import { Canvas, Position } from "src/@types/Canvas"
import CanvasHelper from "src/utils/canvas-helper"
import CanvasExtension from "./canvas-extension"
import { CanvasTableNodeData } from "assets/formats/advanced-json-canvas/spec/1.0-1.0"

const TABLE_NODE_SIZE = { width: 500, height: 350 }
const DEFAULT_ROWS = 4
const DEFAULT_COLUMNS = 4

export default class TableCanvasExtension extends CanvasExtension {
  isEnabled() { return true }

  init() {
    // 添加样式
    this.addTableStyles()
    
    // 添加表格按钮到卡片菜单
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:canvas-changed',
      (canvas: Canvas) => {
        CanvasHelper.addCardMenuOption(
          canvas,
          CanvasHelper.createCardMenuOption(
            canvas,
            {
              id: 'create-table',
              label: '拖动添加表格',
              icon: 'table'
            },
            () => TABLE_NODE_SIZE,
            (canvas: Canvas, pos: Position) => {
              this.createTableNode(canvas, pos)
            }
          )
        )
      }
    ))

    // 监听表格节点创建，处理渲染
    this.plugin.registerEvent(this.plugin.app.workspace.on(
      'advanced-canvas:node-created',
      (canvas: Canvas, node: any) => {
        if (node.getData().type === 'table') {
          this.renderTableNode(node)
        }
      }
    ))
  }

  // 添加表格样式
  private addTableStyles() {
    const styleEl = document.createElement('style')
    styleEl.id = 'canvas-table-styles'
    styleEl.textContent = `
      .canvas-table-node .canvas-node-content {
        padding: 0 !important;
        background: var(--background-primary) !important;
        border: 1px solid var(--background-modifier-border) !important;
        box-shadow: 0 2px 8px var(--background-modifier-box-shadow) !important;
        overflow: hidden !important;
      }
      
      .table-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .table-toolbar {
        display: flex;
        padding: 4px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        gap: 4px;
      }
      
      .table-toolbar button {
        padding: 2px 8px;
        font-size: 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 3px;
        background: var(--interactive-normal);
        color: var(--text-normal);
        cursor: pointer;
      }
      
      .table-toolbar button:hover {
        background: var(--interactive-hover);
      }
      
      .table-content {
        flex: 1;
        overflow: auto;
      }
      
      .excel-table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--font-text);
        font-size: var(--font-smaller);
        color: var(--text-normal);
      }
      
      .excel-table th {
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        padding: 5px;
        font-weight: bold;
        text-align: center;
        color: var(--text-normal);
      }
      
      .excel-table td {
        border: 1px solid var(--background-modifier-border);
        padding: 5px;
        text-align: left;
      }
      
      .excel-table tr:nth-child(even) {
        background: var(--background-secondary-alt);
      }
      
      .excel-table .row-header {
        background: var(--background-secondary);
        font-weight: bold;
        text-align: center;
        color: var(--text-normal);
        width: 30px;
      }
      
      .excel-table .selected {
        background: var(--background-modifier-active);
        border: 2px solid var(--interactive-accent);
      }
    `
    
    // 如果已存在则移除旧样式
    document.getElementById('canvas-table-styles')?.remove()
    document.head.appendChild(styleEl)
  }

  // 创建表格节点
  private createTableNode(canvas: Canvas, pos: Position) {
    // 生成默认表格数据
    const data: string[][] = []
    for (let i = 0; i < DEFAULT_ROWS; i++) {
      const row: string[] = []
      for (let j = 0; j < DEFAULT_COLUMNS; j++) {
        row.push(`${i+1}-${j+1}`)
      }
      data.push(row)
    }

    // 创建节点
    const tableNode = canvas.createTextNode({
      pos: pos,
      size: TABLE_NODE_SIZE,
      text: '' // 空文本，将被表格替换
    })

    // 修改节点类型和数据
    const nodeData = tableNode.getData()
    const tableData: CanvasTableNodeData = {
      ...nodeData,
      type: 'table',
      rows: DEFAULT_ROWS,
      columns: DEFAULT_COLUMNS,
      data: data,
      headers: ['A', 'B', 'C', 'D'],
      mergedCells: [
        // 默认合并第一行的前两列作为示例
        { startRow: 0, startCol: 0, endRow: 0, endCol: 1 }
      ],
      cellStyles: [
        // 为第一个合并单元格添加样式
        { 
          row: 0, 
          col: 0, 
          style: { 
            backgroundColor: 'var(--interactive-accent-hover)' as any, 
            fontWeight: 'bold',
            textAlign: 'center'
          } 
        }
      ],
      styles: {
        cellPadding: 5,
        borderWidth: 1,
        headerBackground: 'var(--background-secondary)' as any,
        alternateRowBackground: 'var(--background-secondary-alt)' as any,
        borderColor: 'var(--background-modifier-border)' as any,
        headerTextColor: 'var(--text-normal)' as any,
        fontFamily: 'var(--font-text)',
        fontSize: 12,
        tableWidth: '100%'
      }
    }

    // 更新节点数据
    tableNode.setData(tableData)
    
    // 添加自定义CSS类
    if (tableNode.nodeEl) {
      tableNode.nodeEl.classList.add('canvas-table-node')
    }
    
    // 渲染表格
    this.renderTableNode(tableNode)
  }

  // 渲染表格节点
  private renderTableNode(node: any) {
    try {
      const data = node.getData() as CanvasTableNodeData
      if (data.type !== 'table' || !node.contentEl) return
      
      // 添加节点类
      node.nodeEl?.classList.add('canvas-table-node')
      
      // 创建表格容器
      const container = document.createElement('div')
      container.className = 'table-container'
      
      // 添加工具栏
      const toolbar = document.createElement('div')
      toolbar.className = 'table-toolbar'
      
      // 添加行按钮
      const addRowBtn = document.createElement('button')
      addRowBtn.textContent = '添加行'
      addRowBtn.onclick = () => this.addRow(node, data)
      toolbar.appendChild(addRowBtn)
      
      // 添加列按钮
      const addColBtn = document.createElement('button')
      addColBtn.textContent = '添加列'
      addColBtn.onclick = () => this.addColumn(node, data)
      toolbar.appendChild(addColBtn)
      
      // 合并单元格按钮
      const mergeBtn = document.createElement('button')
      mergeBtn.textContent = '合并单元格'
      mergeBtn.onclick = () => this.mergeCells(node, data)
      toolbar.appendChild(mergeBtn)
      
      container.appendChild(toolbar)
      
      // 添加表格内容
      const content = document.createElement('div')
      content.className = 'table-content'
      content.innerHTML = this.generateTableHtml(data)
      container.appendChild(content)
      
      // 清空节点内容并添加新容器
      node.contentEl.innerHTML = ''
      node.contentEl.appendChild(container)
      
      // 添加单元格编辑事件
      this.addCellEvents(node, content, data)
    } catch (error) {
      console.error('表格渲染错误:', error)
    }
  }

  // 生成表格HTML
  private generateTableHtml(data: CanvasTableNodeData): string {
    try {
      const { rows, columns, data: tableData, headers, mergedCells } = data
      
      // 创建单元格占用标记数组
      const occupied = Array(rows).fill(0).map(() => Array(columns).fill(false))
      
      // 标记被合并单元格占用的单元格
      if (mergedCells) {
        for (const merge of mergedCells) {
          for (let i = merge.startRow; i <= merge.endRow; i++) {
            for (let j = merge.startCol; j <= merge.endCol; j++) {
              if (i !== merge.startRow || j !== merge.startCol) {
                occupied[i][j] = true
              }
            }
          }
        }
      }
      
      // 生成表格HTML
      let html = '<table class="excel-table">'
      
      // 表头
      html += '<thead><tr><th></th>'
      for (let j = 0; j < columns; j++) {
        const headerText = headers && j < headers.length ? headers[j] : String.fromCharCode(65 + j)
        html += `<th>${headerText}</th>`
      }
      html += '</tr></thead>'
      
      // 表格内容
      html += '<tbody>'
      for (let i = 0; i < rows; i++) {
        html += '<tr>'
        html += `<td class="row-header">${i+1}</td>`
        
        for (let j = 0; j < columns; j++) {
          // 如果单元格被占用则跳过
          if (occupied[i][j]) continue
          
          // 获取单元格数据
          const cellData = tableData[i] && tableData[i][j] ? tableData[i][j] : ''
          
          // 检查是否是合并单元格
          let rowspan = 1, colspan = 1
          const mergedCell = mergedCells?.find(m => m.startRow === i && m.startCol === j)
          if (mergedCell) {
            rowspan = mergedCell.endRow - mergedCell.startRow + 1
            colspan = mergedCell.endCol - mergedCell.startCol + 1
          }
          
          // 获取单元格样式
          const style = this.getCellStyle(data, i, j)
          const styleStr = Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';')
          
          // 生成单元格
          html += `<td 
            data-row="${i}" 
            data-col="${j}" 
            ${rowspan > 1 ? `rowspan="${rowspan}"` : ''} 
            ${colspan > 1 ? `colspan="${colspan}"` : ''}
            ${styleStr ? `style="${styleStr}"` : ''}
          >${cellData}</td>`
        }
        
        html += '</tr>'
      }
      html += '</tbody></table>'
      
      return html
    } catch (error) {
      console.error('生成表格HTML错误:', error)
      return '<div>表格生成错误</div>'
    }
  }

  // 添加单元格事件
  private addCellEvents(node: any, container: HTMLElement, data: CanvasTableNodeData) {
    const cells = container.querySelectorAll('td:not(.row-header)')
    cells.forEach(cell => {
      const row = parseInt(cell.getAttribute('data-row') || '0')
      const col = parseInt(cell.getAttribute('data-col') || '0')
      
      // 点击选中
      cell.addEventListener('click', () => {
        container.querySelectorAll('td.selected').forEach(el => el.classList.remove('selected'))
        cell.classList.add('selected')
      })
      
      // 双击编辑
      cell.addEventListener('dblclick', (e) => {
        e.stopPropagation()
        
        // 检查是否是合并单元格的主单元格
        if (!this.canEditCell(data, row, col)) return
        
        // 创建输入框
        const input = document.createElement('input')
        input.value = data.data[row][col]
        input.style.width = '100%'
        input.style.height = '100%'
        input.style.border = 'none'
        input.style.padding = '0'
        input.style.boxSizing = 'border-box'
        
        // 替换单元格内容
        const oldContent = cell.innerHTML
        cell.innerHTML = ''
        cell.appendChild(input)
        input.focus()
        
        // 失去焦点时保存
        input.addEventListener('blur', () => {
          // 更新数据
          data.data[row][col] = input.value
          node.setData(data)
          
          // 重新渲染
          cell.textContent = input.value
        })
        
        // 按Enter保存
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            input.blur()
          } else if (e.key === 'Escape') {
            cell.innerHTML = oldContent
          }
        })
      })
    })
  }

  // 添加行
  private addRow(node: any, data: CanvasTableNodeData) {
    // 创建新行
    const newRow = Array(data.columns).fill('').map((_, j) => `${data.rows + 1}-${j+1}`)
    
    // 更新数据
    data.data.push(newRow)
    data.rows++
    
    // 更新节点
    node.setData(data)
    this.renderTableNode(node)
  }

  // 添加列
  private addColumn(node: any, data: CanvasTableNodeData) {
    // 更新每行
    for (let i = 0; i < data.rows; i++) {
      data.data[i].push(`${i+1}-${data.columns+1}`)
    }
    
    // 更新表头
    if (data.headers) {
      const newHeader = String.fromCharCode(65 + data.columns)
      data.headers.push(newHeader)
    }
    
    // 更新列数
    data.columns++
    
    // 更新节点
    node.setData(data)
    this.renderTableNode(node)
  }

  // 合并单元格
  private mergeCells(node: any, data: CanvasTableNodeData) {
    // 简单示例：合并下一个单元格
    if (!data.mergedCells) data.mergedCells = []
    
    data.mergedCells.push({
      startRow: 1,
      startCol: 1,
      endRow: 1,
      endCol: 2
    })
    
    // 更新节点
    node.setData(data)
    this.renderTableNode(node)
  }

  // 获取单元格样式
  private getCellStyle(data: CanvasTableNodeData, row: number, col: number): Record<string, string> {
    const style: Record<string, string> = {}
    
    // 基本样式
    style['padding'] = '5px'
    
    // 交替行背景
    if (row % 2 === 1) {
      style['background-color'] = (data.styles?.alternateRowBackground as string) || 'var(--background-secondary-alt)'
    }
    
    // 自定义单元格样式
    const cellStyle = data.cellStyles?.find(s => s.row === row && s.col === col)
    if (cellStyle) {
      if (cellStyle.style.backgroundColor) style['background-color'] = cellStyle.style.backgroundColor as string
      if (cellStyle.style.textColor) style['color'] = cellStyle.style.textColor as string
      if (cellStyle.style.fontWeight) style['font-weight'] = cellStyle.style.fontWeight
      if (cellStyle.style.textAlign) style['text-align'] = cellStyle.style.textAlign
      if (cellStyle.style.verticalAlign) style['vertical-align'] = cellStyle.style.verticalAlign
    }
    
    return style
  }

  // 检查单元格是否可以编辑
  private canEditCell(data: CanvasTableNodeData, row: number, col: number): boolean {
    if (!data.mergedCells) return true
    
    // 检查是否是合并单元格的主单元格
    const isMergedMainCell = data.mergedCells.some(m => m.startRow === row && m.startCol === col)
    
    // 检查是否是合并单元格的一部分但不是主单元格
    const isPartOfMergedCell = data.mergedCells.some(m => 
      row >= m.startRow && row <= m.endRow && 
      col >= m.startCol && col <= m.endCol &&
      !(row === m.startRow && col === m.startCol)
    )
    
    return isMergedMainCell || !isPartOfMergedCell
  }
} 