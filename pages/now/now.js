const chooseLocation = requirePlugin('chooseLocation') //地图选点结果插件实例
const db = wx.cloud.database()
const app = getApp()
const _ = db.command;
Page({

	/**
	 * 页面的初始数据
	 */
	data: {

		latitudes: [],
		longitudes: [],
		addresses: [],
		latitude: "",
		longitude: "",
		address: "",
		what: 0,
		list: [],
		key: 'M3RBZ-FHG6J-YGBFW-KJ3KD-QQ7B7-SBBOY', //在腾讯位置服务申请的key
		referer: 'zglxdm', //调用腾讯位置服务相关插件的app的名称
		rightArrow: "../images/rightArrow.png"
	},


	write: function (e) {
		wx.navigateTo({
			url: '../write/write',
		})
	},


	onLoad: function (options) {

	},

	onHide: function () {
		wx.setStorage({
				data: this.data.longitudes,
				key: 'longitudes',
			}),
			wx.setStorage({
				data: this.data.list,
				key: 'list',
			}),
			wx.setStorage({
				data: this.data.latitudes,
				key: 'longitudes',
			})

	},
	onReady: function () {
		var that = this
		wx.getStorage({
			key: 'list',
			success(res) {
				console.log(res)
				that.setData({
					list: res.data
				})
			}
		})
	},
	/**
	 * 生命周期函数--监听页面显示
	 */

	change: function (e) {
		var current = e.currentTarget.dataset.index;
		this.data.change_index = current
		this.data.what = 3
		console.log(this.data.change_index, this.data.what)
		this.clickMap()
	},
	onShow: function () {
		console.log(this.data.change_index, this.data.what)
		// 从地图选点插件返回后，在页面的onShow生命周期函数中能够调用插件接口，取得选点结果对象
		const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
		if (location != null && this.data.what == 1) { // 1添加 3更改 2导航
			console.log(location)
			this.data.list.push(location.name)
			this.data.longitudes.push(location.longitude)
			this.data.latitudes.push(location.latitude)
			this.setData({
				latitude: location.latitude,
				longitude: location.longitude,
				address: location.name,
				list: this.data.list
			})
			if (location != null) {
				this.data.what = 2
			}

		} else if (location != null && this.data.what == 3) { // 1添加 3更改 2导航
			console.log(location)
			var change_index = this.data.change_index
			console.log(change_index)
			this.data.list[change_index] = location.name
			this.data.longitudes[change_index] = location.longitude
			this.data.latitudes[change_index] = location.latitude
			this.setData({
				latitude: location.latitude,
				longitude: location.longitude,
				address: location.name,
				list: this.data.list
			})
			if (location != null) {
				this.data.what = 2
			}

		}
	},
	add: function (e) {
		this.data.what = 1
		this.clickMap()
	},
	//腾讯位置服务地图选点
	clickMap() {
		let that = this
		console.log(this.data.change_index, this.data.what)
		//获取用户的当前设置。返回值中只会出现小程序已经向用户请求过的权限
		wx.getSetting({
			success(res) {
				//console.log(res)
				//scope.userLocation 就是地理授权的标志：
				//res.authSetting['scope.userLocation'] == undefined 表示初始进入该页面
				//res.authSetting['scope.userLocation'] == false 表示非初始化进入该页面 且未授权
				//res.authSetting['scope.userLocation'] == true 表示地理位置授权
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
	//调用腾讯位置服务的地图选点插件API
	callQQPlugin() {
		const key = this.data.key; //使用在腾讯位置服务申请的key
		const referer = this.data.referer; //调用插件的app的名称
		const latitude = this.data.latitude;

		const longitude = this.data.longitude;
		if (this.data.what == 2) {
			this.data.what = 1
		}
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
	//腾讯位置服务路线规划
	routePlan() {
		let that = this
		//获取用户的当前设置。返回值中只会出现小程序已经向用户请求过的权限
		wx.getSetting({
			success(res) {

				//scope.userLocation 就是地理授权的标志：
				//res.authSetting['scope.userLocation'] == undefined 表示初始进入该页面
				//res.authSetting['scope.userLocation'] == false 表示非初始化进入该页面 且未授权
				//res.authSetting['scope.userLocation'] == true 表示地理位置授权
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
											//再次授权之后，调用腾讯位置服务的路线规划插件API
											that.callRoutePlanPlugin()
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
					//调用腾讯位置服务的路线规划插件API
					that.callRoutePlanPlugin()
				} else {
					//调用腾讯位置服务的路线规划插件API
					that.callRoutePlanPlugin()
				}
			}

		})
	},
	//
	del: function (e) {
		var current = e.currentTarget.dataset.index;
		var list = this.data.list;
		list.splice(current, 1)
		this.setData({
			list: list
		})
	},
	callRoutePlanPlugin() {
		let plugin = requirePlugin('routePlan') //路线规划插件
		let key = this.data.key;
		let referer = this.data.referer; //调用插件的app的名称
		let latitude = this.data.latitude
		let longitude = this.data.longitude
		let longitudes = this.data.longitudes

		if (latitude != "" && longitude != "") {
			let endPoint = JSON.stringify({ //终点
				name: this.data.address,
				latitude: latitude,
				longitude: longitude
			})

			wx.navigateTo({
				url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint= ' + endPoint
			});
		} else {
			console.log('请先选择地点')
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
	save: function (e) {
		if (app.globalData.openid) {
			var address = this.data.list
			db.collection('user').doc(app.globalData.openid).update({
				// data 传入需要局部更新的数据
				data: {
					// 表示将 done 字段置为 true
					now: address,
					history: _.unshift({
						address
					})
				},
				success: function (res) {
					wx.showToast({
						title: '已保存路线至云',
					})
				}
			})
		} else {
			wx.showToast({
				title: '求你登录一下好不好？',
			})
		}
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
      
    }}
})