import { Canvas, CanvasNode } from "src/@types/Canvas"
import CanvasExtension from "./canvas-extension"

export default class PolygonNodeExtension extends CanvasExtension {
  isEnabled() { return true }

  init() {
    // 注册节点创建事件监听器
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-created',
      (canvas: Canvas, node: CanvasNode) => this.onNodeCreated(canvas, node)
    ))

    // 添加命令：将选中的节点转换为多边形节点
    this.plugin.addCommand({
      id: 'convert-to-polygon',
      name: '将选中节点转换为多边形',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        const selection = canvas.selection
        if (selection.size === 0) return false
        
        if (!checking) {
          this.convertSelectionToPolygon(canvas)
        }
        
        return true
      }
    })

    // 添加命令：创建三角形节点
    this.plugin.addCommand({
      id: 'create-triangle-node',
      name: '创建三角形节点',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        if (!checking) {
          this.createPolygonNode(canvas, 'triangle')
        }
        
        return true
      }
    })

    // 添加命令：创建五边形节点
    this.plugin.addCommand({
      id: 'create-pentagon-node',
      name: '创建五边形节点',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        if (!checking) {
          this.createPolygonNode(canvas, 'pentagon')
        }
        
        return true
      }
    })

    // 添加命令：创建六边形节点
    this.plugin.addCommand({
      id: 'create-hexagon-node',
      name: '创建六边形节点',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        if (!checking) {
          this.createPolygonNode(canvas, 'hexagon')
        }
        
        return true
      }
    })

    // 添加命令：创建八边形节点
    this.plugin.addCommand({
      id: 'create-octagon-node',
      name: '创建八边形节点',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        if (!checking) {
          this.createPolygonNode(canvas, 'octagon')
        }
        
        return true
      }
    })
  }

  private onNodeCreated(canvas: Canvas, node: CanvasNode) {
    const nodeData = node.getData()
    
    // 仅处理文本节点
    if (nodeData.type !== 'text') return

    // 检查是否需要自动应用多边形样式（可以根据需要添加设置）
    // const shouldApplyPolygon = this.plugin.settings.getSetting('defaultTextNodeStyleAttributes')?.shape === 'polygon'
    
    // if (shouldApplyPolygon) {
    //   // 设置多边形样式
    //   node.setData({
    //     ...nodeData,
    //     styleAttributes: {
    //       ...nodeData.styleAttributes,
    //       shape: 'polygon'
    //     }
    //   })
    // }
  }

  private convertSelectionToPolygon(canvas: Canvas) {
    // 获取选中的节点
    const selectionNodeData = canvas.getSelectionData().nodes
    
    // 遍历选中的节点
    for (const nodeData of selectionNodeData) {
      // 仅处理文本节点
      if (nodeData.type !== 'text') continue
      
      // 获取节点实例
      const node = canvas.nodes.get(nodeData.id)
      if (!node) continue
      
      // 设置多边形样式
      node.setData({
        ...nodeData,
        styleAttributes: {
          ...nodeData.styleAttributes,
          shape: 'hexagon' // 默认使用六边形
        }
      })
    }
    
    // 记录历史
    canvas.pushHistory(canvas.getData())
  }

  private createPolygonNode(canvas: Canvas, shapeType: 'triangle' | 'pentagon' | 'hexagon' | 'octagon') {
    // 获取视图中心位置
    const viewportCenter = this.getViewportCenter(canvas)
    
    // 创建文本节点
    const node = canvas.createTextNode({
      pos: viewportCenter,
      position: 'center',
      text: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}节点`
    })
    
    // 设置多边形样式
    node.setData({
      ...node.getData(),
      styleAttributes: {
        ...node.getData().styleAttributes,
        shape: shapeType,
        textAlign: 'center' // 居中文本以获得更好的视觉效果
      }
    })
    
    // 选中新创建的节点
    canvas.selectOnly(node)
  }

  // 获取视图中心位置
  private getViewportCenter(canvas: Canvas): {x: number, y: number} {
    // 获取画布容器的尺寸
    const rect = canvas.wrapperEl.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // 计算中心点在画布坐标系中的位置
    const center = canvas.posFromEvt({
      clientX: rect.left + width / 2,
      clientY: rect.top + height / 2
    } as MouseEvent)
    
    return center
  }
} 