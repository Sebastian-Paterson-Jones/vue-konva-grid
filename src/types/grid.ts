import { Cell } from "./cell";
import { CellArea } from "./cell-area";
import { CellRenderer } from "./cell-renderer";

export interface Grid {
  /**
   * Width of the grid
   */
  width?: number;
  /**
   * Height of the grid
   */
  height?: number;
  /**
   * Number of rows in the grid
   */
  rowsCount: number;
  /**
   * Number of frozen rows in the grid
   */
  rowsFrozen: number;
  /**
   * Get the height of a row
   */
  getRowHeight: (rowIndex: number) => number;
  /**
   * Estimated height of a row
   */
  estimatedRowHeight?: number;
  /**
   * Number of columns in the grid
   */
  columnsCount: number;
  /**
   * Number of frozen columns in the grid
   */
  columnsFrozen: number;
  /**
   * Get the width of a column
   */
  getColumnWidth: (columnIndex: number) => number;
  /**
   * Estimated width of a column
   */
  estimatedColumnWidth?: number;
  /**
   * Get the data of a cell
   */
  getCellData: (rowIndex: number, columnIndex: number) => any;
  /**
   * Selected cells in the grid
   */
  selectedCells?: Cell[];
  /**
   * Array of merged cells
   */
  mergedCells?: CellArea[];
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
   * Called when the grid is scrolled
   */
  onScroll?: (event: Event) => void;
  /**
   * Called when the grid is clicked
   */
  onClick?: (event: Event) => void;
  /**
   * Called when the grid is updated
   */
  onUpdate?: (event: Event) => void;
  /**
   * Called when the grid is resized
   */
  onResize?: (event: Event) => void;
  /**
   * Called when the grid is before rendering a row
   */
  onBeforeRenderRow?: (rowIndex: number) => void;
  /**
   * Cell renderer
   */
  cellRenderer?: CellRenderer;
}

