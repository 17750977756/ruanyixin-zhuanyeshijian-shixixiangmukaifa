const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
    const db = cloud.database()
    const MAX_LIMIT = 100
    exports.main = async (event, context) => {
      db.collection('user').get({
        success: function(res) {
          // res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
          console.log(res.data)
          return (3)
        },
        fail:function(res){
          return (4)
        }
      })
    }