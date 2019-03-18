import api from '../services'

const {UserInfo} = api.main

export default {
  namespace: 'app',
  state: {
    login: false,

    loading: false,
    tip: '',
    fetching: false,

    // 用户信息
    userInfo: {}
  },
  reducers: {
    setState (state, { payload }) {
      return { ...state, ...payload }
    }
  },
  effects: {
    * userInfo(p, {call, put}) {
      const userInfo = yield call(UserInfo)
      yield put({type: 'setState', payload: {userInfo}})
    }
  },
  subscriptions: {}
}
