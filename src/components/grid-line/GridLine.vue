<template>
  <v-line
    :config="{
      points: points,
      stroke: stroke,
      strokeWidth: strokeWidth,
      offsetY: offsetY,
      offsetX: offsetX,
      shadowForStrokeEnabled: false,
      strokeScaleEnabled: false,
      hitStrokeWidth: 0,
      listening: false,
      perfectDrawEnabled: false,
    }"
  />
</template>

<script setup lang="ts">
import { ShapeConfig } from "konva/lib/Shape";

// ==== props ==== //
withDefaults(defineProps<ShapeConfig>(), {
  points: [],
  stroke: "black",
  strokeWidth: 1,
  offsetY: 0,
  offsetX: 0,
});
// ================ //
</script>