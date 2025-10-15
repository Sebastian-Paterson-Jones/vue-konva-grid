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
    <div ref="stageRef" />
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
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useScroller } from "../../../composables/useScroller";
import { useGrid } from "../../../composables/useGrid";
import Scroller from "../../scroller/Scroller.vue";
import { Grid } from "../../../types/grid";
import { Text } from "../../../types/text";
import { Rect } from "../../../types/rect";
import { Color } from "../../../enums/color";
import { cellRenderer } from "../../cell/Cell";

// ==== Props ==== //
const props = withDefaults(defineProps<Grid>(), {
  width: 800,
  height: 600,
  rowsFrozen: 0,
  estimatedRowHeight: 40,
  getRowHeight: () => 40,
  estimatedColumnWidth: 60,
  getColumnWidth: () => 60,
  columnsFrozen: 0,
  getCellRenderer: () => cellRenderer,
  getCellText: (rowIndex, columnIndex) => `${rowIndex}-${columnIndex}`,
  getCellFormatting: (): Omit<Text, "text"> & Omit<Rect, "x" | "y" | "width" | "height"> => ({
    fill: "white",
    stroke: Color.Gray,
    strokeWidth: 1,
    borderRadius: 0,
    fontSize: 12,
    fontStyle: "normal",
    fontFamily: "Arial",
    fontWeight: "normal",
    textDecoration: "none",
    textAlign: "left",
    verticalAlign: "middle",
    wrap: "none",
    padding: 0,
    color: Color.Black
  }),
});
// ================ //

// ==== Refs ==== //
const gridRef = ref<HTMLDivElement>();
const stageRef = ref<HTMLDivElement>();
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
  renderGridThrottled,
  estimatedTotalWidth, 
  estimatedTotalHeight,
} = useGrid({
  gridRef,
  stageRef,
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
  getCellRenderer: props.getCellRenderer,
  getCellText: props.getCellText,
  getCellFormatting: props.getCellFormatting,
  getCellClickHandler: props.getCellClickHandler,
  getCellDoubleClickHandler: props.getCellDoubleClickHandler,
  getCellRightClickHandler: props.getCellRightClickHandler,
  getCellHoverHandler: props.getCellHoverHandler
});
// ================ //

// ==== Watchers ==== //
watch([scrollTop, scrollLeft], () => renderGridThrottled())
// ================ //

// ==== Life cycle ==== //
onMounted(async () => {
  initGrid();
  renderGridThrottled();
  gridRef.value?.addEventListener("wheel", onWheel);
});
onUnmounted(() => {
  gridRef.value?.removeEventListener("wheel", onWheel);
});
// ================ //
</script>
