import * as dva from 'dva'
import { NativeModules, Dimensions, Platform, AsyncStorage } from 'react-native'
import { NavigationActions } from '@jdreact/jdreact-navigation'
import * as RT from './runtime.json'

// 设计稿的像素px
const uiWidthPx = 750

// 当前设备的宽度
let deviceWidthDp = Dimensions.get('window').width

// px 转成 dp
export const dp = (px) => {
  return px * deviceWidthDp / uiWidthPx
}

// 更新当前设备的宽度
export const updateDp = () => {
  deviceWidthDp = Dimensions.get('window').width
}

// 清空缓存
export function clear () {
  return AsyncStorage.clear()
}

// 获取缓存key
export function get (key, defaultValue = null) {
  return AsyncStorage.getItem(key).then(
    value => (value !== null ? JSON.parse(value) : defaultValue)
  )
}

// 设置缓存key value
export function set (key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value))
}

// 删除缓存key
export function remove (key) {
  return AsyncStorage.removeItem(key)
}

// 获取多个key缓存
export function multiGet (...keys) {
  return AsyncStorage.multiGet([...keys]).then(stores => {
    const data = {}
    stores.forEach((result, i, store) => {
      data[store[i][0]] = JSON.parse(store[i][1])
    })
    return data
  })
}

// 删除多个key缓存
export function multiRemove (...keys) {
  return AsyncStorage.multiRemove([...keys])
}

// 请求
export function request (url, options = {}) {
  const { headers, ...otherOptions } = options
  const defaultOption = {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers
    },
    method: 'GET',
    ...otherOptions
  }

  // method为get时，将参数添加至url
  if (defaultOption.method === 'GET') {
    if (typeof defaultOption.body === 'string') {
      if (url.indexOf('?') < 0) {
        url += '?'
      }
      url += defaultOption.body
    } else if (typeof defaultOption.body === 'object') {
      if (url.indexOf('?') < 0) {
        url += '?'
      }
      url += json2param(defaultOption.body)
    }
    delete defaultOption.body
  } else {
    if (defaultOption.body instanceof FormData) {
      defaultOption.headers['Content-Type'] = undefined
      delete defaultOption.headers['Content-Type']
    } else if (defaultOption.method === 'POST' && typeof defaultOption.body === 'number') {
      defaultOption.body = '' + defaultOption.body
    } else if (typeof defaultOption.body === 'object') {
      defaultOption.body = JSON.stringify(defaultOption.body)
    }
  }

  return fetch(url, defaultOption).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return new Promise((resolve, reject) => {
        response.json().then(res => {
          resolve(res)
        }).catch(() => {
          reject(new Error('无法解析的json格式'))
        })
      })
    } else if (response.status === 401) {
      return Promise.reject(new Error('未授权'))
    } else {
      return new Promise((resolve, reject) => {
        response.json().then(data => {
          if (data) {
            reject(data)
          } else {
            reject(response.status)
          }
        }).catch(() => {
          reject(response.status)
        })
      })
    }
  })
}

/**
 * 将json对象转换成键值对字符串
 * @param o json对象
 * @returns {string}
 */
export function json2param (o) {
  const p = []
  for (let key in o) {
    if (o.hasOwnProperty(key)) {
      let value = o[key]
      if (value === null || value === undefined || isNaN(value) || value ===
                Infinity || value === -Infinity) {
        value = ''
      }
      p.push(`${key}=${encodeURIComponent(value)}`)
    }
  }

  return p.join('&')
}

/**
 * 将键值对字符串转换成json对象
 * @param str 键值对字符串
 * @returns {object}
 */
export function param2json (str) {
  if (typeof str !== 'string') {
    return {}
  }

  let i1 = str.indexOf('?')
  let i2 = str.indexOf('#')

  if (i2 < 0) {
    i2 = str.length
  }

  if (i2 > i1) {
    str = str.substring(i1 + 1, i2)
  }

  const reg = /([a-z0-9_]+)=([^&#]+)/ig
  let m = reg.exec(str)
  const ret = {}
  while (m) {
    ret[m[1]] = decodeURIComponent(m[2])
    m = reg.exec(str)
  }

  return ret
}

/**
 * 简单模板引擎
 * @param template 模板字符串
 * @param context 上下文数据
 * @returns {string}
 */
export function renderTemplate (template, context) {
  return template.replace(/\{\{(.*?)\}\}/g,
    (match, key) => context[key.trim()])
}

/**
 * 数组异步回调
 * @param arr 包含Promise的数组或者数据，如果为数据，则必须传operate操作函数
 * @param operate 要执行的操作，返回Promise对象（主要是为了真正的同步执行数组中的Promise）
 * @returns {Promise<any>}
 */
export function promiseAll (arr, operate) {
  const resultArr = []

  function _aysncArr (cb) {
    let a = arr.shift()
    if (a) {
      let promise = a
      if (typeof operate === 'function') {
        promise = operate(a)
      }
      promise.then(r => {
        resultArr.push(r)
        _aysncArr(cb)
      }).catch(err => {
        cb(err, resultArr)
      })
    } else {
      cb(null, resultArr)
    }
  }

  return new Promise((resolve, reject) => {
    _aysncArr(function (err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

// 内存缓存，目前用来存储erp信息
export const memoryCache = {}

let errStatck = []
let toastTimer = 0

// 错误信息转成字符串
export function err2string (a) {
  if (typeof a === 'string') {
    return a
  } else if (a instanceof Error) {
    return a.message
  } else if (typeof a === 'object') {
    if (a && a.body && a.body.message) {
      return a.body.message
    } else if (a.msg) {
      return a.msg
    } else if (a.message) {
      return a.message
    } else {
      return JSON.stringify(a)
    }
  } else if (typeof a === 'number' || typeof a === 'boolean') {
    return `${a}`
  } else if (a) {
    return a.toString()
  }
}

// 调用京Me自带的提示
export function toast (a) {
  clearTimeout(toastTimer)

  const str = err2string(a)

  if (str) {
    errStatck.push(str)
    toastTimer = setTimeout(() => {
      NativeModules.MERNToast.show(str)
      errStatck = []
    }, 100)
  }
}

// 显示加载状态
export function loadingShow (a) {
  if (memoryCache.loading) {
    memoryCache.loading.show(a)
  }
}

// 隐藏加载状态
export function loadingHide () {
  if (memoryCache.loading) {
    memoryCache.loading.hide()
  }
}

const HOST = RT.API_HOST

export const API_ROOT = (__DEV__ ? `http://` : `https://`) + HOST

const onlineKey = RT.ONLINE_KEY

function aesKey (key) {
  var realKey = ''
  for (var i = 0; i < 8; i++) {
    realKey += key.charAt(i)
    realKey += onlineKey.charAt(i)
  }

  return realKey
}

/**
 * 京Me判断是否已经录入人脸特征
 * @returns {Promise<any>} true | false
 */
export function isFaceTemplateSetted () {
  // loadingShow()
  return new Promise((resolve, reject) => {
    NativeModules.MERNFaceDetect.isFaceTemplateSetted((result) => {
      // loadingHide()
      resolve(result)
    })
  })
}

/**
 * 京Me设置人脸特征
 * @returns {Promise<any>}
 */
export function setFaceTemplate () {
  loadingShow()

  return new Promise((resolve, reject) => {
    NativeModules.MERNFaceDetect.setFaceTemplate((result) => {
      loadingHide()
      resolve(result)
    }, (code) => {
      loadingHide()
      if (code === NativeModules.MERNFaceDetect.ERROR_CANCEL) {
        reject(0)
      } else if (code === NativeModules.MERNFaceDetect.ERROR_NETWORK_ERROR) {
        toast('网络异常，请重试')
        reject(0)
      } else if (code ===
                NativeModules.MERNFaceDetect.ERROR_PERMISSION_DENIED) {
        toast('未获取到权限')
        reject(0)
      } else if (code === NativeModules.MERNFaceDetect.ERROR_UNKNOWN_ERROR) {
        toast('未知异常')
        reject(0)
      } else {
        reject(1)
      }
    })
  })
}

/**
 * 京Me人脸识别
 * @returns {Promise<any>}
 */
export function faceDetect () {
  loadingShow()
  return new Promise((resolve, reject) => {
    NativeModules.MERNFaceDetect.detect((result) => {
      loadingHide()
      resolve(result)
    }, (code) => {
      loadingHide()
      if (code === NativeModules.MERNFaceDetect.ERROR_CANCEL) {
        reject(0)
      } else if (code === NativeModules.MERNFaceDetect.ERROR_NETWORK_ERROR) {
        toast('网络异常，请重试')
        reject(0)
      } else if (code ===
                NativeModules.MERNFaceDetect.ERROR_PERMISSION_DENIED) {
        toast('未获取到权限')
        reject(0)
      } else if (code === NativeModules.MERNFaceDetect.ERROR_DETECT_FAILED) {
        reject(1)
      } else if (code === NativeModules.MERNFaceDetect.ERROR_UNKNOWN_ERROR) {
        toast('识别错误，未知异常')
        reject(0)
      } else {
        reject(1)
      }
    })
  })
}

export class PayrollCrypto {
  constructor (key) {
    this.key = key
  }

  encode (text) {
    return text
  }

  decode (text) {
    return text
  }
}

export function connect (a, b, c) {
  return dva.connect(a, b, c, { withRef: true })
}

export function AESDecode (a) {
  try {
    const key = a.substr(0, 8)
    const str = a.substr(8).replace(/(\r)|(\n)/g, '')
    const crypto = new PayrollCrypto(key)
    return JSON.parse(crypto.decode(str))
  } catch (err) {
    return null
  }
}

export function setCookie (obj) {
  NativeModules.MERNCookie.set(HOST, obj)
}

export function setJdCookie (obj) {
  NativeModules.MERNCookie.set('.jd.com', obj)
}

export function selectContact (selected = []) {
  return new Promise((resolve, reject) => {
    NativeModules.MERNContact.select({
      maxNum: 1,
      selected
    }, result => {
      resolve(result)
    }, err => {
      reject(err)
    })
  })
}

export function deleteCookie () {
  NativeModules.MERNCookie.delete(HOST)
}

export function deleteJdCookie () {
  if (HOST.indexOf('jd.com') >= 0) {
    NativeModules.MERNCookie.delete('.jd.com')
  }
}

export function getJdCookie (name) {
  return new Promise((resolve, reject) => {
    NativeModules.MERNCookie.get('.jd.com', value => {
      resolve(value ? value[name] : '')
    })
  })
}

export function getCookie (name) {
  return new Promise((resolve, reject) => {
    NativeModules.MERNCookie.get(HOST, value => {
      resolve(value ? value[name] : '')
    })
  })
}

export function resetNav (navigation, routeName, params) {
  navigation.dispatch(NavigationActions.reset({
    actions: [
      NavigationActions.navigate({
        routeName,
        params
      })
    ],
    index: 0
  }))
}

// iPhoneX Xs
const X_WIDTH = 375
const X_HEIGHT = 812

// iPhoneXR XsMax
const XR_WIDTH = 414
const XR_HEIGHT = 896

// screen
const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

// 判断是否为iphoneX或Xs
export function isIphoneX () {
  return (
    Platform.OS === 'ios' &&
        ((SCREEN_HEIGHT === X_HEIGHT && SCREEN_WIDTH === X_WIDTH) ||
            (SCREEN_HEIGHT === X_WIDTH && SCREEN_WIDTH === X_HEIGHT))
  )
}

// 判断是否为iphoneXR或XsMAX
export function isIphoneXR () {
  return (
    Platform.OS === 'ios' &&
        ((SCREEN_HEIGHT === XR_HEIGHT && SCREEN_WIDTH === XR_WIDTH) ||
            (SCREEN_HEIGHT === XR_WIDTH && SCREEN_WIDTH === XR_HEIGHT))
  )
}

// 保留原来内部的error handler
const originalHandler = ErrorUtils.getGlobalHandler()

// 配置我们自定义的错误 handler
//

export function setGlobalErrorHandler (fn) {
  ErrorUtils.setGlobalHandler((e, isFatal) => {
    fn(e)
  })
  // if (Platform.OS === 'ios') {
  //   originalHandler(arguments)
  // } else {
  //   setTimeout(() => {
  //     originalHandler(arguments)
  //   }, 300)
  // }
  // console.error(lsErrorStack(e))
  // __DEV__ && throwErrorToNative()

  // // 我们自己的错误处理方式
  // // 发送检测数据
  // Report.send(e)
}

export function lsErrorStack (e) {
  if (!e || !(e instanceof Error) || !e.stack) {
    return {
      message: e,
      line: 0,
      column: 0
    }
  }

  try {
    const stack = e.stack.toString().split(/\r\n|\n/)
    const frameRE = /:(\d+:\d+)[^\d]*$/

    while (stack.length) {
      const frame = frameRE.exec(stack.shift())
      if (frame) {
        const position = frame[1].split(':')
        return { message: e.message, line: position[0], column: position[1] }
      }
    }
    return null
  } catch (e) {
    return null
  }
}

// 记录全局错误日志
export function elog (body) {
  if (!body) {
    return
  }
  const op = { body, method: 'POST' }
  if (memoryCache.cookie) {
    op.headers = { Cookie: memoryCache.cookie }
  }
  request(API_ROOT + '/api/g/e', op).then(() => {
  }).catch(() => {
  })
}

const AnroidVersions = {
  '9': 'Android 2.3',
  '10': 'Android 2.3.3',
  '11': 'Android 3.0',
  '12': 'Android 3.1',
  '13': 'Android 3.2',
  '14': 'Android 4.0',
  '15': 'Android 4.0.3',
  '16': 'Android 4.1',
  '17': 'Android 4.2',
  '18': 'Android 4.3',
  '19': 'Android 4.4',
  '20': 'Android 4.4W',
  '21': 'Android 5.0',
  '22': 'Android 5.1',
  '23': 'Android 6.0',
  '24': 'Android 7.0',
  '25': 'Android 7.1',
  '26': 'Android 8.0',
  '27': 'Android 8.1',
  '28': 'Android 9.0'
}

// 设置不同平台的userAgent
export function osUserAgent () {
  let userAgent = ''
  if (Platform.OS === 'ios') {
    userAgent = `Mozilla/5.0 (iPhone; RN; CPU iPhone OS ${Platform.Version} like Mac OS X)`
  } else if (Platform.OS === 'android') {
    const androidVersion = AnroidVersions[Platform.Version]
    if (androidVersion) {
      userAgent = `Mozilla/5.0 (Linux; RN; Android ${androidVersion}; )`
    } else {
      userAgent = `Mozilla/5.0 (Linux; RN; Android ${Platform.Version}; )`
    }
  } else {
    userAgent = `${Platform.OS} ${Platform.Version}`
  }
  return userAgent
}
