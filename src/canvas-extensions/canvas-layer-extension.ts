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
    panel.style.top = '80px'
    panel.style.right = '40px'
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

    // 标题栏
    const title = document.createElement('div')
    title.textContent = '图层管理'
    title.style.fontWeight = 'bold'
    title.style.marginBottom = '12px'
    panel.appendChild(title)

    // 关闭按钮
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '×'
    closeBtn.style.position = 'absolute'
    closeBtn.style.top = '8px'
    closeBtn.style.right = '12px'
    closeBtn.style.background = 'none'
    closeBtn.style.border = 'none'
    closeBtn.style.fontSize = '12px'
    closeBtn.style.cursor = 'pointer'
    closeBtn.onclick = () => panel.remove()
    panel.appendChild(closeBtn)

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

      // 显隐按钮
      const visibleBtn = document.createElement('button')
      visibleBtn.textContent = layer.visible ? '👁️' : '🚫'
      visibleBtn.title = layer.visible ? '隐藏图层' : '显示图层'
      visibleBtn.style.marginRight = '8px'
      visibleBtn.onclick = () => {
        layer.visible = !layer.visible
        this.saveLayers(canvas, layers)
        this.renderLayerList(canvas, container)
        this.patchNodeVisibility(canvas)
      }
      row.appendChild(visibleBtn)

      // 名称（可编辑）
      const nameInput = document.createElement('input')
      nameInput.value = layer.name
      nameInput.style.flex = '1'
      nameInput.style.marginRight = '8px'
      nameInput.onchange = () => {
        layer.name = nameInput.value
        this.saveLayers(canvas, layers)
      }
      row.appendChild(nameInput)

      // 删除按钮
      const delBtn = document.createElement('button')
      delBtn.textContent = '🗑️'
      delBtn.title = '删除图层'
      delBtn.style.marginRight = '4px'
      delBtn.onclick = () => {
        if (confirm('确定要删除该图层吗？')) {
          // 删除图层时，移除节点归属
          layer.nodeIds.forEach(nodeId => {
            if (canvas.nodes.has(nodeId)) {
              // 可选：也可以选择将节点移动到其他图层
              canvas.removeNode(canvas.nodes.get(nodeId)!)
            }
          })
          layers.splice(idx, 1)
          this.saveLayers(canvas, layers)
          this.renderLayerList(canvas, container)
          this.patchNodeVisibility(canvas)
        }
      }
      row.appendChild(delBtn)

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
    const layers = (canvas.getData().layers ?? []) as CanvasLayer[]
    const visibleLayerIds = new Set(layers.filter(l => l.visible).map(l => l.id))
    // 统计所有可见图层下的节点id和连接线id
    const visibleNodeIds = new Set<string>()
    const visibleEdgeIds = new Set<string>()
    for (const layer of layers) {
      if (visibleLayerIds.has(layer.id)) {
        layer.nodeIds.forEach(id => visibleNodeIds.add(id))
        if (layer.edgeIds) layer.edgeIds.forEach(id => visibleEdgeIds.add(id))
      }
    }
    // 节点显示
    for (const node of canvas.nodes.values()) {
      node.nodeEl.style.display = visibleNodeIds.has(node.id) ? '' : 'none'
    }
    // 连接线显示（严格跟随图层）
    for (const edge of canvas.edges.values()) {
      const show = visibleEdgeIds.has(edge.id)
      edge.path.display.style.display = show ? '' : 'none'
      edge.path.interaction.style.display = show ? '' : 'none'
      if (edge.labelElement?.wrapperEl) edge.labelElement.wrapperEl.style.display = show ? '' : 'none'
      // 箭头相关
      if (edge.fromLineEnd?.el) edge.fromLineEnd.el.style.display = show ? '' : 'none'
      if (edge.toLineEnd?.el) edge.toLineEnd.el.style.display = show ? '' : 'none'
      if (edge.lineEndGroupEl) edge.lineEndGroupEl.style.display = show ? '' : 'none'
    }
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