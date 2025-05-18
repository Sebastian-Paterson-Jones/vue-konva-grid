<template>
  <div
    v-if="x !== 0 && y !== 0"
    :style="{
      position: 'absolute',
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      border: `${strokeWidth}px ${borderColor} solid`,
      borderRightWidth: `${0}px`,
      borderBottomWidth: `${0}px`,
      background: stroke as string,
      cursor: 'crosshair',
      pointerEvents: 'all',
    }"
    v-bind="props"
  />
</template>

<script setup lang="ts">
import { ShapeConfig } from "konva/lib/Shape";

// ==== props ==== //
const props = withDefaults(defineProps<ShapeConfig>(), {
  x: 0,
  y: 0,
  stroke: "black",
  strokeWidth: 1,
  size: 8,
  borderColor: "black",
});
// ================ //
</script>