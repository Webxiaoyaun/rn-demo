import * as main from '../pages/api'
import {
  AESDecode, API_ROOT, loadingShow, loadingHide, err2string,
  osUserAgent, getCookie, request, renderTemplate
} from '../utils'

const DEBUG = false
const deviceUserAgent = osUserAgent()

const URLS = {
  main
}

const apis = {}

function __parseResponse (apioption, data) {
  try {
    let resolveData = data
    if (apioption.aesDecode) {
      resolveData = AESDecode(resolveData)
    }
    if (typeof apioption.parseResponse === 'function') {
      resolveData = apioption.parseResponse(data)
    }
    return Promise.resolve(resolveData)
  } catch (e) {
    return Promise.reject(e.message)
  }
}

function __getRequest (apioption) {
  return (p = {}) => {
    if ((DEBUG || apioption.debug) && apioption.mock) {
      return Promise.resolve(apioption.aesDecode ? AESDecode(apioption.mock) : apioption.mock)
    }
    let p1 = p
    if (typeof apioption.parseParam === 'function') {
      try {
        p1 = apioption.parseParam(p)
      } catch (e) {
        return Promise.reject(e)
      }
    }

    let op = {
      headers: {
        'User-Agent': deviceUserAgent
      }
    }

    if (p1) op.body = p1
    if (apioption.method) op.method = apioption.method
    if (apioption.headers) Object.assign(op.headers, apioption.headers)
    if (apioption.loading) {
      loadingShow()
    }
    let URL_ROOT = ''
    if (apioption.url.startsWith('/')) {
      URL_ROOT = API_ROOT
    }
    // if (memoryCache.cookie) op.headers.cookie = memoryCache.cookie
    // alert(memoryCache.cookie)
    getCookie('third_name')
    let pm = request(URL_ROOT + renderTemplate(apioption.url, p), op, apioption.synchronous).then(res => {
      if (apioption.loading) {
        loadingHide()
      }
      if (apioption.useOriginResponseData) {
        return __parseResponse(apioption, res)
      } else {
        if (res && res.success) {
          return __parseResponse(apioption, res.body)
        } else {
          return Promise.reject(err2string(res))
        }
      }
    })

    setTimeout(() => {
      pm.catch(() => {
        if (apioption.loading) {
          loadingHide()
        }
      })
    })

    return pm
  }
}

for (let modelKey in URLS) {
  const model = URLS[modelKey]
  const modelUrls = {}
  for (let urlKey in model) {
    modelUrls[urlKey] = __getRequest(model[urlKey])
  }
  apis[modelKey] = modelUrls
}

export default apis
