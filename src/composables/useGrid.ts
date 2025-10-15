import { ref, Ref } from "vue";
import { AreaProps } from "@/types";
import { Cell } from "@/types/cell";
import { Text } from "@/types/text";
import { Rect } from "@/types/rect";
import { Layer } from "konva/lib/Layer";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";
import { Stage } from "konva/lib/Stage";
import Konva from "konva";
import { cellRenderer } from "@/components/cell/Cell";

export const useGrid = ({
  stageRef,
  rowsCount,
  getRowHeight,
  estimatedRowHeight,
  columnsCount,
  getColumnWidth,
  estimatedColumnWidth,
  isHiddenRow,
  isHiddenCell,
  rowsFrozen,
  columnsFrozen,
  onBeforeRenderRow,
  containerHeight,
  containerWidth,
  scrollTop,
  scrollLeft,
  isScrolling,
  getCellRenderer,
  getCellText,
  getCellFormatting,
  getCellClickHandler,
  getCellDoubleClickHandler,
  getCellRightClickHandler,
  getCellHoverHandler
}: {
  gridRef: Ref<HTMLDivElement>;
  stageRef: Ref<HTMLDivElement>;
  rowsCount: number;
  rowsFrozen: number;
  getRowHeight: (rowIndex: number) => number;
  estimatedRowHeight: number;
  columnsCount: number;
  columnsFrozen: number;
  getColumnWidth: (columnIndex: number) => number;
  estimatedColumnWidth: number;
  isHiddenRow: (rowIndex: number) => boolean;
  isHiddenColumn: (columnIndex: number) => boolean;
  isHiddenCell: (rowIndex: number, columnIndex: number) => boolean;
  getCellRenderer: (rowIndex: number, columnIndex: number) => (props: Cell) => Layer | Shape | Group;
  getCellText: (rowIndex: number, columnIndex: number) => string;
  getCellFormatting: (rowIndex: number, columnIndex: number) => Omit<Text, "text"> & Omit<Rect, "x" | "y" | "width" | "height">;
  getCellClickHandler: (rowIndex: number, columnIndex: number) => (cell: Cell) => void;
  getCellDoubleClickHandler?: (rowIndex: number, columnIndex: number) => (cell: Cell) => void;
  getCellRightClickHandler?: (rowIndex: number, columnIndex: number) => (cell: Cell) => void;
  getCellHoverHandler?: (rowIndex: number, columnIndex: number) => (cell: Cell) => void;
  onBeforeRenderRow?: (rowIndex: number) => void;
  containerHeight: number;
  containerWidth: number;
  scrollTop: Ref<number>;
  scrollLeft: Ref<number>;
  isScrolling: Ref<boolean>;
}) => {
  // === Grid Konva === //
  let stage: Stage | undefined;
  // Layers
  let scrollLayer: Layer | undefined;
  let frozenRowsLayer: Layer | undefined;
  let frozenColsLayer: Layer | undefined;
  let intersectionLayer: Layer | undefined;
  // ================ //


  // ==== Grid Data ==== //
  let rowSizeCache: { size: number, offset: number }[] = [];
  const estimatedTotalWidth = ref(0);
  let columnSizeCache: { size: number, offset: number }[] = [];
  const estimatedTotalHeight = ref(0);
  let renderRequested = false;
  // Track last visible index ranges for fast pan-path
  let lastRowStart = -1;
  let lastRowStop = -1;
  let lastColStart = -1;
  let lastColStop = -1;

  // Pools per layer
  type Pool = { map: Map<string, Group>, free: Group[] };
  const poolScroll: Pool = { map: new Map(), free: [] };
  const poolFrozenRows: Pool = { map: new Map(), free: [] };
  const poolFrozenCols: Pool = { map: new Map(), free: [] };
  const poolIntersection: Pool = { map: new Map(), free: [] };
  // ================ //

  // ==== Methods ==== //
  const getEstimatedTotalHeight = () => {
    let totalSizeOfMeasuredRows = 0;
    let lastMeasuredRowIndex = rowSizeCache.length - 1;
  
    if (lastMeasuredRowIndex >= rowsCount) {
      lastMeasuredRowIndex = rowsCount - 1;
    }
  
    if (lastMeasuredRowIndex >= 0) {
      const lastMeasuredRowSize = rowSizeCache[lastMeasuredRowIndex];
      totalSizeOfMeasuredRows = lastMeasuredRowSize.offset + lastMeasuredRowSize.size;
    }
  
    const numUnmeasuredItems = rowsCount - lastMeasuredRowIndex - 1;
    const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedRowHeight;
  
    return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
  };
  const getEstimatedTotalWidth = () => {
    let totalSizeOfMeasuredColumns = 0;
    let lastMeasuredColumnIndex = columnSizeCache.length - 1;

    if (lastMeasuredColumnIndex >= columnsCount) {
      lastMeasuredColumnIndex = columnsCount - 1;
    }
  
    if (lastMeasuredColumnIndex >= 0) {
      const lastMeasuredColumnSize = columnSizeCache[lastMeasuredColumnIndex];
      totalSizeOfMeasuredColumns = lastMeasuredColumnSize.offset + lastMeasuredColumnSize.size;
    }
  
    const numUnmeasuredItems = columnsCount - lastMeasuredColumnIndex - 1;
    const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedColumnWidth;
  
    return totalSizeOfUnmeasuredItems + totalSizeOfMeasuredColumns;
  };
  const getRowSizing = (rowIndex: number) => {
    const lastMeasuredIndex = rowSizeCache.length - 1;
    
    if (rowIndex in rowSizeCache) {
      return rowSizeCache[rowIndex];
    }
    
    if (rowIndex <= lastMeasuredIndex) {
      return rowSizeCache[rowIndex];
    }
    
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const lastItemMetadata = rowSizeCache[lastMeasuredIndex];
      offset = lastItemMetadata.offset + lastItemMetadata.size;
    }
    
    for (let i = lastMeasuredIndex + 1; i <= rowIndex; i++) {
      const size = getRowHeight(i);

      rowSizeCache[i] = {
        offset,
        size,
      };

      offset += size;
    }

    return rowSizeCache[rowIndex];
  }
  const getColumnSizing = (columnIndex: number) => {
    const lastMeasuredIndex = columnSizeCache.length - 1;
    
    if (columnIndex in columnSizeCache) {
      return columnSizeCache[columnIndex];
    }
    
    if (columnIndex <= lastMeasuredIndex) {
      return columnSizeCache[columnIndex];
    }
    
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const lastItemMetadata = columnSizeCache[lastMeasuredIndex];
      offset = lastItemMetadata.offset + lastItemMetadata.size;
    }
    
    for (let i = lastMeasuredIndex + 1; i <= columnIndex; i++) {
      const size = getColumnWidth(i);

      columnSizeCache[i] = {
        offset,
        size,
      };

      offset += size;
    }

    return columnSizeCache[columnIndex];
  }
  const getFrozenColumnWidth = () => getColumnSizing(columnsFrozen).offset;
  const getFrozenRowHeight = () => getRowSizing(rowsFrozen).offset;
  const findNearestRowBinarySearch = (high: number, low: number, offset: number) => {
    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2);
      const currentOffset = getRowSizing(middle).offset;
  
      if (currentOffset === offset) {
        return middle;
      } else if (currentOffset < offset) {
        low = middle + 1;
      } else if (currentOffset > offset) {
        high = middle - 1;
      }
    }
  
    if (low > 0) {
      return low - 1;
    } else {
      return 0;
    }
  }
  const findNearestRowExponentialSearch = (index: number, offset: number) => {
    let interval = 1;

    while (
      index < rowsCount &&
      getRowSizing(index).offset < offset
    ) {
      index += interval;
      interval *= 2;
    }

    return findNearestRowBinarySearch(
      Math.min(index, rowsCount - 1),
      Math.floor(index / 2),
      offset,
    );
  }
  const findNearestColumnBinarySearch = (high: number, low: number, offset: number) => {
    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2);
      const currentOffset = getColumnSizing(middle).offset;
  
      if (currentOffset === offset) {
        return middle;
      } else if (currentOffset < offset) {
        low = middle + 1;
      } else if (currentOffset > offset) {
        high = middle - 1;
      }
    }
  
    if (low > 0) {
      return low - 1;
    } else {
      return 0;
    }
  }
  const findNearestColumnExponentialSearch = (index: number, offset: number) => {
    let interval = 1;

    while (
      index < rowsCount &&
      getColumnSizing(index).offset < offset
    ) {
      index += interval;
      interval *= 2;
    }

    return findNearestColumnBinarySearch(
      Math.min(index, rowsCount - 1),
      Math.floor(index / 2),
      offset,
    );
  }
  const findNearestRow = (offset: number) => {
    let lastMeasuredRowIndex = rowSizeCache.length - 1;

    const lastMeasuredRowOffset =
      lastMeasuredRowIndex > 0 ? rowSizeCache[lastMeasuredRowIndex].offset : 0;

    if (lastMeasuredRowOffset >= offset) {
      return findNearestRowBinarySearch(
        lastMeasuredRowIndex,
        0,
        offset,
      );
    } else {
      return findNearestRowExponentialSearch(
        Math.max(0, lastMeasuredRowIndex),
        offset,
      );
    }
  }
  const findNearestColumn = (offset: number) => {
    let lastMeasuredColumnIndex = columnSizeCache.length - 1;

    const lastMeasuredColumnOffset =
      lastMeasuredColumnIndex > 0 ? columnSizeCache[lastMeasuredColumnIndex].offset : 0;
    
    if (lastMeasuredColumnOffset >= offset) {
      return findNearestColumnBinarySearch(
        lastMeasuredColumnIndex,
        0,
        offset,
      );
    } else {
      return findNearestColumnExponentialSearch(
        Math.max(0, lastMeasuredColumnIndex),
        offset,
      );
    }
  }
  const getRowStartIndex = (offset) => {
    return findNearestRow(offset);
  }
  const getRowStopIndex = (rowStartIndex: number) => {
    const itemMetadata = getRowSizing(rowStartIndex);
    const maxOffset = scrollTop.value + containerHeight;
  
    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = rowStartIndex;
  
    while (stopIndex < rowsCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getRowSizing(stopIndex).size;
    }
  
    return stopIndex;
  }
  const getColumnStartIndex = (offset: number) => {
    return findNearestColumn(offset);
  }
  const getColumnStopIndex = (columnStartIndex: number) => {
    const itemMetadata = getColumnSizing(columnStartIndex);
    const maxOffset = scrollLeft.value + containerWidth;
  
    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = columnStartIndex;
  
    while (stopIndex < columnsCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getColumnSizing(stopIndex).size;
    }
  
    return stopIndex;
  }
  const rowStartIndex = () => {
    const startIndex = getRowStartIndex(scrollTop.value + getFrozenRowHeight());
    /* 
      Overscan by one item in each direction so that tab/focus works.
      If there isn't at least one extra item, tab loops back around.
    */
    const overscanBackward = isScrolling.value ? 0 : 1;

    return Math.max(0, startIndex - overscanBackward)
  };
  const rowStopIndex = () => {
    /* 
      Overscan by one item in each direction so that tab/focus works.
      If there isn't at least one extra item, tab loops back around.
    */
    const overscanForward = isScrolling.value ? 0 : 1;

    return Math.max(0, Math.min(rowsCount - 1, getRowStopIndex(rowStartIndex()) + overscanForward));
  };
  const columnStartIndex = () => {
    const startIndex = getColumnStartIndex(scrollLeft.value + getFrozenColumnWidth());
    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanBackward = isScrolling.value ? 0 : 1;
    return Math.max(0, startIndex - overscanBackward);
  };
  const columnStopIndex = () => {
    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanForward = isScrolling.value ? 0 : 1;
    return Math.max(0, Math.min(columnsCount - 1, getColumnStopIndex(columnStartIndex()) + overscanForward));
  }
  const getCellBounds = (
    rowIndex, columnIndex
  ): AreaProps => {
    return {
      top: rowIndex,
      left: columnIndex,
      right: columnIndex,
      bottom: rowIndex,
    } as AreaProps;
  };

  const calculateEstimatedTotalSizing = () => {
    estimatedTotalWidth.value = getEstimatedTotalWidth();
    estimatedTotalHeight.value = getEstimatedTotalHeight();
  }

  const createCellGroup = (cell: Cell): Group => {
    const clickHandler = getCellClickHandler?.(cell.rowIndex, cell.columnIndex);
    const doubleClickHandler = getCellDoubleClickHandler?.(cell.rowIndex, cell.columnIndex);
    const rightClickHandler = getCellRightClickHandler?.(cell.rowIndex, cell.columnIndex);
    const hoverHandler = getCellHoverHandler?.(cell.rowIndex, cell.columnIndex);
    const node = getCellRenderer(cell.rowIndex, cell.columnIndex)(cell);

    let group: Group;
    if (node instanceof Group) {
      group = node;
    } else if (node instanceof Shape) {
      group = new Group({ listening: false, perfectDrawEnabled: false });
      group.add(node);
    } else {
      // Fallback to default renderer to ensure Group
      const fallback = cellRenderer(cell);
      group = fallback as Group;
    }

    if (clickHandler) {
      group.on("click", () => clickHandler(cell));
    }
    if (doubleClickHandler) {
      group.on("dblclick", () => doubleClickHandler(cell));
    }
    if (rightClickHandler) {
      group.on("contextmenu", () => rightClickHandler(cell));
    }
    if (hoverHandler) {
      group.on("mouseover", () => hoverHandler(cell));
    }

    return group;
  }

  // Acquire a node from pool or create new
  const acquireNode = (pool: Pool, create: () => Group, layer: Layer, key: string): Group => {
    let node: Group | undefined = undefined;
    if (pool.free.length > 0) {
      node = pool.free.pop();
    }
    if (!node) {
      node = create();
      layer.add(node);
    } else {
      layer.add(node);
    }
    pool.map.set(key, node);
    return node;
  };

  const releaseStaleNodes = (pool: Pool, nextKeys: Set<string>) => {
    pool.map.forEach((node, key) => {
      if (!nextKeys.has(key)) {
        node.off("click dblclick contextmenu mouseover");
        node.remove();
        pool.map.delete(key);
        pool.free.push(node);
      }
    });
  };

  const updateNodeProps = (node: Group, cell: Cell, interactive: boolean) => {
    const rectNode = node.findOne<Shape>(".rect");
    const textNode = node.findOne<Shape>(".text");
    if (rectNode) {
      rectNode.setAttrs({
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        fill: cell.fill,
        stroke: cell.stroke,
        strokeWidth: cell.strokeWidth,
        borderRadius: cell.borderRadius,
      });
    }
    if (textNode) {
      textNode.setAttrs({
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        text: cell.text,
        fontSize: cell.fontSize,
        fontFamily: cell.fontFamily,
        fontWeight: cell.fontWeight,
        textDecoration: cell.textDecoration,
        textAlign: cell.textAlign,
        verticalAlign: cell.verticalAlign,
        wrap: cell.wrap,
        padding: cell.padding,
        fontStyle: cell.fontStyle,
        fill: cell.color,
      });
    }
    node.listening(interactive);
  };

  const renderCells = () => {
    if (!scrollLayer || !frozenRowsLayer || !frozenColsLayer || !intersectionLayer) return;
    if (columnsCount === 0 || rowsCount === 0) return;

    const rStart = rowStartIndex();
    const rStop = rowStopIndex();
    const cStart = columnStartIndex();
    const cStop = columnStopIndex();

    // ==== Fast path (only pan if ranges unchanged) ==== //
    if (
      lastRowStart === rStart &&
      lastRowStop === rStop &&
      lastColStart === cStart &&
      lastColStop === cStop
    ) {
      scrollLayer.position({ x: -scrollLeft.value, y: -scrollTop.value });
      frozenRowsLayer.position({ x: -scrollLeft.value, y: 0 });
      frozenColsLayer.position({ x: 0, y: -scrollTop.value });
      intersectionLayer.position({ x: 0, y: 0 });
      stage?.batchDraw();
      return;
    }
    // ============================ //

    // ==== Update last ranges ==== //
    lastRowStart = rStart; 
    lastRowStop = rStop; 
    lastColStart = cStart; 
    lastColStop = cStop;
    // ============================ //
    
    // ==== Precompute sizing for visible indices ==== //
    const rowOffsets: number[] = [];
    const rowSizes: number[] = [];
    for (let r = rStart; r <= rStop; r++) {
      const rs = getRowSizing(r);
      rowOffsets[r - rStart] = rs.offset;
      rowSizes[r - rStart] = rs.size;
    }
    const colOffsets: number[] = [];
    const colSizes: number[] = [];
    for (let c = cStart; c <= cStop; c++) {
      const cs = getColumnSizing(c);
      colOffsets[c - cStart] = cs.offset;
      colSizes[c - cStart] = cs.size;
    }
    // ============================ //

    // Position layers
    scrollLayer.position({ x: -scrollLeft.value, y: -scrollTop.value });
    frozenRowsLayer.position({ x: -scrollLeft.value, y: 0 });
    frozenColsLayer.position({ x: 0, y: -scrollTop.value });
    intersectionLayer.position({ x: 0, y: 0 });

    // Build next key sets per layer
    const nextScrollKeys = new Set<string>();
    const nextFrozenRowsKeys = new Set<string>();
    const nextFrozenColsKeys = new Set<string>();
    const nextIntersectionKeys = new Set<string>();
    const interactive = !isScrolling.value;

    // ==== Scrolling area ==== //
    for (let r = rStart; r <= rStop; r++) {
      if (r < rowsFrozen || isHiddenRow?.(r)) continue;
      const rOff = rowOffsets[r - rStart];
      for (let c = cStart; c <= cStop; c++) {
        if (c < columnsFrozen || isHiddenCell?.(r, c)) continue;
        const cOff = colOffsets[c - cStart];

        const bounds = getCellBounds(r, c);
        const actualBottom = Math.max(r, bounds.bottom);
        const actualRight = Math.max(c, bounds.right);
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(c).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(r).offset;

        const formatting = getCellFormatting(r, c);
        const cell: Cell = {
          x: cOff,
          y: rOff,
          width,
          height,
          rowIndex: r,
          columnIndex: c,
          text: getCellText(r, c),
          fill: formatting.fill,
          stroke: formatting.stroke,
          strokeWidth: formatting.strokeWidth,
          borderRadius: formatting.borderRadius,
          fontSize: formatting.fontSize,
          fontFamily: formatting.fontFamily,
          fontWeight: formatting.fontWeight,
          textDecoration: formatting.textDecoration,
          textAlign: formatting.textAlign,
          verticalAlign: formatting.verticalAlign,
          wrap: formatting.wrap,
          padding: formatting.padding,
          fontStyle: formatting.fontStyle,
          color: formatting.color,
          key: `${r}-${c}`,
        } as Cell;

        const key = cell.key as string;
        nextScrollKeys.add(key);
        const existing = poolScroll.map.get(key);
        if (existing) {
          existing.off("click dblclick contextmenu mouseover");
          updateNodeProps(existing, cell, interactive);
          if (interactive) {
            const clickHandler = getCellClickHandler?.(r, c);
            const dblHandler = getCellDoubleClickHandler?.(r, c);
            const ctxHandler = getCellRightClickHandler?.(r, c);
            const hovHandler = getCellHoverHandler?.(r, c);
            if (clickHandler) existing.on("click", () => clickHandler(cell));
            if (dblHandler) existing.on("dblclick", () => dblHandler(cell));
            if (ctxHandler) existing.on("contextmenu", () => ctxHandler(cell));
            if (hovHandler) existing.on("mouseover", () => hovHandler(cell));
          }
        } else {
          const node = acquireNode(poolScroll, () => createCellGroup(cell), scrollLayer, key);
          updateNodeProps(node, cell, interactive);
        }
      }
    }
    // ============================ //

    // ==== Frozen rows ==== //
    for (let r = 0; r < Math.min(rStop, rowsFrozen); r++) {
      if (isHiddenRow?.(r)) continue;
      const rOff = getRowSizing(r).offset;
      for (let c = cStart; c <= cStop; c++) {
        if (c < columnsFrozen || isHiddenCell?.(r, c)) continue;
        const cOff = colOffsets[c - cStart];
        const bounds = getCellBounds(r, c);
        const actualBottom = Math.max(r, bounds.bottom);
        const actualRight = Math.max(c, bounds.right);
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(c).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(r).offset;

        const formatting = getCellFormatting(r, c);
        const cell: Cell = {
          x: cOff,
          y: rOff,
          width,
          height,
          rowIndex: r,
          columnIndex: c,
          text: getCellText(r, c),
          fill: formatting.fill,
          stroke: formatting.stroke,
          strokeWidth: formatting.strokeWidth,
          borderRadius: formatting.borderRadius,
          fontSize: formatting.fontSize,
          fontFamily: formatting.fontFamily,
          fontWeight: formatting.fontWeight,
          textDecoration: formatting.textDecoration,
          textAlign: formatting.textAlign,
          verticalAlign: formatting.verticalAlign,
          wrap: formatting.wrap,
          padding: formatting.padding,
          fontStyle: formatting.fontStyle,
          color: formatting.color,
          key: `${r}-${c}`,
        } as Cell;
        const key = cell.key as string;
        nextFrozenRowsKeys.add(key);
        const existing = poolFrozenRows.map.get(key);
        if (existing) {
          existing.off("click dblclick contextmenu mouseover");
          updateNodeProps(existing, cell, interactive);
        } else {
          const node = acquireNode(poolFrozenRows, () => createCellGroup(cell), frozenRowsLayer, key);
          updateNodeProps(node, cell, interactive);
        }
      }
    }
    // ============================ //

    // ==== Frozen columns ==== //
    for (let r = rStart; r <= rStop; r++) {
      if (r < rowsFrozen || isHiddenRow?.(r)) continue;
      const rOff = rowOffsets[r - rStart];
      for (let c = 0; c < Math.min(cStop, columnsFrozen); c++) {
        if (isHiddenCell?.(r, c)) continue;
        const cOff = getColumnSizing(c).offset;
        const bounds = getCellBounds(r, c);
        const actualBottom = Math.max(r, bounds.bottom);
        const actualRight = Math.max(c, bounds.right);
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(c).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(r).offset;

        const formatting = getCellFormatting(r, c);
        const cell: Cell = {
          x: cOff,
          y: rOff,
          width,
          height,
          rowIndex: r,
          columnIndex: c,
          text: getCellText(r, c),
          fill: formatting.fill,
          stroke: formatting.stroke,
          strokeWidth: formatting.strokeWidth,
          borderRadius: formatting.borderRadius,
          fontSize: formatting.fontSize,
          fontFamily: formatting.fontFamily,
          fontWeight: formatting.fontWeight,
          textDecoration: formatting.textDecoration,
          textAlign: formatting.textAlign,
          verticalAlign: formatting.verticalAlign,
          wrap: formatting.wrap,
          padding: formatting.padding,
          fontStyle: formatting.fontStyle,
          color: formatting.color,
          key: `${r}-${c}`,
        } as Cell;
        const key = cell.key as string;
        nextFrozenColsKeys.add(key);
        const existing = poolFrozenCols.map.get(key);
        if (existing) {
          existing.off("click dblclick contextmenu mouseover");
          updateNodeProps(existing, cell, interactive);
        } else {
          const node = acquireNode(poolFrozenCols, () => createCellGroup(cell), frozenColsLayer, key);
          updateNodeProps(node, cell, interactive);
        }
      }
    }
    // ============================ //

    // ==== Intersection cells ==== //
    for (let r = 0; r < Math.min(rStop, rowsFrozen); r++) {
      if (isHiddenRow?.(r)) continue;
      const rOff = getRowSizing(r).offset;
      for (let c = 0; c < Math.min(cStop, columnsFrozen); c++) {
        if (isHiddenCell?.(r, c)) continue;
        const cOff = getColumnSizing(c).offset;
        const bounds = getCellBounds(r, c);
        const actualBottom = Math.max(r, bounds.bottom);
        const actualRight = Math.max(c, bounds.right);
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(c).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(r).offset;

        const formatting = getCellFormatting(r, c);
        const cell: Cell = {
          x: cOff,
          y: rOff,
          width,
          height,
          rowIndex: r,
          columnIndex: c,
          text: getCellText(r, c),
          fill: formatting.fill,
          stroke: formatting.stroke,
          strokeWidth: formatting.strokeWidth,
          borderRadius: formatting.borderRadius,
          fontSize: formatting.fontSize,
          fontFamily: formatting.fontFamily,
          fontWeight: formatting.fontWeight,
          textDecoration: formatting.textDecoration,
          textAlign: formatting.textAlign,
          verticalAlign: formatting.verticalAlign,
          wrap: formatting.wrap,
          padding: formatting.padding,
          fontStyle: formatting.fontStyle,
          color: formatting.color,
          key: `${r}-${c}`,
        } as Cell;
        const key = cell.key as string;
        nextIntersectionKeys.add(key);
        const existing = poolIntersection.map.get(key);
        if (existing) {
          existing.off("click dblclick contextmenu mouseover");
          updateNodeProps(existing, cell, interactive);
        } else {
          const node = acquireNode(poolIntersection, () => createCellGroup(cell), intersectionLayer, key);
          updateNodeProps(node, cell, interactive);
        }
      }
    }
    // ============================ //

    // ==== Release ==== //
    releaseStaleNodes(poolScroll, nextScrollKeys);
    releaseStaleNodes(poolFrozenRows, nextFrozenRowsKeys);
    releaseStaleNodes(poolFrozenCols, nextFrozenColsKeys);
    releaseStaleNodes(poolIntersection, nextIntersectionKeys);
    // =================== //
  }

  const initGrid = () => {
    stage = new Stage({
      container: stageRef.value,
      width: containerWidth,
      height: containerHeight,
    });
    scrollLayer = new Layer();
    frozenRowsLayer = new Layer();
    frozenColsLayer = new Layer();
    intersectionLayer = new Layer();

    stage.add(scrollLayer);
    stage.add(frozenRowsLayer);
    stage.add(frozenColsLayer);
    stage.add(intersectionLayer);

    renderGrid();
  }

  const renderGrid = () => {
    if (!stage || !scrollLayer || !frozenRowsLayer || !frozenColsLayer || !intersectionLayer) return;

    // ==== Listeners ==== //
    const interactive = !isScrolling.value;
    scrollLayer.listening(interactive);
    frozenRowsLayer.listening(interactive);
    frozenColsLayer.listening(interactive);
    intersectionLayer.listening(interactive);
    // =================== //

    // ==== Render ==== //
    calculateEstimatedTotalSizing();
    renderCells();
    stage.batchDraw();
    // =================== //
  }
  
  const renderGridThrottled = () => {
    if (renderRequested) return;
    
    renderRequested = true;
    requestAnimationFrame(() => {
      renderGrid();
      renderRequested = false;
    });
  }
  // ================ //

  return {
    initGrid,
    renderGrid,
    renderGridThrottled,
    estimatedTotalWidth,
    estimatedTotalHeight,
    getEstimatedTotalWidth,
    getEstimatedTotalHeight,
    getRowSizing,
    getColumnSizing,
    findNearestRow,
    findNearestColumn,
    findNearestRowBinarySearch,
    findNearestRowExponentialSearch,
    findNearestColumnBinarySearch,
    findNearestColumnExponentialSearch,
  };
};