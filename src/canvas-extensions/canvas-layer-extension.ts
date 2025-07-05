import CanvasExtension from "./canvas-extension"
import CanvasHelper from "../utils/canvas-helper"
import { Canvas, CanvasLayer, CanvasNode } from "../@types/Canvas"

const CONTROL_MENU_LAYER_ID = 'canvas-layer-control'
const LAYER_PANEL_ID = 'canvas-layer-panel'

// 新增：当前图层id
let currentLayerId: string | null = null

export default class CanvasLayerExtension extends CanvasExtension {
  isEnabled() { return true }

  init() {
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:canvas-changed',
      (canvas: Canvas) => {
        this.addLayerControlButton(canvas)
        this.patchNodeVisibility(canvas)
      }
    ))
    // 监听节点增删，自动分配到图层
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-created',
      (canvas: Canvas, node: CanvasNode) => this.handleNodeCreated(node)
    ))
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-removed',
      (canvas: Canvas, node: CanvasNode) => this.handleNodeRemoved(node)
    ))
    // 监听连接线增删，自动分配到图层
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-created',
      (canvas: Canvas, edge: any) => this.handleEdgeCreated(edge)
    ))
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:edge-removed',
      (canvas: Canvas, edge: any) => this.handleEdgeRemoved(edge)
    ))
    // 右键节点菜单：移动到当前图层
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'canvas:node-menu',
      (menu: any, node: CanvasNode) => {
        menu.addItem((item: any) => {
          item.setTitle('移动到当前图层')
          item.setIcon('layers')
          item.onClick(() => this.moveNodeToCurrentLayer(node))
        })
      }
    ))
    // 右键连接线菜单：移动到当前图层
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'canvas:edge-menu',
      (menu: any, edge: any) => {
        menu.addItem((item: any) => {
          item.setTitle('移动到当前图层')
          item.setIcon('layers')
          item.onClick(() => this.moveEdgeToCurrentLayer(edge))
        })
      }
    ))
    // 新建白板时自动插入默认图层
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:data-loaded:before',
      (canvas: Canvas, data: any, setData: (data: any) => void) => {
        if (!data.layers || !Array.isArray(data.layers) || data.layers.length === 0) {
          data.layers = [{
            id: 'layer-' + Date.now() + '-' + Math.floor(Math.random()*10000),
            name: '默认图层',
            visible: true,
            nodeIds: [],
            edgeIds: []
          }]
          setData(data)
        }
      }
    ))
  }

  private addLayerControlButton(canvas: Canvas) {
    const settingsContainer = canvas.quickSettingsButton?.parentElement
    if (!settingsContainer) return

    const layerButton = CanvasHelper.createControlMenuButton({
      id: CONTROL_MENU_LAYER_ID,
      label: '图层',
      icon: 'layers',
      callback: () => {
        this.toggleLayerPanel(canvas)
      }
    })
    CanvasHelper.addControlMenuButton(settingsContainer, layerButton)
  }

  private toggleLayerPanel(canvas: Canvas) {
    let panel = document.getElementById(LAYER_PANEL_ID)
    if (panel) {
      panel.remove()
      return
    }
    panel = this.createLayerPanel(canvas)
    document.body.appendChild(panel)
  }

  private createLayerPanel(canvas: Canvas): HTMLElement {
    const panel = document.createElement('div')
    panel.id = LAYER_PANEL_ID
    panel.style.position = 'fixed'
    // 居中显示
    panel.style.top = '50%'
    panel.style.left = '50%'
    panel.style.transform = 'translate(-50%, -50%)'
    panel.style.zIndex = '9999'
    panel.style.background = 'var(--background-primary, #fff)'
    panel.style.border = '1px solid var(--background-modifier-border, #ccc)'
    panel.style.borderRadius = '8px'
    panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
    panel.style.padding = '16px'
    panel.style.minWidth = '360px'
    panel.style.maxWidth = '420px'
    panel.style.maxHeight = '60vh'
    panel.style.overflowY = 'auto'

    // 标题栏（作为拖动区域）
    const titleBar = document.createElement('div')
    titleBar.style.display = 'flex'
    titleBar.style.justifyContent = 'space-between'
    titleBar.style.alignItems = 'center'
    titleBar.style.marginBottom = '12px'
    titleBar.style.cursor = 'move' // 指示可拖动
    titleBar.style.userSelect = 'none' // 防止文本选择
    titleBar.style.paddingBottom = '8px'
    titleBar.style.borderBottom = '1px solid var(--background-modifier-border, #ccc)'
    panel.appendChild(titleBar)

    // 标题文本
    const title = document.createElement('div')
    title.textContent = '图层管理'
    title.style.fontWeight = 'bold'
    titleBar.appendChild(title)

    // 关闭按钮
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.background = 'none'
    closeBtn.style.border = 'none'
    closeBtn.style.fontSize = '16px'
    closeBtn.style.cursor = 'pointer'
    closeBtn.style.padding = '0 4px'
    closeBtn.onclick = () => panel.remove()
    titleBar.appendChild(closeBtn)

    // 添加拖动功能
    this.makeDraggable(panel, titleBar)

    // 图层列表
    const list = document.createElement('div')
    list.id = 'canvas-layer-list'
    panel.appendChild(list)
    this.renderLayerList(canvas, list)

    // 新建图层按钮
    const addBtn = document.createElement('button')
    addBtn.textContent = '+ 新建图层'
    addBtn.style.marginTop = '12px'
    addBtn.style.width = '100%'
    addBtn.style.padding = '6px 0'
    addBtn.style.background = 'var(--interactive-accent, #3a8cff)'
    addBtn.style.color = '#fff'
    addBtn.style.border = 'none'
    addBtn.style.borderRadius = '4px'
    addBtn.style.cursor = 'pointer'
    addBtn.onclick = () => {
      this.addLayer(canvas)
      this.renderLayerList(canvas, list)
      this.patchNodeVisibility(canvas)
    }
    panel.appendChild(addBtn)

    return panel
  }

  // 添加拖动功能
  private makeDraggable(panel: HTMLElement, handle: HTMLElement) {
    let offsetX = 0
    let offsetY = 0
    let isDragging = false

    const startDrag = (e: MouseEvent) => {
      // 获取鼠标相对于面板的位置
      const rect = panel.getBoundingClientRect()
      offsetX = e.clientX - rect.left
      offsetY = e.clientY - rect.top
      isDragging = true

      // 添加临时事件监听器
      document.addEventListener('mousemove', drag)
      document.addEventListener('mouseup', stopDrag)
    }

    const drag = (e: MouseEvent) => {
      if (!isDragging) return
      
      // 计算新位置
      const x = e.clientX - offsetX
      const y = e.clientY - offsetY
      
      // 设置面板位置（取消居中变换）
      panel.style.transform = 'none'
      panel.style.left = `${x}px`
      panel.style.top = `${y}px`
    }

    const stopDrag = () => {
      isDragging = false
      
      // 移除临时事件监听器
      document.removeEventListener('mousemove', drag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // 添加拖动开始事件监听器
    handle.addEventListener('mousedown', startDrag)
  }

  private renderLayerList(canvas: Canvas, container: HTMLElement) {
    container.innerHTML = ''
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    // 当前图层高亮
    if (!currentLayerId && layers.length > 0) currentLayerId = layers[0].id
    layers.forEach((layer, idx) => {
      const row = document.createElement('div')
      row.style.display = 'flex'
      row.style.alignItems = 'center'
      row.style.marginBottom = '8px'
      if (layer.id === currentLayerId) {
        row.style.background = 'var(--background-secondary, #e6f7ff)'
      }

      // 设为当前图层按钮
      const setCurrentBtn = document.createElement('button')
      setCurrentBtn.textContent = '●'
      setCurrentBtn.title = '设为当前图层'
      setCurrentBtn.style.marginRight = '6px'
      setCurrentBtn.style.color = layer.id === currentLayerId ? '#3a8cff' : '#aaa'
      setCurrentBtn.onclick = () => {
        currentLayerId = layer.id
        this.renderLayerList(canvas, container)
      }
      row.appendChild(setCurrentBtn)

      // 图层可见性切换
      const visibilityBtn = document.createElement('button')
      visibilityBtn.textContent = layer.visible ? '👁️' : '👁️‍🗨️'
      visibilityBtn.title = layer.visible ? '隐藏图层' : '显示图层'
      visibilityBtn.style.marginRight = '6px'
      visibilityBtn.onclick = () => {
        layer.visible = !layer.visible
        this.saveLayers(canvas, layers)
        this.renderLayerList(canvas, container)
        this.patchNodeVisibility(canvas)
      }
      row.appendChild(visibilityBtn)

      // 图层名称
      const nameInput = document.createElement('input')
      nameInput.type = 'text'
      nameInput.value = layer.name
      nameInput.style.flex = '1'
      nameInput.style.marginRight = '6px'
      nameInput.onchange = () => {
        layer.name = nameInput.value
        this.saveLayers(canvas, layers)
      }
      row.appendChild(nameInput)

      // 图层信息（节点和边缘数量）
      const infoText = document.createElement('span')
      infoText.style.fontSize = '12px'
      infoText.style.color = '#999'
      infoText.style.marginRight = '6px'
      row.appendChild(infoText)

      // 上移按钮
      if (idx > 0) {
        const upBtn = document.createElement('button')
        upBtn.textContent = '↑'
        upBtn.title = '上移图层'
        upBtn.style.marginRight = '4px'
        upBtn.onclick = () => {
          const temp = layers[idx]
          layers[idx] = layers[idx - 1]
          layers[idx - 1] = temp
          this.saveLayers(canvas, layers)
          this.renderLayerList(canvas, container)
        }
        row.appendChild(upBtn)
      } else {
        const spacer = document.createElement('div')
        spacer.style.width = '20px'
        row.appendChild(spacer)
      }

      // 下移按钮
      if (idx < layers.length - 1) {
        const downBtn = document.createElement('button')
        downBtn.textContent = '↓'
        downBtn.title = '下移图层'
        downBtn.style.marginRight = '4px'
        downBtn.onclick = () => {
          const temp = layers[idx]
          layers[idx] = layers[idx + 1]
          layers[idx + 1] = temp
          this.saveLayers(canvas, layers)
          this.renderLayerList(canvas, container)
        }
        row.appendChild(downBtn)
      } else {
        const spacer = document.createElement('div')
        spacer.style.width = '20px'
        row.appendChild(spacer)
      }

      // 删除按钮（只有多于一个图层时才能删除）
      if (layers.length > 1) {
        const deleteBtn = document.createElement('button')
        deleteBtn.textContent = '×'
        deleteBtn.title = '删除图层'
        deleteBtn.style.color = '#ff4d4f'
        deleteBtn.onclick = () => {
          if (confirm(`确定要删除图层"${layer.name}"吗？图层中的节点和连接线将被移动到默认图层。`)) {
            // 如果删除的是当前图层，将当前图层设为第一个图层
            if (layer.id === currentLayerId) {
              const newCurrentIdx = idx === 0 ? 1 : 0
              currentLayerId = layers[newCurrentIdx].id
            }
            
            // 将该图层的节点和边缘移动到第一个图层
            const targetLayer = layers[0]
            if (layer.nodeIds?.length) {
              targetLayer.nodeIds = [...(targetLayer.nodeIds || []), ...(layer.nodeIds || [])]
            }
            if (layer.edgeIds?.length) {
              targetLayer.edgeIds = [...(targetLayer.edgeIds || []), ...(layer.edgeIds || [])]
            }
            
            // 移除该图层
            layers.splice(idx, 1)
            this.saveLayers(canvas, layers)
            this.renderLayerList(canvas, container)
            this.patchNodeVisibility(canvas)
          }
        }
        row.appendChild(deleteBtn)
      }

      container.appendChild(row)
    })
  }

  private addLayer(canvas: Canvas) {
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    const newLayer: CanvasLayer = {
      id: 'layer-' + Date.now() + '-' + Math.floor(Math.random()*10000),
      name: '新图层',
      visible: true,
      nodeIds: []
    }
    layers.push(newLayer)
    this.saveLayers(canvas, layers)
  }

  private saveLayers(canvas: Canvas, layers: CanvasLayer[]) {
    const data = canvas.getData()
    data.layers = layers
    canvas.setData(data)
  }

  // 节点与图层联动相关
  private handleNodeCreated(node: CanvasNode) {
    const canvas = node.canvas
    let layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    if (layers.length === 0) {
      this.addLayer(canvas)
      layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    }
    // 归属当前图层
    let targetLayer = layers.find(l => l.id === currentLayerId)
    if (!targetLayer) {
      targetLayer = layers[0]
      currentLayerId = targetLayer.id
    }
    if (!targetLayer.nodeIds.includes(node.id)) {
      targetLayer.nodeIds.push(node.id)
      this.saveLayers(canvas, layers)
      this.patchNodeVisibility(canvas)
    }
  }

  private handleNodeRemoved(node: CanvasNode) {
    const canvas = node.canvas
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    let changed = false
    for (const layer of layers) {
      const idx = layer.nodeIds.indexOf(node.id)
      if (idx !== -1) {
        layer.nodeIds.splice(idx, 1)
        changed = true
      }
    }
    if (changed) this.saveLayers(canvas, layers)
  }

  // 新建连接线归属当前图层（兼容edgeIds可选）
  private handleEdgeCreated(edge: any) {
    const canvas = edge.canvas
    let layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    let targetLayer = layers.find(l => l.id === currentLayerId)
    if (!targetLayer) return
    if (!targetLayer.edgeIds) targetLayer.edgeIds = []
    if (!targetLayer.edgeIds.includes(edge.id)) {
      targetLayer.edgeIds.push(edge.id)
      this.saveLayers(canvas, layers)
      this.patchNodeVisibility(canvas)
    }
  }

  // 删除连接线时移出所有图层（兼容edgeIds可选）
  private handleEdgeRemoved(edge: any) {
    const canvas = edge.canvas
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    let changed = false
    for (const layer of layers) {
      if (!layer.edgeIds) continue
      const idx = layer.edgeIds.indexOf(edge.id)
      if (idx !== -1) {
        layer.edgeIds.splice(idx, 1)
        changed = true
      }
    }
    if (changed) this.saveLayers(canvas, layers)
  }

  // 控制节点和连接线显示/隐藏（兼容edgeIds可选）
  private patchNodeVisibility(canvas: Canvas) {
    // 获取图层数据
    const layers = canvas.getData().layers as CanvasLayer[]
    if (!layers || !Array.isArray(layers)) return

    // 创建一个映射，记录每个节点和边缘所属的图层及其可见性
    const nodeLayerMap = new Map<string, {layerId: string, visible: boolean}>()
    const edgeLayerMap = new Map<string, {layerId: string, visible: boolean}>()

    // 填充映射
    layers.forEach(layer => {
      // 处理节点
      layer.nodeIds?.forEach(nodeId => {
        nodeLayerMap.set(nodeId, {layerId: layer.id, visible: layer.visible})
      })
      // 处理边缘
      layer.edgeIds?.forEach(edgeId => {
        edgeLayerMap.set(edgeId, {layerId: layer.id, visible: layer.visible})
      })
    })

    // 应用节点可见性
    canvas.nodes.forEach(node => {
      const layerInfo = nodeLayerMap.get(node.id)
      if (layerInfo) {
        // 设置节点可见性
        node.nodeEl.style.display = layerInfo.visible ? '' : 'none'
      }
    })

    // 应用边缘可见性
    canvas.edges.forEach(edge => {
      const layerInfo = edgeLayerMap.get(edge.id)
      if (layerInfo) {
        // 设置边缘可见性
        if (edge.lineGroupEl) {
          edge.lineGroupEl.style.display = layerInfo.visible ? '' : 'none'
        }
        
        // 设置线条可见性
        if (edge.path?.display) {
          edge.path.display.style.display = layerInfo.visible ? '' : 'none'
        }
        
        // 设置交互区域可见性
        if (edge.path?.interaction) {
          edge.path.interaction.style.display = layerInfo.visible ? '' : 'none'
        }
        
        // 设置标签可见性
        if (edge.labelElement?.wrapperEl) {
          edge.labelElement.wrapperEl.style.display = layerInfo.visible ? '' : 'none'
        }
        
        // 设置线端点可见性
        if (edge.fromLineEnd?.el) {
          edge.fromLineEnd.el.style.display = layerInfo.visible ? '' : 'none'
        }
        
        if (edge.toLineEnd?.el) {
          edge.toLineEnd.el.style.display = layerInfo.visible ? '' : 'none'
        }
        
        if (edge.lineEndGroupEl) {
          edge.lineEndGroupEl.style.display = layerInfo.visible ? '' : 'none'
        }
        
        // 处理边缘上的所有箭头
        this.updateEdgeArrowsVisibility(edge, layerInfo.visible)
      }
    })
  }

  // 更新边缘上箭头的可见性
  private updateEdgeArrowsVisibility(edge: any, visible: boolean) {
    if (!edge.lineGroupEl) return
    
    // 获取边缘上的所有箭头元素
    const arrows = edge.lineGroupEl.querySelectorAll('.edge-direction-arrow')
    
    // 设置箭头的可见性
    arrows.forEach((arrow: HTMLElement) => {
      arrow.style.display = visible ? '' : 'none'
    })
  }

  // 节点移动到当前图层
  private moveNodeToCurrentLayer(node: CanvasNode) {
    const canvas = node.canvas
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    if (!currentLayerId) return
    for (const layer of layers) {
      const idx = layer.nodeIds.indexOf(node.id)
      if (idx !== -1) layer.nodeIds.splice(idx, 1)
    }
    const targetLayer = layers.find(l => l.id === currentLayerId)
    if (targetLayer && !targetLayer.nodeIds.includes(node.id)) {
      targetLayer.nodeIds.push(node.id)
      this.saveLayers(canvas, layers)
      this.patchNodeVisibility(canvas)
    }
  }

  // 连接线移动到当前图层（兼容edgeIds可选）
  private moveEdgeToCurrentLayer(edge: any) {
    const canvas = edge.canvas
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    if (!currentLayerId) return
    for (const layer of layers) {
      if (!layer.edgeIds) continue
      const idx = layer.edgeIds.indexOf(edge.id)
      if (idx !== -1) layer.edgeIds.splice(idx, 1)
    }
    const targetLayer = layers.find(l => l.id === currentLayerId)
    if (targetLayer) {
      if (!targetLayer.edgeIds) targetLayer.edgeIds = []
      if (!targetLayer.edgeIds.includes(edge.id)) {
        targetLayer.edgeIds.push(edge.id)
        this.saveLayers(canvas, layers)
        this.patchNodeVisibility(canvas)
      }
    }
  }
} 
