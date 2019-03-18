import React from 'react'
import { AppRegistry } from 'react-native'
import dva from 'dva'
import { createMemoryHistory as createHistory } from 'history'
import { JDRouter } from '@jdreact/jdreact-core-lib-lite'

import Index from './pages/Index'

import appModel from './models/app'

import Loading from './components/Loading'
import {
  setJdCookie, memoryCache, toast
} from './utils'

const { Router, Route } = JDRouter

const app = dva({
  history: createHistory(),
  onError: e => {
    e.preventDefault()
    if (typeof e === 'string') {
      toast(e)
    } else {
      toast(err2string(e))
    }
  }
})

app.model(appModel)

app.router((props) => {
  setJdCookie({
    third_token: props.third_token,
    third_timestamp: props.third_timestamp,
    third_name: props.third_name,
    third_safetyToken: props.third_safetyToken
  })

  memoryCache.erp = props.third_name

  return <Router allowSlidePopFirstPage={false} renderOverlay={() => <Loading />}>
    <Route key={'home'} component={Index} />
  </Router>
})

const App = app.start()

AppRegistry.registerComponent('index', () => App)
