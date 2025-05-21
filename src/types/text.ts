import { Color } from "@/enums/color";

export interface Text {
  /**
   * Text content of the text
   */
  text: string;
  /**
   * Font size of the text
   */
  fontSize: number;
  /**
   * Font family of the text
   */
  fontFamily: string;
  /**
   * Font weight of the text
   */
  fontWeight: string;
  /**
   * Text decoration of the text
   */
  textDecoration: string;
  /**
   * Text align of the text
   */
  textAlign: string;
  /**
   * Text color of the text
   */
  color: Color | string;
}