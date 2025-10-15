import { ref, Ref } from "vue";
import { AreaProps } from "@/types";
import { Cell } from "@/types/cell";
import { Text } from "@/types/text";
import { Rect } from "@/types/rect";
import { Layer } from "konva/lib/Layer";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";
import { Stage } from "konva/lib/Stage";

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
  // ================ //


  // ==== Grid Data ==== //
  let rowSizeCache: { size: number, offset: number }[] = [];
  const estimatedTotalWidth = ref(0);
  let columnSizeCache: { size: number, offset: number }[] = [];
  const estimatedTotalHeight = ref(0);
  let renderRequested = false;
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
    const overscanBackward =
      Number(!isScrolling.value || 1);

    return Math.max(0, startIndex - overscanBackward)
  };
  const rowStopIndex = () => {
    /* 
      Overscan by one item in each direction so that tab/focus works.
      If there isn't at least one extra item, tab loops back around.
    */
    const overscanForward =
      Number(!isScrolling.value || 1);

    return Math.max(0, Math.min(rowsCount - 1, getRowStopIndex(rowStartIndex()) + overscanForward));
  };
  const columnStartIndex = () => {
    const startIndex = getColumnStartIndex(scrollLeft.value + getFrozenColumnWidth());
    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanBackward =
      Number(!isScrolling.value || 1);
    return Math.max(0, startIndex - overscanBackward);
  };
  const columnStopIndex = () => {
    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanForward =
      Number(!isScrolling.value || 1);
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

  const renderCell = (cell: Cell) => {
    const clickHandler = getCellClickHandler?.(cell.rowIndex, cell.columnIndex);
    const doubleClickHandler = getCellDoubleClickHandler?.(cell.rowIndex, cell.columnIndex);
    const rightClickHandler = getCellRightClickHandler?.(cell.rowIndex, cell.columnIndex);
    const hoverHandler = getCellHoverHandler?.(cell.rowIndex, cell.columnIndex);
    const renderedCell = getCellRenderer(cell.rowIndex, cell.columnIndex)(cell);

    if (clickHandler) {
      renderedCell.on("click", () => clickHandler(cell));
    }
    if (doubleClickHandler) {
      renderedCell.on("dblclick", () => doubleClickHandler(cell));
    }
    if (rightClickHandler) {
      renderedCell.on("contextmenu", () => rightClickHandler(cell));
    }
    if (hoverHandler) {
      renderedCell.on("mouseover", () => hoverHandler(cell));
    }

    return renderedCell;
  }
  
  const calculateVisibleCells = (layer: Layer): Layer => {
    // Use screen coordinates for viewport bounds (0 to containerWidth/Height)
    const viewportLeft = 0;
    const viewportRight = containerWidth;
    const viewportTop = 0;
    const viewportBottom = containerHeight;

    for (let rowIndex = rowStartIndex(); rowIndex <= rowStopIndex(); rowIndex++) {
      if (rowIndex < rowsFrozen || isHiddenRow?.(rowIndex)) continue;
      
      onBeforeRenderRow?.(rowIndex);

      for (let columnIndex = columnStartIndex(); columnIndex <= columnStopIndex(); columnIndex++) {
        if (columnIndex < columnsFrozen || isHiddenCell?.(rowIndex, columnIndex)) continue;

        const bounds = getCellBounds(rowIndex, columnIndex);
        const actualBottom = Math.max(rowIndex, bounds.bottom);
        const actualRight = Math.max(columnIndex, bounds.right);

        const x = getColumnSizing(columnIndex).offset - scrollLeft.value;
        const y = getRowSizing(rowIndex).offset - scrollTop.value;
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(columnIndex).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(rowIndex).offset;
        
        // Skip cells that are completely outside the viewport
        if (x + width < viewportLeft || x > viewportRight || y + height < viewportTop || y > viewportBottom) continue;

        const formatting = getCellFormatting(rowIndex, columnIndex);
        layer.add(renderCell({
          x,
          y,
          width,
          height,
          rowIndex, 
          columnIndex, 
          text: getCellText(rowIndex, columnIndex),
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
          key: `${rowIndex}-${columnIndex}`,
        }));
      }
    }

    return layer;
  };

  const calculateFrozenRows = (layer: Layer): Layer => {
    const viewportLeft = 0;
    const viewportRight = containerWidth;
    const viewportTop = 0;
    const viewportBottom = containerHeight;

    for (
      let rowIndex = 0;
      rowIndex < Math.min(rowStopIndex(), rowsFrozen);
      rowIndex++
    ) {
      if (isHiddenRow?.(rowIndex)) continue;
      
      onBeforeRenderRow?.(rowIndex);
  
      for (
        let columnIndex = columnStartIndex();
        columnIndex <= columnStopIndex();
        columnIndex++
      ) {
        /* Skip merged cells columns */
        if (columnIndex < columnsFrozen) {
          continue;
        }
  
        const bounds = getCellBounds(rowIndex, columnIndex);
        const actualBottom = Math.max(rowIndex, bounds.bottom);
        const actualRight = Math.max(columnIndex, bounds.right);
        if (isHiddenCell?.(rowIndex, columnIndex)) {
          continue;
        }
  
        // Frozen rows: X scrolls horizontally, Y is fixed (no vertical scroll)
        const x = getColumnSizing(columnIndex).offset - scrollLeft.value;
        const y = getRowSizing(rowIndex).offset;
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(columnIndex).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(rowIndex).offset;
        
        // Skip cells that are completely outside the viewport
        if (x + width < viewportLeft || x > viewportRight || y + height < viewportTop || y > viewportBottom) continue;
  
        const formatting = getCellFormatting(rowIndex, columnIndex);
        layer.add(renderCell({
          x,
          y,
          width,
          height,
          rowIndex, 
          columnIndex, 
          text: getCellText(rowIndex, columnIndex),
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
          key: `${rowIndex}-${columnIndex}`,
        }));
      }
    }

    return layer;
  }
  const calculateFrozenColumns = (layer: Layer): Layer => {
    const viewportLeft = 0;
    const viewportRight = containerWidth;
    const viewportTop = 0;
    const viewportBottom = containerHeight;

    for (let rowIndex = rowStartIndex(); rowIndex <= rowStopIndex(); rowIndex++) {
      if (rowIndex < rowsFrozen || isHiddenRow?.(rowIndex)) {
        continue;
      }
      
      onBeforeRenderRow?.(rowIndex);
  
      for (
        let columnIndex = 0;
        columnIndex < Math.min(columnStopIndex(), columnsFrozen);
        columnIndex++
      ) {
        const bounds = getCellBounds(rowIndex, columnIndex);
        const actualBottom = Math.max(rowIndex, bounds.bottom);
        const actualRight = Math.max(columnIndex, bounds.right);
        if (isHiddenCell?.(rowIndex, columnIndex)) {
          continue;
        }
  
        // Frozen columns: X is fixed (no horizontal scroll), Y scrolls vertically
        const x = getColumnSizing(columnIndex).offset;
        const y = getRowSizing(rowIndex).offset - scrollTop.value;
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(columnIndex).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(rowIndex).offset;
        
        // Skip cells that are completely outside the viewport
        if (x + width < viewportLeft || x > viewportRight || y + height < viewportTop || y > viewportBottom) continue;
  
        const formatting = getCellFormatting(rowIndex, columnIndex);
        layer.add(renderCell({
          x,
          y,
          width,
          height,
          rowIndex, 
          columnIndex, 
          text: getCellText(rowIndex, columnIndex),
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
          key: `${rowIndex}-${columnIndex}`,
        }));
      }
    }

    return layer;
  }

  const calculateFrozenIntersectionCells = (layer: Layer): Layer => {
    const viewportLeft = 0;
    const viewportRight = containerWidth;
    const viewportTop = 0;
    const viewportBottom = containerHeight;
    
    for (
      let rowIndex = 0;
      rowIndex < Math.min(rowStopIndex(), rowsFrozen);
      rowIndex++
    ) {
      if (isHiddenRow?.(rowIndex)) continue;
      for (
        let columnIndex = 0;
        columnIndex < Math.min(columnStopIndex(), columnsFrozen);
        columnIndex++
      ) {
        const bounds = getCellBounds(rowIndex, columnIndex);
        const actualBottom = Math.max(rowIndex, bounds.bottom);
        const actualRight = Math.max(columnIndex, bounds.right);
        if (isHiddenCell?.(rowIndex, columnIndex)) {
          continue;
        }
  
        // Frozen intersection: Both X and Y are fixed (no scrolling)
        const x = getColumnSizing(columnIndex).offset;
        const y = getRowSizing(rowIndex).offset;
        const width = getColumnSizing(actualRight).offset + getColumnWidth(actualRight) - getColumnSizing(columnIndex).offset;
        const height = getRowSizing(actualBottom).offset + getRowHeight(actualBottom) - getRowSizing(rowIndex).offset;
        
        // Skip cells that are completely outside the viewport
        if (x + width < viewportLeft || x > viewportRight || y + height < viewportTop || y > viewportBottom) continue;
  
        const formatting = getCellFormatting(rowIndex, columnIndex);
        layer.add(renderCell({
          x,
          y,
          width,
          height,
          rowIndex, 
          columnIndex, 
          text: getCellText(rowIndex, columnIndex),
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
          key: `${rowIndex}-${columnIndex}`,
        }));
      }
    }

    return layer;
  }

  const renderCells = (Layer: Layer) => {
    if (columnsCount === 0 || rowsCount === 0) return;
    calculateVisibleCells(Layer);
  }

  const renderFrozenRows = (Layer: Layer) => {
    calculateFrozenRows(Layer);
  }

  const renderFrozenColumns = (Layer: Layer) => {
    calculateFrozenColumns(Layer);
  }

  const renderFrozenIntersectionCells = (Layer: Layer) => {
    calculateFrozenIntersectionCells(Layer);
  }

  const initGrid = () => {
    stage = new Stage({
      container: stageRef.value,
      width: containerWidth,
      height: containerHeight,
    });
    renderGrid();
  }

  const renderGrid = () => {
    if (!stage) return;

    // calculate sizing //
    calculateEstimatedTotalSizing();
    // ================ //

    // render graphics //
    const cellsLayer = new Layer();
    renderCells(cellsLayer);
    renderFrozenRows(cellsLayer);
    renderFrozenColumns(cellsLayer);
    renderFrozenIntersectionCells(cellsLayer);
    // ================ //

    stage.add(cellsLayer);
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