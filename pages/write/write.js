const chooseLocation = requirePlugin('chooseLocation') //地图选点结果插件实例
const app = getApp()
const db = wx.cloud.database();
const _ = db.command;
var util = require('../../utils/util');
const user = db.collection('user')
Page({
  data: {
    see:false,
    haspos:false,
    latitudes: [],
		longitudes: [],
		addresses: [],
		latitude: "",
		longitude: "",
    address: "",
    name:'',
		what: 0,
		list: [],
		key: 'KNZBZ-WNMLT-UECXY-LT2TY-YZZN7-L7F64', //在腾讯位置服务申请的key
		referer: 'POI推荐', //调用腾讯位置服务相关插件的app的名称
		rightArrow: "../images/rightArrow.png",
    hasUserInfo: false,
    hasloc: false,
    dataMsg: '',
    statusMsg: '',
    fileID: null,
    coverImage: '',
    tempFilePath: '',
    currentPhoto: false,
    albumIndex: -1,
    albums: [],
    photosOrigin: [],
    photosNew: [],
    newphotos_url: [],
    index: '',
    piclist:[],
    tp:[]
  },
  clickMap() {
		let that = this
		//获取用户的当前设置。返回值中只会出现小程序已经向用户请求过的权限
		wx.getSetting({
			success(res) {
				if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
					//表示非初始化进入该页面 且未授权：
					wx.showModal({
						title: '请求授权当前位置',
						content: '需要获取您的地理位置，请确认授权',
						showCancel: true,
						cancelText: '取消',
						cancelColor: '#000000',
						confirmText: '确定',
						confirmColor: '#3CC51F',
						success: (result) => {
							if (res.cancel) {
								wx.showToast({
									title: '拒绝授权',
									icon: 'none',
									duration: 1000
								});
							} else if (result.confirm) {
								//调起客户端小程序设置界面，返回用户设置的操作结果。 
								//设置界面只会出现小程序已经向用户请求过的权限
								wx.openSetting({
									success: (dataAu) => {
										if (dataAu.authSetting["scope.userLocation"] == true) {
											wx.showToast({
												title: '授权成功',
												icon: 'success',
												duration: 1000
											});
											//再次授权之后，调用腾讯位置服务的地图选点插件API
											that.callQQPlugin()
										} else {
											wx.showToast({
												title: '授权失败',
												icon: 'none',
												duration: 1000
											});
										}
									}
								});

							}
						}
					});

				} else if (res.authSetting['scope.userLocation'] == undefined) {
					//调用腾讯位置服务的地图选点插件API
					that.callQQPlugin()
				} else {
					//调用腾讯位置服务的地图选点插件API
					that.callQQPlugin()
				}
			}

		})
	},
  callQQPlugin() {
		const key = this.data.key; //使用在腾讯位置服务申请的key
		const referer = this.data.referer; //调用插件的app的名称
		const latitude = this.data.latitude;
		const longitude = this.data.longitude;
		this.data.what = 1
		if (latitude != "" && longitude != "") {
			const location = JSON.stringify({
				latitude: latitude,
				longitude: longitude
			});
			wx.navigateTo({
				url: 'plugin://chooseLocation/index?key=' + key + '&referer=' + referer + '&location=' + location
			});
		} else {
			wx.navigateTo({
				url: 'plugin://chooseLocation/index?key=' + key + '&referer=' + referer
			});
		}

	},
  onShow: function () {
		// 从地图选点插件返回后，在页面的onShow生命周期函数中能够调用插件接口，取得选点结果对象
		const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
		if (location != null && this.data.what == 1) {
      console.log(location)
      
			this.data.list.push(location.name)
			this.data.longitudes.push(location.longitude)
			this.data.latitudes.push(location.latitude)
			this.setData({
				latitude: location.latitude,
				longitude: location.longitude,
				address: location.address,
        list: this.data.list,
        name:location.name,
        haspos:true
			})
			if (location!=null){
				this.data.what=2
			}

		}
	},
  
  onLoad: function (options) {
    var that = this
    if (app.globalData.openid) {
      user.doc(app.globalData.openid).get({
        success: function (res) {
          that.setData({
            now: res.data.now
          })
        }
      })
    } else {
      wx.showToast({
        title: '请登录',
      })
    }

  },

  // 选择图片
  chooseImage: function () {
    const items = []

    wx.chooseImage({
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        console.log(res.tempFilePaths)
        let tempFilePaths = res.tempFilePaths
        for (const tempFilePath of tempFilePaths) {
          items.push({
            src: tempFilePath
          })
        }
        this.setData({
          tp:res.tempFilePaths,
          photosNew: items,
          coverImage: tempFilePaths[0]
        })
        console.log(this.data.tp)
      }
    })
  },

  // 上传图片
  uploadPhoto(filePath) {
    return wx.cloud.uploadFile({
      cloudPath: `${Date.now()}-${Math.floor(Math.random(0, 1) * 10000000)}.png`,
      filePath
    })
  },

  centext: function (e) {
    const data = this.data
    const formData = e.detail.value;
    console.log(formData)
    if (!formData.content || !formData.title) {
      return wx.showToast({
        title: '标题、文章内容不能为空',
        icon: 'none'
      });
    }
    if (!this.data.haspos) {
      return wx.showToast({
        title: '请先选择地点',
        icon: 'none'
      });
    }
    this.setData({
      title : formData.title,
      text : formData.content
      })
     
    wx.showLoading({
      title: '加载中'
    })

    // 并发上传图片
    
    const uploadTasks = this.data.photosNew.map(item => this.uploadPhoto(item.src))
    Promise.all(uploadTasks).then(result => {
      console.log('result', result)
     for (const file of result) {
        this.data.piclist.push(file.fileID)
      }
      this.upload()
      
    })
   
  },

upload(){
  var time = util.formatTime(new Date());
  var title=this.data.title
  var text=this.data.text
  var pl=this.data.piclist
  var address=this.data.address
  var name=this.data.name
  var wd=this.data.latitude
  var jd=this.data.longitude
  var see=this.data.see
  db.collection('text').add({
    // data 字段表示需新增的 JSON 数据
    data: {    
        title,
        text,
        time,
        address,
        name,
        jd,
        wd,
        pl,
        location: new db.Geo.Point(jd, wd),
        see
    },
    success: function(res) {
      // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
      console.log(res)
    }
  })


  db.collection('user').doc(app.globalData.openid).update({
    data: {
      text: _.unshift({
        title,
        text,
        time,
        address,
        name,
        jd,
        wd,
        pl
      })
    },
    success: function (res) {
      console.log('上传返回',res)
      wx.hideLoading()
      wx.showToast({
        title: '上传成功',
      })
    }
  })
},

  addPhotos(photos, comment) {

    // 从全局数据中读出用户信息里的照片列表
    const oldPhotos = app.globalData.albums[this.data.albumIndex].photos
    const albumPhotos = photos.map(photo => ({
      fileID: photo.fileID,
      comments: comment
    }))

    // 合并老照片的数组和新照片的数组
    app.globalData.albums[this.data.albumIndex].photos = [...oldPhotos, ...albumPhotos]
    db.collection('user').doc(app.globalData.id).update({
      data: {
        albums: db.command.set(app.globalData.allData.albums)
      }
    }).then(result => {
      console.log('写入成功', result)
      wx.navigateBack()
    })
    // 在此插入储存图片信息代码
  },
  switch:function(e){
    this.setData({
      see:e.detail.value
    })
  },
	onShareAppMessage: function () {
    return {
      title: '侦察姬',
      path: '/pages/create/create'
    }
  }
})