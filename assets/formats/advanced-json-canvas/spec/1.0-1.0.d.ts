export type CanvasColor = `${number}` | `#${string}`

export interface CanvasData {
  metadata: CanvasMetadata
  nodes: AnyCanvasNodeData[]
  edges: CanvasEdgeData[]
}

export interface CanvasMetadata {
  version: '1.0-1.0'
  frontmatter: { [key: string]: unknown }
  startNode?: string
}

export type CanvasNodeType = 'text' | 'group' | 'file' | 'link' | 'table' | 'pure-table' | 'xinyang'
export interface CanvasNodeData {
  id: string
  type: CanvasNodeType

  x: number
  y: number
  width: number
  height: number
  dynamicHeight?: boolean // AdvancedJsonCanvas
  ratio?: number
  zIndex?: number // AdvancedJsonCanvas

  color?: CanvasColor

  styleAttributes?: { [key: string]: string | null } // AdvancedJsonCanvas
}

export type AnyCanvasNodeData = CanvasNodeData | CanvasTextNodeData | CanvasFileNodeData | CanvasLinkNodeData | CanvasGroupNodeData | CanvasTableNodeData | CanvasPureTableNodeData | CanvasXinyangNodeData

export interface CanvasTextNodeData extends CanvasNodeData {
  type: 'text'
  text: string
}

export type Subpath = `#${string}`
export interface CanvasFileNodeData extends CanvasNodeData {
  type: 'file'
  file: string
  subpath?: Subpath

  portal?: boolean // AdvancedJsonCanvas
  interdimensionalEdges?: CanvasEdgeData[] // AdvancedJsonCanvas
}

export interface CanvasLinkNodeData extends CanvasNodeData {
  type: 'link'
  url: string
}

export type BackgroundStyle = 'cover' | 'ratio' | 'repeat'
export interface CanvasGroupNodeData extends CanvasNodeData {
  type: 'group'
  label?: string
  background?: string
  backgroundStyle?: BackgroundStyle

  collapsed?: boolean // AdvancedJsonCanvas
}

// 信阳市节点类型，只显示文本内容
export interface CanvasXinyangNodeData extends CanvasNodeData {
  type: 'xinyang'
  text: string
  showOnlyText?: boolean // 是否只显示文本部分
}

type Side = 'top' | 'right' | 'bottom' | 'left'
type EndType = 'none' | 'arrow'
export interface CanvasEdgeData {
  id: string

  fromNode: string
  fromSide: Side
  fromFloating?: boolean // AdvancedJsonCanvas
  fromEnd?: EndType
  fromPosition?: number // AdvancedJsonCanvas - 相对位置 (0-1)
  
  toNode: string
  toSide: Side
  toFloating?: boolean // AdvancedJsonCanvas
  toEnd?: EndType
  toPosition?: number // AdvancedJsonCanvas - 相对位置 (0-1)

  color?: CanvasColor
  label?: string

  styleAttributes?: { [key: string]: string | null } // AdvancedJsonCanvas
}

export interface CanvasTableNodeData extends CanvasNodeData {
  type: 'table'
  rows: number
  columns: number
  data: string[][] // 表格单元格数据
  headers?: string[] // 可选的表头
  mergedCells?: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }[] // 合并单元格信息
  cellStyles?: {
    row: number
    col: number
    style: {
      backgroundColor?: CanvasColor
      textColor?: CanvasColor
      fontWeight?: string
      textAlign?: 'left' | 'center' | 'right'
      verticalAlign?: 'top' | 'middle' | 'bottom'
    }
  }[] // 单元格样式
  styles?: {
    cellPadding?: number
    borderWidth?: number
    headerBackground?: CanvasColor
    alternateRowBackground?: CanvasColor
    borderColor?: CanvasColor
    headerTextColor?: CanvasColor
    fontFamily?: string
    fontSize?: number
    tableWidth?: string // 可以是百分比或像素值
    tableHeight?: string
  }
}

export interface CanvasPureTableNodeData extends CanvasNodeData {
  type: 'pure-table'
  rows: number
  columns: number
  data: string[][] // 表格单元格数据
  headers?: string[] // 可选的表头
  mergedCells?: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }[] // 合并单元格信息
  cellStyles?: {
    row: number
    col: number
    style: {
      backgroundColor?: CanvasColor
      textColor?: CanvasColor
      fontWeight?: string
      textAlign?: 'left' | 'center' | 'right'
      verticalAlign?: 'top' | 'middle' | 'bottom'
    }
  }[] // 单元格样式
  styles?: {
    cellPadding?: number
    borderWidth?: number
    headerBackground?: CanvasColor
    alternateRowBackground?: CanvasColor
    borderColor?: CanvasColor
    headerTextColor?: CanvasColor
    fontFamily?: string
    fontSize?: number
    tableWidth?: string // 可以是百分比或像素值
    tableHeight?: string
  }
}