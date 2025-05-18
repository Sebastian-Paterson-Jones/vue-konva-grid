import { ShapeConfig } from "konva/lib/Shape";

export interface ImageProps extends ShapeConfig {
  url: string;
  spacing?: number;
}