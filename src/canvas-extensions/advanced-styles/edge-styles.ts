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
    this.cssStylesManager = new CssStylesConfigManager(this.plugin, 'advanced-canvas-edge-style', styleAttributeValidator)

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:popup-menu-created',
      (canvas: Canvas) => this.onPopupMenuCreated(canvas)
    ))

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-changed',
      (canvas: Canvas, edge: CanvasEdge) => this.onEdgeChanged(canvas, edge)
    ))

    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-center-requested',
      (canvas: Canvas, edge: CanvasEdge, center: Position) => this.onEdgeCenterRequested(canvas, edge, center)
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
    
    // 获取线段颜色
    let fillColor = 'var(--interactive-accent)';
    let strokeColor = 'var(--background-primary)';
    
    // 如果边缘有颜色属性，则使用该颜色
    if (edgeData.color) {
      // 检查颜色是否为预设颜色（数字1-6）或十六进制颜色
      if (/^[1-6]$/.test(edgeData.color)) {
        // 预设颜色，使用CSS变量
        fillColor = `var(--canvas-color-${edgeData.color})`;
      } else {
        // 十六进制颜色
        fillColor = edgeData.color;
      }
      
      // 确定适合的描边颜色（深色背景用浅色描边，浅色背景用深色描边）
      if (this.isLightColor(fillColor)) {
        strokeColor = '#333333';
      } else {
        strokeColor = '#ffffff';
      }
    }
    
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
      arrow.setAttribute("stroke", strokeColor);
      arrow.setAttribute("stroke-width", "1");
      arrow.setAttribute("transform", `translate(${point.x},${point.y}) rotate(${angle})`);
      
      // 添加到边缘的线组元素中
      edge.lineGroupEl.appendChild(arrow);
    }
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
}