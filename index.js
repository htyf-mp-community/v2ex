import { AppRegistry } from 'react-native'
import { useEffect } from 'react';
import { MiniAppsEnginesProvider } from '@htyf-mp/engines'
import d from 'react-native-splash-screen'
import App from './src'

const Root = () => {
  useEffect(() => {
    d.hide()
    return () => {
      
    }
  }, [])
  return <App />
}

const Root2 = () => {
  return <MiniAppsEnginesProvider><Root/></MiniAppsEnginesProvider>
}

AppRegistry.registerComponent('apps', () => Root2)
