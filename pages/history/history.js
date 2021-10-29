// pages/history/history.js
const app = getApp()
const db = wx.cloud.database();
const _ = db.command;
const user = db.collection('test')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that=this
    if(app.globalData.openid){
    db.collection('user').doc(app.globalData.openid).get({
      success: function(res) {
        // res.data 包含该记录的数据
        console.log(res)
        that.setData({
          list:res.data.history
        })
      }
    })}
    else{
      wx.showToast({
        title: '请登录',
      })
      
    }
  },
	guide(e) {
		let plugin = requirePlugin('routePlan') //路线规划插件
		var current = e.currentTarget.dataset.index;
		console.log("cureent=", current)
		let referer = this.data.referer; //调用插件的app的名称
		var end = e.currentTarget.dataset.index + 1;
		let key = this.data.key;
		let latitudes = this.data.latitudes
		let longitudes = this.data.longitudes
		let list = this.data.list
		this.data.what = 2;
		let startPoint = JSON.stringify({ //终点
			name: list[current],
			latitude: latitudes[current],
			longitude: longitudes[current]
		})
		let endPoint = JSON.stringify({ //终点
			name: list[end],
			latitude: latitudes[end],
			longitude: longitudes[end]
		})
		wx.navigateTo({
			url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint= ' + endPoint + '&startPoint= ' + startPoint
		});

	},
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  
	onShareAppMessage: function () {
    return {
      title: '侦察姬',
      path: '/pages/create/create'
    }
  },
  onShareTimeline:function(){
    return {
      title: '侦察姬',
      
    }}
})