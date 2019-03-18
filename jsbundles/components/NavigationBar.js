import { JDTouchable, JDDevice, JDText, JDImage } from '@jdreact/jdreact-core-lib-lite'
import { isIphoneX, isIphoneXR } from '../utils'
const React = require('react')
const PropTypes = React.PropTypes
const {
  View,
  Platform,
  StyleSheet,
  NativeModules
} = require('react-native')

const { backIOS } = require('../assets')
const { backAndroid } = require('../assets')

const NavigationBar = React.createClass({
  propTypes: {
    /**
     * 中间标题
     */
    Title: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string
    ]),

    titleBgColor: PropTypes.string,

    leftBgColor: PropTypes.string,

    rightBgColor: PropTypes.string,

    /**
     * 左边的渲染函数
     */
    LeftButton: PropTypes.func,

    /**
     * 右边的渲染函数
     */
    RightButton: PropTypes.func,

    showMoreNav: PropTypes.bool,
    moreNavList: PropTypes.array,
    /**
     * 点击更多按钮时被调用
     */
    onMoreNavClick: PropTypes.func,

    /**
     * 点击更多按钮展示的每一项具体菜单时被首先调用，如果返回true，可以阻塞下面代码执行
     */
    onMoreNavItemClick: PropTypes.func
  },

  contextTypes: {
    router: PropTypes.object
  },
  render () {
    return (
      <View>
        {
          Platform.OS === 'ios'
            ? <View style={{ height: isIphoneX() || isIphoneXR() ? 44 : 20, backgroundColor: 'white' }} /> : null
        }
        <View style={styles.navigationContainer}>
          <View style={[styles.navigationBar, this.props.titleBgColor ? { backgroundColor: this.props.titleBgColor } : null]}>
            <View style={[styles.navigationAction, styles.left]}>{this._renderLeft()}</View>
            <View style={styles.middle}>{this._renderTitle()}</View>
            <View style={[styles.navigationAction, styles.right]}>{this._renderRight()}</View>
          </View>
        </View>
      </View>
    )
  },

  _renderLeft () {
    if (typeof this.props.LeftButton === 'function') {
      return this.props.LeftButton()
    }
    return (
      <JDTouchable onPress={this.goBack}
        style={[styles.navigationBtn, this.props.leftBgColor ? { backgroundColor: this.props.leftBgColor } : null]}
        underlayColor={this.props.leftBgColor ? this.props.leftBgColor : null}>
        {
          Platform.OS === 'ios' ? <JDImage source={backIOS} style={styles.backIcon} /> : <JDImage source={backAndroid} style={styles.backIcon} />
        }
      </JDTouchable>
    )
  },

  _renderTitle () {
    if (typeof this.props.Title === 'function') {
      return this.props.Title()
    }
    return (<JDText style={styles.titleText} numberOfLines={1}>{this.props.Title}</JDText>)
  },

  _renderRight () {
    let rightButtons = []
    if (typeof this.props.RightButton === 'function') {
      const cusRightBtns = this.props.RightButton()
      if (Array.isArray(cusRightBtns)) {
        rightButtons = rightButtons.concat(cusRightBtns)
      } else {
        rightButtons.push(cusRightBtns)
      }
    }
    return rightButtons
  },

  goBack () {
    const { backToHome } = this.props
    if (backToHome && Platform.OS === 'ios') {
      NativeModules.MERNFaceDetect.closePage()
    } else {
      this.context.router.goBack()
    }
    this.context.router.goBack()
  }
})

const NAVIGATION_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 56
const BACK_BTN_WIDTH = JDDevice.getDpx(60 * 2)

const styles = StyleSheet.create({
  navigationContainer: {
    backgroundColor: 'transparent',
    shadowColor: '#E5E5E5',
    shadowOffset: { width: JDDevice.getDpx(0), height: JDDevice.getDpx(7) },
    shadowOpacity: 0.5,
    shadowRadius: JDDevice.getDpx(7)
  },
  navigationBar: {
    backgroundColor: '#fff',
    height: NAVIGATION_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: Platform.OS === 'ios' ? 0 : JDDevice.getDpx(2),
    borderBottomColor: 'rgb(203,203,203)'
  },
  navigationAction: {
    position: 'absolute',
    top: 0,
    bottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: '#FFF'
  },
  left: {
    left: 0
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: Platform.OS === 'ios' ? 0 : BACK_BTN_WIDTH,
    alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start'
  },
  right: {
    right: 0,
    minWidth: BACK_BTN_WIDTH
  },
  titleText: {
    fontSize: JDDevice.getFontSize(40),
    color: '#2e2d2d',
    fontWeight: 'bold'
  },
  navigationBtn: {
    width: BACK_BTN_WIDTH,
    height: NAVIGATION_BAR_HEIGHT - 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backIcon: {
    width: Platform.OS === 'ios' ? JDDevice.getDpx(28) : JDDevice.getDpx(50),
    height: Platform.OS === 'ios' ? JDDevice.getDpx(38) : JDDevice.getDpx(50)
  }
})

module.exports = NavigationBar
