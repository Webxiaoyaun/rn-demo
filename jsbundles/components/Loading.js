import React from 'react'
import { View } from 'react-native'
import { connect } from 'dva'
import { JDToast, JDLoadingView, JDText, JDDevice } from '@jdreact/jdreact-core-lib-lite'
import { memoryCache } from '../utils'

class Loading extends React.Component {
  constructor (props) {
    super(props)
    memoryCache.loading = this
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
  }

  show (tip = '正在加载') {
    const { Loading } = this.props
    Loading(true, tip)
  }

  hide (tip = '正在加载') {
    const { Loading } = this.props
    Loading(false, tip)
  }

  render () {
    const { loading, tip } = this.props
    return loading
      ? <JDToast show style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: JDDevice.getDpx(750), borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        mode={JDToast.MODE.MODAL}>
        <View style={{ width: JDDevice.getDpx(200), height: JDDevice.getDpx(200), justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ marginBottom: JDDevice.getDpx(20) }}><JDLoadingView /></View>
          <JDText style={{ color: '#FFF' }}>{tip}</JDText>
        </View>
      </JDToast>
      : null
  }
}

export default connect(({ app }) => ({
  loading: app.loading,
  tip: app.tip
}), (dispatch) => ({
  Loading: (loading, tip) => dispatch({ type: 'app/setState', payload: { loading, tip } })
}))(Loading)
