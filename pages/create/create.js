const chooseLocation = requirePlugin('chooseLocation') //地图选点结果插件实例
const db = wx.cloud.database()
const app = getApp()
const _ = db.command;
const poi = [
	['云南民族村', 24.965712, 102.661308],
	['昆明融创海世界', 25.015775, 102.652997],
	['石林风景名胜区', 24.812902, 103.325221],
	['七彩云南·欢乐世界', 24.769026, 102.739337],
	['九乡风景名胜区', 25.077382, 103.387001],
	['滇池', 24.95972, 102.665486],
	['西山风景区', 24.951031, 102.63234],
	['西游洞景区', 25.141262, 102.646381],
	['云南野生动物园', 25.096852, 102.787801],
	[' 昆明动物园', 25.053547, 102.711521],
	['七彩云南古滇温泉山庄', 24.768052, 102.75769],
	['昆明花都海洋世界', 24.902411, 102.78941],
	['滇池海埂公园-滇池索道', 24.960029, 102.65237],
	['花之城', 25.054146, 102.789339],
	['大观楼', 25.023289, 102.673412],
	['云南映象', 25.015669, 102.649589],
	['滇池海埂公园', 24.96045, 102.65991],
	['小人国主题公园', 24.851002, 102.618312],
	['昆明老街', 25.04141, 102.70919],
	['斗南花卉市场', 24.902421, 102.788402],
	['古滇朵拉萌宠乐园', 24.765432, 102.755997],
	['七彩云南·古滇名城', 24.77222, 102.762207],
	['昙华寺', 25.045086, 102.747539],
	['昆明·梵高星空艺术馆(昆明大悦城)', 25.020565, 102.713267],
	['官渡古镇', 24.954961, 102.755809],
	['石林冰雪海洋世界', 24.81209, 103.311535],
	['昆明翠湖公园', 25.048538, 102.703989],
	['青龙峡风景区', 25.063914, 102.371529],
	['昆明融创乐园', 25.01522, 102.649256],
	['金殿风景名胜区-金殿公园', 25.087994, 102.767069],
	['南屏步行街', 25.036939, 102.711281],
	['大观公园', 25.022511, 102.672809],
	['昆明瀑布公园', 25.12675, 102.76501],
	['青鱼湾水上乐园', 24.857572, 102.526532],
	['云南省博物馆', 24.949454, 102.753515],
	['Park1903', 24.986425, 102.675484],
	['五华山', 25.04441, 102.711516],
	['红土地风景区', 25.910655, 103.069318],
	['海埂大坝', 24.973901, 102.65078],
	['昆明失恋博物馆(昆明大悦城)', 25.021081, 102.714526],
	['昆明植物园', 25.140356, 102.742708],
	['云南陆军讲武学校旧址', 25.047846, 102.700648],
	['金马碧鸡坊', 25.03278, 102.71012]
]

Page({

	data: {
		latitudes: [],
		longitudes: [],
		addresses: [],
		latitude: "",
		longitude: "",
		address: "",
		what: 0,
		list: [],
		key: 'KNZBZ-WNMLT-UECXY-LT2TY-YZZN7-L7F64', //在腾讯位置服务申请的key
		referer: 'POI推荐', //调用腾讯位置服务相关插件的app的名称
		rightArrow: "../images/rightArrow.png",
		arr: []
	},
	pointchange: function (e) {
		console.log(typeof (e.detail.value))
		this.data.want = parseInt(e.detail.value)
	},
	timechange: function (e) {
		this.data.tl = parseInt(e.detail.value)
	},
	write: function (e) {
		wx.navigateTo({
			url: '../write/write',
		})
	},
	onLoad: function (options) {
		var like = 0
		try {
			like = wx.getStorageSync('like')
			app.globalData.like = like
		} catch (e) {
		}
		var that = this
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
		var that = this
	},
	create: async function () {
		console.log(typeof (this.data.tl))
		if (typeof (this.data.tl) != 'number' || typeof (this.data.want) != 'number') {
			wx.showToast({
				title: '输入有误！',
				icon: "error"
			})
		} else if (this.data.want > 10) {
			wx.showToast({
				title: '选择的必经点数量不能大于10',
				icon: "none"
			})
		} else if (this.data.arr.length == 0) {
			wx.showToast({
				title: '请至少选择一个点',
				icon: "none"
			})
		} else if (app.globalData.like!=0) {
			var arr = JSON.parse(JSON.stringify(this.data.arr))

			for (var i = 0; i < arr.length; i++) {
				if (arr[i].length != 4) {
					arr[i][0] = i + 100
					arr[i].splice(1, 0, 5);
				}
			}
			console.log('arr', arr)
			if (!this.data.tl) {
				wx.showToast({
					title: '请输入景点数量',
					icon: 'none'
				})
			} else if (!this.data.want) {
				wx.showToast({
					title: '请输入游玩时间',
					icon: 'none'
				})
			} else {
				console.log('create', this.data.arr)
				console.log('传参', app.globalData.openid, arr, this.data.tl, this.data.want)
				const res = await wx.cloud.callContainer({
					config: {
						env: 'cloud1-2gzvk2cf379b86fb',
					},
					path: '/container-test/cre', // 填入业务自定义路径和参数
					header: {
						'content-type': "application/x-www-form-urlencoded"
					},
					method: 'POST',
					data: {
						user: JSON.stringify(app.globalData.openid),

						nec: JSON.stringify(arr),
						want: JSON.stringify(this.data.want),
						tl: JSON.stringify(this.data.tl),
					},
					// 其余参数同 wx.request
				});

				console.log(res);

				if (res.data.length) {
					this.data.list = []
					this.data.latitudes = []
					this.data.longitudes = []
					for (var i = 0; i < res.data.length; i++) {
						var t = res.data[i]
						if (t < 100) {
							this.data.list.push(poi[t][0])
							this.data.latitudes.push(poi[t][1])
							this.data.longitudes.push(poi[t][2])
						} else {
							this.data.list.push(this.data.arr[t - 100][0])
							this.data.latitudes.push(this.data.arr[t - 100][1])
							this.data.longitudes.push(this.data.arr[t - 100][2])
						}
					}
					this.setData({
						list: this.data.list
					})
				} else {
					wx.showToast({
						title: '没能获取到路线...',
						icon: 'none'
					})
				}
			}
		} else {
			wx.showModal({
				title: '您还未选择您的爱好',
				content: '是否现在前往选择？',
				success(res) {
					if (res.confirm) {
						wx.navigateTo({
							url: '../like/like',
						})
					} else if (res.cancel) {
						console.log('用户点击取消')
					}
				}
			})
		}
	},

	onHide: function () {

	},
	onReady: function () {

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
	add: function (e) {
		this.data.what = 1
		this.clickMap()
	},
	onShow: function () {
		console.log('index,what', this.data.change_index, this.data.what)
		// 从地图选点插件返回后，在页面的onShow生命周期函数中能够调用插件接口，取得选点结果对象
		const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
		console.log('location', location)
		if (location != null && this.data.what == 1) { // 1添加 3更改 2导航
			console.log(location)
			this.data.list.push(location.name)
			this.data.longitudes.push(location.longitude)
			this.data.latitudes.push(location.latitude)
			this.data.arr.push([location.name, location.latitude, location.longitude])
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
			this.data.arr[change_index] = [location.name, location.latitude, location.longitude]
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
		var arr = this.data.arr
		list.splice(current, 1)
		arr.splice(current, 1)
		this.setData({
			list: list,
			arr: arr
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

})