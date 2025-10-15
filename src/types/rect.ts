import { Color } from "@/enums/color";
import { Position } from "./position";

export interface Rect extends Position {
  /**
   * Width of the rectangle
   */
  width: number;
  /**
   * Height of the rectangle
   */
  height: number;
  /**
   * Fill color of the rectangle
   */
  fill?: Color | string;
  /**
   * Stroke color of the rectangle
   */
  stroke?: Color | string;
  /**
   * Stroke width of the rectangle
   */
  strokeWidth?: number;
  /**
   * Border radius of the rectangle
   */
  borderRadius?: number;
}
