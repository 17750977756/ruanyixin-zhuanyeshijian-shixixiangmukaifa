
const db = wx.cloud.database();
const _ = db.command;
const user = db.collection('test')
var app = getApp();

Page({

  data: {
    
    // 是否显示loading
    showLoading: false,
    // loading提示语
    loadingMessage: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    if (app.globalData.openid) {
      db.collection('user').doc(app.globalData.openid).get({
        success: function (res) {
          // res.data 包含该记录的数据
          that.setData({
            diaries: res.data.text
          })
        }
      })
    } else {
      wx.showToast({
        title: '请登录',
      })

    }
  },
  onShow() {
    
  },


  // 查看详情
  myshowDetail(event) {
    var id=event.currentTarget.id
    var all=this.data.diaries[id]
    console.log(all)
    all=JSON.stringify(all)
    wx.navigateTo({
      url: '../entry/entry?all=' + all,
    });
  
},
onShareAppMessage: function () {
  return {
    title: '侦察姬',
    path: '/pages/create/create'
  }
}

})