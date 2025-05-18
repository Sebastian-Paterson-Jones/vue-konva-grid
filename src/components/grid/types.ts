import { ItemSizer, ScrollCoords, RendererProps, StylingProps, ViewPortProps, CellInterface, SelectionArea, AreaProps, CellRangeArea, SelectionProps } from "@/types";
import { ShapeConfig } from "konva/lib/Shape";
import { StageConfig } from "konva/lib/Stage";
import { HTMLAttributes } from "vue";

export interface GridProps extends /* @vue-ignore */ Omit<HTMLAttributes, "onScroll" | "children"> {
  /**
   * Width of the grid
   */
  width?: number;
  /**
   * Height of the grid
   */
  height?: number;
  /**
   * No of columns in the grid
   */
  columnCount: number;
  /**
   * No of rows in the grid
   */
  rowCount: number;
  /**
   * Should return height of a row at an index
   */
  rowHeight?: ItemSizer;
  /**
   * Should return width of a column at an index
   */
  columnWidth?: ItemSizer;
  /**
   * Size of the scrollbar. Default is 13
   */
  scrollbarSize?: number;
  /**
   * Helps in lazy grid width calculation
   */
  estimatedColumnWidth?: number;
  /**
   * Helps in lazy grid height calculation
   */
  estimatedRowHeight?: number;
  /**
   * Called when user scrolls the grid
   */
  onScroll?: ({ scrollLeft, scrollTop }: ScrollCoords) => void;
  /**
   * Called immediately on scroll
   */
  onImmediateScroll?: ({ scrollLeft, scrollTop }: ScrollCoords) => void;
  /**
   * Show scrollbars on the left and right of the grid
   */
  showScrollbar?: boolean;
  /**
   * Currently active cell
   */
  activeCell?: CellInterface | null;
  /**
   * Background of selection
   */
  selectionBackgroundColor?: string;
  /**
   * Border color of selected area
   */
  selectionBorderColor?: string;
  /**
   * Stroke width of the selection
   */
  selectionStrokeWidth?: number;
  /**
   * Active Cell Stroke width
   */
  activeCellStrokeWidth?: number;
  /**
   * Array of selected cell areas
   */
  selections?: SelectionArea[];
  /**
   * Fill selection
   */
  fillSelection?: SelectionArea | null;
  /**
   * Array of merged cells
   */
  mergedCells?: AreaProps[];
  /**
   * Number of frozen rows
   */
  frozenRows?: number;
  /**
   * Number of frozen columns
   */
  frozenColumns?: number;
  /**
   * Snap to row and column when scrolling
   */
  snap?: boolean;
  /**
   * Show shadow as you scroll for frozen rows and columns
   */
  showFrozenShadow?: boolean;
  /**
   * Shadow settings
   */
  shadowSettings?: ShapeConfig;
  /**
   * Scroll throttle wait timeout
   */
  scrollThrottleTimeout?: number;
  /**
   * Cell styles for border
   */
  borderStyles?: StylingProps;
  /**
   * Extend certains to coords
   */
  cellAreas?: CellRangeArea[];
  /**
   * Cell renderer. Must be a Konva Component eg: Group, Rect etc
   */
  itemRenderer?: (props: RendererProps) => React.ReactNode;
  /**
   * Render custom overlays like stroke on top of cell
   */
  overlayRenderer?: (props: RendererProps) => React.ReactNode;
  /**
   * Allow users to customize selected cells design
   */
  selectionRenderer?: (props: SelectionProps) => React.ReactNode;
  /**
   * Bind to fill handle
   */
  fillHandleProps?: Record<string, (e: any) => void>;
  /**
   * Fired when scroll viewport changes
   */
  onViewChange?: (view: ViewPortProps) => void;
  /**
   * Called right before a row is being rendered.
   * Will be called for frozen cells and merged cells
   */
  onBeforeRenderRow?: (rowIndex: number) => void;
  /**
   * Custom grid overlays
   */
  children?: (props: ScrollCoords) => React.ReactNode;
  /**
   * Allows users to Wrap stage children in Top level Context
   */
  wrapper?: (children: React.ReactNode) => React.ReactNode;
  /**
   * Props that can be injected to Konva stage
   */
  stageProps?: Omit<StageConfig, "container">;
  /**
   * Show fillhandle
   */
  showFillHandle?: boolean;
  /**
   * Overscan row and columns
   */
  overscanCount?: number;
  /**
   * Border color of fill handle
   */
  fillhandleBorderColor?: string;
  /**
   * Show grid lines.
   * Useful for spreadsheets
   */
  showGridLines?: boolean;
  /**
   * Customize grid line color
   */
  gridLineColor?: string;
  /**
   * Width of the grid line
   */
  gridLineWidth?: number;
  /**
   * Gridline component
   */
  gridLineRenderer?: (props: ShapeConfig) => React.ReactNode;
  /**
   * Shadow stroke color
   */
  shadowStroke?: string;
  /**
   * Draw overlay for each cell.
   * Can be used to apply stroke or draw on top of a cell
   */
  enableCellOverlay?: boolean;
  /**
   * Check if its hidden row
   */
  isHiddenRow?: (rowIndex: number) => boolean;
  /**
   * Check if its a hidden column. Skip rendering hidden
   */
  isHiddenColumn?: (columnIndex: number) => boolean;
  /**
   * Is Hidden cell
   */
  isHiddenCell?: (rowIndex: number, columnIndex: number) => boolean;
  /**
   * Scale
   */
  scale?: number;
  /**
   * Enable draging active cell and selections
   */
  enableSelectionDrag?: boolean;
  /**
   * Is user currently dragging a selection
   */
  isDraggingSelection?: boolean;
}