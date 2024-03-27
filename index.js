import { AppRegistry } from 'react-native'
import { useEffect } from 'react';
import { MiniAppsEnginesProvider } from '@htyf-mp/engines'
import App from './src'

const Root = () => {
  useEffect(() => {
    return () => {

    }
  }, [])
  return <App />
}

const Root2 = () => {
  return <MiniAppsEnginesProvider><Root/></MiniAppsEnginesProvider>
}

AppRegistry.registerComponent('apps', () => Root2)
