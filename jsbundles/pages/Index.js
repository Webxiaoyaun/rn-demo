import React from 'react'
import {StyleSheet, View, WebView, Text} from 'react-native'
import {connect, loadingShow, loadingHide, resetNav} from '../utils'
import NavigationPage from '../components/NavigationPage'

class Index extends React.Component {
  state = {
    user: null
  }
  
  componentDidMount() {
    this.props.UserInfo()
  }

  render() {
    const {userInfo} = this.props
    
    return <NavigationPage
        backToHome
        title='RN应用测试'
        backWrapperColor='transparent'>
        <Text>hello world!!{userInfo ? userInfo.emplName : ''}</Text>
    </NavigationPage>
  }
}

export default connect(({app}) => ({
  userInfo: app.userInfo
}), (dispatch) => ({
  UserInfo: () => dispatch({type: 'app/userInfo'})
}))(Index)
