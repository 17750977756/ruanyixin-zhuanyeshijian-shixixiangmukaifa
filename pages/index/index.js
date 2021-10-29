// index.js
// 获取应用实例
const app = getApp()
const db = wx.cloud.database()
const _ = db.command


Page({
  data: {
    name:'',
    grids: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName') // 如需尝试获取用户信息可改为false
  },
  // 事件处理函数
  onLoad() {
    try{
			like = wx.getStorageSync('like')
			app.globalData.like = like
		}
		catch(e){

		}
    var that= this
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log(res)
        that.setData({
          openid: res.result.openid,
          
        })
        app.globalData.openid = res.result.openid
                  
      },
      
    })

  },
  onShow() {
    

    if (this.data.hasUserInfo) {
      this.setData({
        name: getApp().globalData.userInfo.nickName
        /* name: getApp().globalData.userInfo.nickName, */
      })
    }

  },
  onHide() {

  },
  getUserProfile(e) {
    var that = this
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '获取头像等信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写 
      success: (res) => {
        that.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
          name: res.userInfo.nickName
        })
      
        app.globalData.userInfo = this.data.userInfo
        app.globalData.hasUserInfo = true

      }

    })


  },
	onShareAppMessage: function () {
    return {
      title: '侦察姬',
      path: '/pages/create/create'
    }
  },
  onShareTimeline:function(){
    return {
      title: '侦察姬',
      
    }
  },
  onShareTimeline:function(){
    return {
      title: '侦察姬',
      
    }}
})