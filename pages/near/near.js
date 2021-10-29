// pages/near/near.js
const db = wx.cloud.database()
const user = db.collection('test')
const app = getApp()
const _ = db.command;
var QQMapWX = require('../../qqmap-wx-jssdk.js');
var qqmapsdk;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    latitude: 'unknown',
    longitude: 'unknown',
    to: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    qqmapsdk = new QQMapWX({
      key: 'M3RBZ-FHG6J-YGBFW-KJ3KD-QQ7B7-SBBOY'
    });
    var that = this
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userLocation'] != true) {
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
              wx.getLocation({
                type: 'gcj02',
                success(res) {
                  that.setData({
                    latitude: res.latitude,
                    longitude: res.longitude
                  })
                  that.change()

                  db.collection('text').where({
                    location: _.geoNear({
                      geometry: db.Geo.Point(that.data.longitude, that.data.latitude),
                      maxDistance: 500000

                    })
                  }).get({
                    success: function (res) {
                      // res.data 包含该记录的数据
                      console.log('附近点', res.data)
                      this.setData({
                        text: res.data
                      })
                      that.dispush()
                      that.caldis()
                    },
                    fail: function (res) {
                      console.log(res)
                    }
                  })
                  /*                   const speed = res.speed
                                    const accuracy = res.accuracy */
                },
                fail() {
                  wx.showToast({
                    title: '请打开手机GPS',
                  })
                }
              })
            }
          })
        } else {
          wx.getLocation({
            type: 'gcj02',
            success(res) {
              that.setData({
                latitude: res.latitude,
                longitude: res.longitude
              })
              that.change()

              db.collection('text').where({
                location: _.geoNear({
                  geometry: db.Geo.Point(that.data.longitude, that.data.latitude),
                  maxDistance: 500000
                })
              }).get({
                success: function (res) {
                  // res.data 包含该记录的数据
                  console.log('附近点', res.data)

                  that.setData({
                    text: res.data
                  })
                  that.dispush()
                  that.caldis()
                },
                fail: function (res) {
                  console.log(res)
                }
              })
              /*               const speed = res.speed
                            const accuracy = res.accuracy */
            },
            fail() {
              wx.showToast({
                title: '请打开手机GPS',
              })
            }
          })
        }
      }
    })


  },
  fresh: function () {
    var that = this
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userLocation'] != true) {
          wx.authorize({
            scope: 'scope.userLocation',
            success() {
              // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
              wx.getLocation({
                type: 'gcj02',
                success(res) {
                  that.setData({
                    latitude: res.latitude,
                    longitude: res.longitude
                  })


                  db.collection('text').where({
                    location: _.geoNear({
                      geometry: db.Geo.Point(that.data.longitude, that.data.latitude),
                      maxDistance: 500000

                    })
                  }).get({
                    success: function (res) {
                      // res.data 包含该记录的数据
                      console.log('附近点', res.data)
                      that.setData({
                        text: res.data
                      })
                      that.dispush()
                      that.caldis()
                    },
                    fail: function (res) {
                      console.log(res)
                    }
                  })
                  /*                   const speed = res.speed
                                    const accuracy = res.accuracy */
                },
                fail() {
                  wx.showToast({
                    title: '请打开手机GPS',
                  })
                }
              })
            }
          })
        } else {
          wx.getLocation({
            type: 'gcj02',
            success(res) {
              that.setData({
                latitude: res.latitude,
                longitude: res.longitude
              })
              that.change()

              db.collection('text').where({
                location: _.geoNear({
                  geometry: db.Geo.Point(that.data.longitude, that.data.latitude),
                  maxDistance: 500000
                })
              }).get({
                success: function (res) {
                  // res.data 包含该记录的数据
                  console.log('附近点', res.data)

                  that.setData({
                    text: res.data
                  })
                  that.dispush()
                  that.caldis()
                },
                fail: function (res) {
                  console.log(res)
                }
              })
              /*               const speed = res.speed
                            const accuracy = res.accuracy */
            },
            fail() {
              wx.showToast({
                title: '请打开手机GPS',
              })
            }
          })
        }
      }
    })


  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  change: function () {
    var la = this.data.latitude
    var lo = this.data.longitude
    var that = this
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: la,
        longitude: lo
      },
      get_poi: 0,
      success: function (res) { //成功后的回调
        console.log(res);
        var res = res.result;
        that.setData({
          address: res.address
        })
        /* var mks = []; */
        /**
         *  当get_poi为1时，检索当前位置或者location周边poi数据并在地图显示，可根据需求是否使用
         *
            for (var i = 0; i < result.pois.length; i++) {
            mks.push({ // 获取返回结果，放到mks数组中
                title: result.pois[i].title,
                id: result.pois[i].id,
                latitude: result.pois[i].location.lat,
                longitude: result.pois[i].location.lng,
                iconPath: './resources/placeholder.png', //图标路径
                width: 20,
                height: 20
            })
            }
        *
        **/
        //当get_poi为0时或者为不填默认值时，检索目标位置，按需使用
        /* mks.push({ // 获取返回结果，放到mks数组中
          title: res.address,
          id: 0,
          latitude: res.location.lat,
          longitude: res.location.lng,
          iconPath: './resources/placeholder.png', //图标路径
          width: 20,
          height: 20,
          callout: { //在markers上展示地址名称，根据需求是否需要
            content: res.address,
            color: '#000',
            display: 'ALWAYS'
          }
        });
        that.setData({ //设置markers属性和地图位置poi，将结果在地图展示
          markers: mks,
          poi: {
            latitude: res.location.lat,
            longitude: res.location.lng
          }
        }); */
      },
      fail: function (error) {
        console.error(error);
      },
      complete: function (res) {
        console.log(res);
      }
    })
  },
  dispush: function () {
    var la = this.data.latitude
    var lo = this.data.longitude
    this.setData({
      from: {
        latitude: la,
        longitude: lo
      }
    })
    console.log('push', this.data.text)
    for (const i of this.data.text) {
      this.data.to.push({
        latitude: i.wd,
        longitude: i.jd
      })
    }
  },
  caldis: function () {
    var from = this.data.from
    var to = this.data.to
    var that = this
    console.log('from', from)

    console.log('to', to)
    qqmapsdk.calculateDistance({
      mode: 'driving',

      from: from,
      to: to,
      success: function (res) { //成功后的回调
        console.log('距离', res);
        var res = res.result;
        var dis = [];
        var dur = [];
        for (var i = 0; i < res.elements.length; i++) {
          dis.push(res.elements[i].distance); //将返回数据存入dis数组，
          dur.push((res.elements[i].duration/60).toFixed(2)); //将返回数据存入dis数组，
        }
        that.setData({ //设置并更新distance数据
          distance: dis,
          duration: dur
        });
      },
      fail: function (error) {
        console.error('距离', error);
      },
      complete: function (res) {
        console.log('距离', res);
      }
    });


  },
  myshowDetail(event) {
    var id = event.currentTarget.id
    var all = this.data.text[id]
    all = JSON.stringify(all)
    wx.navigateTo({
      url: '../entry/entry?all=' + all,
    });
  },
 
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
  }
})