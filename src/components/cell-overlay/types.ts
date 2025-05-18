import { CellProps } from "../cell/types";

export interface StrokeCellProps
  extends Omit<CellProps, "key" | "rowIndex" | "columnIndex"> {}