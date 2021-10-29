const db = wx.cloud.database();
const _ = db.command;
var app = getApp();

Page({

  data: {
    inputShowed: false,
    inputVal: "",
    text: [],
    // 是否显示loading
    showLoading: false,
    // loading提示语
    loadingMessage: '',
  },
  search: function (value) {
    console.log('输入', value)
    var fit = []
    var result = []
    db.collection('text').where({
        title: {
          $regex: value,
        }
      })
      .get({
        success: function (res) {
          console.log('查询结果', res.data)
          for (var i = 0; i < res.data.length; i++) {
            fit.push({
              text: res.data[i].title,
              value: res.data[i]._id,
            })
          }
        }
      })
    
    console.log('结果', fit)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(fit)
      }, 1000)
    })
  },
  selectResult: function (e) {
    console.log('select result', e.detail)
    db.collection('text').doc(e.detail.item.value).get({
      success: function(res) {
        // res.data 包含该记录的数据
        console.log(res.data)
        var all={
          address:res.data.address,
          name:res.data.name,
          pl:res.data.pl,
          jd:res.data.jd,
          wd:res.data.wd,
          text:res.data.text,
          title:res.data.title,
          time:res.data.time

        }
        all = JSON.stringify(all)
        console.log('all',all)
        wx.navigateTo({
          url: '../entry/entry?all=' + all,
        });
      }
    })
    
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      search: this.search.bind(this)
    })
    var that = this
    const items = []

    wx.cloud.callFunction({
      name: 'add',
      success: res => {
        console.log('云函数返回', res.result.data)

        for (const i of res.result.data) {
          this.data.text.push(i.text[1])
          this.data.text.push(i.text[2])
          this.data.text.push(i.text[0])
          
         
        }
        this.setData({
          text: this.data.text
        })
      },
      fail: err => {
        console.error('[云函数] [get] 调用失败', err)
      }
    })

  },
  onShow() {

  },


  // 查看详情
  myshowDetail(event) {
    var id = event.currentTarget.id
    var all = this.data.text[id]
    all = JSON.stringify(all)
    wx.navigateTo({
      url: '../entry/entry?all=' + all,
    });
  },
  showDetail(all) {
    
  },
  
	onShareAppMessage: function () {
    return {
      title: '侦察姬',
      path: '/pages/create/create'
    }
  }
})