import { Cell } from "./cell";
import { CellArea } from "./cell-area";
import { Rect } from "./rect";
import { Text } from "./text";
import { Layer } from "konva/lib/Layer";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";

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
  getCellRenderer: (
    rowIndex: number,
    columnIndex: number
  ) => (props: Cell) => Layer | Shape | Group;
  /**
   * Get the text of a cell
   */
  getCellText: (rowIndex: number, columnIndex: number) => string;
  /**
   * Get the formatting of a cell
   */
  getCellFormatting: (
    rowIndex: number,
    columnIndex: number
  ) => Omit<Text, "text"> & Omit<Rect, "x" | "y" | "width" | "height">;
  /**
   * Get the click handler of a cell
   */
  getCellClickHandler?: (
    rowIndex: number,
    columnIndex: number
  ) => (cell: Cell) => void;
  /**
   * Get the double click handler of a cell
   */
  getCellDoubleClickHandler?: (
    rowIndex: number,
    columnIndex: number
  ) => (cell: Cell) => void;
  /**
   * Get the right click handler of a cell
   */
  getCellRightClickHandler?: (
    rowIndex: number,
    columnIndex: number
  ) => (cell: Cell) => void;
  /**
   * Get the hover handler of a cell
   */
  getCellHoverHandler?: (
    rowIndex: number,
    columnIndex: number
  ) => (cell: Cell) => void;
}
