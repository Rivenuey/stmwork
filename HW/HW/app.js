// app.js
App({


  onLaunch() {
    console.log('App Launch');
  },
  Data: {
    mqttServer: 'wss://broker.emqx.io:8084',  // 替换为你的MQTT服务器地址
    mqttTopic: 'TEST12345',  // 替换为你的MQTT主题
  },


  

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
