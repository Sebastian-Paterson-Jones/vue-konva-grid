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
   * Key of the cell
   */
  key: string;
}