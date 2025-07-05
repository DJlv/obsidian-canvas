import { Canvas, CanvasNode } from "src/@types/Canvas"
import CanvasExtension from "./canvas-extension"

export default class PureTextNodeExtension extends CanvasExtension {
  isEnabled() { return true }

  init() {
    // 监听节点创建事件，为新创建的文本节点添加纯文本样式选项
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-created',
      (canvas: Canvas, node: CanvasNode) => this.onNodeCreated(canvas, node)
    ))

    // 添加命令：将选中的节点转换为纯文本节点
    this.plugin.addCommand({
      id: 'convert-to-pure-text',
      name: '将选中节点转换为纯文本',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        const selection = canvas.selection
        if (selection.size === 0) return false
        
        if (!checking) {
          this.convertSelectionToPureText(canvas)
        }
        
        return true
      }
    })

    // 添加命令：创建纯文本节点
    this.plugin.addCommand({
      id: 'create-pure-text-node',
      name: '创建纯文本节点',
      checkCallback: (checking) => {
        const canvas = this.plugin.getCurrentCanvas()
        if (!canvas) return false
        
        if (!checking) {
          this.createPureTextNode(canvas)
        }
        
        return true
      }
    })
  }

  private onNodeCreated(canvas: Canvas, node: CanvasNode) {
    const nodeData = node.getData()
    
    // 仅处理文本节点
    if (nodeData.type !== 'text') return

    // 检查是否需要自动应用纯文本样式
    const shouldApplyPureText = this.plugin.settings.getSetting('defaultTextNodeStyleAttributes')?.display === 'pure-text'
    
    if (shouldApplyPureText) {
      // 设置纯文本样式
      node.setData({
        ...nodeData,
        styleAttributes: {
          ...nodeData.styleAttributes,
          display: 'pure-text'
        }
      })
    }
  }

  private convertSelectionToPureText(canvas: Canvas) {
    // 获取选中的节点
    const selectionNodeData = canvas.getSelectionData().nodes
    
    // 遍历选中的节点
    for (const nodeData of selectionNodeData) {
      // 仅处理文本节点
      if (nodeData.type !== 'text') continue
      
      // 获取节点实例
      const node = canvas.nodes.get(nodeData.id)
      if (!node) continue
      
      // 设置纯文本样式
      node.setData({
        ...nodeData,
        styleAttributes: {
          ...nodeData.styleAttributes,
          display: 'pure-text'
        }
      })
    }
    
    // 记录历史
    canvas.pushHistory(canvas.getData())
  }

  private createPureTextNode(canvas: Canvas) {
    // 获取视图中心位置
    const viewportCenter = this.getViewportCenter(canvas)
    
    // 创建文本节点
    const node = canvas.createTextNode({
      pos: viewportCenter,
      position: 'center',
      text: '纯文本节点'
    })
    
    // 设置纯文本样式
    node.setData({
      ...node.getData(),
      styleAttributes: {
        ...node.getData().styleAttributes,
        display: 'pure-text'
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