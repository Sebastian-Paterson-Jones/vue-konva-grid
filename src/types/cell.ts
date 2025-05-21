import { Rect } from "./rect";
import { Text } from "./text";

export interface Cell extends Rect, Text {
  /**
   * Row index of the cell
   */
  rowIndex: number;
  /**
   * Column index of the cell
   */
  columnIndex: number;
  /**
   * Value of the cell (value stored, not text displayed)
   */
  value: any;
  /**
   * Called when the cell is clicked
   */
  onClick?: (event: MouseEvent) => void;
  /**
   * Called when the cell is updated
   */
  onUpdate?: (value: string) => void;
}