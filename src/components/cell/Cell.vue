<template>
  <v-group v-if="!isOverlay">
    <v-rect
      :config="{
        x: x + 0.5,
        y: y + 0.5,
        height: height,
        width: width,
        fill: fill,
        stroke: stroke,
        strokeWidth: strokeWidth,
        shadowForStrokeEnabled: false,
        strokeScaleEnabled: false,
        hitStrokeWidth: 0,
        fillEnabled: fillEnabled,
        strokeEnabled: strokeEnabled,
      }"
    />
    <v-text
      v-if="value"
      :config="{
        x: x,
        y: y,
        height: height,
        width: width,
        text: value,
        fill: textColor,
        verticalAlign: verticalAlign,
        align: align,
        fontFamily: fontFamily,
        fontStyle: textStyle,
        textDecoration: textDecoration,
        padding: padding,
        wrap: wrap,
        fontSize: fontSize,
        hitStrokeWidth: 0,
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { computed, withDefaults } from "vue";
import { CellProps } from "./types";

// ==== props ==== //
const props = withDefaults(defineProps<CellProps>(), {
  x: 0,
  y: 0,
  fill: "white",
  stroke: "#d9d9d9",
  strokeWidth: 1,
  strokeEnabled: true,
  textColor: "#333",
  padding: 5,
  fontWeight: "normal",
  fontStyle: "normal",
  align: "left",
  verticalAlign: "middle",
  fontFamily: "Arial",
  fontSize: 12,
  wrap: "none",
  globalCompositeOperation: "multiply",
  isOverlay: false,
});
// ================ //

// === computed === //
const fillEnabled = computed(() => !!props.fill);
const textStyle = computed(() => `${props.fontWeight} ${props.fontStyle}`);
const groupProps = computed(() => {
  const {
    x,
    y,
    width,
    height,
    value,
    fill,
    strokeWidth,
    stroke,
    align,
    verticalAlign,
    textColor,
    padding,
    fontFamily,
    fontSize,
    wrap,
    fontWeight,
    fontStyle,
    textDecoration,
    strokeEnabled,
    globalCompositeOperation,
    isOverlay,
    ...rest
  } = props;

  return rest;
});
// ================ //
</script>
