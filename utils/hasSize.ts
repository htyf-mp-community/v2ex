import { isPlainObject } from 'lodash'

export function hasSize(
  style: any
): style is { width: number; height: number; [k: string]: any } {
  return isPlainObject(style) && !!style.width && !!style.height
}
