import { RendererProps } from "../../types";
import { KonvaEventObject } from "konva/lib/Node";

export interface CellProps extends RendererProps {
  value?: string;
  textColor?: string;
  padding?: number;
  fontWeight?: string;
  fontStyle?: string;
  onClick?: (e: KonvaEventObject<MouseEvent>) => void;
}