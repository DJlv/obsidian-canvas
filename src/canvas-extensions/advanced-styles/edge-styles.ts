import { BBox, Canvas, CanvasEdge, CanvasNode, Position } from "src/@types/Canvas"
import BBoxHelper from "src/utils/bbox-helper"
import CanvasHelper from "src/utils/canvas-helper"
import CanvasExtension from "../canvas-extension"
import EdgePathfindingMethod from "./edge-pathfinding-methods/edge-pathfinding-method"
import EdgePathfindingAStar from "./edge-pathfinding-methods/pathfinding-a-star"
import EdgePathfindingDirect from "./edge-pathfinding-methods/pathfinding-direct"
import EdgePathfindingSquare from "./edge-pathfinding-methods/pathfinding-square"
import { BUILTIN_EDGE_STYLE_ATTRIBUTES, StyleAttribute, styleAttributeValidator } from "./style-config"
import CssStylesConfigManager from "src/managers/css-styles-config-manager"

const EDGE_PATHFINDING_METHODS: { [key: string]: typeof EdgePathfindingMethod } = {
  'direct': EdgePathfindingDirect,
  'square': EdgePathfindingSquare,
  'a-star': EdgePathfindingAStar
}

const MAX_LIVE_UPDATE_SELECTION_SIZE = 5
export default class EdgeStylesExtension extends CanvasExtension {
  cssStylesManager: CssStylesConfigManager<StyleAttribute>

  isEnabled() { return 'edgesStylingFeatureEnabled' as const }

  init() {
    // 注册样式配置管理器
    this.cssStylesManager = new CssStylesConfigManager(
      this.plugin,
      'advanced-canvas-edge-style',
      styleAttributeValidator
    )

    // 注册事件监听器
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:canvas-changed',
      (canvas: Canvas) => {
        // 监听图层变化，更新箭头可见性
        this.setupLayerChangeListener(canvas)
      }
    ))

    // 监听边缘变化
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-changed',
      (canvas: Canvas, edge: CanvasEdge) => {
        if (!this.shouldUpdateEdge(canvas)) return
        this.onEdgeChanged(canvas, edge)
      }
    ))

    // 监听边缘创建
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-created',
      (canvas: Canvas, edge: CanvasEdge) => {
        if (!this.shouldUpdateEdge(canvas)) return
        this.onEdgeChanged(canvas, edge)
        
        // 延迟添加箭头，确保边缘已完全创建
        setTimeout(() => {
          this.addMultipleArrows(canvas, edge)
        }, 50)
      }
    ))

    // 监听边缘中心点请求（用于添加标签）
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-center-requested',
      (canvas: Canvas, edge: CanvasEdge, center: Position) => {
        if (!this.shouldUpdateEdge(canvas)) return
        this.onEdgeCenterRequested(canvas, edge, center)
      }
    ))

    // 监听弹出菜单创建
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:popup-menu-created',
      (canvas: Canvas) => {
        if (!this.shouldUpdateEdge(canvas)) return
        this.onPopupMenuCreated(canvas)
      }
    ))

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-added',
      (canvas: Canvas, node: CanvasNode) => {
        if (canvas.dirty.size > 1 && !canvas.isPasting) return // Skip if multiple nodes are added at once (e.g. on initial load)
        
        this.updateAllEdgesInArea(canvas, node.getBBox())
      }
    ))

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-moved',
      // Only update edges this way if a node got moved with the arrow keys
      (canvas: Canvas, node: CanvasNode, keyboard: boolean) => node.initialized && keyboard ? this.updateAllEdgesInArea(canvas, node.getBBox()) : void 0
    ))

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-removed',
      (canvas: Canvas, node: CanvasNode) => this.updateAllEdgesInArea(canvas, node.getBBox())
    ))

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:dragging-state-changed',
      (canvas: Canvas, isDragging: boolean) => {
        if (isDragging) return

        const selectedNodes = canvas.getSelectionData().nodes
          .map(nodeData => canvas.nodes.get(nodeData.id))
          .filter(node => node !== undefined) as CanvasNode[]
        const selectedNodeBBoxes = selectedNodes.map(node => node.getBBox())
        const selectedNodeBBox = BBoxHelper.combineBBoxes(selectedNodeBBoxes)

        this.updateAllEdgesInArea(canvas, selectedNodeBBox)
      }
    ))
    
    // 监听颜色变化事件 - 使用edge-changed事件，因为颜色变化会触发这个事件
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-changed',
      (canvas: Canvas, edge: CanvasEdge) => {
        // 检查是否是颜色变化
        this.addMultipleArrows(canvas, edge);
      }
    ))
    
    // 监听数据变化事件
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:data-loaded:after',
      (canvas: Canvas) => {
        // 更新所有边缘的箭头
        canvas.edges.forEach(edge => {
          this.addMultipleArrows(canvas, edge);
        });
      }
    ))
  }

  // Skip if isDragging and setting isn't enabled and not connecting an edge
  private shouldUpdateEdge(canvas: Canvas): boolean {
    return !canvas.isDragging || this.plugin.settings.getSetting('edgeStyleUpdateWhileDragging') || canvas.canvasEl.hasClass('is-connecting')
  }

  private onPopupMenuCreated(canvas: Canvas): void {
    const selectedEdges = [...canvas.selection].filter((item: any) => item.path !== undefined) as CanvasEdge[]
    if (canvas.readonly || selectedEdges.length === 0 || selectedEdges.length !== canvas.selection.size)
      return

    CanvasHelper.addStyleAttributesToPopup(
      this.plugin, canvas,  [...BUILTIN_EDGE_STYLE_ATTRIBUTES, /* Legacy */ ...this.plugin.settings.getSetting('customEdgeStyleAttributes'), ...this.cssStylesManager.getStyles()],
      selectedEdges[0].getData().styleAttributes ?? {},
      (attribute, value) => this.setStyleAttributeForSelection(canvas, attribute, value)
    )
  }

  private setStyleAttributeForSelection(canvas: Canvas, attribute: StyleAttribute, value: string | null): void {
    const selectedEdges = [...canvas.selection].filter((item: any) => item.path !== undefined) as CanvasEdge[]

    for (const edge of selectedEdges) {
      const edgeData = edge.getData()

      edge.setData({
        ...edgeData,
        styleAttributes: {
          ...edgeData.styleAttributes,
          [attribute.key]: value
        }
      })
    }
    
    canvas.pushHistory(canvas.getData())
  }

  private updateAllEdgesInArea(canvas: Canvas, bbox: BBox) {
    if (!this.shouldUpdateEdge(canvas)) return

    for (const edge of canvas.edges.values()) {
      if (!BBoxHelper.isColliding(edge.getBBox(), bbox)) continue

      canvas.markDirty(edge)
    }
  }

  private onEdgeChanged(canvas: Canvas, edge: CanvasEdge) {
    // Skip if edge isn't dirty or selected
    if (!canvas.dirty.has(edge) && !canvas.selection.has(edge)) return

    if (!this.shouldUpdateEdge(canvas)) {
      const tooManySelected = canvas.selection.size > MAX_LIVE_UPDATE_SELECTION_SIZE
      if (tooManySelected) return

      const groupNodesSelected = [...canvas.selection].some((item: any) => item.getData()?.type === 'group')
      if (groupNodesSelected) return
    }

    const edgeData = edge.getData()
    
    // Reset path to default
    if (!edge.bezier) return
    edge.center = undefined
    edge.updatePath()

    // Set pathfinding method
    const pathfindingMethod = edgeData.styleAttributes?.pathfindingMethod
    if (pathfindingMethod && pathfindingMethod in EDGE_PATHFINDING_METHODS) {
      const fromNodeBBox = edge.from.node.getBBox()
      const fromBBoxSidePos = BBoxHelper.getCenterOfBBoxSide(fromNodeBBox, edge.from.side)
      const fromPos = edge.from.end === 'none' ? 
        fromBBoxSidePos :
        edge.bezier.from
      
      const toNodeBBox = edge.to.node.getBBox()
      const toBBoxSidePos = BBoxHelper.getCenterOfBBoxSide(toNodeBBox, edge.to.side)
      const toPos = edge.to.end === 'none' ? 
        toBBoxSidePos :
        edge.bezier.to

      const path = new (EDGE_PATHFINDING_METHODS[pathfindingMethod] as any)(
        this.plugin, 
        canvas, 
        fromNodeBBox, fromPos, fromBBoxSidePos, edge.from.side, 
        toNodeBBox, toPos, toBBoxSidePos, edge.to.side
      ).getPath()
      if (!path) return

      edge.center = path.center
      edge.path.interaction.setAttr("d", path?.svgPath)
      edge.path.display.setAttr("d", path?.svgPath)
      
      // 添加多个方向箭头
      this.addMultipleArrows(canvas, edge);
    } else {
      // 即使是默认的贝塞尔曲线路径，也添加方向箭头
      this.addMultipleArrows(canvas, edge);
    }

    // Update label position
    edge.labelElement?.render()

    // Set arrow polygon
    const arrowPolygonPoints = this.getArrowPolygonPoints(edgeData.styleAttributes?.arrow)
    if (edge.fromLineEnd?.el) edge.fromLineEnd.el.querySelector('polygon')?.setAttribute('points', arrowPolygonPoints)
    if (edge.toLineEnd?.el) edge.toLineEnd.el.querySelector('polygon')?.setAttribute('points', arrowPolygonPoints)
    
    // 确保在下一帧更新箭头颜色（解决颜色变化后箭头不更新的问题）
    setTimeout(() => {
      this.addMultipleArrows(canvas, edge);
    }, 50);
  }

  // 在连接线上添加多个方向箭头
  private addMultipleArrows(canvas: Canvas, edge: CanvasEdge) {
    // 移除现有的箭头
    edge.lineGroupEl.querySelectorAll('.edge-direction-arrow').forEach(el => el.remove());
    
    // 创建SVG命名空间
    const svgNS = "http://www.w3.org/2000/svg";
    
    // 获取路径元素
    const pathElement = edge.path.display as unknown as SVGPathElement;
    if (!pathElement) return;
    
    // 获取路径总长度
    const pathLength = pathElement.getTotalLength();
    if (pathLength <= 0) return;
    
    // 获取边缘数据和样式属性
    const edgeData = edge.getData();
    const arrowStyle = edgeData.styleAttributes?.arrow;
    
    // 如果箭头样式为none，则不添加方向箭头
    if (arrowStyle === 'none') return;
    
    // 获取箭头密度设置（默认为中等密度）
    const arrowDensity = edgeData.styleAttributes?.arrowDensity || 'medium';
    
    // 根据密度设置和路径长度计算箭头数量
    let arrowCount = 1;
    switch (arrowDensity) {
      case 'low':
        arrowCount = Math.max(1, Math.floor(pathLength / 200));
        break;
      case 'medium':
        arrowCount = Math.max(1, Math.floor(pathLength / 100));
        break;
      case 'high':
        arrowCount = Math.max(1, Math.floor(pathLength / 50));
        break;
      default:
        arrowCount = Math.max(1, Math.floor(pathLength / 100));
    }
    
    // 限制最大箭头数量
    arrowCount = Math.min(20, arrowCount);
    
    // 获取箭头大小设置（默认为中等大小）
    const arrowSize = edgeData.styleAttributes?.arrowSize || 'medium';
    
    // 根据大小设置确定箭头尺寸
    let arrowPoints = '';
    switch (arrowSize) {
      case 'small':
        arrowPoints = '0,0 -8,-4 -8,4';
        break;
      case 'medium':
        arrowPoints = '0,0 -12,-6 -12,6';
        break;
      case 'large':
        arrowPoints = '0,0 -16,-8 -16,8';
        break;
      default:
        arrowPoints = '0,0 -12,-6 -12,6';
    }
    
    // 直接从边缘获取颜色
    // 获取边缘的stroke颜色
    let fillColor = '';
    
    // 尝试直接从SVG元素获取颜色
    const strokeAttr = edge.path.display.getAttribute('stroke');
    if (strokeAttr && strokeAttr !== 'none') {
      fillColor = strokeAttr;
    } 
    // 如果没有直接获取到，使用计算样式
    else {
      try {
        const computedStyle = window.getComputedStyle(edge.path.display);
        if (computedStyle.stroke && computedStyle.stroke !== 'none') {
          fillColor = computedStyle.stroke;
        }
      } catch (e) {
        console.error('获取计算样式失败:', e);
      }
    }
    
    // 如果仍然没有获取到颜色，使用边缘数据中的颜色
    if (!fillColor || fillColor === 'none') {
      if (edgeData.color) {
        if (/^[1-6]$/.test(edgeData.color)) {
          fillColor = `var(--canvas-color-${edgeData.color})`;
        } else {
          fillColor = edgeData.color;
        }
      } else {
        // 默认颜色
        fillColor = 'var(--interactive-accent)';
      }
    }
    
    // 检查边缘是否可见（基于图层设置）
    const isVisible = this.isEdgeVisible(canvas, edge);
    
    // 在路径上均匀分布箭头
    for (let i = 1; i <= arrowCount; i++) {
      // 计算箭头在路径上的位置（均匀分布）
      const position = pathLength * i / (arrowCount + 1);
      
      // 获取路径上该位置的点坐标
      const point = pathElement.getPointAtLength(position);
      
      // 计算路径在该点的切线方向（通过获取前后两个点的位置差）
      const delta = 0.01 * pathLength;
      const pointBefore = pathElement.getPointAtLength(Math.max(0, position - delta));
      const pointAfter = pathElement.getPointAtLength(Math.min(pathLength, position + delta));
      
      // 计算方向角度
      const dx = pointAfter.x - pointBefore.x;
      const dy = pointAfter.y - pointBefore.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      // 创建箭头
      const arrow = document.createElementNS(svgNS, "polygon");
      arrow.setAttribute("class", "edge-direction-arrow");
      arrow.setAttribute("points", arrowPoints);
      arrow.setAttribute("fill", fillColor);
      arrow.setAttribute("stroke", "var(--background-primary)");
      arrow.setAttribute("stroke-width", "1");
      arrow.setAttribute("transform", `translate(${point.x},${point.y}) rotate(${angle})`);
      
      // 设置箭头的可见性，跟随边缘的可见性
      arrow.style.display = isVisible ? '' : 'none';
      
      // 添加边缘ID属性，便于图层管理
      arrow.setAttribute("data-edge-id", edge.id);
      
      // 添加样式属性，帮助调试
      arrow.setAttribute("data-color-source", fillColor);
      
      // 添加到边缘的线组元素中
      edge.lineGroupEl.appendChild(arrow);
    }
  }
  
  // 检查边缘是否可见（基于图层设置）
  private isEdgeVisible(canvas: Canvas, edge: CanvasEdge): boolean {
    // 获取图层数据
    const layers = canvas.getData().layers as any[];
    if (!layers || !Array.isArray(layers)) return true;
    
    // 检查边缘元素的显示状态
    if (edge.lineGroupEl && edge.lineGroupEl.style.display === 'none') {
      return false;
    }
    
    // 查找边缘所在的图层
    for (const layer of layers) {
      if (layer.edgeIds?.includes(edge.id)) {
        return layer.visible;
      }
    }
    
    // 如果没有找到边缘所在的图层，默认为可见
    return true;
  }

  // 获取边缘的颜色（综合多种方法）
  private getEdgeColor(edge: CanvasEdge): string {
    // 直接从DOM元素获取颜色
    try {
      // 尝试从SVG路径元素获取stroke属性
      const strokeAttr = edge.path?.display?.getAttribute('stroke');
      if (strokeAttr && strokeAttr !== 'none') {
        console.log('从SVG获取到的颜色:', strokeAttr);
        return strokeAttr;
      }
    } catch (e) {
      console.error('获取SVG stroke属性失败:', e);
    }
    
    // 尝试从计算样式获取
    try {
      const computedStyle = window.getComputedStyle(edge.path.display);
      const stroke = computedStyle.stroke;
      if (stroke && stroke !== 'none' && stroke !== '') {
        console.log('从计算样式获取到的颜色:', stroke);
        return stroke;
      }
    } catch (e) {
      console.error('获取计算样式失败:', e);
    }
    
    // 从边缘数据获取颜色
    const edgeData = edge.getData();
    if (edgeData.color) {
      if (/^[1-6]$/.test(edgeData.color)) {
        // 获取预设颜色的实际值
        const colorClass = `canvas-color-${edgeData.color}`;
        const colorElement = document.createElement('div');
        colorElement.className = colorClass;
        document.body.appendChild(colorElement);
        const computedColor = window.getComputedStyle(colorElement).color;
        document.body.removeChild(colorElement);
        
        if (computedColor) {
          console.log('从预设颜色获取到的颜色:', computedColor);
          return computedColor;
        }
        
        // 如果无法获取计算值，返回CSS变量
        console.log('使用CSS变量:', `var(--canvas-color-${edgeData.color})`);
        return `var(--canvas-color-${edgeData.color})`;
      } else {
        // 直接返回十六进制颜色
        console.log('使用十六进制颜色:', edgeData.color);
        return edgeData.color;
      }
    }
    
    // 如果没有设置颜色，使用默认的强调色
    console.log('使用默认强调色');
    return 'var(--interactive-accent)';
  }

  // 判断颜色是否为浅色
  private isLightColor(color: string): boolean {
    // 如果是CSS变量，无法直接判断，默认为深色
    if (color.startsWith('var(--')) {
      return false;
    }
    
    // 将颜色转换为RGB
    let r, g, b;
    
    // 处理十六进制颜色
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      // 处理缩写形式 (#RGB)
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } 
      // 处理完整形式 (#RRGGBB)
      else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else {
        return false;
      }
    } else {
      return false;
    }
    
    // 计算亮度 (HSP 公式)
    // 参考: http://alienryderflex.com/hsp.html
    const brightness = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );
    
    // 亮度大于 127.5 (一半的 255) 认为是浅色
    return brightness > 127.5;
  }

  // 从颜色字符串中获取RGB值
  private getRGBFromColor(color: string): { r: number, g: number, b: number } | null {
    // 处理rgb/rgba格式
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (match) {
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10)
        };
      }
    }
    
    // 处理十六进制格式
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      // 处理缩写形式 (#RGB)
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16)
        };
      } 
      // 处理完整形式 (#RRGGBB)
      else if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16)
        };
      }
    }
    
    return null;
  }

  private onEdgeCenterRequested(_canvas: Canvas, edge: CanvasEdge, center: Position) {
    center.x = edge.center?.x ?? center.x
    center.y = edge.center?.y ?? center.y
  }

  private getArrowPolygonPoints(arrowStyle?: string | null): string {
    if (arrowStyle === 'halved-triangle')
      return `-2,0 7.5,12 -2,12`
    else if (arrowStyle === 'thin-triangle')
      return `0,0 7,10 0,0 0,10 0,0 -7,10`
    else if (arrowStyle === 'diamond' || arrowStyle === 'diamond-outline')
      return `0,0 5,10 0,20 -5,10`
    else if (arrowStyle === 'circle' || arrowStyle === 'circle-outline')
      return `0 0, 4.95 1.8, 7.5 6.45, 6.6 11.7, 2.7 15, -2.7 15, -6.6 11.7, -7.5 6.45, -4.95 1.8`
    else if (arrowStyle === 'blunt')
      return `-10,8 10,8 10,6 -10,6`
    else // Default triangle
      return `0,0 6.5,10.4 -6.5,10.4`
  }

  // 设置图层变化监听器
  private setupLayerChangeListener(canvas: Canvas) {
    // 监听图层可见性变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            mutation.target instanceof HTMLElement) {
          
          const edgeEl = mutation.target;
          const edgeId = edgeEl.dataset.id;
          
          if (edgeId && canvas.edges.has(edgeId)) {
            const edge = canvas.edges.get(edgeId)!; // 使用非空断言，因为已经检查了has(edgeId)
            // 获取边缘的可见性
            const isVisible = edgeEl.style.display !== 'none';
            
            // 更新该边缘上所有箭头的可见性
            this.updateArrowsVisibility(edge, isVisible);
          }
        }
      });
    });
    
    // 为每个边缘元素添加观察器
    canvas.edges.forEach(edge => {
      if (edge.lineGroupEl) {
        observer.observe(edge.lineGroupEl, { attributes: true });
      }
    });
  }
  
  // 更新箭头可见性
  private updateArrowsVisibility(edge: CanvasEdge, isVisible: boolean) {
    const arrows = edge.lineGroupEl.querySelectorAll('.edge-direction-arrow');
    arrows.forEach((arrow: HTMLElement) => {
      arrow.style.display = isVisible ? '' : 'none';
    });
  }
}