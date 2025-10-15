import { Cell } from "../../types/cell";
import { Group } from "konva/lib/Group";
import { Rect } from "konva/lib/shapes/Rect";
import { Text } from "konva/lib/shapes/Text";

export function cellRenderer(props: Cell) {
  const {
    x,
    y,
    width,
    height,
    text: textContent,
    fill,
    stroke,
    strokeWidth,
    borderRadius,
    fontSize,
    fontFamily,
    fontWeight,
    textDecoration,
    textAlign,
    verticalAlign,
    wrap,
    padding,
    fontStyle,
    color,
  } = props;

  const group = new Group();
  const rect = new Rect({
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    borderRadius,
  });
  const text = new Text({
    x,
    y,
    width,
    height,
    text: textContent,
    fontSize,
    fontFamily,
    fontWeight,
    textDecoration,
    textAlign,
    verticalAlign,
    wrap,
    padding,
    fontStyle,
    color,
  });

  group.add(rect, text);
  return group;
}
