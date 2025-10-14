import * as PIXI from "pixi.js";
import { Color } from "pixi.js";

type CellRendererProps = {
  rowIndex: number;
  columnIndex: number;
  width: number;
  height: number;
  x: number;
  y: number;
  fill?: Color | string;
  stroke?: Color | string;
  strokeWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textDecoration?: string;
};

export type CellRenderer = (graphics: PIXI.Graphics, props: CellRendererProps) => void;