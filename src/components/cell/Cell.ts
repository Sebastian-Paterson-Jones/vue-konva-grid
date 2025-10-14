import * as PIXI from "pixi.js";
import { CellRenderer } from "../../types/cell-renderer";

export const cellRenderer: CellRenderer = (graphics, props) => {
  graphics.rect(props.x, props.y, props.width, props.height);
  graphics.fill({ color: props.fill });
  graphics.stroke({ color: props.stroke, width: props.strokeWidth });

  if (graphics.parent) {
    const textStyle = new PIXI.TextStyle({
      fontSize: props.fontSize || 12,
      fontFamily: props.fontFamily || "Arial",
      fontWeight: (props.fontWeight as any) || "normal",
      fill: props.fill,
    });

    const pixiText = new PIXI.Text({
      text: "Hello World",
      style: textStyle,
    });

    pixiText.x = props.x + 5;
    pixiText.y = props.y + (props.height - pixiText.height) / 2;

    graphics.parent.addChild(pixiText);
  }
};