// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  var openid = wxContext.OPENID
  const res = await db.collection('user').where({
    _id:openid
  })
  .get({

  })
  const iddata = await db.collection('user').doc('cd045e75614099260db797eb71cc5526')
    .get({
  
    })
  var id = iddata.data.count
  if (res.data.length==0){
    await db.collection('user').add({
      data: {
        _id: openid,
        text: [],
        history: [],
        now: [],
        like:[]
        

      },
      success: function(res) {
        
      }
    })
    
    
    db.collection('user').doc('cd045e75614099260db797eb71cc5526').update({
      data: {
        // 表示指示数据库将字段自增 10
        count: _.inc(1)
      },
      success: function(res) {
        console.log(res.data)
      }
    })
    db.collection('user').doc(openid).update({
      data: {
        // 表示指示数据库将字段自增 10
        num:id
      },
      success: function(res) {
        console.log(res.data)
      }
    })
    
  }
  return {
    openid :openid,
    num:id
  } 
  
 

  
}