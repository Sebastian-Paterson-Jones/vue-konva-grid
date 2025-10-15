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
   * Font style of the text
   */
  fontStyle: 'normal' | 'italic' | 'bold' | 'italic bold';
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
  textAlign: 'left' | 'right' | 'center' | 'justify';
  /**
   * Vertical align of the text
   */
  verticalAlign: 'top' | 'bottom' | 'middle';
  /**
   * Wrap of the text
   */
  wrap: 'word' | 'char' | 'none';
  /**
   * Text color of the text
   */
  color: Color | string;
  /**
   * Padding of the text
   */
  padding: number;
}