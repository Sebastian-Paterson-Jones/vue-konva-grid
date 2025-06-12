<template>
  <div
    ref="gridRef"
    class="grid"
    :style="{
      width: width + 'px',
      height: height + 'px',
      userSelect: 'none',
    }"
  >
    <Scroller
      ref="scrollerRef"
      v-model:scroll-top="scrollTop"
      v-model:scroll-left="scrollLeft"
      v-model:is-scrolling="isScrolling"
      v-model:horizontal-scroll-direction="horizontalScrollDirection"
      v-model:vertical-scroll-direction="verticalScrollDirection"
      :container-height="width"
      :container-width="height"
      :estimated-total-height="estimatedTotalHeight"
      :estimated-total-width="estimatedTotalWidth"
    />
  </div>
</template>

<script setup lang="ts">
import { useScroller } from "@/composables/useScroller";
import { useGrid } from "@/composables/useGrid";
import Scroller from "@/components/scroller/Scroller.vue";
import { Grid } from "@/types/grid";
import { onMounted, onUnmounted, ref } from "vue";

// ==== Props ==== //
const props = withDefaults(defineProps<Grid>(), {
  width: 800,
  height: 600,
  getRowHeight: () => 20,
  rowsFrozen: 0,
  estimatedRowHeight: 50,
  getColumnWidth: () => 60,
  columnsFrozen: 0,
  estimatedColumnWidth: 50,
});
// ================ //

// ==== Refs ==== //
const gridRef = ref<HTMLDivElement>();
const scrollerRef = ref<InstanceType<typeof Scroller>>();
// ================ //

// ==== Composables ==== //
const {
  onWheel,
  scrollTop,
  scrollLeft,
  isScrolling,
  horizontalScrollDirection,
  verticalScrollDirection,
} = useScroller({
  scrollerRef,
});
const { 
  initGrid, 
  estimatedTotalWidth, 
  estimatedTotalHeight 
} = useGrid({
  gridRef,
  rowsCount: props.rowsCount,
  getRowHeight: props.getRowHeight,
  rowsFrozen: props.rowsFrozen,
  estimatedRowHeight: props.estimatedRowHeight,
  columnsCount: props.columnsCount,
  getColumnWidth: props.getColumnWidth,
  columnsFrozen: props.columnsFrozen,
  estimatedColumnWidth: props.estimatedColumnWidth,
  isHiddenRow: props.isHiddenRow,
  isHiddenColumn: props.isHiddenColumn,
  isHiddenCell: props.isHiddenCell,
  onBeforeRenderRow: props.onBeforeRenderRow,
  containerHeight: props.height,
  containerWidth: props.width,
  scrollTop: scrollTop,
  scrollLeft: scrollLeft,
  isScrolling: isScrolling,
});
// ================ //

// ==== Life cycle ==== //
onMounted(() => {
  initGrid();
  gridRef.value?.addEventListener("wheel", onWheel);
});
onUnmounted(() => {
  gridRef.value?.removeEventListener("wheel", onWheel);
});
// ================ //
</script>
