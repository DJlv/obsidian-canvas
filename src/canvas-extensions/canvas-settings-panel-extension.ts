import CanvasExtension from "./canvas-extension"
import CanvasHelper from "../utils/canvas-helper"
import { Canvas } from "../@types/Canvas"
import { DEFAULT_SETTINGS_VALUES } from "../settings"

const CONTROL_MENU_SETTINGS_ID = 'canvas-settings-control'
const SETTINGS_PANEL_ID = 'canvas-settings-panel'

// 设置分类及其中文名称
const SETTINGS_CATEGORIES = {
  general: '常规设置',
  node: '节点设置',
  edge: '连接线设置',
  feature: '功能设置',
  presentation: '演示设置',
  advanced: '高级设置'
}

// 设置项的中文名称和描述
const SETTINGS_LABELS = {
  // 常规设置
  nodeTypeOnDoubleClick: { name: '双击创建的节点类型', desc: '双击画布时创建的节点类型' },
  alignNewNodesToGrid: { name: '将新节点对齐到网格', desc: '创建新节点时自动对齐到网格' },
  defaultTextNodeDimensions: { name: '默认文本节点尺寸', desc: '新建文本节点的默认宽高' },
  defaultFileNodeDimensions: { name: '默认文件节点尺寸', desc: '新建文件节点的默认宽高' },
  minNodeSize: { name: '最小节点尺寸', desc: '节点可调整的最小尺寸' },
  maxNodeWidth: { name: '最大节点宽度', desc: '节点可调整的最大宽度，-1表示无限制' },
  disableFontSizeRelativeToZoom: { name: '禁用字体大小随缩放变化', desc: '禁止字体大小随画布缩放而变化' },
  
  // 节点设置
  nodeStylingFeatureEnabled: { name: '启用节点样式', desc: '允许自定义节点样式' },
  customNodeStyleAttributes: { name: '自定义节点样式属性', desc: '添加自定义节点样式属性' },
  defaultTextNodeStyleAttributes: { name: '默认文本节点样式', desc: '设置默认文本节点样式' },
  defaultNodeDisplay: { name: '默认节点显示方式', desc: '设置默认节点的显示方式' },
  
  // 连接线设置
  edgesStylingFeatureEnabled: { name: '启用连接线样式', desc: '允许自定义连接线样式' },
  customEdgeStyleAttributes: { name: '自定义连接线样式属性', desc: '添加自定义连接线样式属性' },
  defaultEdgeLineDirection: { name: '默认连接线方向', desc: '设置默认连接线的方向箭头' },
  defaultEdgeStyleAttributes: { name: '默认连接线样式', desc: '设置默认连接线样式' },
  edgeStyleUpdateWhileDragging: { name: '拖动时更新连接线样式', desc: '拖动节点时实时更新连接线样式' },
  edgeStyleSquarePathRounded: { name: '方形路径圆角', desc: '使方形路径的连接线有圆角' },
  edgeStylePathfinderAllowDiagonal: { name: '路径查找允许对角线', desc: '路径查找算法允许对角线路径' },
  edgeStylePathfinderPathRounded: { name: '路径查找圆角', desc: '使路径查找的连接线有圆角' },
  
  // 功能设置
  floatingEdgeFeatureEnabled: { name: '启用浮动连接线', desc: '允许创建不固定在节点边缘的连接线' },
  allowFloatingEdgeCreation: { name: '允许创建浮动连接线', desc: '允许创建不固定在节点边缘的连接线' },
  newEdgeFromSideFloating: { name: '从侧边创建浮动连接线', desc: '从节点侧边创建浮动连接线' },
  customEdgeConnectionPositions: { name: '自定义连接线位置', desc: '允许自定义连接线在节点上的连接位置' },
  flipEdgeFeatureEnabled: { name: '启用连接线翻转', desc: '允许翻转连接线的起点和终点' },
  zOrderingControlFeatureEnabled: { name: '启用Z轴排序控制', desc: '允许控制节点的层叠顺序' },
  aspectRatioControlFeatureEnabled: { name: '启用宽高比控制', desc: '允许控制节点的宽高比' },
  commandsFeatureEnabled: { name: '启用命令', desc: '启用高级画布命令' },
  autoResizeNodeFeatureEnabled: { name: '启用节点自动调整大小', desc: '允许节点根据内容自动调整大小' },
  collapsibleGroupsFeatureEnabled: { name: '启用可折叠分组', desc: '允许折叠和展开分组节点' },
  focusModeFeatureEnabled: { name: '启用专注模式', desc: '允许进入专注模式，只显示选中的节点' },
  
  // 演示设置
  presentationFeatureEnabled: { name: '启用演示模式', desc: '允许进入演示模式' },
  showSetStartNodeInPopup: { name: '在弹出菜单中显示设置起始节点', desc: '在节点弹出菜单中显示设置为演示起始节点选项' },
  defaultSlideDimensions: { name: '默认幻灯片尺寸', desc: '演示模式下默认幻灯片的尺寸' },
  wrapInSlidePadding: { name: '幻灯片内边距', desc: '演示模式下幻灯片的内边距' },
  resetViewportOnPresentationEnd: { name: '演示结束时重置视图', desc: '演示结束时重置画布视图' },
  useArrowKeysToChangeSlides: { name: '使用方向键切换幻灯片', desc: '允许使用方向键切换幻灯片' },
  
  // 高级设置
  canvasMetadataCompatibilityEnabled: { name: '启用画布元数据兼容性', desc: '启用与其他插件的画布元数据兼容性' },
  treatFileNodeEdgesAsLinks: { name: '将文件节点连接线视为链接', desc: '将文件节点的连接线视为文件之间的链接' },
  enableSingleNodeLinks: { name: '启用单节点链接', desc: '允许创建单节点链接' },
  portalsFeatureEnabled: { name: '启用传送门', desc: '允许创建传送门节点' },
  canvasEncapsulationEnabled: { name: '启用画布封装', desc: '允许将画布封装为可重用组件' },
  autoFileNodeEdgesFeatureEnabled: { name: '启用自动文件节点连接线', desc: '根据文件内容自动创建文件节点连接线' },
  edgeHighlightEnabled: { name: '启用连接线高亮', desc: '允许高亮显示连接线' }
}

export default class CanvasSettingsPanelExtension extends CanvasExtension {
  isEnabled() { return true }

  init() {
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:canvas-changed',
      (canvas: Canvas) => {
        this.addSettingsControlButton(canvas)
      }
    ))
  }

  private addSettingsControlButton(canvas: Canvas) {
    const settingsContainer = canvas.quickSettingsButton?.parentElement
    if (!settingsContainer) return

    const settingsButton = CanvasHelper.createControlMenuButton({
      id: CONTROL_MENU_SETTINGS_ID,
      label: '设置',
      icon: 'settings',
      callback: () => {
        this.toggleSettingsPanel(canvas)
      }
    })
    CanvasHelper.addControlMenuButton(settingsContainer, settingsButton)
  }

  private toggleSettingsPanel(canvas: Canvas) {
    let panel = document.getElementById(SETTINGS_PANEL_ID)
    if (panel) {
      panel.remove()
      return
    }
    panel = this.createSettingsPanel(canvas)
    document.body.appendChild(panel)
  }

  private createSettingsPanel(canvas: Canvas): HTMLElement {
    const panel = document.createElement('div')
    panel.id = SETTINGS_PANEL_ID
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
    panel.style.minWidth = '400px'
    panel.style.maxWidth = '600px'
    panel.style.maxHeight = '80vh'
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
    title.textContent = '画布设置'
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

    // 创建设置分类标签页
    const tabsContainer = document.createElement('div')
    tabsContainer.style.display = 'flex'
    tabsContainer.style.borderBottom = '1px solid var(--background-modifier-border, #ccc)'
    tabsContainer.style.marginBottom = '16px'
    panel.appendChild(tabsContainer)

    const contentContainer = document.createElement('div')
    panel.appendChild(contentContainer)

    // 创建标签页
    Object.entries(SETTINGS_CATEGORIES).forEach(([category, label], index) => {
      const tab = document.createElement('div')
      tab.textContent = label
      tab.dataset.category = category
      tab.style.padding = '8px 12px'
      tab.style.cursor = 'pointer'
      tab.style.borderBottom = '2px solid transparent'
      
      if (index === 0) {
        tab.style.borderBottom = '2px solid var(--interactive-accent, #3a8cff)'
        tab.style.color = 'var(--interactive-accent, #3a8cff)'
        this.renderSettingsCategory(contentContainer, category)
      }
      
      tab.addEventListener('click', () => {
        // 移除所有标签页的活动状态
        tabsContainer.querySelectorAll('div').forEach(t => {
          t.style.borderBottom = '2px solid transparent'
          t.style.color = ''
        })
        
        // 设置当前标签页为活动状态
        tab.style.borderBottom = '2px solid var(--interactive-accent, #3a8cff)'
        tab.style.color = 'var(--interactive-accent, #3a8cff)'
        
        // 渲染对应分类的设置
        contentContainer.innerHTML = ''
        this.renderSettingsCategory(contentContainer, category)
      })
      
      tabsContainer.appendChild(tab)
    })

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

  private renderSettingsCategory(container: HTMLElement, category: string) {
    // 根据分类获取相关设置项
    const settings = this.getSettingsByCategory(category)
    
    settings.forEach(setting => {
      const settingInfo = SETTINGS_LABELS[setting.key]
      if (!settingInfo) return
      
      const settingContainer = document.createElement('div')
      settingContainer.style.marginBottom = '16px'
      container.appendChild(settingContainer)
      
      // 设置标题
      const settingTitle = document.createElement('div')
      settingTitle.textContent = settingInfo.name
      settingTitle.style.fontWeight = '500'
      settingTitle.style.marginBottom = '4px'
      settingContainer.appendChild(settingTitle)
      
      // 设置描述
      const settingDesc = document.createElement('div')
      settingDesc.textContent = settingInfo.desc
      settingDesc.style.fontSize = '12px'
      settingDesc.style.color = 'var(--text-muted, #999)'
      settingDesc.style.marginBottom = '8px'
      settingContainer.appendChild(settingDesc)
      
      // 设置控件
      this.createSettingControl(settingContainer, setting)
      
      // 分隔线
      const divider = document.createElement('div')
      divider.style.height = '1px'
      divider.style.background = 'var(--background-modifier-border, #eee)'
      divider.style.margin = '8px 0'
      settingContainer.appendChild(divider)
    })
  }

  private createSettingControl(container: HTMLElement, setting: { key: string, type: string, value: any, options?: {value: any, label: string}[], onChange?: (value: any) => void }) {
    const { key, type, value } = setting
    const settingsManager = this.plugin.settings
    
    switch (type) {
      case 'boolean':
        const toggleContainer = document.createElement('div')
        toggleContainer.style.display = 'flex'
        toggleContainer.style.alignItems = 'center'
        
        const toggle = document.createElement('div')
        toggle.style.width = '36px'
        toggle.style.height = '20px'
        toggle.style.borderRadius = '10px'
        toggle.style.background = value ? 'var(--interactive-accent, #3a8cff)' : 'var(--background-modifier-border, #ccc)'
        toggle.style.position = 'relative'
        toggle.style.cursor = 'pointer'
        toggle.style.transition = 'background 0.2s'
        
        const toggleHandle = document.createElement('div')
        toggleHandle.style.width = '16px'
        toggleHandle.style.height = '16px'
        toggleHandle.style.borderRadius = '50%'
        toggleHandle.style.background = '#fff'
        toggleHandle.style.position = 'absolute'
        toggleHandle.style.top = '2px'
        toggleHandle.style.left = value ? '18px' : '2px'
        toggleHandle.style.transition = 'left 0.2s'
        
        toggle.appendChild(toggleHandle)
        toggleContainer.appendChild(toggle)
        
        const toggleLabel = document.createElement('div')
        toggleLabel.textContent = value ? '开启' : '关闭'
        toggleLabel.style.marginLeft = '8px'
        toggleContainer.appendChild(toggleLabel)
        
        toggle.addEventListener('click', () => {
          const newValue = !value
          toggleHandle.style.left = newValue ? '18px' : '2px'
          toggle.style.background = newValue ? 'var(--interactive-accent, #3a8cff)' : 'var(--background-modifier-border, #ccc)'
          toggleLabel.textContent = newValue ? '开启' : '关闭'
          
          // 更新设置
          if (setting.onChange) {
            setting.onChange(newValue);
          } else {
            const updateData = { [key]: newValue }
            settingsManager.setSetting(updateData)
          }
        })
        
        container.appendChild(toggleContainer)
        break
        
      case 'text':
        const input = document.createElement('input')
        input.type = 'text'
        input.value = value
        input.style.width = '100%'
        input.style.padding = '6px 8px'
        input.style.borderRadius = '4px'
        input.style.border = '1px solid var(--background-modifier-border, #ccc)'
        
        input.addEventListener('change', () => {
          // 更新设置
          if (setting.onChange) {
            setting.onChange(input.value);
          } else {
            const updateData = { [key]: input.value }
            settingsManager.setSetting(updateData)
          }
        })
        
        container.appendChild(input)
        break
        
      case 'number':
        const numInput = document.createElement('input')
        numInput.type = 'number'
        numInput.value = value
        numInput.style.width = '100%'
        numInput.style.padding = '6px 8px'
        numInput.style.borderRadius = '4px'
        numInput.style.border = '1px solid var(--background-modifier-border, #ccc)'
        
        numInput.addEventListener('change', () => {
          // 更新设置
          if (setting.onChange) {
            setting.onChange(Number(numInput.value));
          } else {
            const updateData = { [key]: Number(numInput.value) }
            settingsManager.setSetting(updateData)
          }
        })
        
        container.appendChild(numInput)
        break
        
      case 'dimensions':
        const dimensionsContainer = document.createElement('div')
        dimensionsContainer.style.display = 'flex'
        dimensionsContainer.style.gap = '8px'
        
        const widthInput = document.createElement('input')
        widthInput.type = 'number'
        widthInput.value = value[0]
        widthInput.placeholder = '宽度'
        widthInput.style.flex = '1'
        widthInput.style.padding = '6px 8px'
        widthInput.style.borderRadius = '4px'
        widthInput.style.border = '1px solid var(--background-modifier-border, #ccc)'
        
        const heightInput = document.createElement('input')
        heightInput.type = 'number'
        heightInput.value = value[1]
        heightInput.placeholder = '高度'
        heightInput.style.flex = '1'
        heightInput.style.padding = '6px 8px'
        heightInput.style.borderRadius = '4px'
        heightInput.style.border = '1px solid var(--background-modifier-border, #ccc)'
        
        const updateDimensions = () => {
          if (setting.onChange) {
            setting.onChange([Number(widthInput.value), Number(heightInput.value)]);
          } else {
            const updateData = { [key]: [Number(widthInput.value), Number(heightInput.value)] }
            settingsManager.setSetting(updateData)
          }
        }
        
        widthInput.addEventListener('change', updateDimensions)
        heightInput.addEventListener('change', updateDimensions)
        
        dimensionsContainer.appendChild(widthInput)
        dimensionsContainer.appendChild(heightInput)
        container.appendChild(dimensionsContainer)
        break
        
      case 'dropdown':
        const select = document.createElement('select')
        select.style.width = '100%'
        select.style.padding = '6px 8px'
        select.style.borderRadius = '4px'
        select.style.border = '1px solid var(--background-modifier-border, #ccc)'
        
        // 添加选项
        if (setting.options) {
          // 使用提供的选项
          setting.options.forEach(option => {
            const optionEl = document.createElement('option')
            optionEl.value = option.value !== null ? option.value : ''
            optionEl.textContent = option.label
            optionEl.selected = value === option.value
            select.appendChild(optionEl)
          });
        } else if (key === 'nodeTypeOnDoubleClick') {
          const options = {
            'text': '文本节点',
            'file': '文件节点',
            'group': '分组节点'
          }
          
          Object.entries(options).forEach(([optionValue, optionLabel]) => {
            const option = document.createElement('option')
            option.value = optionValue
            option.textContent = optionLabel
            option.selected = value === optionValue
            select.appendChild(option)
          })
        } else if (key === 'defaultEdgeLineDirection') {
          const options = {
            'none': '无箭头',
            'unidirectional': '单向箭头',
            'bidirectional': '双向箭头',
            'multi-arrow': '多箭头'
          }
          
          Object.entries(options).forEach(([optionValue, optionLabel]) => {
            const option = document.createElement('option')
            option.value = optionValue
            option.textContent = optionLabel
            option.selected = value === optionValue
            select.appendChild(option)
          })
        }
        
        select.addEventListener('change', () => {
          // 处理空字符串为null（表示默认值）
          const selectedValue = select.value === '' ? null : select.value;
          
          // 更新设置
          if (setting.onChange) {
            setting.onChange(selectedValue);
          } else {
            const updateData = { [key]: selectedValue }
            settingsManager.setSetting(updateData)
          }
        })
        
        container.appendChild(select)
        break
    }
  }

  private getSettingsByCategory(category: string): { key: string, type: string, value: any }[] {
    const settings = []
    const settingsManager = this.plugin.settings
    
    // 根据分类获取相关设置项
    switch (category) {
      case 'general':
        settings.push(
          { key: 'nodeTypeOnDoubleClick', type: 'dropdown', value: settingsManager.getSetting('nodeTypeOnDoubleClick') },
          { key: 'alignNewNodesToGrid', type: 'boolean', value: settingsManager.getSetting('alignNewNodesToGrid') },
          { key: 'defaultTextNodeDimensions', type: 'dimensions', value: settingsManager.getSetting('defaultTextNodeDimensions') },
          { key: 'defaultFileNodeDimensions', type: 'dimensions', value: settingsManager.getSetting('defaultFileNodeDimensions') },
          { key: 'minNodeSize', type: 'number', value: settingsManager.getSetting('minNodeSize') },
          { key: 'maxNodeWidth', type: 'number', value: settingsManager.getSetting('maxNodeWidth') },
          { key: 'disableFontSizeRelativeToZoom', type: 'boolean', value: settingsManager.getSetting('disableFontSizeRelativeToZoom') }
        )
        break
        
      case 'node':
        settings.push(
          { key: 'nodeStylingFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('nodeStylingFeatureEnabled') },
          { 
            key: 'defaultNodeDisplay', 
            type: 'dropdown', 
            value: settingsManager.getSetting('defaultTextNodeStyleAttributes')?.display || null,
            options: [
              { value: null, label: '标准' },
              { value: 'pure-text', label: '纯文本' }
            ],
            onChange: (value) => {
              const currentStyles = settingsManager.getSetting('defaultTextNodeStyleAttributes') || {};
              settingsManager.setSetting({
                defaultTextNodeStyleAttributes: {
                  ...currentStyles,
                  display: value
                }
              });
            }
          }
        )
        break
        
      case 'edge':
        settings.push(
          { key: 'edgesStylingFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('edgesStylingFeatureEnabled') },
          { key: 'defaultEdgeLineDirection', type: 'dropdown', value: settingsManager.getSetting('defaultEdgeLineDirection') },
          { key: 'edgeStyleUpdateWhileDragging', type: 'boolean', value: settingsManager.getSetting('edgeStyleUpdateWhileDragging') },
          { key: 'edgeStyleSquarePathRounded', type: 'boolean', value: settingsManager.getSetting('edgeStyleSquarePathRounded') },
          { key: 'edgeStylePathfinderAllowDiagonal', type: 'boolean', value: settingsManager.getSetting('edgeStylePathfinderAllowDiagonal') },
          { key: 'edgeStylePathfinderPathRounded', type: 'boolean', value: settingsManager.getSetting('edgeStylePathfinderPathRounded') }
        )
        break
        
      case 'feature':
        settings.push(
          { key: 'floatingEdgeFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('floatingEdgeFeatureEnabled') },
          { key: 'allowFloatingEdgeCreation', type: 'boolean', value: settingsManager.getSetting('allowFloatingEdgeCreation') },
          { key: 'customEdgeConnectionPositions', type: 'boolean', value: settingsManager.getSetting('customEdgeConnectionPositions') },
          { key: 'flipEdgeFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('flipEdgeFeatureEnabled') },
          { key: 'zOrderingControlFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('zOrderingControlFeatureEnabled') },
          { key: 'aspectRatioControlFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('aspectRatioControlFeatureEnabled') },
          { key: 'commandsFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('commandsFeatureEnabled') },
          { key: 'autoResizeNodeFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('autoResizeNodeFeatureEnabled') },
          { key: 'collapsibleGroupsFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('collapsibleGroupsFeatureEnabled') },
          { key: 'focusModeFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('focusModeFeatureEnabled') }
        )
        break
        
      case 'presentation':
        settings.push(
          { key: 'presentationFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('presentationFeatureEnabled') },
          { key: 'showSetStartNodeInPopup', type: 'boolean', value: settingsManager.getSetting('showSetStartNodeInPopup') },
          { key: 'defaultSlideDimensions', type: 'dimensions', value: settingsManager.getSetting('defaultSlideDimensions') },
          { key: 'wrapInSlidePadding', type: 'number', value: settingsManager.getSetting('wrapInSlidePadding') },
          { key: 'resetViewportOnPresentationEnd', type: 'boolean', value: settingsManager.getSetting('resetViewportOnPresentationEnd') },
          { key: 'useArrowKeysToChangeSlides', type: 'boolean', value: settingsManager.getSetting('useArrowKeysToChangeSlides') }
        )
        break
        
      case 'advanced':
        settings.push(
          { key: 'canvasMetadataCompatibilityEnabled', type: 'boolean', value: settingsManager.getSetting('canvasMetadataCompatibilityEnabled') },
          { key: 'treatFileNodeEdgesAsLinks', type: 'boolean', value: settingsManager.getSetting('treatFileNodeEdgesAsLinks') },
          { key: 'enableSingleNodeLinks', type: 'boolean', value: settingsManager.getSetting('enableSingleNodeLinks') },
          { key: 'portalsFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('portalsFeatureEnabled') },
          { key: 'canvasEncapsulationEnabled', type: 'boolean', value: settingsManager.getSetting('canvasEncapsulationEnabled') },
          { key: 'autoFileNodeEdgesFeatureEnabled', type: 'boolean', value: settingsManager.getSetting('autoFileNodeEdgesFeatureEnabled') },
          { key: 'edgeHighlightEnabled', type: 'boolean', value: settingsManager.getSetting('edgeHighlightEnabled') }
        )
        break
    }
    
    return settings
  }
} 