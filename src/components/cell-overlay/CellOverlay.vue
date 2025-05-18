<template>
  <v-shape
    v-if="userStroke"
    :config="{
      x: x,
      y: y,
      width: width,
      height: height,
      sceneFunc: sceneFunc,
    }"
  />
</template>

<script setup lang="ts">
import Konva from "konva";
import { StrokeCellProps } from "./types";
import { computed } from "vue";

// ==== props ==== //
const props = withDefaults(defineProps<StrokeCellProps>(), {
  strokeTopDash: [],
  strokeRightDash: [],
  strokeBottomDash: [],
  strokeLeftDash: [],
});
// ================ //

// ==== computed ==== //
const userStroke = computed(() => {
  return props.strokeTopColor || props.strokeRightColor || props.strokeBottomColor || props.strokeLeftColor;
});
// ================ //

// ==== methods ==== //
const getOffsetFromWidth = (width: number) => {
  return width / 2 - 0.5;
};
const sceneFunc = (context: Konva.Context, shape: Konva.Shape) => {
  /* Top border */
  if (props.strokeTopColor) {
    context.beginPath();
    context.moveTo(
      props.strokeLeftColor ? -getOffsetFromWidth(props.strokeLeftWidth) : 0,
      0.5
    );
    context.lineTo(
      shape.width() +
        (props.strokeRightColor ? getOffsetFromWidth(props.strokeRightWidth) + 1 : 1),
      0.5
    );
    context.setAttr("strokeStyle", props.strokeTopColor);
    context.setAttr("lineWidth", props.strokeTopWidth);
    context.setAttr("lineCap", props.lineCap);
    context.setLineDash(props.strokeTopDash);
    context.stroke();
  }
  /* Bottom border */
  if (props.strokeBottomColor) {
    context.beginPath();
    context.moveTo(
      props.strokeLeftColor ? -getOffsetFromWidth(props.strokeLeftWidth) : 0,
      shape.height() + 0.5
    );
    context.lineTo(
      shape.width() +
        (props.strokeRightColor ? getOffsetFromWidth(props.strokeRightWidth) + 1 : 1),
      shape.height() + 0.5
    );
    context.setAttr("lineWidth", props.strokeBottomWidth);
    context.setAttr("strokeStyle", props.strokeBottomColor);
    context.setAttr("lineCap", props.lineCap);
    context.setLineDash(props.strokeBottomDash);
    context.stroke();
  }
  /* Left border */
  if (props.strokeLeftColor) {
    context.beginPath();
    context.moveTo(
      0.5,
      props.strokeTopColor ? -getOffsetFromWidth(props.strokeTopWidth) : 0
    );
    context.lineTo(
      0.5,
      shape.height() +
        (props.strokeBottomColor
          ? getOffsetFromWidth(props.strokeBottomWidth) + 1
          : 1)
    );
    context.setAttr("strokeStyle", props.strokeLeftColor);
    context.setAttr("lineWidth", props.strokeLeftWidth);
    context.setAttr("lineCap", props.lineCap);
    context.setLineDash(props.strokeLeftDash);
    context.stroke();
  }
  /* Right border */
  if (props.strokeRightColor) {
    context.beginPath();
    context.moveTo(
      shape.width() + 0.5,
      props.strokeTopColor ? -getOffsetFromWidth(props.strokeTopWidth) : 0
    );
    context.lineTo(
      shape.width() + 0.5,
      shape.height() +
        (props.strokeBottomColor
          ? getOffsetFromWidth(props.strokeBottomWidth) + 1
          : 1)
    );
    context.setAttr("strokeStyle", props.strokeRightColor);
    context.setAttr("lineWidth", props.strokeRightWidth);
    context.setAttr("lineCap", props.lineCap);
    context.setLineDash(props.strokeRightDash);
    context.stroke();
  }
};
// ================ //
</script>