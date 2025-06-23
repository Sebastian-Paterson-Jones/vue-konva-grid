import { ref, Ref } from "vue";
import { Application, Graphics } from "pixi.js";
import { AreaProps } from "@/types";
import { getRowOffset } from "@/helpers/helpers";

export const useGrid = ({
  gridRef,
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
}: {
  gridRef: Ref<HTMLDivElement>;
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
  onBeforeRenderRow: (rowIndex: number) => void;
  containerHeight: number;
  containerWidth: number;
  scrollTop: Ref<number>;
  scrollLeft: Ref<number>;
  isScrolling: Ref<boolean>;
}) => {
  // ==== Data ==== //
  let pixiApp: Application | null = null;
  let rowSizeCache: { size: number, offset: number }[] = [];
  const estimatedTotalWidth = ref(0);
  let columnSizeCache: { size: number, offset: number }[] = [];
  const estimatedTotalHeight = ref(0);
  let visibleCellsGraphics: Graphics | null = null;
  let frozenRowsGraphics: Graphics | null = null;
  let frozenColumnsGraphics: Graphics | null = null;
  let intersectionCellsGraphics: Graphics | null = null;
  let renderRequested = false;
  // ================ //

  // ==== Methods ==== //
  const getEstimatedTotalWidth = () => {
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
  const getEstimatedTotalHeight = () => {
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
  
  const calculateVisibleCells = () => {
    const visibleCells = [];
    
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

        visibleCells.push({ x, y, width, height });
      }
    }

    return visibleCells;
  };

  const calculateFrozenRows = () => {
    const frozenRows = [];
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
  
        frozenRows.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: rowIndex,
            columnIndex: columnIndex,
          }
        );
      }
    }

    return frozenRows;
  }
  const calculateFrozenColumns = () => {
    const frozenColumns = [];
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
  
        frozenColumns.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: rowIndex,
            columnIndex: columnIndex,
          }
        );
      }
    }

    return frozenColumns;
  }

  const calculateFrozenIntersectionCells = () => {
    const frozenIntersectionCells = [];
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
  
        frozenIntersectionCells.push(
          {
            x,
            y,
            width,
            height,
            rowIndex: rowIndex,
            columnIndex: columnIndex,
          }
        );
      }
    }

    return frozenIntersectionCells;
  }

  const renderCells = () => {
    if (!pixiApp || !visibleCellsGraphics || columnsCount === 0 || rowsCount === 0) return;
    visibleCellsGraphics.clear();
    
    const cells = calculateVisibleCells();
    for (const cell of cells) {
      visibleCellsGraphics.rect(cell.x, cell.y, cell.width, cell.height);
    }
    
    if (cells.length > 0) {
      visibleCellsGraphics.fill({ color: 0xFFFFFF });
      visibleCellsGraphics.stroke({ color: 0x000000, width: 1 });
    }
  }

  const renderFrozenRows = () => {
    if (!frozenRowsGraphics) return;
    frozenRowsGraphics.clear();
    
    const frozenRows = calculateFrozenRows();
    for (const frozenRow of frozenRows) {
      frozenRowsGraphics.rect(frozenRow.x, frozenRow.y, frozenRow.width, frozenRow.height);
    }
    
    if (frozenRows.length > 0) {
      frozenRowsGraphics.fill({ color: 0xFFFFFF });
      frozenRowsGraphics.stroke({ color: 0x000000, width: 1 });
    }
  }

  const renderFrozenColumns = () => {
    if (!frozenColumnsGraphics) return;
    frozenColumnsGraphics.clear();
    
    const frozenColumns = calculateFrozenColumns();
    for (const frozenColumn of frozenColumns) {
      frozenColumnsGraphics.rect(frozenColumn.x, frozenColumn.y, frozenColumn.width, frozenColumn.height);
    }
    
    if (frozenColumns.length > 0) {
      frozenColumnsGraphics.fill({ color: 0xFFFFFF });
      frozenColumnsGraphics.stroke({ color: 0x000000, width: 1 });
    }
  }

  const renderFrozenIntersectionCells = () => {
    if (!intersectionCellsGraphics) return;
    intersectionCellsGraphics.clear();
    
    const frozenIntersectionCells = calculateFrozenIntersectionCells();
    for (const frozenIntersectionCell of frozenIntersectionCells) {
      intersectionCellsGraphics.rect(frozenIntersectionCell.x, frozenIntersectionCell.y, frozenIntersectionCell.width, frozenIntersectionCell.height);
    }
    
    if (frozenIntersectionCells.length > 0) {
      intersectionCellsGraphics.fill({ color: 0xFFFFFF });
      intersectionCellsGraphics.stroke({ color: 0x000000, width: 1 });
    }
  }

  const destroyGrid = () => {
    visibleCellsGraphics = null;
    frozenRowsGraphics = null;
    frozenColumnsGraphics = null;
    intersectionCellsGraphics = null;
    renderRequested = false;
    pixiApp?.destroy();
  }

  const initGrid = async () => {
    pixiApp = new Application();
    await pixiApp.init({
      background: '#ffffff',
      resizeTo: gridRef.value,
    });
    gridRef.value.appendChild(pixiApp?.canvas);
  }

  const renderGrid = () => {
    if (!pixiApp) return;
    
    // Initialize graphics objects if they don't exist, ensuring proper layering order
    if (!visibleCellsGraphics) {
      visibleCellsGraphics = new Graphics();
      pixiApp.stage.addChild(visibleCellsGraphics);
    }
    if (!frozenRowsGraphics) {
      frozenRowsGraphics = new Graphics();
      pixiApp.stage.addChild(frozenRowsGraphics);
    }
    if (!frozenColumnsGraphics) {
      frozenColumnsGraphics = new Graphics();
      pixiApp.stage.addChild(frozenColumnsGraphics);
    }
    if (!intersectionCellsGraphics) {
      intersectionCellsGraphics = new Graphics();
      pixiApp.stage.addChild(intersectionCellsGraphics);
    }
    
    calculateEstimatedTotalSizing();
    
    // Render in order: visible cells (bottom), frozen cells (middle), intersection cells (top)
    renderCells();
    renderFrozenRows();
    renderFrozenColumns();
    renderFrozenIntersectionCells();
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
    pixiApp,
    initGrid,
    renderGrid,
    renderGridThrottled,
    destroyGrid,
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