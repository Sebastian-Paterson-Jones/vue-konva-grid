import type { ShapeConfig } from "konva/lib/Shape";
import Konva from "konva";
import type { HTMLAttributes, Ref } from "vue";

export enum KeyCodes {
  Right = 39,
  Left = 37,
  Up = 38,
  Down = 40,
  Escape = 27,
  Tab = 9,
  Meta = 91,
  Delete = 46,
  BackSpace = 8,
  Enter = 13,
  A = 65,
  SPACE = 32,
  ALT = 18,
  C = 67,
  Home = 36,
  End = 35,
  PageDown = 34,
  PageUp = 33,
  Z = 90,
  CapsLock = 20,
  KEY_B = 66,
  KEY_I = 73,
  KEY_U = 85,
  KEY_X = 88,
  KEY_L = 76,
  KEY_E = 69,
  KEY_R = 82,
  BACK_SLASH = 220,
  KEY_Y = 89,
  ScrollLock = 145,
  NumLock = 144,
  Pause = 19,
  Insert = 45,
  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,
}

export enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

export enum MimeType {
  html = "text/html",
  csv = "text/csv",
  plain = "text/plain",
  json = "application/json",
}

export enum MouseButtonCodes {
  "left" = 1,
  "middle" = 2,
  "right" = 3,
}

export type SelectionPolicy = "single" | "range" | "multiple";

export interface CellRangeArea extends CellInterface {
  toColumnIndex: number;
}

export type RefAttribute = {
  ref?: Ref<GridRef>;
};

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface SelectionProps
  extends AreaMeta,
    ShapeConfig,
    /* @vue-ignore */ Omit<HTMLAttributes, "draggable"> {
  fillHandleProps?: Record<string, (e: any) => void>;
  type: "fill" | "activeCell" | "selection" | "border";
  isDragging?: boolean;
  inProgress?: boolean;
  activeCell?: CellInterface;
  selection?: SelectionArea;
  key: number;
  draggable?: boolean;
  bounds?: AreaProps;
  borderCoverWidth?: number;
}

export type ScrollCoords = {
  scrollTop: number;
  scrollLeft: number;
};

export type OptionalScrollCoords = {
  scrollTop?: number;
  scrollLeft?: number;
};

export interface ScrollState extends ScrollCoords {
  isScrolling: boolean;
  verticalScrollDirection: Direction;
  horizontalScrollDirection: Direction;
}

export interface CellPosition extends Pick<ShapeConfig, "x" | "y"> {
  width?: ShapeConfig["width"];
  height?: ShapeConfig["height"];
}

export interface RendererProps
  extends CellInterface,
    CellPosition,
    Omit<ShapeConfig, "scale"> {
  key: string | number;
  isMergedCell?: boolean;
  isOverlay?: boolean;
}

export type ItemSizer = (index: number) => number;

export interface SelectionArea extends AreaStyle {
  bounds: AreaProps;
  inProgress?: boolean;
  /**
   * When user drags the fill handle
   */
  isFilling?: boolean;
}
export interface AreaProps {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CellInterface {
  rowIndex: number;
  columnIndex: number;
}

export interface OptionalCellInterface {
  rowIndex?: number;
  columnIndex?: number;
}

export interface ViewPortProps {
  rowStartIndex: number;
  rowStopIndex: number;
  columnStartIndex: number;
  columnStopIndex: number;
  visibleRowStartIndex: number;
  visibleRowStopIndex: number;
  visibleColumnStartIndex: number;
  visibleColumnStopIndex: number;
}

export interface InstanceInterface {
  columnMetadataMap: CellMetaDataMap;
  rowMetadataMap: CellMetaDataMap;
  lastMeasuredColumnIndex: number;
  lastMeasuredRowIndex: number;
  estimatedRowHeight: number;
  estimatedColumnWidth: number;
  recalcColumnIndices: number[];
  recalcRowIndices: number[];
}

export type CellMetaDataMap = Record<number, CellMetaData>;
export type CellMetaData = {
  offset: number;
  size: number;
};

export interface SnapRowProps {
  deltaY: number;
}

export interface SnapColumnProps {
  deltaX: number;
}

export interface PosXY {
  x?: number;
  y?: number;
}

export interface PosXYRequired {
  x: number;
  y: number;
}

export type GridRef = {
  scrollTo: (scrollPosition: ScrollCoords) => void;
  scrollBy: (pos: PosXY) => void;
  stage: Konva.Stage | null;
  container: HTMLDivElement | null;
  resetAfterIndices: (
    coords: OptionalCellInterface,
    shouldForceUpdate?: boolean
  ) => void;
  getScrollPosition: () => ScrollCoords;
  isMergedCell: (coords: CellInterface) => boolean;
  getCellBounds: (coords: CellInterface, spanMerges?: boolean) => AreaProps;
  getCellCoordsFromOffset: (
    x: number,
    y: number,
    includeFrozen?: boolean
  ) => CellInterface | null;
  getCellOffsetFromCoords: (coords: CellInterface) => CellPosition;
  getActualCellCoords: (coords: CellInterface) => CellInterface;
  scrollToItem: (coords: OptionalCellInterface, align?: Align) => void;
  focus: () => void;
  resizeColumns: (indices: number[]) => void;
  resizeRows: (indices: number[]) => void;
  getViewPort: () => ViewPortProps;
  getRelativePositionFromOffset: (x: number, y: number) => PosXYRequired | null;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getDimensions: () => {
    containerWidth: number;
    containerHeight: number;
    estimatedTotalWidth: number;
    estimatedTotalHeight: number;
  };
  getRowOffset: (index: number) => number;
  getColumnOffset: (index: number) => number;
};

export type MergedCellMap = Map<string, AreaProps>;

export type StylingProps = AreaStyle[];

export interface AreaStyle extends AreaMeta {
  bounds: AreaProps;
  style?: Style;
  strokeStyle?: "dashed" | "solid" | "dotted";
}
export interface AreaMeta {
  title?: string;
  [key: string]: any;
}

export interface Style {
  stroke?: string;
  strokeLeftColor?: string;
  strokeTopColor?: string;
  strokeRightColor?: string;
  strokeBottomColor?: string;
  strokeWidth?: number;
  strokeTopWidth?: number;
  strokeRightWidth?: number;
  strokeBottomWidth?: number;
  strokeLeftWidth?: number;
  strokeStyle?: string;
}

export enum Align {
  start = "start",
  end = "end",
  center = "center",
  auto = "auto",
  smart = "smart",
}

export enum ItemType {
  row = "row",
  column = "column",
}
