import { computed, ref, Ref } from "vue";
import { Application, Graphics } from "pixi.js";
import { AreaProps, Cell, CellInterface, Direction } from "@/types";

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
  const cells: Set<Cell> = new Set();
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

    return Math.max(0, Math.min(rowsCount - 1, getRowStopIndex(scrollTop.value + getFrozenRowHeight()) + overscanForward));
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
    const stopIndex = getColumnStopIndex(scrollLeft.value + getFrozenColumnWidth());
    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanForward =
      Number(!isScrolling.value || 1);
    return Math.max(0, Math.min(columnsCount - 1, stopIndex + overscanForward));
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
  const destroyCells = () => {
    cells.forEach(cell => {
      pixiApp?.stage.removeChild(cell.graphics);
    });
    cells.clear();
  }
  const renderCells = () => {
    destroyCells();
    if (columnsCount > 0 && rowsCount) {
      for (let rowIndex = rowStartIndex(); rowIndex <= rowStopIndex(); rowIndex++) {
        /* Skip frozen rows */
        if (rowIndex < rowsFrozen || isHiddenRow?.(rowIndex)) {
          continue;
        }
        /**
         * Do any pre-processing of the row before being renderered.
         * Useful for `react-table` to call `prepareRow(row)`
         */
        onBeforeRenderRow?.(rowIndex);

        for (
          let columnIndex = columnStartIndex();
          columnIndex <= columnStopIndex();
          columnIndex++
        ) {
          /**
           * Skip frozen columns
           * Skip merged cells that are out of bounds
           */
          if (columnIndex < columnsFrozen) {
            continue;
          }

          const bounds = getCellBounds(rowIndex, columnIndex);
          const actualBottom = Math.max(rowIndex, bounds.bottom);
          const actualRight = Math.max(columnIndex, bounds.right);
          if (isHiddenCell?.(rowIndex, columnIndex)) {
            continue;
          }

          const y = getRowSizing(rowIndex).offset;
          const height = getRowSizing(actualBottom).offset - y + getRowHeight(actualBottom);
          const x = getColumnSizing(columnIndex).offset;
          const width = getColumnSizing(actualRight).offset - x + getColumnWidth(actualRight);

          const graphics = new Graphics();
          graphics.setStrokeStyle({
            width: 5,
            color: 0xFF0000,
          });
          graphics.rect(x, y, width, height);
          pixiApp?.stage.addChild(graphics);

          cells.add(
            {
              x,
              y,
              width,
              height,
              rowIndex,
              columnIndex,
              graphics,
              key: `${rowIndex}:${columnIndex}`,
            }
          );
        }
      }
    }
  }
  const destroyGrid = () => {
    destroyCells();
    pixiApp?.destroy();
  }
  const renderGrid = () => {
    renderCells();
  }
  const initGrid = async () => {
    pixiApp = new Application();
    console.log(gridRef.value)
    console.log(pixiApp?.canvas)
    gridRef.value.appendChild(pixiApp?.canvas);
    estimatedTotalWidth.value = getEstimatedTotalWidth();
    estimatedTotalHeight.value = getEstimatedTotalHeight();
    await pixiApp.init({
      background: '#000000',
      resizeTo: gridRef.value,
    });
  }
  // ================ //

  return {
    pixiApp,
    initGrid,
    renderGrid,
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