// pages/like/like.js
const app = getApp()
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    checkbox:[],
  checkboxItems: [
    {name: '云南民族村', value:0},
    {name: '昆明融创海世界', value:1},
    {name: '石林风景名胜区', value:2},
    {name: '七彩云南·欢乐世界', value:3},
    {name: '九乡风景名胜区', value:4},
    {name: '滇池', value:'5'},
    {name: '西山风景区', value:'6'},
    {name: '西游洞景区', value:'7'},
    {name: '云南野生动物园', value:'8'},
    {name: '七彩云南古滇温泉山庄', value:'10'},
    {name: '昆明花都海洋世界', value:'11'},
    {name: '滇池海埂公园-滇池索道', value:'12'}
  ],
  },

  /**
   * 生命周期函数--监听页面加载
   */

 save:function(e){
console.log(this.data.checkbox)
db.collection('user').doc(app.globalData.openid).update({
  // data 传入需要局部更新的数据
  data: {
    like:this.data.checkbox
  },
  success: function(res) {
    console.log(res.data)
  }
})
 },
 get:async function(){
  console.log(JSON.stringify(this.data.checkbox))
  if (this.data.checkbox.length){
  wx.showLoading({
    title: '推测爱好中..',
  })
  const res = await wx.cloud.callContainer({
    config: {
      env: 'h2h2-2gwfffx2350d6b21',
    },
    path: '/container-test/svd', // 填入业务自定义路径和参数
    header:{
      'content-type': "application/x-www-form-urlencoded"
    },
    method: 'POST',
    data: {
      like: JSON.stringify(this.data.checkbox),
      user : JSON.stringify(app.globalData.openid)
    },
    // 其余参数同 wx.request
  });
  wx.hideLoading({
    success: (res) => {},
  })
  if (res){
    wx.showToast({
      title: '已为您推算爱好',
    })
  }
  app.globalData.like = 1
  wx.setStorage({
    data: 1,
    key: 'like',
  }),
  console.log(res);
}
else
{
  wx.showToast({
    title: '请至少选择一项感兴趣景点',
    icon:"none"
  })
}
},

checkboxChange: function (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value);
    var box = e.detail.value
    var t = []
    for (var i=0;i<box.length;i++){
      t.push([parseInt(box[i]),5])
    }
    console.log(t)
    this.setData({
       
        checkbox: t
    });
},
  onLoad: function (options) {

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
	onShareAppMessage: function () {
    return {
      title: '侦察姬',
      path: '/pages/create/create'
    }
  }
})