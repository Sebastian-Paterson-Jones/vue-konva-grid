<template>
  <div
    v-if="props.fill"
    :style="fillStyle"
    class="html-box-fill"
  />
  <div
    v-for="line in lines"
    :key="line.key"
    :style="line.style"
    :class="`html-box-line html-box-line-${line.key}`"
  />
  <template v-if="showBorderCover">
    <div
      v-for="cover in borderCovers"
      :key="cover.key"
      :style="cover.style"
      :class="`html-box-border-cover html-box-border-cover-${cover.key}`"
    />
  </template>
</template>

<script setup lang="ts">
import { SelectionProps } from '../../types';
import { computed, defineProps, withDefaults } from 'vue';
import type { CSSProperties } from 'vue';

const props = withDefaults(defineProps<SelectionProps>(), {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  fill: undefined,
  stroke: undefined,
  strokeLeftColor: undefined,
  strokeTopColor: undefined,
  strokeRightColor: undefined,
  strokeBottomColor: undefined,
  strokeWidth: 0,
  strokeTopWidth: undefined,
  strokeRightWidth: undefined,
  strokeBottomWidth: undefined,
  strokeLeftWidth: undefined,
  strokeStyle: "solid",
  fillOpacity: 1,
  draggable: false,
  isDragging: false,
  borderCoverWidth: 5,
});

const finalStrokeTopColor = computed(() => props.strokeTopColor ?? props.stroke);
const finalStrokeRightColor = computed(() => props.strokeRightColor ?? props.stroke);
const finalStrokeBottomColor = computed(() => props.strokeBottomColor ?? props.stroke);
const finalStrokeLeftColor = computed(() => props.strokeLeftColor ?? props.stroke);

const finalStrokeTopWidth = computed(() => props.strokeTopWidth ?? props.strokeWidth);
const finalStrokeRightWidth = computed(() => props.strokeRightWidth ?? props.strokeWidth);
const finalStrokeBottomWidth = computed(() => props.strokeBottomWidth ?? props.strokeWidth);
const finalStrokeLeftWidth = computed(() => props.strokeLeftWidth ?? props.strokeWidth);

const calculatedWidth = computed(() => Math.max(0, props.width - Math.floor(props.strokeWidth / 2)));
const calculatedHeight = computed(() => Math.max(0, props.height - Math.floor(props.strokeWidth / 2)));

const lineStylesBase = computed((): CSSProperties => ({
  borderWidth: 0,
  position: 'absolute',
  pointerEvents: 'none',
}));
const borderCoverStyleBase = computed((): CSSProperties => ({
  position: 'absolute',
  pointerEvents: props.draggable ? 'auto' : 'none',
  cursor: props.draggable ? (props.isDragging ? 'grabbing' : 'grab') : 'initial',
}));
const showBorderCover = computed(() => props.draggable);

const lines = computed(() => [
  {
    key: 'top',
    style: {
      ...lineStylesBase.value,
      left: `${props.x}px`,
      top: `${props.y}px`,
      width: `${calculatedWidth.value}px`,
      height: `${finalStrokeTopWidth.value}px`,
      borderTopColor: finalStrokeTopColor.value,
      borderTopWidth: `${finalStrokeTopWidth.value}px`,
      borderTopStyle: props.strokeStyle,
    } as CSSProperties,
  },
  {
    key: 'right',
    style: {
      ...lineStylesBase.value,
      left: `${props.x + calculatedWidth.value}px`,
      top: `${props.y}px`,
      width: `${finalStrokeRightWidth.value}px`,
      height: `${calculatedHeight.value}px`,
      borderRightColor: finalStrokeRightColor.value,
      borderRightWidth: `${finalStrokeRightWidth.value}px`,
      borderRightStyle: props.strokeStyle,
    } as CSSProperties,
  },
  {
    key: 'bottom',
    style: {
      ...lineStylesBase.value,
      left: `${props.x}px`,
      top: `${props.y + calculatedHeight.value}px`,
      width: `${calculatedWidth.value + (finalStrokeLeftWidth.value > 0 ? 0 : finalStrokeRightWidth.value)}px`, // Adjust width to connect properly, was: calculatedWidth.value + finalStrokeTopWidth.value
      height: `${finalStrokeBottomWidth.value}px`,
      borderBottomColor: finalStrokeBottomColor.value,
      borderBottomWidth: `${finalStrokeBottomWidth.value}px`,
      borderBottomStyle: props.strokeStyle,
    } as CSSProperties,
  },
  {
    key: 'left',
    style: {
      ...lineStylesBase.value,
      left: `${props.x}px`,
      top: `${props.y}px`,
      width: `${finalStrokeLeftWidth.value}px`,
      height: `${calculatedHeight.value + (finalStrokeTopWidth.value > 0 ? 0: finalStrokeBottomWidth.value)}px`, // Adjust height to connect properly
      borderLeftColor: finalStrokeLeftColor.value,
      borderLeftWidth: `${finalStrokeLeftWidth.value}px`,
      borderLeftStyle: props.strokeStyle,
    } as CSSProperties,
  },
].filter(line => parseFloat(line.style.borderWidth?.toString() || line.style.borderTopWidth?.toString() || line.style.borderRightWidth?.toString() || line.style.borderBottomWidth?.toString() || line.style.borderLeftWidth?.toString() || '0') > 0)
);

const borderCovers = computed(() => [
  {
    key: 'top-cover',
    style: {
      ...borderCoverStyleBase.value,
      left: `${props.x}px`,
      top: `${props.y}px`,
      width: `${calculatedWidth.value}px`,
      height: `${props.borderCoverWidth}px`,
    } as CSSProperties,
  },
  {
    key: 'right-cover',
    style: {
      ...borderCoverStyleBase.value,
      left: `${props.x + calculatedWidth.value - props.borderCoverWidth + finalStrokeRightWidth.value}px`,
      top: `${props.y}px`,
      width: `${props.borderCoverWidth}px`,
      height: `${calculatedHeight.value}px`,
    } as CSSProperties,
  },
  {
    key: 'bottom-cover',
    style: {
      ...borderCoverStyleBase.value,
      left: `${props.x}px`,
      top: `${props.y + calculatedHeight.value - props.borderCoverWidth + finalStrokeBottomWidth.value}px`,
      width: `${calculatedWidth.value + (finalStrokeLeftWidth.value > 0 ? 0 : finalStrokeRightWidth.value)}px`,
      height: `${props.borderCoverWidth}px`,
    } as CSSProperties,
  },
  {
    key: 'left-cover',
    style: {
      ...borderCoverStyleBase.value,
      left: `${props.x}px`,
      top: `${props.y}px`,
      width: `${props.borderCoverWidth}px`,
      height: `${calculatedHeight.value + (finalStrokeTopWidth.value > 0 ? 0: finalStrokeBottomWidth.value)}px`,
    } as CSSProperties,
  },
]);

const fillStyle = computed((): CSSProperties => ({
  position: 'absolute',
  top: `${props.y + (finalStrokeTopWidth.value / 2)}px`,
  left: `${props.x + (finalStrokeLeftWidth.value / 2)}px`,
  height: `${calculatedHeight.value}px`,
  width: `${calculatedWidth.value}px`,
  backgroundColor: props.fill as string, // Cast as string assuming fill implies it's set
  opacity: props.fillOpacity,
  userSelect: 'none',
  pointerEvents: 'none',
  boxSizing: 'border-box',
}));
</script>
