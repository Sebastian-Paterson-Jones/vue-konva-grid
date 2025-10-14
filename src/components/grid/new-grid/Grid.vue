<template>
  <div
    ref="gridRef"
    class="grid"
    :style="{
      position: 'relative',
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
      :container-height="height"
      :container-width="width"
      :estimated-total-height="estimatedTotalHeight"
      :estimated-total-width="estimatedTotalWidth"
    />
  </div>
</template>

<script setup lang="ts">
import { useScroller } from "../../../composables/useScroller";
import { useGrid } from "../../../composables/useGrid";
import Scroller from "../../scroller/Scroller.vue";
import { Grid } from "../../../types/grid";
import { onMounted, onUnmounted, ref, watch } from "vue";

// ==== Props ==== //
const props = withDefaults(defineProps<Grid>(), {
  width: 800,
  height: 600,
  rowsFrozen: 0,
  estimatedRowHeight: 50,
  getRowHeight: () => 20,
  estimatedColumnWidth: 50,
  getColumnWidth: () => 40,
  columnsFrozen: 0,
  cellRenderer: () => null,
});
// ================ //

// ==== Refs ==== //
const gridRef = ref<HTMLDivElement>();
const scrollerRef = ref<InstanceType<typeof Scroller>>();
let frameRequested = false;
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
  destroyGrid,
  renderGridThrottled,
  estimatedTotalWidth, 
  estimatedTotalHeight,
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

// ==== Watchers ==== //
watch([scrollTop, scrollLeft], () => renderGridThrottled())
// ================ //

// ==== Life cycle ==== //
onMounted(async () => {
  await initGrid();
  renderGridThrottled();
  gridRef.value?.addEventListener("wheel", onWheel);
});
onUnmounted(() => {
  gridRef.value?.removeEventListener("wheel", onWheel);
  destroyGrid();
});
// ================ //
</script>
