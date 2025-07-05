import { Canvas, CanvasEdge } from "src/@types/Canvas"
import CanvasExtension from "./canvas-extension"
import BBoxHelper from "src/utils/bbox-helper"

/**
 * 自定义边缘连接位置扩展
 * 
 * 该扩展用于处理连接线端点在节点边缘上的精确位置。
 * 它允许用户将连接线连接到节点边缘的任意位置，而不仅仅是中点，
 * 从而提供更灵活、更精确的连接线布局。
 */
export default class CustomEdgeConnectionPositionsExtension extends CanvasExtension {
  /**
   * 检查扩展是否启用
   * @returns {boolean} 始终返回 true，表示该扩展始终启用
   */
  isEnabled() { return true } // 始终启用此扩展

  /**
   * 初始化扩展
   * 注册事件监听器，用于处理边缘连接点的拖动
   */
  init() {
    // 监听边缘连接点拖动事件，当连接点被拖动结束时触发
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-connection-dragging:after',
      (canvas: Canvas, edge: CanvasEdge, event: PointerEvent, newEdge: boolean, side: 'from' | 'to') => 
        this.onEdgeConnectionDragged(canvas, edge, event, newEdge, side)
    ))
  }

  /**
   * 处理边缘连接点拖动完成事件
   * 计算连接点在节点边缘上的精确位置，并更新边缘数据
   * 
   * @param {Canvas} canvas - 画布实例
   * @param {CanvasEdge} edge - 被拖动的边缘
   * @param {PointerEvent} event - 指针事件
   * @param {boolean} _newEdge - 是否是新创建的边缘（未使用）
   * @param {string} side - 拖动的是哪一端（'from'或'to'）
   */
  private onEdgeConnectionDragged(canvas: Canvas, edge: CanvasEdge, event: PointerEvent, _newEdge: boolean, side: 'from' | 'to') {
    // 获取边缘数据，用于后续更新
    const edgeData = edge.getData()
    // 获取连接点所在的节点和边
    const node = side === 'from' ? edge.from.node : edge.to.node
    const nodeSide = side === 'from' ? edge.from.side : edge.to.side
    
    // 获取节点边缘的边界框，用于计算相对位置
    const nodeBBox = node.getBBox()
    
    // 获取鼠标位置在Canvas坐标系中的位置
    const mousePos = canvas.posFromClient({
      x: event.clientX,
      y: event.clientY
    })
    
    // 计算相对位置（0到1之间的值）
    let relativePosition = 0.5 // 默认为中点
    
    if (nodeSide === 'top' || nodeSide === 'bottom') {
      // 水平边缘（上边或下边），计算x轴相对位置
      const edgeLength = nodeBBox.maxX - nodeBBox.minX
      relativePosition = Math.max(0, Math.min(1, (mousePos.x - nodeBBox.minX) / edgeLength))
    } else {
      // 垂直边缘（左边或右边），计算y轴相对位置
      const edgeLength = nodeBBox.maxY - nodeBBox.minY
      relativePosition = Math.max(0, Math.min(1, (mousePos.y - nodeBBox.minY) / edgeLength))
    }
    
    // 根据拖动的是哪一端，更新相应的边缘数据
    if (side === 'from') {
      // 更新起点位置
      edgeData.fromPosition = relativePosition
    } else {
      // 更新终点位置
      edgeData.toPosition = relativePosition
    }
    
    // 设置边缘数据，触发更新
    edge.setData(edgeData)
  }
} 