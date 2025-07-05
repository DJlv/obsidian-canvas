// import { Canvas, Position } from "src/@types/Canvas"
// import CanvasHelper from "src/utils/canvas-helper"
// import CanvasExtension from "./canvas-extension"
// import { CanvasPureTableNodeData } from "assets/formats/advanced-json-canvas/spec/1.0-1.0"

// const TABLE_NODE_SIZE = { width: 500, height: 350 }
// const DEFAULT_ROWS = 4
// const DEFAULT_COLUMNS = 4

// export default class PureTableCanvasExtension extends CanvasExtension {
//   isEnabled() { return true }

//   init() {
//     // 添加样式
//     this.addPureTableStyles()
    
//     // 添加表格按钮到卡片菜单
//     this.plugin.registerEvent(this.plugin.app.workspace.on(
//       'advanced-canvas:canvas-changed',
//       (canvas: Canvas) => {
//         CanvasHelper.addCardMenuOption(
//           canvas,
//           CanvasHelper.createCardMenuOption(
//             canvas,
//             {
//               id: 'create-pure-table',
//               label: '拖动添加纯表格',
//               icon: 'table'
//             },
//             () => TABLE_NODE_SIZE,
//             (canvas: Canvas, pos: Position) => {
//               this.createPureTableNode(canvas, pos)
//             }
//           )
//         )
//       }
//     ))

//     // 监听节点创建，处理渲染
//     this.plugin.registerEvent(this.plugin.app.workspace.on(
//       'advanced-canvas:node-created',
//       (canvas: Canvas, node: any) => {
//         if (node.getData().type === 'pure-table') {
//           this.renderPureTableNode(node)
//         }
//       }
//     ))
//   }

//   // 添加纯表格样式
//   private addPureTableStyles() {
//     const styleEl = document.createElement('style')
//     styleEl.id = 'canvas-pure-table-styles'
//     styleEl.textContent = `
//       /* 纯表格节点样式 */
//       .canvas-pure-table-node {
//         background: var(--background-primary);
//         border: 1px solid var(--background-modifier-border);
//         border-radius: 4px;
//         box-shadow: 0 2px 8px var(--background-modifier-box-shadow);
//         overflow: hidden;
//       }
      
//       .canvas-pure-table-node .canvas-node-label {
//         display: none !important;
//       }
      
//       .canvas-pure-table-node .canvas-node-content {
//         padding: 0 !important;
//         background: var(--background-primary) !important;
//         border: none !important;
//         box-shadow: none !important;
//         overflow: hidden !important;
//       }
      
//       /* 表格容器 */
//       .pure-table-container {
//         display: flex;
//         flex-direction: column;
//         height: 100%;
//         width: 100%;
//       }
      
//       /* 表格工具栏 */
//       .pure-table-toolbar {
//         display: flex;
//         padding: 4px;
//         border-bottom: 1px solid var(--background-modifier-border);
//         background: var(--background-secondary);
//         gap: 4px;
//         flex-wrap: wrap;
//       }
      
//       .pure-table-toolbar button {
//         padding: 2px 8px;
//         font-size: 12px;
//         border: 1px solid var(--background-modifier-border);
//         border-radius: 3px;
//         background: var(--interactive-normal);
//         color: var(--text-normal);
//         cursor: pointer;
//       }
      
//       .pure-table-toolbar button:hover {
//         background: var(--interactive-hover);
//       }
      
//       /* 表格内容区 */
//       .pure-table-content {
//         flex: 1;
//         overflow: auto;
//       }
      
//       /* 表格样式 */
//       .pure-table {
//         width: 100%;
//         border-collapse: collapse;
//         font-family: var(--font-text);
//         font-size: var(--font-smaller);
//         color: var(--text-normal);
//       }
      
//       .pure-table th {
//         background: var(--background-secondary);
//         border: 1px solid var(--background-modifier-border);
//         padding: 5px;
//         font-weight: bold;
//         text-align: center;
//         color: var(--text-normal);
//         position: sticky;
//         top: 0;
//         z-index: 1;
//       }
      
//       .pure-table td {
//         border: 1px solid var(--background-modifier-border);
//         padding: 5px;
//         text-align: left;
//       }
      
//       .pure-table tr:nth-child(even) {
//         background: var(--background-secondary-alt);
//       }
      
//       .pure-table .row-header {
//         background: var(--background-secondary);
//         font-weight: bold;
//         text-align: center;
//         color: var(--text-normal);
//         width: 30px;
//         position: sticky;
//         left: 0;
//         z-index: 1;
//       }
      
//       .pure-table .selected {
//         background: var(--background-modifier-active);
//         border: 2px solid var(--interactive-accent);
//       }
      
//       /* 状态栏 */
//       .pure-table-status {
//         padding: 2px 8px;
//         font-size: 11px;
//         color: var(--text-muted);
//         background: var(--background-secondary);
//         border-top: 1px solid var(--background-modifier-border);
//       }
      
//       /* 单元格编辑状态 */
//       .pure-table-cell-editing {
//         padding: 0 !important;
//       }
      
//       .pure-table-cell-input {
//         width: 100%;
//         height: 100%;
//         border: none;
//         padding: 5px;
//         box-sizing: border-box;
//         background: var(--background-primary);
//         color: var(--text-normal);
//         font-family: var(--font-text);
//         font-size: var(--font-smaller);
//       }
      
//       .pure-table-cell-input:focus {
//         outline: none;
//       }
//     `
    
//     // 如果已存在则移除旧样式
//     document.getElementById('canvas-pure-table-styles')?.remove()
//     document.head.appendChild(styleEl)
//   }

//   // 创建纯表格节点
//   private createPureTableNode(canvas: Canvas, pos: Position) {
//     try {
//       // 生成默认表格数据
//       const data: string[][] = []
//       for (let i = 0; i < DEFAULT_ROWS; i++) {
//         const row: string[] = []
//         for (let j = 0; j < DEFAULT_COLUMNS; j++) {
//           row.push(`${i+1}-${j+1}`)
//         }
//         data.push(row)
//       }

//       // 使用createTextNode创建基础节点，然后修改其类型
//       const tableNode = canvas.createTextNode({
//         pos: pos,
//         size: TABLE_NODE_SIZE,
//         text: 'qweqwe' // 空文本
//       })

//       // 修改节点类型和数据
//       const nodeData = tableNode.getData()
//       const tableData: CanvasPureTableNodeData = {
//         ...nodeData,
//         type: 'pure-table', // 修改类型为pure-table
//         rows: DEFAULT_ROWS,
//         columns: DEFAULT_COLUMNS,
//         data: data,
//         headers: ['A', 'B', 'C', 'D'],
//         mergedCells: [
//           // 默认合并第一行的前两列作为示例
//           { startRow: 0, startCol: 0, endRow: 0, endCol: 1 }
//         ],
//         cellStyles: [
//           // 为第一个合并单元格添加样式
//           { 
//             row: 0, 
//             col: 0, 
//             style: { 
//               backgroundColor: 'var(--interactive-accent-hover)' as any, 
//               fontWeight: 'bold',
//               textAlign: 'center'
//             } 
//           }
//         ],
//         styles: {
//           cellPadding: 5,
//           borderWidth: 1,
//           headerBackground: 'var(--background-secondary)' as any,
//           alternateRowBackground: 'var(--background-secondary-alt)' as any,
//           borderColor: 'var(--background-modifier-border)' as any,
//           headerTextColor: 'var(--text-normal)' as any,
//           fontFamily: 'var(--font-text)',
//           fontSize: 12,
//           tableWidth: '100%'
//         }
//       }

//       // 更新节点数据
//       tableNode.setData(tableData)
      
//       // 添加自定义CSS类
//       if (tableNode.nodeEl) {
//         tableNode.nodeEl.classList.add('canvas-pure-table-node')
//       }
      
//       // 渲染表格
//       this.renderPureTableNode(tableNode)
//     } catch (error) {
//       console.error('创建纯表格节点失败:', error)
//     }
//   }

//   // 渲染纯表格节点
//   private renderPureTableNode(node: any) {
//     try {
//       const data = node.getData() as CanvasPureTableNodeData
//       if (data.type !== 'pure-table' || !node.contentEl) return
      
//       // 添加节点类
//       node.nodeEl?.classList.add('canvas-pure-table-node')
      
//       // 创建表格容器
//       const container = document.createElement('div')
//       container.className = 'pure-table-container'
      
//       // 添加工具栏
//       const toolbar = document.createElement('div')
//       toolbar.className = 'pure-table-toolbar'
      
//       // 添加行按钮
//       const addRowBtn = document.createElement('button')
//       addRowBtn.textContent = '添加行'
//       addRowBtn.onclick = () => this.addRow(node, data)
//       toolbar.appendChild(addRowBtn)
      
//       // 添加列按钮
//       const addColBtn = document.createElement('button')
//       addColBtn.textContent = '添加列'
//       addColBtn.onclick = () => this.addColumn(node, data)
//       toolbar.appendChild(addColBtn)
      
//       // 合并单元格按钮
//       const mergeBtn = document.createElement('button')
//       mergeBtn.textContent = '合并单元格'
//       mergeBtn.onclick = () => this.mergeCells(node, data)
//       toolbar.appendChild(mergeBtn)
      
//       // 删除行按钮
//       const deleteRowBtn = document.createElement('button')
//       deleteRowBtn.textContent = '删除行'
//       deleteRowBtn.onclick = () => this.deleteRow(node, data)
//       toolbar.appendChild(deleteRowBtn)
      
//       // 删除列按钮
//       const deleteColBtn = document.createElement('button')
//       deleteColBtn.textContent = '删除列'
//       deleteColBtn.onclick = () => this.deleteColumn(node, data)
//       toolbar.appendChild(deleteColBtn)
      
//       container.appendChild(toolbar)
      
//       // 添加表格内容
//       const content = document.createElement('div')
//       content.className = 'pure-table-content'
//       content.innerHTML = this.generateTableHtml(data)
//       container.appendChild(content)
      
//       // 添加状态栏
//       const status = document.createElement('div')
//       status.className = 'pure-table-status'
//       status.textContent = `${data.rows} 行 × ${data.columns} 列`
//       container.appendChild(status)
      
//       // 清空节点内容并添加新容器
//       node.contentEl.innerHTML = ''
//       node.contentEl.appendChild(container)
      
//       // 添加单元格编辑事件
//       this.addCellEvents(node, content, data)
//     } catch (error) {
//       console.error('渲染纯表格节点错误:', error)
//     }
//   }

//   // 生成表格HTML
//   private generateTableHtml(data: CanvasPureTableNodeData): string {
//     try {
//       const { rows, columns, data: tableData, headers, mergedCells } = data
      
//       // 创建单元格占用标记数组
//       const occupied = Array(rows).fill(0).map(() => Array(columns).fill(false))
      
//       // 标记被合并单元格占用的单元格
//       if (mergedCells) {
//         for (const merge of mergedCells) {
//           for (let i = merge.startRow; i <= merge.endRow; i++) {
//             for (let j = merge.startCol; j <= merge.endCol; j++) {
//               if (i !== merge.startRow || j !== merge.startCol) {
//                 occupied[i][j] = true
//               }
//             }
//           }
//         }
//       }
      
//       // 生成表格HTML
//       let html = '<table class="pure-table">'
      
//       // 表头
//       html += '<thead><tr><th class="row-header"></th>'
//       for (let j = 0; j < columns; j++) {
//         const headerText = headers && j < headers.length ? headers[j] : String.fromCharCode(65 + j)
//         html += `<th>${headerText}</th>`
//       }
//       html += '</tr></thead>'
      
//       // 表格内容
//       html += '<tbody>'
//       for (let i = 0; i < rows; i++) {
//         html += '<tr>'
//         html += `<td class="row-header">${i+1}</td>`
        
//         for (let j = 0; j < columns; j++) {
//           // 如果单元格被占用则跳过
//           if (occupied[i][j]) continue
          
//           // 获取单元格数据
//           const cellData = tableData[i] && tableData[i][j] ? tableData[i][j] : ''
          
//           // 检查是否是合并单元格
//           let rowspan = 1, colspan = 1
//           const mergedCell = mergedCells?.find(m => m.startRow === i && m.startCol === j)
//           if (mergedCell) {
//             rowspan = mergedCell.endRow - mergedCell.startRow + 1
//             colspan = mergedCell.endCol - mergedCell.startCol + 1
//           }
          
//           // 获取单元格样式
//           const style = this.getCellStyle(data, i, j)
//           const styleStr = Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';')
          
//           // 生成单元格
//           html += `<td 
//             data-row="${i}" 
//             data-col="${j}" 
//             ${rowspan > 1 ? `rowspan="${rowspan}"` : ''} 
//             ${colspan > 1 ? `colspan="${colspan}"` : ''}
//             ${styleStr ? `style="${styleStr}"` : ''}
//           >${cellData}</td>`
//         }
        
//         html += '</tr>'
//       }
//       html += '</tbody></table>'
      
//       return html
//     } catch (error) {
//       console.error('生成表格HTML错误:', error)
//       return '<div>表格生成错误</div>'
//     }
//   }

//   // 添加单元格事件
//   private addCellEvents(node: any, container: HTMLElement, data: CanvasPureTableNodeData) {
//     const cells = container.querySelectorAll('td:not(.row-header)')
//     cells.forEach(cell => {
//       const row = parseInt(cell.getAttribute('data-row') || '0')
//       const col = parseInt(cell.getAttribute('data-col') || '0')
      
//       // 点击选中
//       cell.addEventListener('click', () => {
//         container.querySelectorAll('td.selected').forEach(el => el.classList.remove('selected'))
//         cell.classList.add('selected')
//       })
      
//       // 双击编辑
//       cell.addEventListener('dblclick', (e) => {
//         e.stopPropagation()
        
//         // 检查是否是合并单元格的主单元格
//         if (!this.canEditCell(data, row, col)) return
        
//         // 添加编辑状态
//         cell.classList.add('pure-table-cell-editing')
        
//         // 创建输入框
//         const input = document.createElement('input')
//         input.className = 'pure-table-cell-input'
//         input.value = data.data[row][col]
        
//         // 替换单元格内容
//         const oldContent = cell.innerHTML
//         cell.innerHTML = ''
//         cell.appendChild(input)
//         input.focus()
        
//         // 失去焦点时保存
//         input.addEventListener('blur', () => {
//           // 移除编辑状态
//           cell.classList.remove('pure-table-cell-editing')
          
//           // 更新数据
//           data.data[row][col] = input.value
//           node.setData(data)
          
//           // 重新渲染单元格内容
//           cell.textContent = input.value
//         })
        
//         // 按Enter保存
//         input.addEventListener('keydown', (e) => {
//           if (e.key === 'Enter') {
//             input.blur()
//           } else if (e.key === 'Escape') {
//             cell.classList.remove('pure-table-cell-editing')
//             cell.innerHTML = oldContent
//           }
//         })
//       })
//     })
//   }

//   // 添加行
//   private addRow(node: any, data: CanvasPureTableNodeData) {
//     // 创建新行
//     const newRow = Array(data.columns).fill('').map((_, j) => `${data.rows + 1}-${j+1}`)
    
//     // 更新数据
//     data.data.push(newRow)
//     data.rows++
    
//     // 更新节点
//     node.setData(data)
//     this.renderPureTableNode(node)
//   }

//   // 添加列
//   private addColumn(node: any, data: CanvasPureTableNodeData) {
//     // 更新每行
//     for (let i = 0; i < data.rows; i++) {
//       data.data[i].push(`${i+1}-${data.columns+1}`)
//     }
    
//     // 更新表头
//     if (data.headers) {
//       const newHeader = String.fromCharCode(65 + data.columns)
//       data.headers.push(newHeader)
//     }
    
//     // 更新列数
//     data.columns++
    
//     // 更新节点
//     node.setData(data)
//     this.renderPureTableNode(node)
//   }

//   // 删除行
//   private deleteRow(node: any, data: CanvasPureTableNodeData) {
//     if (data.rows <= 1) return
    
//     // 删除最后一行
//     data.data.pop()
//     data.rows--
    
//     // 更新节点
//     node.setData(data)
//     this.renderPureTableNode(node)
//   }

//   // 删除列
//   private deleteColumn(node: any, data: CanvasPureTableNodeData) {
//     if (data.columns <= 1) return
    
//     // 删除最后一列
//     for (let i = 0; i < data.rows; i++) {
//       data.data[i].pop()
//     }
    
//     // 更新表头
//     if (data.headers && data.headers.length > 0) {
//       data.headers.pop()
//     }
    
//     // 更新列数
//     data.columns--
    
//     // 更新节点
//     node.setData(data)
//     this.renderPureTableNode(node)
//   }

//   // 合并单元格
//   private mergeCells(node: any, data: CanvasPureTableNodeData) {
//     // 简单示例：合并下一个单元格
//     if (!data.mergedCells) data.mergedCells = []
    
//     data.mergedCells.push({
//       startRow: 1,
//       startCol: 1,
//       endRow: 1,
//       endCol: 2
//     })
    
//     // 更新节点
//     node.setData(data)
//     this.renderPureTableNode(node)
//   }

//   // 获取单元格样式
//   private getCellStyle(data: CanvasPureTableNodeData, row: number, col: number): Record<string, string> {
//     const style: Record<string, string> = {}
    
//     // 基本样式
//     style['padding'] = '5px'
    
//     // 交替行背景
//     if (row % 2 === 1) {
//       style['background-color'] = (data.styles?.alternateRowBackground as string) || 'var(--background-secondary-alt)'
//     }
    
//     // 自定义单元格样式
//     const cellStyle = data.cellStyles?.find(s => s.row === row && s.col === col)
//     if (cellStyle) {
//       if (cellStyle.style.backgroundColor) style['background-color'] = cellStyle.style.backgroundColor as string
//       if (cellStyle.style.textColor) style['color'] = cellStyle.style.textColor as string
//       if (cellStyle.style.fontWeight) style['font-weight'] = cellStyle.style.fontWeight
//       if (cellStyle.style.textAlign) style['text-align'] = cellStyle.style.textAlign
//       if (cellStyle.style.verticalAlign) style['vertical-align'] = cellStyle.style.verticalAlign
//     }
    
//     return style
//   }

//   // 检查单元格是否可以编辑
//   private canEditCell(data: CanvasPureTableNodeData, row: number, col: number): boolean {
//     if (!data.mergedCells) return true
    
//     // 检查是否是合并单元格的主单元格
//     const isMergedMainCell = data.mergedCells.some(m => m.startRow === row && m.startCol === col)
    
//     // 检查是否是合并单元格的一部分但不是主单元格
//     const isPartOfMergedCell = data.mergedCells.some(m => 
//       row >= m.startRow && row <= m.endRow && 
//       col >= m.startCol && col <= m.endCol &&
//       !(row === m.startRow && col === m.startCol)
//     )
    
//     return isMergedMainCell || !isPartOfMergedCell
//   }
// } 