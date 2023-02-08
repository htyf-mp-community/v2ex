import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'
import { store } from './store'

export type FontScale = 'medium' | 'large' | 'super'

/**
 * 字体缩放大小
 */
export const fontScaleAtom = atomWithStorage<FontScale>(
  'fontScale',
  'medium',
  storage
)

type Level = 1 | 2 | 3 | 4 | 5 | 6

const fontSizeMap: Record<FontScale, Record<Level, string>> = {
  medium: {
    '1': 'text-[23px] leading-[32px]',
    '2': 'text-[21px] leading-[30px]',
    '3': 'text-[19px] leading-[28px]',
    '4': 'text-[17px] leading-[26px]',
    '5': 'text-[15px] leading-[24px]',
    '6': 'text-[13px] leading-[22px]',
  },
  large: {
    '1': 'text-[24px] leading-[33px]',
    '2': 'text-[22px] leading-[31px]',
    '3': 'text-[20px] leading-[29px]',
    '4': 'text-[18px] leading-[27px]',
    '5': 'text-[16px] leading-[25px]',
    '6': 'text-[14px] leading-[23px]',
  },
  super: {
    '1': 'text-[25px] leading-[34px]',
    '2': 'text-[23px] leading-[32px]',
    '3': 'text-[21px] leading-[30px]',
    '4': 'text-[19px] leading-[28px]',
    '5': 'text-[17px] leading-[26px]',
    '6': 'text-[15px] leading-[24px]',
  },
}

export function getFontSize(level: Level) {
  return fontSizeMap[store.get(fontScaleAtom) || 'medium'][level]
}