// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({env:'cloud1-2gzvk2cf379b86fb'})
const db = cloud.database();
const MAX_LIMIT = 100
// 云函数入口函数
exports.main = async (event, context) => {
  return db.collection('user').get({
    success: function(res) {
      // res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
      console.log('直接',res.data)
      return (res.data)
    }
  })
 
  
}