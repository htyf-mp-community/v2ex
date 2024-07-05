// import * as Device from 'expo-device'
import { useAtomValue } from 'jotai'
import { Dimensions, Platform, useWindowDimensions } from 'react-native'

import { deviceTypeAtom } from '../jotai/deviceTypeAtom'
import { store } from '../jotai/store'

export const isTablet = () =>
  Platform.OS === 'ios'
    ? store.get(deviceTypeAtom) === 2 ||
      store.get(deviceTypeAtom) === 3
    : Dimensions.get('window').width >= 768

export const useTablet = () => {
  useAtomValue(deviceTypeAtom)
  const { width } = useWindowDimensions()
  return {
    navbarWidth: isTablet() ? Math.min(Math.floor((3 / 7) * width), 460) : 0,
    isTablet: isTablet(),
  }
}
