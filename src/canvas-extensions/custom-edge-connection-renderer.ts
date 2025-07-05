import { Canvas, CanvasNode } from "src/@types/Canvas"
import CanvasExtension from "./canvas-extension"

/**
 * 自定义边缘连接点渲染器扩展
 * 
 * 该扩展用于在节点的边缘上创建连接点，使用户可以从节点边缘的任意位置创建连接线，
 * 而不仅仅是从边缘的中点。这大大提高了画布连接线的灵活性和精确度。
 */
export default class CustomEdgeConnectionRendererExtension extends CanvasExtension {
  /**
   * 检查扩展是否启用
   * @returns {boolean} 始终返回 true，表示该扩展始终启用
   */
  isEnabled() { return true } // 始终启用此扩展

  /**
   * 初始化扩展
   * 注册事件监听器，用于在节点添加或变化时渲染连接点
   */
  init() {
    // 监听节点添加事件，当新节点被添加到画布时渲染连接点
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-added',
      (canvas: Canvas, node: CanvasNode) => this.renderConnectionPoints(node)
    ))
    
    // 监听节点变化事件，当节点属性发生变化时重新渲染连接点
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-changed',
      (canvas: Canvas, node: CanvasNode) => this.renderConnectionPoints(node)
    ))
  }

  /**
   * 渲染节点边缘的连接点
   * 在节点的四个边缘上创建多个可交互的连接点
   * 
   * @param {CanvasNode} node - 要渲染连接点的节点
   */
  private renderConnectionPoints(node: CanvasNode) {
    // 如果节点元素不存在，直接返回
    if (!node.nodeEl) return
    
    // 查找或创建连接点容器
    let sideConnectionPointsEl = node.nodeEl.querySelector('.side-connection-points')
    if (!sideConnectionPointsEl) {
      // 如果容器不存在，创建一个新的容器
      sideConnectionPointsEl = document.createElement('div')
      sideConnectionPointsEl.className = 'side-connection-points'
      node.nodeEl.appendChild(sideConnectionPointsEl)
    } else {
      // 如果容器已存在，清空现有连接点以便重新创建
      sideConnectionPointsEl.innerHTML = ''
    }
    
    // 创建各边的连接点容器（上、右、下、左四个边）
    const sides = ['top', 'right', 'bottom', 'left']
    sides.forEach(side => {
      // 为每个边创建一个容器
      const sidePointsEl = document.createElement('div')
      sidePointsEl.className = `${side}-connection-points`
      sideConnectionPointsEl.appendChild(sidePointsEl)
      
      // 在每边创建5个连接点，均匀分布
      const numPoints = 5
      for (let i = 0; i < numPoints; i++) {
        // 创建连接点元素
        const pointEl = document.createElement('div')
        pointEl.className = 'connection-point'
        
        // 计算连接点的相对位置（0到1之间的值）
        const relativePosition = i / (numPoints - 1) // 0 到 1 之间的相对位置
        
        // 根据边的不同设置连接点的位置
        if (side === 'top' || side === 'bottom') {
          // 对于上边和下边，设置水平位置
          pointEl.style.left = `${relativePosition * 100}%`
        } else {
          // 对于左边和右边，设置垂直位置
          pointEl.style.top = `${relativePosition * 100}%`
        }
        
        // 存储连接点的相对位置和所在边的信息，用于后续处理
        pointEl.dataset.relativePosition = relativePosition.toString()
        pointEl.dataset.side = side
        
        // 添加连接点到对应边的容器中
        sidePointsEl.appendChild(pointEl)
      }
    })
  }
} 