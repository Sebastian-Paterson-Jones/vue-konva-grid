<template>
  <v-group>
    <v-rect
      :config="{
        x: data.x,
        y: data.y,
        height: data.height,
        width: data.width,
        fill: data.fill,
        stroke: data.stroke,
        strokeWidth: data.strokeWidth,
      }"
    />
    <v-text
      v-if="data.text"
      :config="{
        x: data.x,
        y: data.y,
        height: data.height,
        width: data.width,
        text: data.text,
        verticalAlign: data.verticalAlign,
        align: data.textAlign,
        fontFamily: data.fontFamily,
        fontWeight: data.fontWeight,
        textDecoration: data.textDecoration,
        padding: data.padding,
        wrap: data.wrap,
        fontSize: data.fontSize,
        hitStrokeWidth: 0,
      }"
    />
  </v-group>
</template>

<script setup lang="ts">
import { Cell } from "../../types/cell";

// ==== props ==== //
const props = defineProps<{ data: Cell }>();
// ================ //
</script>
