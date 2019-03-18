import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { connect } from '../utils'
import {JDDevice} from "@jdreact/jdreact-core-lib-lite/Libraries/jdreact-core-lib.common";

const NavigationBar = require('./NavigationBar')

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  body: {
    flex: 1
  }
})

class NavigationPage extends React.Component {
  render () {
    const { title, style, children, notScroll = false, backWrapperColor = 'transparent', backToHome, keyboardShouldPersistTaps, noWrapper } = this.props
    return <View style={styles.wrapper} backgroundColor={backWrapperColor}>
      <NavigationBar backToHome={backToHome} Title={title} />
      {
        noWrapper ? children : notScroll ? <View style={[styles.body, style]}>
          {children}
        </View> : <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} style={[styles.body, style]}>
          {children}
        </ScrollView>
      }
    </View>
  }
}

export default connect()(NavigationPage)
