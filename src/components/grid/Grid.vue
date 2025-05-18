<template>
  <div
    class="rowsncolumns-grid"
    :style="{
      position: 'relative',
      width: containerWidth + 'px',
      userSelect: 'none'
    }"
    ref="scrollContainerRef"
  >
    <div
      tabIndex="0"
      class="rowsncolumns-grid-container"
      ref="containerRef"
      v-bind="restProps"
    >
      <v-stage
        :config="{
          width: containerWidth,
          height: containerHeight,
          listening: listenToEvents,
          ...stageProps
        }"
        ref="stageRef"
      >
        <v-layer>
          <v-group
            :config="{
              clipX: frozenColumnWidth,
              clipY: frozenRowHeight,
              clipWidth: containerWidth - frozenColumnWidth,
              clipHeight: containerHeight - frozenRowHeight,
            }"
          >
            <v-group 
              :config="{
                offsetY: scrollTop,
                offsetX: scrollLeft,
              }"
            >
              <GridLine 
                v-for="(line, index) in state.gridLines"
                :key="index"
                v-bind="line"
              />
              <Cell
                v-for="cell in state.cells"
                :key="cell"
                v-bind="cell"
              />
              <CellOverlay
                v-for="(overlay, index) in state.cellOverlays"
                :key="index"
                v-bind="overlay"
              />
              <Cell
                v-for="(range, index) in state.ranges"
                :key="index"
                v-bind="range"
              />
            </v-group>
          </v-group>
          <v-group
            :config="{
              clipX: frozenColumnWidth,
              clipY: 0,
              clipWidth: containerWidth - frozenColumnWidth,
              clipHeight: frozenRowHeight + frozenSpacing,
            }"
          >
            <v-group
              :config="{
                offsetY: 0,
                offsetX: scrollLeft,
              }"
            >
              <GridLine 
                v-for="(line, index) in state.gridLinesFrozenRow"
                :key="index"
                v-bind="line"
              />
              <Cell
                v-for="(cell, index) in state.frozenRowCells"
                :key="index"
                v-bind="cell"
              />
              <v-line
                v-if="frozenRowShadowComponent"
                :config="frozenRowShadowComponent"
              />
              <CellOverlay
                v-for="(overlay, index) in state.frozenRowCellOverlays"
                :key="index"
                v-bind="overlay"
              />
            </v-group>
          </v-group>
          <v-group
            :config="{
              clipX: 0,
              clipY: frozenRowHeight,
              clipWidth: frozenColumnWidth + frozenSpacing,
              clipHeight: containerHeight - frozenRowHeight,
            }"
          >
            <v-group
              :config="{
                offsetY: scrollTop,
                offsetX: 0,
              }"
            >
              <GridLine
                v-for="(line, index) in state.gridLinesFrozenColumn"
                :key="index"
                v-bind="line"
              />
              <Cell
                v-for="(cell, index) in state.frozenColumnCells"
                :key="index"
                v-bind="cell"
              />
              <v-line
                v-if="frozenColumnShadowComponent"
                :config="frozenColumnShadowComponent"
              />
              <CellOverlay
                v-for="(overlay, index) in state.frozenColumnCellOverlays"
                :key="index"
                v-bind="overlay"
              />
            </v-group>
          </v-group>
          <v-group
            :config="{
              clipX: 0,
              clipY: 0,
              clipWidth: frozenColumnWidth + frozenSpacing,
              clipHeight: frozenRowHeight + frozenSpacing,
            }"
          >
            <GridLine
              v-for="(line, index) in state.gridLinesFrozenIntersection"
              :key="index"
              v-bind="line"
            />
            <Cell 
              v-for="(cell, index) in state.frozenIntersectionCells"
              :key="index"
              v-bind="cell"
            />
            <v-line
              v-if="frozenRowShadowComponent"
              :config="frozenRowShadowComponent"
            />
            <v-line
              v-if="frozenRowShadowComponent"
              :config="frozenColumnShadowComponent"
            />
            <CellOverlay 
              v-for="(overlay, index) in state.frozenIntersectionCellOverlays"
              :key="index"
              v-bind="overlay"
            />
          </v-group>
        </v-layer>
      </v-stage>
    </div>
    <div
      :style="{
        pointerEvents: 'none',
      }"
    >
      <div
        :style="{
          position: 'absolute',
          left: frozenColumnWidth + 'px',
          top: frozenRowHeight + 'px',
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }"
      >
        <div
          :style="{
            transform: `translate(-${scrollLeft + frozenColumnWidth}px, -${
              scrollTop + frozenRowHeight
            }px)`,
          }"
        >
          <HtmlBox 
            v-for="(box, index) in state.borderStyleCells"
            :key="index"
            v-bind="box"
          />
          <Selection
            v-for="(selection, index) in state.fillSelections"
            :key="index"
            v-bind="selection"
          />
          <Selection
            v-for="(selection, index) in state.selectionAreas"
            :key="index"
            v-bind="selection"
          />
          <Selection
            v-if="state.activeCellSelection"
            v-bind="state.activeCellSelection"
          />
          <FillHandle
            v-if="fillhandleComponent"
            v-bind="fillhandleComponent"
          />
        </div>
      </div>
      <div
        v-if="frozenColumns"
        :style="{
          position: 'absolute',
          width: frozenColumnWidth + 8 + 'px',
          top: frozenRowHeight + 'px',
          left: 0,
          bottom: 0,
          overflow: 'hidden',
        }"
      >
        <div
          :style="{
            transform: `translate(0, -${scrollTop + frozenRowHeight}px)`,
          }"
        >
          <HtmlBox 
            v-for="(box, index) in state.borderStyleCellsFrozenColumns"
            :key="index"
            v-bind="box"
          />
          <Selection
            v-for="(selection, index) in state.selectionAreasFrozenColumns"
            :key="index"
            v-bind="selection"
          />
          <Selection
            v-if="state.activeCellSelectionFrozenColumn"
            v-bind="state.activeCellSelectionFrozenColumn"
          />
          <FillHandle
            v-if="fillhandleComponent"
            v-bind="fillhandleComponent"
          />
        </div>
      </div>
      <div
        v-if="frozenRows"
        :style="{
          position: 'absolute',
          height: frozenRowHeight + 8 + 'px',
          left: frozenColumnWidth + 'px',
          right: 0,
          top: 0,
          overflow: 'hidden',
        }"
      >
        <div
          :style="{
            transform: `translate(-${scrollLeft + frozenColumnWidth}px, 0)`,
          }"
        >
          <HtmlBox 
            v-for="(box, index) in state.borderStyleCellsFrozenRows"
            :key="index"
            v-bind="box"
          />
          <Selection
            v-for="(selection, index) in state.selectionAreasFrozenRows"
            :key="index"
            v-bind="selection"
          />
          <Selection
            v-if="state.activeCellSelectionFrozenRow"
            v-bind="state.activeCellSelectionFrozenRow"
          />
          <FillHandle
            v-if="fillhandleComponent"
            v-bind="fillhandleComponent"
          />
        </div>
      </div>
      <div
        v-if="frozenRows && frozenColumns"
        :style="{
          position: 'absolute',
          height: frozenRowHeight + 8 + 'px',
          width: frozenColumnWidth + 8 + 'px',
          left: 0,
          top: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }"
      >
        <HtmlBox 
          v-for="(box, index) in state.borderStyleCellsIntersection"
          :key="index"
          v-bind="box"
        />
        <Selection
          v-for="(selection, index) in state.selectionAreasIntersection"
          :key="index"
          v-bind="selection"
        />
        <Selection
          v-if="state.activeCellSelectionFrozenIntersection"
          v-bind="state.activeCellSelectionFrozenIntersection"
        />
        <FillHandle
          v-if="fillhandleComponent"
          v-bind="fillhandleComponent"
        />
      </div>
    </div>
    <template v-if="showScrollbar">
      <div
        class="rowsncolumns-grid-scrollbar rowsncolumns-grid-scrollbar-y"
        tabIndex="-1"
        :style="{
          height: containerHeight + 'px',
          overflow: 'scroll',
          position: 'absolute',
          right: 0,
          top: 0,
          width: scrollbarSize + 'px',
          willChange: 'transform',
        }"
        @scroll="handleScroll"
        ref="verticalScrollRef"
      >
        <div
          :style="{
            position: 'absolute',
            height: estimatedTotalHeight + 'px',
            width: 1 + 'px',
          }"
        ></div>
      </div>
      <div
        class="rowsncolumns-grid-scrollbar rowsncolumns-grid-scrollbar-x"
        tabIndex="-1"
        :style="{
          overflow: 'scroll',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: containerWidth + 'px',
          height: scrollbarSize + 'px',
          willChange: 'transform',
        }"
        @scroll="handleScrollLeft"
        ref="horizontalScrollRef"
      >
        <div
          :style="{
            position: 'absolute',
            width: estimatedTotalWidth + 'px',
            height: 1 + 'px',
          }"
        ></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
} from "vue";
import invariant from "tiny-invariant";
import Konva from "konva";
import {
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  itemKey,
  getRowOffset as getRowOffsetHelper,
  getColumnOffset as getColumnOffsetHelper,
  getColumnWidth as getColumnWidthHelper,
  getRowHeight as getRowHeightHelper,
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
  getBoundedCells,
  cellIdentifier,
  throttle,
  getOffsetForColumnAndAlignment,
  getOffsetForRowAndAlignment,
  requestTimeout,
  cancelTimeout,
  TimeoutID,
  clampIndex,
  canUseDOM,
} from "../../helpers/helpers";
import type { ShapeConfig } from "konva/lib/Shape";
import type { GridProps } from "./types";
import type {
  CellInterface,
  CellPosition,
  CellRangeArea,
  RendererProps,
  ScrollCoords,
  SelectionArea,
  SelectionProps,
  ViewPortProps,
  ItemSizer,
  StylingProps,
  AreaProps,
  SnapRowProps,
  SnapColumnProps,
  MergedCellMap,
  InstanceInterface,
  OptionalScrollCoords,
  PosXY,
  OptionalCellInterface,
  PosXYRequired,
} from "../../types";
import { Direction, Align } from "../../types";

import Cell from "../cell/Cell.vue";
import CellOverlay from "../cell-overlay/CellOverlay.vue";
import Selection from "../selection/Selection.vue";
import FillHandle from "../fill-handle/FillHandle.vue";
import GridLine from "../grid-line/GridLine.vue";
import HtmlBox from "../html-box/HtmlBox.vue";
import { watch } from "vue";
import { toRefs } from "vue";
import { CellProps } from "../cell/types";
import { StrokeCellProps } from "../cell-overlay/types";

interface ScrollSnapRef {
  visibleRowStartIndex: number;
  rowCount: number;
  frozenRows: number;
  visibleColumnStartIndex: number;
  columnCount: number;
  frozenColumns: number;
  isHiddenRow?: (rowIndex: number) => boolean;
  isHiddenColumn?: (columnIndex: number) => boolean;
}

// ==== props ==== //
const props = withDefaults(defineProps<GridProps>(), {
  width: 800,
  height: 600,
  rowHeight: () => (index: number) => 20,
  columnWidth: () => (index: number) => 60,
  estimatedColumnWidth: 50,
  estimatedRowHeight: 50,
  rowCount: 0,
  columnCount: 0,
  scrollbarSize: 13,
  showScrollbar: true,
  selectionBackgroundColor: "rgb(14, 101, 235, 0.1)",
  selectionBorderColor: "#1a73e8",
  selectionStrokeWidth: 1,
  activeCellStrokeWidth: 2,
  selections: () => [] as SelectionArea[],
  frozenRows: 0,
  frozenColumns: 0,
  enableCellOverlay: false,
  mergedCells: () => [] as AreaProps[],
  snap: false,
  scrollThrottleTimeout: 80,
  showFrozenShadow: false,
  shadowSettings: () => ({
    strokeWidth: 1,
  }),
  borderStyles: () => [] as StylingProps,
  cellAreas: () => [] as CellRangeArea[],
  showFillHandle: false,
  overscanCount: 1,
  fillhandleBorderColor: "white",
  showGridLines: false,
  gridLineColor: "#E3E2E2",
  gridLineWidth: 1,
  scale: 1,
  enableSelectionDrag: false,
  isDraggingSelection: false,
});
// ================ //

// ==== data ==== //
const instanceProps = ref<InstanceInterface>({
  columnMetadataMap: {},
  rowMetadataMap: {},
  lastMeasuredColumnIndex: -1,
  lastMeasuredRowIndex: -1,
  estimatedColumnWidth: props.estimatedColumnWidth,
  estimatedRowHeight: props.estimatedRowHeight,
  recalcColumnIndices: [],
  recalcRowIndices: [],
});
const stageRef = ref<Konva.Stage>(null);
const containerRef = ref<HTMLDivElement>(null);
const scrollContainerRef = ref<HTMLDivElement>(null);
const verticalScrollRef = ref<HTMLDivElement>(null);
const wheelingRef = ref<number | null>(null);
const horizontalScrollRef = ref<HTMLDivElement>(null);
const scrollSnapRefs = ref<ScrollSnapRef | null>(null);
const scrollTop = ref(0);
const scrollLeft = ref(0);
const isScrolling = ref(false);
const verticalScrollDirection = ref(Direction.Down);
const horizontalScrollDirection = ref(Direction.Right);
const snapToRowThrottler = ref<(({ deltaY }: SnapRowProps) => void) | null>(null);
const snapToColumnThrottler = ref<(({ deltaX }: SnapColumnProps) => void) | null>(null);
const resetIsScrollingTimeoutID = ref<TimeoutID | null>(null);

/* All grid rendering state is consolidated in state ref */

const state = ref({
  gridLines: [],
  gridLinesFrozenRow: [],
  gridLinesFrozenColumn: [],
  gridLinesFrozenIntersection: [],
  cells: [],
  ranges: [],
  cellOverlays: [],
  frozenRowCells: [],
  frozenRowCellOverlays: [],
  frozenColumnCells: [],
  frozenColumnCellOverlays: [],
  frozenIntersectionCells: [],
  frozenIntersectionCellOverlays: [],
  fillHandleDimension: {
    x: 0,
    y: 0,
  },
  activeCellSelection: null,
  activeCellSelectionFrozenColumn: null,
  activeCellSelectionFrozenRow: null,
  activeCellSelectionFrozenIntersection: null,
  isSelectionInProgress: false,
  selectionAreas: [],
  selectionAreasFrozenColumns: [],
  selectionAreasFrozenRows: [],
  selectionAreasIntersection: [],
  fillSelections: [],
  borderStyleCells: [],
  borderStyleCellsFrozenColumns: [],
  borderStyleCellsFrozenRows: [],
  borderStyleCellsIntersection: []
})

/* Spacing for frozen row/column clip */
const frozenSpacing = ref(1);

const {
  mergedCells,
  frozenColumns,
  frozenRows,
  rowHeight,
  columnWidth,
  rowCount,
  columnCount,
  scale,
  snap,
  height: containerHeight,
  width: containerWidth,
  scrollbarSize,
  showScrollbar,
  overscanCount,
  scrollThrottleTimeout,
  showGridLines,
  isHiddenRow,
  onBeforeRenderRow,
  isHiddenColumn,
  isHiddenCell,
  gridLineColor,
  gridLineWidth,
  onViewChange,
  enableCellOverlay,
  cellAreas,
  onScroll,
  shadowSettings,
  activeCell,
  selectionBorderColor,
  selectionBackgroundColor,
  activeCellStrokeWidth,
  selections,
  isDraggingSelection,
  enableSelectionDrag,
  selectionStrokeWidth,
  fillSelection,
  borderStyles,
  showFrozenShadow,
  onImmediateScroll,
  showFillHandle,
  fillHandleProps,
  fillhandleBorderColor,
} = toRefs(props);
// ================ //

// ==== computed ==== //
const restProps = computed(() => {
  const {
    width,
    height,
    estimatedColumnWidth,
    estimatedRowHeight,
    rowHeight,
    columnWidth,
    rowCount = 0,
    columnCount = 0,
    scrollbarSize = 13,
    onScroll,
    onImmediateScroll,
    showScrollbar = true,
    selectionBackgroundColor = "rgb(14, 101, 235, 0.1)",
    selectionBorderColor = "#1a73e8",
    selectionStrokeWidth = 1,
    activeCellStrokeWidth = 2,
    activeCell,
    selections,
    frozenRows = 0,
    frozenColumns = 0,
    itemRenderer,
    enableCellOverlay = false,
    overlayRenderer,
    mergedCells,
    snap = false,
    scrollThrottleTimeout = 80,
    onViewChange,
    selectionRenderer,
    onBeforeRenderRow,
    showFrozenShadow,
    shadowSettings,
    borderStyles,
    stageProps,
    cellAreas,
    showFillHandle = false,
    fillSelection,
    overscanCount = 1,
    fillHandleProps,
    fillhandleBorderColor = "white",
    showGridLines = false,
    gridLineColor = "#E3E2E2",
    gridLineWidth = 1,
    gridLineRenderer,
    isHiddenRow,
    isHiddenColumn,
    isHiddenCell,
    scale = 1,
    enableSelectionDrag = false,
    isDraggingSelection = false,
    ...rest
  } = props;
  return rest;
})
/**
 * Create a map of merged cells
 * [rowIndex, columnindex] => [parentRowIndex, parentColumnIndex]
 */
const mergedCellMap = computed((): MergedCellMap => {
  const mergedCellMap = new Map();
  for (let i = 0; i < mergedCells.value.length; i++) {
    const bounds = mergedCells.value[i];
    for (const cell of getBoundedCells(bounds)) {
      mergedCellMap.set(cell, bounds);
    }
  }
  return mergedCellMap;
});
const frozenColumnWidth = computed(() => getColumnOffset(frozenColumns.value));
const frozenRowHeight = computed(() => getRowOffset(frozenRows.value));
const offsetRowStartIndex = computed(() => {
  return getRowStartIndexForOffset({
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    rowCount: rowCount.value,
    columnCount: columnCount.value,
    instanceProps: instanceProps.value,
    offset: scrollTop.value + frozenRowHeight.value,
    scale: scale.value,
  });
})
const offsetRowStopIndex = computed(() => {
  return getRowStopIndexForStartIndex({
    startIndex: offsetRowStartIndex.value,
    rowCount: rowCount.value,
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    scrollTop: scrollTop.value,
    containerHeight: containerHeight.value,
    instanceProps: instanceProps.value,
    scale: scale.value,
  });
})
const rowStartIndex = computed(() => {
  const startIndex = offsetRowStartIndex.value;
  /* 
    Overscan by one item in each direction so that tab/focus works.
    If there isn't at least one extra item, tab loops back around.
  */
  const overscanBackward =
    !isScrolling.value || verticalScrollDirection.value === Direction.Up
      ? Math.max(1, overscanCount.value)
      : 1;
  return Math.max(0, startIndex - overscanBackward)
});
const rowStopIndex = computed(() => {  
  /* 
    Overscan by one item in each direction so that tab/focus works.
    If there isn't at least one extra item, tab loops back around.
  */
  const overscanForward =
    !isScrolling.value || verticalScrollDirection.value === Direction.Down
      ? Math.max(1, overscanCount.value)
      : 1;

  return Math.max(0, Math.min(rowCount.value - 1, offsetRowStopIndex.value + overscanForward));
});
const visibleRowStartIndex = computed(() => offsetRowStartIndex.value);
const visibleRowStopIndex = computed(() => offsetRowStopIndex.value);
const offsetColumnStartIndex = computed(() => {
  return getColumnStartIndexForOffset({
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    rowCount: rowCount.value,
    columnCount: columnCount.value,
    instanceProps: instanceProps.value,
    offset: scrollLeft.value + frozenColumnWidth.value,
    scale: scale.value,
  });
})
const offsetColumnStopIndex = computed(() => {
  return getColumnStopIndexForStartIndex({
    startIndex: offsetColumnStartIndex.value,
    columnCount: columnCount.value,
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    scrollLeft: scrollLeft.value,
    containerWidth: containerWidth.value,
    instanceProps: instanceProps.value,
    scale: scale.value,
  });
})
const columnStartIndex = computed(() => {
  const startIndex = offsetColumnStartIndex.value;
  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscanBackward =
    !isScrolling.value || horizontalScrollDirection.value === Direction.Left
      ? Math.max(1, overscanCount.value)
      : 1;
  return Math.max(0, startIndex - overscanBackward);
});
const columnStopIndex = computed(() => {
  const stopIndex = offsetColumnStopIndex.value;
  // Overscan by one item in each direction so that tab/focus works.
  // If there isn't at least one extra item, tab loops back around.
  const overscanForward =
    !isScrolling.value || horizontalScrollDirection.value === Direction.Right
      ? Math.max(1, overscanCount.value)
      : 1;
  return Math.max(0, Math.min(columnCount.value - 1, stopIndex + overscanForward));
})
const visibleColumnStartIndex = computed(() => offsetColumnStartIndex.value);
const visibleColumnStopIndex = computed(() => offsetColumnStopIndex.value);
const estimatedTotalHeight = computed(() =>
  getEstimatedTotalHeight(rowCount.value, instanceProps.value)
);
const estimatedTotalWidth = computed(() =>
  getEstimatedTotalWidth(columnCount.value, instanceProps.value)
);
/**
 * Frozen column shadow
 */
const frozenColumnShadow = computed<ShapeConfig>(() => {
  const frozenColumnLineX = getColumnOffset(frozenColumns.value);
  const frozenColumnLineY = getRowOffset(
    Math.min(rowStopIndex.value + 1, rowCount.value)
  );

  return {
    points: [frozenColumnLineX, 0, frozenColumnLineX, frozenColumnLineY],
    offsetX: -0.5,
    strokeWidth: 1,
    shadowForStrokeEnabled: false,
    strokeScaleEnabled: false,
    hitStrokeWidth: 0,
    listening: false,
    perfectDrawEnabled: false,
    ...shadowSettings.value,
  }
});

/**
 * Frozen row shadow
 */
const frozenRowShadow = computed<ShapeConfig>(() => {
  const frozenRowLineY = getRowOffset(frozenRows.value);
  const frozenRowLineX = getColumnOffset(
    Math.min(columnStopIndex.value + 1, columnCount.value)
  );
  return {
    points: [0, frozenRowLineY, frozenRowLineX, frozenRowLineY],
    offsetY: -0.5,
    strokeWidth: 1,
    shadowForStrokeEnabled: false,
    strokeScaleEnabled: false,
    hitStrokeWidth: 0,
    listening: false,
    perfectDrawEnabled: false,
    ...shadowSettings.value,
  }
});

/**
 * Fill handle
 */
const fillHandle = computed(() => {
  return {
    ...state.value.fillHandleDimension,
    stroke: selectionBorderColor.value,
    size: 8,
    borderColor: fillhandleBorderColor.value,
    ...fillHandleProps.value,
  }
});

/**
 * Prevents drawing hit region when scrolling
 */
const listenToEvents = computed(() => !isScrolling.value);

/* Frozen row shadow */
const frozenRowShadowComponent = computed(() =>
  showFrozenShadow.value && frozenRows.value !== 0 ? frozenRowShadow : null
);
  
/* Frozen column shadow */
const frozenColumnShadowComponent = computed(() =>
  showFrozenShadow.value && frozenColumns.value !== 0 ? frozenColumnShadow : null
);

/**
 * fill handle 
 */
const fillhandleComponent = computed(() => {
  return showFillHandle.value && !state.value.isSelectionInProgress ? fillHandle.value : null
})
// ================ //

// ==== methods ==== //
/* Focus container */
const focusContainer = () => {
  if (canUseDOM && document.activeElement !== containerRef.value) {
    return containerRef.value?.focus();
  }
};
/**
 * Get top offset of rowIndex
 */
const getRowOffset = (index: number) => {
  return getRowOffsetHelper({
    index,
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    instanceProps: instanceProps.value,
    scale: scale.value,
  });
};

/**
 * Get left offset of columnIndex
 */
const getColumnOffset = (index: number) => {
  return getColumnOffsetHelper({
    index,
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    instanceProps: instanceProps.value,
    scale: scale.value,
  });
};

/**
 * Get height of rowIndex
 */
const getRowHeight = (index: number) => {
  return getRowHeightHelper(index, instanceProps.value);
};

/**
 * Get height of columNiondex
 */
const getColumnWidth = (index: number) => {
  return getColumnWidthHelper(index, instanceProps.value);
};

/**
 * Imperatively get the current scroll position
 */
const getScrollPosition = () => ({
  scrollTop,
  scrollLeft,
});

/* Redraw grid imperatively */
const resetAfterIndices = (
  { columnIndex, rowIndex }: OptionalCellInterface,
  shouldForceUpdate: boolean = true
) => {
  if (typeof columnIndex === "number") {
    instanceProps.value.recalcColumnIndices = [];
    instanceProps.value.lastMeasuredColumnIndex = Math.min(
      instanceProps.value.lastMeasuredColumnIndex,
      columnIndex - 1
    );
  }
  if (typeof rowIndex === "number") {
    instanceProps.value.recalcRowIndices = [];
    instanceProps.value.lastMeasuredRowIndex = Math.min(
      instanceProps.value.lastMeasuredRowIndex,
      rowIndex - 1
    );
  }
};

/* Check if a cell is part of a merged cell */
const isMergedCell = ({ rowIndex, columnIndex }: CellInterface) => {
  return mergedCellMap.value.has(cellIdentifier(rowIndex, columnIndex));
};

/* Get top, left bounds of a cell */
const getCellBounds = (
  { rowIndex, columnIndex }: CellInterface,
  spanMerges = true
): AreaProps => {
  if (spanMerges) {
    const isMerged = isMergedCell({ rowIndex, columnIndex });
    if (isMerged)
      return mergedCellMap.value.get(
        cellIdentifier(rowIndex, columnIndex)
      ) as AreaProps;
  }
  return {
    top: rowIndex,
    left: columnIndex,
    right: columnIndex,
    bottom: rowIndex,
  } as AreaProps;
};

/* Get top, left bounds of a cell */
const getActualCellCoords = ({
  rowIndex,
  columnIndex,
}: CellInterface): CellInterface => {
  const isMerged = isMergedCell({ rowIndex, columnIndex });
  if (isMerged) {
    const cell = mergedCellMap.value.get(
      cellIdentifier(rowIndex, columnIndex)
    ) as AreaProps;
    return {
      rowIndex: cell?.top,
      columnIndex: cell?.left,
    };
  }
  return {
    rowIndex,
    columnIndex,
  };
};

/* Method to get dimensions of the grid */
const getDimensions = () => {
  return {
    containerWidth,
    containerHeight,
    estimatedTotalWidth,
    estimatedTotalHeight,
  };
};

/**
 * Snaps vertical scrollbar to the next/prev visible row
 */
const snapToRowFn = ({ deltaY }: SnapRowProps) => {
  if (!verticalScrollRef.value || !scrollSnapRefs.value) return;
  if (deltaY !== 0) {
    const direction = deltaY < 0 ? Direction.Up : Direction.Down;
    const { visibleRowStartIndex, rowCount, isHiddenRow } =
      scrollSnapRefs.value;
    let nextRowIndex =
      direction === Direction.Up
        ? // User is scrolling up
          Math.max(0, visibleRowStartIndex - 1)
        : Math.min(visibleRowStartIndex, rowCount - 1);
    /* Ignore hidden row */
    nextRowIndex = clampIndex(nextRowIndex, isHiddenRow, direction);
    const rowHeight = getRowHeight(nextRowIndex);
    verticalScrollRef.value.scrollTop +=
      (direction === Direction.Up ? -1 : 1) * rowHeight;
  }
};

/**
 * Snaps horizontal scrollbar to the next/prev visible column
 */
const snapToColumnFn = ({ deltaX }: SnapColumnProps) => {
  if (!horizontalScrollRef.value || !scrollSnapRefs.value) return;
  if (deltaX !== 0) {
    const { visibleColumnStartIndex, columnCount, isHiddenColumn } =
      scrollSnapRefs.value;
    const direction = deltaX < 0 ? Direction.Left : Direction.Right;
    let nextColumnIndex =
      direction === Direction.Left
        ? Math.max(0, visibleColumnStartIndex - 1)
        : Math.min(visibleColumnStartIndex, columnCount - 1);
    /* Ignore hidden column */
    nextColumnIndex = clampIndex(nextColumnIndex, isHiddenColumn, direction);
    const columnWidth = getColumnWidth(nextColumnIndex);
    horizontalScrollRef.value.scrollLeft +=
      (direction === Direction.Left ? -1 : 1) * columnWidth;
  }
};

/* Find frozen column boundary */
const isWithinFrozenColumnBoundary = (x: number) => {
  return frozenColumns.value > 0 && x < frozenColumnWidth.value;
};

/* Find frozen row boundary */
const isWithinFrozenRowBoundary = (y: number) => {
  return frozenRows.value > 0 && y < frozenRowHeight.value;
};

/**
 * Get relative mouse position
 */
const getRelativePositionFromOffset = (
  left: number,
  top: number
): PosXYRequired | null => {
  invariant(
    typeof left === "number" && typeof top === "number",
    "Top and left should be a number"
  );
  if (!stageRef.value) return null;
  const stage = stageRef.value.getStage();
  const rect = containerRef.value?.getBoundingClientRect();
  if (rect) {
    left = left - rect.x;
    top = top - rect.y;
  }
  const { x, y } = stage
    .getAbsoluteTransform()
    .copy()
    .invert()
    .point({ x: left, y: top });

  return { x, y };
};

/**
 * Get cell cordinates from current mouse x/y positions
 */
const getCellCoordsFromOffset = (
  left: number,
  top: number,
  includeFrozen: boolean = true
): CellInterface | null => {
  const pos = getRelativePositionFromOffset(left, top);
  if (!pos) return null;
  const { x, y } = pos;
  const rowOffset =
    includeFrozen && isWithinFrozenRowBoundary(y) ? y : y + scrollTop.value;
  const columnOffset =
    includeFrozen && isWithinFrozenColumnBoundary(x) ? x : x + scrollLeft.value;
  if (rowOffset > estimatedTotalHeight.value || columnOffset > estimatedTotalWidth.value) {
    return null;
  }
  const rowIndex = getRowStartIndexForOffset({
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    rowCount: rowCount.value,
    columnCount: columnCount.value,
    instanceProps: instanceProps.value,
    offset: rowOffset,
    scale: scale.value,
  });
  const columnIndex = getColumnStartIndexForOffset({
    rowHeight: rowHeight.value,
    columnWidth: columnWidth.value,
    rowCount: rowCount.value,
    columnCount: columnCount.value,
    instanceProps: instanceProps.value,
    offset: columnOffset,
    scale: scale.value,
  });
  /* To be compatible with merged cells */
  const bounds = getCellBounds({ rowIndex, columnIndex });

  return { rowIndex: bounds.top, columnIndex: bounds.left };
};

/**
 * Get cell offset position from rowIndex, columnIndex
 */
const getCellOffsetFromCoords = (cell: CellInterface): CellPosition => {
  const {
    top: rowIndex,
    left: columnIndex,
    right,
    bottom,
  } = getCellBounds(cell);
  const x = getColumnOffset(columnIndex);
  const y = getRowOffset(rowIndex);
  const width = getColumnOffset(right + 1) - x;
  const height = getRowOffset(bottom + 1) - y;

  return {
    x,
    y,
    width,
    height,
  };
};

/**
 * Resize one or more columns
 */
const resizeColumns = (indices: number[]) => {
  const leftMost = Math.min(...indices);
  instanceProps.value.recalcColumnIndices = indices;
  resetAfterIndices({ columnIndex: leftMost }, false);
};

/**
 * Resize one or more rows
 */
const resizeRows = (indices: number[]) => {
  const topMost = Math.min(...indices);
  instanceProps.value.recalcRowIndices = indices;
  resetAfterIndices({ rowIndex: topMost }, false);
};

/* Get current view port of the grid */
const getViewPort = (): ViewPortProps => {
  return {
    rowStartIndex: rowStartIndex.value,
    rowStopIndex: rowStopIndex.value,
    columnStartIndex: columnStartIndex.value,
    columnStopIndex: columnStopIndex.value,
    visibleRowStartIndex: visibleRowStartIndex.value,
    visibleRowStopIndex: visibleRowStopIndex.value,
    visibleColumnStartIndex: visibleColumnStartIndex.value,
    visibleColumnStopIndex: visibleColumnStopIndex.value,
  };
};

const resetIsScrollingDebounced = () => {
  if (resetIsScrollingTimeoutID.value !== null) {
    cancelTimeout(resetIsScrollingTimeoutID.value);
  }
  resetIsScrollingTimeoutID.value = requestTimeout(resetIsScrolling, 150);
};

/* Reset isScrolling */
const resetIsScrolling = () => {
  resetIsScrollingTimeoutID.value = null;
  isScrolling.value = false;
};

/* Handle vertical scroll */
const handleScroll = (e: Event) => {
  const { scrollTop: localScrollTop } = e.target as HTMLDivElement;

  isScrolling.value = true,
  verticalScrollDirection.value =
      scrollTop.value > localScrollTop ? Direction.Up : Direction.Down,
  scrollTop.value = localScrollTop;

  /* Scroll callbacks */
  onImmediateScroll.value?.({ scrollTop: scrollTop.value, scrollLeft: scrollLeft.value });

  /* Reset isScrolling if required */
  resetIsScrollingDebounced();
};

/* Handle horizontal scroll */
const handleScrollLeft = (e: Event) => {
  const { scrollLeft: localScrollLeft } = e.target as HTMLDivElement;
  isScrolling.value = true,
  horizontalScrollDirection.value =
      scrollLeft.value > localScrollLeft ? Direction.Left : Direction.Right,
  scrollLeft.value = localScrollLeft;

  /* Scroll callbacks */
  onImmediateScroll.value?.({ scrollLeft: scrollLeft.value, scrollTop: scrollTop.value });

  /* Reset isScrolling if required */
  resetIsScrollingDebounced();
};

/* Scroll based on left, top position */
const scrollTo = ({ scrollTop: localScrollTop, scrollLeft: localScrollLeft }: OptionalScrollCoords) => {
  /* If scrollbar is visible, lets update it which triggers a state change */
  if (showScrollbar.value) {
    if (horizontalScrollRef.value && localScrollLeft !== void 0)
      horizontalScrollRef.value.scrollLeft = localScrollLeft;
    if (verticalScrollRef.value && localScrollTop !== void 0)
      verticalScrollRef.value.scrollTop = localScrollTop;
  } else {
    scrollLeft.value = localScrollLeft == void 0 ? scrollLeft.value : localScrollLeft;
    scrollTop.value = localScrollTop == void 0 ? scrollTop.value : localScrollTop;
  }
};

/* Scroll grid to top */
const scrollToTop = () => {
  scrollTo({ scrollTop: 0, scrollLeft: 0 });
};

/* Scroll grid to bottom */
const scrollToBottom = () => {
  scrollTo({ scrollTop: estimatedTotalHeight.value - containerHeight.value });
};

/**
 * Scrollby utility
 */
const scrollBy = ({ x, y }: PosXY) => {
  if (showScrollbar) {
    if (horizontalScrollRef.value && x !== void 0)
      horizontalScrollRef.value.scrollLeft += x;
    if (verticalScrollRef.value && y !== void 0)
      verticalScrollRef.value.scrollTop += y;
  } else {
    scrollLeft.value = x == void 0 ? scrollLeft.value : scrollLeft.value + x;
    scrollTop.value = y == void 0 ? scrollTop.value : scrollTop.value + y;
  }
};

/**
 * Scrolls to cell
 * Respects frozen rows and columns
 */
const scrollToItem = (
  { rowIndex, columnIndex }: OptionalCellInterface,
  align: Align = Align.smart
) => {
  const isFrozenRow = rowIndex !== void 0 && rowIndex < frozenRows.value;
  const isFrozenColumn = columnIndex !== void 0 && columnIndex < frozenColumns.value;
  const frozenColumnOffset = getColumnOffset(frozenColumns.value);
  /* Making sure getColumnWidth works */
  const x = columnIndex !== void 0 ? getColumnOffset(columnIndex) : void 0;
  /* Making sure getRowHeight works */
  const y = rowIndex !== void 0 ? getRowOffset(rowIndex) : void 0;
  const width = columnIndex !== void 0 ? getColumnWidth(columnIndex) : 0;
  const height = rowIndex !== void 0 ? getRowHeight(rowIndex) : 0;
  const columnAlign = width > containerWidth.value ? Align.start : align;
  const rowAlign = height > containerHeight.value ? Align.start : align;
  const newScrollLeft =
    columnIndex !== void 0 && !isFrozenColumn
      ? getOffsetForColumnAndAlignment({
          index: columnIndex,
          containerHeight: containerHeight.value,
          containerWidth: containerWidth.value,
          columnCount: columnCount.value,
          columnWidth: columnWidth.value,
          rowCount: rowCount.value,
          rowHeight: rowHeight.value,
          scrollOffset: scrollLeft.value,
          instanceProps: instanceProps.value,
          scrollbarSize: scrollbarSize.value,
          frozenOffset: frozenColumnOffset,
          align: columnAlign,
          scale: scale.value,
          estimatedTotalWidth: estimatedTotalWidth.value,
          estimatedTotalHeight: estimatedTotalHeight.value,
        })
      : void 0;

  const frozenRowOffset = getRowOffset(frozenRows.value);
  const newScrollTop =
    rowIndex !== void 0 && !isFrozenRow
      ? getOffsetForRowAndAlignment({
          index: rowIndex,
          containerHeight: containerHeight.value,
          containerWidth: containerWidth.value,
          columnCount: columnCount.value,
          columnWidth: columnWidth.value,
          rowCount: rowCount.value,
          rowHeight: rowHeight.value,
          scrollOffset: scrollTop.value,
          instanceProps: instanceProps.value,
          scrollbarSize: scrollbarSize.value,
          frozenOffset: frozenRowOffset,
          align: rowAlign,
          scale: scale.value,
          estimatedTotalWidth: estimatedTotalWidth.value,
          estimatedTotalHeight: estimatedTotalHeight.value,
        })
      : void 0;

  const coords = {
    scrollLeft: newScrollLeft,
    scrollTop: newScrollTop,
  };
  const isOutsideViewport =
    (rowIndex !== void 0 &&
      rowIndex > rowStopIndex.value + (rowStopIndex.value - rowStartIndex.value)) ||
    (columnIndex !== void 0 &&
      columnIndex > columnStopIndex.value + (columnStopIndex.value - columnStartIndex.value));

  /* Scroll in the next frame, Useful when user wants to jump from 1st column to last */
  if (isOutsideViewport) {
    window.requestAnimationFrame(() => {
      scrollTo(coords);
    });
  } else scrollTo(coords);
};

/**
 * Fired when user tries to scroll the canvas
 */
const handleWheel = (event: WheelEvent) => {
  /* If user presses shift key, scroll horizontally */
  const isScrollingHorizontally = event.shiftKey;

  /* Prevent browser back in Mac */
  event.preventDefault();
  const { deltaX, deltaY, deltaMode } = event;
  /* Scroll natively */
  if (wheelingRef.value) return;

  let dx = isScrollingHorizontally ? deltaY : deltaX;
  let dy = deltaY;

  /* Scroll only in one direction */
  const isHorizontal = isScrollingHorizontally || Math.abs(dx) > Math.abs(dy);

  /* If snaps are active */
  if (snap.value) {
    if (isHorizontal) {
      snapToColumnThrottler.value?.({
        deltaX,
      });
    } else {
      snapToRowThrottler.value?.({
        deltaY,
      });
    }
    return;
  }

  if (deltaMode === 1) {
    dy = dy * scrollbarSize.value;
  }
  if (!horizontalScrollRef.value || !verticalScrollRef.value) return;
  const currentScroll = isHorizontal
    ? horizontalScrollRef.value?.scrollLeft
    : verticalScrollRef.value?.scrollTop;
  wheelingRef.value = window.requestAnimationFrame(() => {
    wheelingRef.value = null;
    if (isHorizontal) {
      if (horizontalScrollRef.value)
        horizontalScrollRef.value.scrollLeft = currentScroll + dx;
    } else {
      if (verticalScrollRef.value)
        verticalScrollRef.value.scrollTop = currentScroll + dy;
    }
    renderGrid()
  });
};
const renderGrid = () => {
  const gridLinesBuffer = []
  const gridLinesFrozenRowBuffer = []
  const gridLinesFrozenColumnBuffer = []
  const gridLinesFrozenIntersectionBuffer = []
  const cellsBuffer = []
  const rangesBuffer = []
  const cellOverlaysBuffer = []
  const frozenRowCellsBuffer = []
  const frozenRowCellOverlaysBuffer = []
  const frozenColumnCellsBuffer = []
  const frozenColumnCellOverlaysBuffer = []
  const frozenIntersectionCellsBuffer = []
  const frozenIntersectionCellOverlaysBuffer = []
  let fillHandleDimensionBuffer = {
    x: 0,
    y: 0,
  }
  let activeCellSelectionBuffer = null
  let activeCellSelectionFrozenColumnBuffer = null
  let activeCellSelectionFrozenRowBuffer = null
  let activeCellSelectionFrozenIntersectionBuffer = null
  let isSelectionInProgressBuffer = false
  const selectionAreasBuffer = []
  const selectionAreasFrozenColumnsBuffer = []
  const selectionAreasFrozenRowsBuffer = []
  const selectionAreasIntersectionBuffer = []
  const fillSelectionsBuffer = []
  const borderStyleCellsBuffer = []
  const borderStyleCellsFrozenColumnsBuffer = []
  const borderStyleCellsFrozenRowsBuffer = []
  const borderStyleCellsIntersectionBuffer = []
  
  // ==== grid lines ==== //
  if (showGridLines.value) {
    // Horizontal
    for (let rowIndex = rowStartIndex.value; rowIndex <= rowStopIndex.value; rowIndex++) {
      /* Ignore frozen rows */
      if (rowIndex < frozenRows.value || isHiddenRow.value?.(rowIndex)) continue;
      const x1 = getColumnOffset(frozenColumns.value);
      const x2 = getColumnOffset(Math.min(columnStopIndex.value + 1, columnCount.value));
      const y1 = getRowOffset(Math.min(rowIndex + 1, rowCount.value));
      const y2 = y1;
      gridLinesBuffer.push(
        {
          points: [x1, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetY: -0.5,
          key: itemKey({ rowIndex: rowIndex, columnIndex: y1 }),
        }
      );
      gridLinesFrozenColumnBuffer.push(
        {
          points: [0, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetY: -0.5,
          key: itemKey({ rowIndex: rowIndex, columnIndex: y1 }),
        }
      );
    }
    // Vertical
    for (
      let columnIndex = columnStartIndex.value;
      columnIndex <= columnStopIndex.value;
      columnIndex++
    ) {
      const x1 = getColumnOffset(Math.min(columnIndex + 1, columnCount.value));
      const x2 = x1;
      const y1 = getRowOffset(frozenRows.value);
      const y2 = getRowOffset(Math.min(rowStopIndex.value + 1, rowCount.value));
      gridLinesBuffer.push(
        {
          points: [x1, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetX: -0.5,
          key: itemKey({ rowIndex: x1, columnIndex: columnIndex }),
        }
      );
      gridLinesFrozenRowBuffer.push(
        {
          points: [x1, 0, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetX: -0.5,
          key: itemKey({ rowIndex: x1, columnIndex: columnIndex }),
        }
      );
    }
    for (
      let rowIndex = 0;
      rowIndex < Math.min(columnStopIndex.value, frozenRows.value);
      rowIndex++
    ) {
      if (isHiddenRow.value?.(rowIndex)) continue;
      const x1 = 0;
      const x2 = getColumnOffset(Math.min(columnStopIndex.value + 1, columnCount.value));
      const y1 = getRowOffset(Math.min(rowIndex + 1, rowCount.value));
      const y2 = y1;
      gridLinesFrozenRowBuffer.push(
        {
          points: [x1, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetY: -0.5,
          key: itemKey({ rowIndex: rowIndex, columnIndex: y1 }),
        }
      );
      gridLinesFrozenIntersectionBuffer.push(
        {
          points: [x1, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetY: -0.5,
          key: itemKey({ rowIndex: rowIndex, columnIndex: y1 }),
        }
      );
    }

    for (
      let columnIndex = 0;
      columnIndex < Math.min(columnStopIndex.value, frozenColumns.value);
      columnIndex++
    ) {
      const x1 = getColumnOffset(Math.min(columnIndex + 1, columnCount.value));
      const x2 = x1;
      const y1 = 0;
      const y2 = getRowOffset(Math.min(rowStopIndex.value + 1, rowCount.value));
      gridLinesFrozenColumnBuffer.push(
        {
          points: [x1, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetX: -0.5,
          key: itemKey({ rowIndex: x1, columnIndex: columnIndex }),
        }
      );
      gridLinesFrozenIntersectionBuffer.push(
        {
          points: [x1, y1, x2, y2],
          stroke: gridLineColor.value,
          strokeWidth: gridLineWidth.value,
          offsetX: -0.5,
          key: itemKey({ rowIndex: x1, columnIndex: columnIndex }),
        }
      );
    }
  }

  // ==== cells ==== //
  const mergedCellRenderMap = new Set();
  if (columnCount.value > 0 && rowCount.value) {
    for (let rowIndex = rowStartIndex.value; rowIndex <= rowStopIndex.value; rowIndex++) {
      /* Skip frozen rows */
      if (rowIndex < frozenRows.value || isHiddenRow.value?.(rowIndex)) {
        continue;
      }
      /**
       * Do any pre-processing of the row before being renderered.
       * Useful for `react-table` to call `prepareRow(row)`
       */
      onBeforeRenderRow.value?.(rowIndex);

      for (
        let columnIndex = columnStartIndex.value;
        columnIndex <= columnStopIndex.value;
        columnIndex++
      ) {
        /**
         * Skip frozen columns
         * Skip merged cells that are out of bounds
         */
        if (columnIndex < frozenColumns.value) {
          continue;
        }

        const isMerged = isMergedCell({ rowIndex, columnIndex: columnIndex });
        const bounds = getCellBounds({ rowIndex, columnIndex: columnIndex });
        const actualRowIndex = isMerged ? bounds.top : rowIndex;
        const actualColumnIndex = isMerged ? bounds.left : columnIndex;
        const actualBottom = Math.max(rowIndex, bounds.bottom);
        const actualRight = Math.max(columnIndex, bounds.right);
        if (!isMerged && isHiddenCell.value?.(actualRowIndex, actualColumnIndex)) {
          continue;
        }
        if (isMerged) {
          const cellId = cellIdentifier(bounds.top, bounds.left);
          if (mergedCellRenderMap.has(cellId)) {
            continue;
          }
          mergedCellRenderMap.add(cellId);
        }

        const y = getRowOffset(actualRowIndex);
        const height =
          getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

        const x = getColumnOffset(actualColumnIndex);

        const width =
          getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

        cellsBuffer.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
            isMergedCell: isMerged,
            key: itemKey({
              rowIndex: actualRowIndex,
              columnIndex: actualColumnIndex,
            }),
          }
        );

        if (enableCellOverlay.value) {
          cellOverlaysBuffer.push(
            {
              x,
              y,
              width,
              height,
              rowIndex: actualRowIndex,
              columnIndex: actualColumnIndex,
              isMergedCell: isMerged,
              key: itemKey({
                rowIndex: actualRowIndex,
                columnIndex: actualColumnIndex,
              }),
            }
          );
        }
      }
    }
  }
  for (const { rowIndex, columnIndex, toColumnIndex } of cellAreas.value) {
    /* Skip merged cells, Merged  cell cannot be extended */
    if (
      rowIndex < frozenRows.value ||
      columnIndex < frozenColumns.value ||
      isMergedCell({ rowIndex, columnIndex: columnIndex }) ||
      isHiddenCell.value?.(rowIndex, columnIndex)
    ) {
      continue;
    }
    const x = getColumnOffset(columnIndex);
    const y = getRowOffset(rowIndex);
    const height = getRowHeight(rowIndex);
    const { x: offsetX = 0 } = getCellOffsetFromCoords({
      rowIndex,
      columnIndex: toColumnIndex + 1,
    });
    rangesBuffer.push(
      {
        x,
        y,
        width: offsetX - x,
        height,
        rowIndex,
        columnIndex,
        key: `range:${itemKey({ rowIndex, columnIndex })}`,
      }
    );
  }

  // ==== frozen rows ==== //
  for (
    let rowIndex = 0;
    rowIndex < Math.min(rowStopIndex.value, frozenRows.value);
    rowIndex++
  ) {
    if (isHiddenRow.value?.(rowIndex)) continue;
    /**
     * Do any pre-processing of the row before being renderered.
     * Useful for `react-table` to call `prepareRow(row)`
     */
    onBeforeRenderRow.value?.(rowIndex);

    for (
      let columnIndex = columnStartIndex.value;
      columnIndex <= columnStopIndex.value;
      columnIndex++
    ) {
      /* Skip merged cells columns */
      if (columnIndex < frozenColumns.value) {
        continue;
      }

      const isMerged = isMergedCell({ rowIndex, columnIndex });
      const bounds = getCellBounds({ rowIndex, columnIndex });
      const actualRowIndex = isMerged ? bounds.top : rowIndex;
      const actualColumnIndex = isMerged ? bounds.left : columnIndex;
      const actualBottom = Math.max(rowIndex, bounds.bottom);
      const actualRight = Math.max(columnIndex, bounds.right);
      if (!isMerged && isHiddenCell.value?.(actualRowIndex, actualColumnIndex)) {
        continue;
      }
      if (isMerged) {
        const cellId = cellIdentifier(bounds.top, bounds.left);
        if (mergedCellRenderMap.has(cellId)) {
          continue;
        }
        mergedCellRenderMap.add(cellId);
      }

      const y = getRowOffset(actualRowIndex);
      const height =
        getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

      const x = getColumnOffset(actualColumnIndex);

      const width =
        getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

      frozenRowCellsBuffer.push(
        {
          x,
          y,
          width,
          height,
          rowIndex: actualRowIndex,
          columnIndex: actualColumnIndex,
          isMergedCell: isMerged,
          key: itemKey({
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
          }),
        }
      );

      if (enableCellOverlay.value) {
        frozenRowCellOverlaysBuffer.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
            isMergedCell: isMerged,
            key: itemKey({
              rowIndex: actualRowIndex,
              columnIndex: actualColumnIndex,
            }),
          }
        );
      }
    }
  }

  // ==== frozen columns ==== //
  for (let rowIndex = rowStartIndex.value; rowIndex <= rowStopIndex.value; rowIndex++) {
    if (rowIndex < frozenRows.value || isHiddenRow.value?.(rowIndex)) {
      continue;
    }
    /**
     * Do any pre-processing of the row before being renderered.
     * Useful for `react-table` to call `prepareRow(row)`
     */
    onBeforeRenderRow.value?.(rowIndex);

    for (
      let columnIndex = 0;
      columnIndex < Math.min(columnStopIndex.value, frozenColumns.value);
      columnIndex++
    ) {
      const isMerged = isMergedCell({ rowIndex, columnIndex });
      const bounds = getCellBounds({ rowIndex, columnIndex });
      const actualRowIndex = isMerged ? bounds.top : rowIndex;
      const actualColumnIndex = isMerged ? bounds.left : columnIndex;
      const actualBottom = Math.max(rowIndex, bounds.bottom);
      const actualRight = Math.max(columnIndex, bounds.right);
      if (!isMerged && isHiddenCell.value?.(actualRowIndex, actualColumnIndex)) {
        continue;
      }
      if (isMerged) {
        const cellId = cellIdentifier(bounds.top, bounds.left);
        if (mergedCellRenderMap.has(cellId)) {
          continue;
        }
        mergedCellRenderMap.add(cellId);
      }

      const y = getRowOffset(actualRowIndex);
      const height =
        getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

      const x = getColumnOffset(actualColumnIndex);

      const width =
        getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

      frozenColumnCellsBuffer.push(
        {
          x,
          y,
          width,
          height,
          rowIndex: actualRowIndex,
          columnIndex: actualColumnIndex,
          isMergedCell: isMerged,
          key: itemKey({
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
          }),
        }
      );

      if (enableCellOverlay.value) {
        frozenColumnCellOverlaysBuffer.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
            isMergedCell: isMerged,
            key: itemKey({
              rowIndex: actualRowIndex,
              columnIndex: actualColumnIndex,
            }),
          }
        );
      }
    }
  }

  // ==== frozen intersection cells ==== //
  for (
    let rowIndex = 0;
    rowIndex < Math.min(rowStopIndex.value, frozenRows.value);
    rowIndex++
  ) {
    if (isHiddenRow.value?.(rowIndex)) continue;
    for (
      let columnIndex = 0;
      columnIndex < Math.min(columnStopIndex.value, frozenColumns.value);
      columnIndex++
    ) {
      const isMerged = isMergedCell({ rowIndex, columnIndex });
      const bounds = getCellBounds({ rowIndex, columnIndex });
      const actualRowIndex = isMerged ? bounds.top : rowIndex;
      const actualColumnIndex = isMerged ? bounds.left : columnIndex;
      const actualBottom = Math.max(rowIndex, bounds.bottom);
      const actualRight = Math.max(columnIndex, bounds.right);
      if (!isMerged && isHiddenCell.value?.(actualRowIndex, actualColumnIndex)) {
        continue;
      }
      if (isMerged) {
        const cellId = cellIdentifier(bounds.top, bounds.left);
        if (mergedCellRenderMap.has(cellId)) {
          continue;
        }
        mergedCellRenderMap.add(cellId);
      }

      const y = getRowOffset(actualRowIndex);
      const height =
        getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

      const x = getColumnOffset(actualColumnIndex);

      const width =
        getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

      frozenIntersectionCellsBuffer.push(
        {
          x,
          y,
          width,
          height,
          rowIndex: actualRowIndex,
          columnIndex: actualColumnIndex,
          isMergedCell: isMerged,
          key: itemKey({
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
          }),
        }
      );

      if (enableCellOverlay.value) {
        frozenIntersectionCellOverlaysBuffer.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
            isMergedCell: isMerged,
            key: itemKey({
              rowIndex: actualRowIndex,
              columnIndex: actualColumnIndex,
            }),
          }
        );
      }
    }
  }

  // ==== active cell ==== //
  if (activeCell.value) {
    const bounds = getCellBounds(activeCell.value);
    const { top, left, right, bottom } = bounds;
    const actualBottom = Math.min(rowStopIndex.value, bottom);
    const actualRight = Math.min(columnStopIndex.value, right);
    const isInFrozenColumn = left < frozenColumns.value;
    const isInFrozenRow = top < frozenRows.value;
    const isInFrozenIntersection = isInFrozenRow && isInFrozenColumn;
    const y = getRowOffset(top);
    const height =
      getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

    const x = getColumnOffset(left);

    const width =
      getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

    const cell = {
      stroke: selectionBorderColor.value,
      strokeWidth: activeCellStrokeWidth.value,
      fill: "transparent",
      x: x,
      y: y,
      width: width,
      height: height,
      type: "activeCell" as const,
      key: 0,
      activeCell: activeCell.value,
      isDragging: isDraggingSelection.value,
      /* Active cell is draggable only there are no other selections */
      draggable: enableSelectionDrag.value && !selections.value.length,
    };

    if (isInFrozenIntersection) {
      activeCellSelectionFrozenIntersectionBuffer = cell;
    } else if (isInFrozenRow) {
      activeCellSelectionFrozenRowBuffer = cell;
    } else if (isInFrozenColumn) {
      activeCellSelectionFrozenColumnBuffer = cell;
    } else {
      activeCellSelectionBuffer = cell;
    }

    fillHandleDimensionBuffer = {
      x: x + width,
      y: y + height,
    };
  }

  /**
   * Convert selections to area
   * Removed useMemo as changes to lastMeasureRowIndex, lastMeasuredColumnIndex,
   * does not trigger useMemo
   * Dependencies : [selections, rowStopIndex, columnStopIndex, instanceProps]
   */
  for (let i = 0; i < selections.value.length; i++) {
    const selection = selections.value[i];
    const { bounds, inProgress, style } = selection;
    const { top, left, right, bottom } = bounds;
    const selectionBounds = { x: 0, y: 0, width: 0, height: 0 };
    const actualBottom = Math.min(rowStopIndex.value, bottom);
    const actualRight = Math.min(columnStopIndex.value, right);
    const isLeftBoundFrozen = left < frozenColumns.value;
    const isTopBoundFrozen = top < frozenRows.value;
    const isIntersectionFrozen = top < frozenRows.value && left < frozenColumns.value;
    const isLast = i === selections.value.length - 1;
    const styles = {
      stroke: inProgress ? selectionBackgroundColor.value : selectionBorderColor.value,
      fill: selectionBackgroundColor.value,
      strokeWidth: isDraggingSelection.value ? 0 : 1,
      isDragging: isDraggingSelection.value,
      draggable: inProgress ? false : enableSelectionDrag.value,
      ...style,
    };
    /**
     * If selection is in progress,
     * use this variable to hide fill handle
     */
    if (inProgress) {
      isSelectionInProgressBuffer = true;
    }
    selectionBounds.y = getRowOffset(top);
    selectionBounds.height =
      getRowOffset(actualBottom) -
      selectionBounds.y +
      getRowHeight(actualBottom);

    selectionBounds.x = getColumnOffset(left);

    selectionBounds.width =
      getColumnOffset(actualRight) -
      selectionBounds.x +
      getColumnWidth(actualRight);

    if (isLeftBoundFrozen) {
      const frozenColumnSelectionWidth =
        getColumnOffset(Math.min(right + 1, frozenColumns.value)) -
        getColumnOffset(left);
      selectionAreasFrozenColumnsBuffer.push(
        {
          ...styles,
          type: "selection",
          key: i,
          x: selectionBounds.x,
          y: selectionBounds.y,
          width: frozenColumnSelectionWidth,
          height: selectionBounds.height,
          strokeRightWidth:
            frozenColumnSelectionWidth === selectionBounds.width &&
            !isDraggingSelection.value
              ? selectionStrokeWidth.value
              : 0,
          selection: selection,
          inProgress: inProgress,
        }
      )
    }

    if (isTopBoundFrozen) {
      const frozenRowSelectionHeight =
        getRowOffset(Math.min(bottom + 1, frozenRows.value)) - getRowOffset(top);
      selectionAreasFrozenRowsBuffer.push(
        {
          ...styles,
          type: "selection",
          key: i,
          x: selectionBounds.x,
          y: selectionBounds.y,
          width: selectionBounds.width,
          height: frozenRowSelectionHeight,
          strokeBottomWidth:
            frozenRowSelectionHeight === selectionBounds.height &&
            !isDraggingSelection.value
              ? selectionStrokeWidth.value
              : 0,
          selection: selection,
          inProgress: inProgress,
        }
      )
    }

    if (isIntersectionFrozen) {
      const frozenIntersectionSelectionHeight =
        getRowOffset(Math.min(bottom + 1, frozenRows.value)) - getRowOffset(top);

      const frozenIntersectionSelectionWidth =
        getColumnOffset(Math.min(right + 1, frozenColumns.value)) -
        getColumnOffset(left);

      selectionAreasIntersectionBuffer.push(
        {
          ...styles,
          type: "selection",
          key: i,
          x: selectionBounds.x,
          y: selectionBounds.y,
          width: frozenIntersectionSelectionWidth,
          height: frozenIntersectionSelectionHeight,
          strokeBottomWidth:
            frozenIntersectionSelectionHeight === selectionBounds.height &&
            !isDraggingSelection.value
              ? selectionStrokeWidth.value
              : 0,
          strokeRightWidth:
            frozenIntersectionSelectionWidth === selectionBounds.width &&
            !isDraggingSelection.value
              ? selectionStrokeWidth.value
              : 0,
          selection: selection,
          inProgress: inProgress,
        }
      )
    }
    selectionAreasBuffer.push(
      {
        ...styles,
        type: "selection",
        key: i,
        x: selectionBounds.x,
        y: selectionBounds.y,
        width: selectionBounds.width,
        height: selectionBounds.height,
        selection,
        inProgress,
      }
    );

    if (isLast) {
      fillHandleDimensionBuffer = {
        x: selectionBounds.x + selectionBounds.width,
        y: selectionBounds.y + selectionBounds.height,
      };
    }
  }

  // ==== fillselection ==== //
  if (fillSelection.value) {
    const { bounds } = fillSelection.value;
    const { top, left, right, bottom } = bounds;
    const actualBottom = Math.min(rowStopIndex.value, bottom);
    const actualRight = Math.min(columnStopIndex.value, right);
    const x = getColumnOffset(left);
    const y = getRowOffset(top);
    const height =
      getRowOffset(actualBottom) - y + getRowHeight(actualBottom);
    const width =
      getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

    fillSelectionsBuffer.push({
      type: "fill",
      x,
      y,
      width,
      height,
      key: -1,
      stroke: "gray",
      strokeStyle: "dashed",
    })
  }

  for (let i = 0; i < borderStyles.value.length; i++) {
    const { bounds, style, title, ...rest } = borderStyles.value[i];
    const { top, right, bottom, left } = bounds;
    const isLeftBoundFrozen = left < frozenColumns.value;
    const isTopBoundFrozen = top < frozenRows.value;
    const isIntersectionFrozen = top < frozenRows.value && left < frozenColumns.value;
    const x = getColumnOffset(left);
    const y = getRowOffset(top);
    const width = getColumnOffset(Math.min(columnCount.value, right + 1)) - x;
    const height = getRowOffset(Math.min(rowCount.value, bottom + 1)) - y;

    borderStyleCellsBuffer.push(
      {
        ...rest,
        ...style,
        x,
        y,
        key: i,
        width,
        height,
        type: "border",
      }
    );

    if (isLeftBoundFrozen) {
      const frozenColumnSelectionWidth =
        getColumnOffset(Math.min(right + 1, frozenColumns.value)) -
        getColumnOffset(left);
      borderStyleCellsFrozenColumnsBuffer.push(
        {
          ...rest,
          ...style,
          type: "border",
          x,
          y,
          key: i,
          width: frozenColumnSelectionWidth,
          height,
          strokeRightWidth:
            frozenColumnSelectionWidth === width
              ? style?.strokeRightWidth || style?.strokeWidth
              : 0,
        }
      );
    }

    if (isTopBoundFrozen) {
      const frozenRowSelectionHeight =
        getRowOffset(Math.min(bottom + 1, frozenRows.value)) - getRowOffset(top);

      borderStyleCellsFrozenRowsBuffer.push(
        {
          ...rest,
          ...style,
          type: "border",
          x,
          y,
          key: i,
          width,
          height: frozenRowSelectionHeight,
          strokeBottomWidth:
            frozenRowSelectionHeight === height
              ? style?.strokeBottomWidth || style?.strokeWidth
              : 0,
        }
      );
    }

    if (isIntersectionFrozen) {
      const frozenIntersectionSelectionHeight =
        getRowOffset(Math.min(bottom + 1, frozenRows.value)) - getRowOffset(top);

      const frozenIntersectionSelectionWidth =
        getColumnOffset(Math.min(right + 1, frozenColumns.value)) -
        getColumnOffset(left);

      borderStyleCellsIntersectionBuffer.push(
        {
          ...rest,
          ...style,
          type: "border",
          x,
          y,
          key: i,
          width: frozenIntersectionSelectionWidth,
          height: frozenIntersectionSelectionHeight,
          strokeBottomWidth:
            frozenIntersectionSelectionHeight === height
              ? selectionStrokeWidth.value
              : 0,
          strokeRightWidth:
            frozenIntersectionSelectionWidth === width
              ? selectionStrokeWidth.value
              : 0,
        }
      );
    }
  }

  // === set state === //
  state.value = {
    gridLines: gridLinesBuffer,
    gridLinesFrozenRow: gridLinesFrozenRowBuffer,
    gridLinesFrozenColumn: gridLinesFrozenColumnBuffer,
    gridLinesFrozenIntersection: gridLinesFrozenIntersectionBuffer,
    cells: cellsBuffer,
    ranges: rangesBuffer,
    cellOverlays: cellOverlaysBuffer,
    frozenRowCells: frozenRowCellsBuffer,
    frozenRowCellOverlays: frozenRowCellOverlaysBuffer,
    frozenColumnCells: frozenColumnCellsBuffer,
    frozenColumnCellOverlays: frozenColumnCellOverlaysBuffer,
    frozenIntersectionCells: frozenIntersectionCellsBuffer,
    frozenIntersectionCellOverlays: frozenIntersectionCellOverlaysBuffer,
    fillHandleDimension: fillHandleDimensionBuffer,
    activeCellSelection: activeCellSelectionBuffer,
    activeCellSelectionFrozenColumn: activeCellSelectionFrozenColumnBuffer,
    activeCellSelectionFrozenRow: activeCellSelectionFrozenRowBuffer,
    activeCellSelectionFrozenIntersection: activeCellSelectionFrozenIntersectionBuffer,
    isSelectionInProgress: isSelectionInProgressBuffer,
    selectionAreas: selectionAreasBuffer,
    selectionAreasFrozenColumns: selectionAreasFrozenColumnsBuffer,
    selectionAreasFrozenRows: selectionAreasFrozenRowsBuffer,
    selectionAreasIntersection: selectionAreasIntersectionBuffer,
    fillSelections: fillSelectionsBuffer,
    borderStyleCells: borderStyleCellsBuffer,
    borderStyleCellsFrozenColumns: borderStyleCellsFrozenColumnsBuffer,
    borderStyleCellsFrozenRows: borderStyleCellsFrozenRowsBuffer,
    borderStyleCellsIntersection: borderStyleCellsIntersectionBuffer
  }
}
// ================ //

// ===== watchers ===== //
/**
 * onScroll callback
 */
watch([scrollTop, scrollLeft], () => {
  onScroll.value?.({ scrollTop: scrollTop.value, scrollLeft: scrollLeft.value });
});
/**
 * Update snap properties if its active
 * We need this because we are binding `onwheel` event to document
 * So props go stale
 */
watch(
  [
    snap,
    visibleRowStartIndex,
    rowCount,
    frozenRows,
    visibleColumnStartIndex,
    columnCount,
    frozenColumns,
    isHiddenRow,
    isHiddenColumn,
  ],
  () => {
    if (snap.value) {
      scrollSnapRefs.value = {
        visibleRowStartIndex: visibleRowStartIndex.value,
        rowCount: rowCount.value,
        frozenRows: frozenRows.value,
        visibleColumnStartIndex: visibleColumnStartIndex.value,
        columnCount: columnCount.value,
        frozenColumns: frozenColumns.value,
        isHiddenRow: isHiddenRow.value,
        isHiddenColumn: isHiddenColumn.value,
      };
    }
  }
);
/**
 * Register snap throttlers
 */
watch(snap, () => {
  if (snap.value) {
    snapToRowThrottler.value = throttle(
      snapToRowFn,
      scrollThrottleTimeout.value
    );
    snapToColumnThrottler.value = throttle(
      snapToColumnFn,
      scrollThrottleTimeout.value
    );
  }
});
 /* Always if the viewport changes */
watch([rowStopIndex, columnStopIndex, scale], () => {
  if (instanceProps.value.recalcColumnIndices.length) {
    instanceProps.value.recalcColumnIndices.length = 0;
  }
  if (instanceProps.value.recalcRowIndices.length) {
    instanceProps.value.recalcRowIndices.length = 0;
  }
});
/* Callback when visible rows or columns have changed */
watch([
  rowStartIndex,
  rowStopIndex,
  columnStartIndex,
  columnStopIndex,
  visibleRowStartIndex,
  visibleRowStopIndex,
  visibleColumnStartIndex,
  visibleColumnStopIndex,
], () => {
  onViewChange.value?.({
    rowStartIndex: rowStartIndex.value,
    rowStopIndex: rowStopIndex.value,
    columnStartIndex: columnStartIndex.value,
    columnStopIndex: columnStopIndex.value,
    visibleRowStartIndex: visibleRowStartIndex.value,
    visibleRowStopIndex: visibleRowStopIndex.value,
    visibleColumnStartIndex: visibleColumnStartIndex.value,
    visibleColumnStopIndex: visibleColumnStopIndex.value,
  });
});
// ================ //

// ===== lifecycle ===== //
onMounted(() => {
  scrollContainerRef.value?.addEventListener("wheel", handleWheel, {
    passive: false,
  });
  renderGrid()
});
onUnmounted(() => {
  scrollContainerRef.value?.removeEventListener("wheel", handleWheel);
});
// ================ //
</script>

<style scoped></style>
