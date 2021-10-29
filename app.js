// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env:'h2h2-2gwfffx2350d6b21',
      traceUser: true
  })
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    like:0,
    userInfo: null,
    hasLogin: false,
        theme: 'light',
        GRID_DEMO_URL: '/example/index',
        iconTabbar: '/example/images/icon_tabbar.png',
        albums:[]
  }
})
