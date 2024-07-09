// // pages/HW1/HW1.js
const app=getApp();
const KEY="daa55bd294950e95ab0399576dd52936";
import mqtt from"../../utils/mqtt.min.js";
const MQTTADDRESS="broker.mqttdashboard.com";
let client=null;//mqtt服务
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title:'红温智能火灾预防系统',
    welcome:'欢迎欢迎，今天的天气是晴',
    location:"无",
    temperature:15,
    currentTime: '',

// 红温提示您
    // temperature: 45,  // 从传感器读取的温度
    // humidity: 0,  // 从传感器读取的湿度
    // gasConcentration: 45,  // 从传感器读取的可燃气体浓度
    // fireAlert: '',
    // gasAlert: '',

    isConnect:true,
    mqttContontDialog:false,

      sensorList: [
        {
          img: "/images/温度.png",
          name: "DHT11",
          parameter: "室内温度",
          value: 0,
          unit: "°C",
          idx:0,
        },
        {
          img: "/images/湿度.png",
          name: "DHT11",
          parameter: "室内湿度",
          value: 0,
          unit: "%rh",
        },
        {
          img: "/images/icon_画板 1.png",
          name: "MQ2",
          parameter: "可燃气体浓度",
          value: 0,
          unit: "ppm",
        },

      ],
      otherSensorList:[
        {img:"",name:"灯",isOpen:false}
      ],
      isConnect:false,
      isPush:false,
      isSubscr:false,
      address:wx.getStorageSync('address')||'' ,
      port:wx.getStorageSync('port')||'',
      username:wx.getStorageSync('username')||'',
      password:wx.getStorageSync('password')||'',
      push:'',
      subscr:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(){
    this.getUserLocation()
      this.updateTime();
      setInterval(this.updateTime, 1000); // 每秒更新时间

  },


  


  updateTime() {
    const now = new Date();
    this.setData({
      currentTime: now.toLocaleString()
    });
  },
  openDialog(){
    this.setData({
      mqttContontDialog: true
    })

  },
  onClose(){
    this.setData({
      mqttContontDialog:false
    })
  },





  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
    //获取位置信息
    getUserLocation() {
      let that = this;
      wx.getSetting({
        success: res => {
          console.log(res, JSON.stringify(res));
  
          if (
            res.authSetting["scope.userLocation"] != undefined &&
            res.authSetting["scope.userLocation"] != true
          ) {
            wx.showModal({
              title: "请求授权当前位置",
              content: "需要获取您的地理位置，请确认授权",
              success: function (res) {
                if (res.cancel) {
                  wx.showToast({
                    title: "拒绝授权",
                    icon: "none",
                    duration: 1000,
                  });
                } else if (res.confirm) {
                  wx.openSetting({
                    success: function (dataAu) {
                      if (dataAu.authSetting["scope.userLocation"] == true) {
                        wx.showToast({
                          title: "授权成功",
                          icon: "success",
                          duration: 1000,
                        });
                        //再次授权，调用wx.getLocation的API
                        that.getLocation();
                      } else {
                        wx.showToast({
                          title: "授权失败",
                          icon: "none",
                          duration: 1000,
                        });
                      }
                    },
                  });
                }
              },
            });
          } else if (res.authSetting["scope.userLocation"] == undefined) {
            //调用wx.getLocation的API
            that.getLocation();
          } else {
            //res.authSetting['scope.userLocation'] == true
            //调用wx.getLocation的API
            that.getLocation();
          }
        },
      });
    },

  getLocation() {
    let that = this;
    wx.getLocation({
      type: "wgs84",
      success(res) {
        console.log("经纬度", res);
        if (res?.errMsg === "getLocation:ok") {
          /* ----------------通过经纬度获取地区编码---------------- */
          wx.request({
            url: "https://restapi.amap.com/v3/geocode/regeo?parameters",
            data: {
              key: KEY, //填入自己申请到的Key
              location: res.longitude + "," + res.latitude, //传入经纬度
            },
            header: {
              "content-type": "application/json",
            },
            success: function (res) {
              console.log("坐标转换和查询天气", res.data);
              wx.setStorageSync(
                "city",
                res.data.regeocode.addressComponent.adcode //地区编码
              );
              that.setData({
                location: res.data.regeocode.addressComponent.city +
                  " " +
                  res.data.regeocode.addressComponent.district,
              });

              wx.request({
                url: "https://restapi.amap.com/v3/weather/weatherInfo",
                data: {
                  key: KEY, //填入自己申请到的Key
                  city: res.data.regeocode.addressComponent.adcode, //传入地区编码
                },
                header: {
                  "content-type": "application/json",
                },
                success: function (weather) {
                  console.log("天气", weather.data);
                  that.setData({
                    temperature: weather.data.lives[0].temperature, //温度
                    weatherText: weather.data.lives[0].weather,
                    welcome: "欢迎欢迎！今天的天气是 " + weather.data.lives[0].weather, //欢迎语
                  });
                },
              });
            },
          });
        }
      },
      fail(err) {
        console.log("获取经纬度错误信息", err);
      },
    });
  },
    //连接mqtt
    connectMqtt() {
      let that = this;
      const options = {
        connectTimeout: 4000,
        address: this.data.address, // 输入的连接地址
        port: this.data.port, // 输入的端口号
        username: this.data.username, // 输入的用户名
        password: this.data.password, // 输入的密码
      };
  
      console.log("address是：", "wxs://" + options.address + '/mqtt');
      client = mqtt.connect("wxs://" + options.address + '/mqtt', options); // 连接方法
      client.on("connect",(e)=> {
        console.log("连接成功");
        this.setData({isConnect:true})

        wx.setStorageSync('address', options.address)
        wx.setStorageSync('port', options.port)
        wx.setStorageSync('username',options.username)
        wx.setStorageSync('password',options.password)
      });
      client.on("message", (topic, message) => {
        // console.log("topic:", topic, "收到消息：", message.toString());
        let getMessageObj = {}; //收到的消息
        getMessageObj = JSON.parse(message); //收到的消息转换成json对象
        console.log(getMessageObj);
        // TEMPERATURE
        // HUMIDITY

        // 红温提示您
        let fireAlert = '一切正常';

        if ((getMessageObj.hasOwnProperty('temp') && Number(getMessageObj.temp) > 20) ||
            (getMessageObj.hasOwnProperty('humi') && Number(getMessageObj.humi) < 80) ||
            (getMessageObj.hasOwnProperty('gas') && Number(getMessageObj.gas) > 1000)) {
          fireAlert = '注意防范火灾';
        }
  
        if (getMessageObj.hasOwnProperty('temp')) {
          that.setData({ 'sensorList[0].value': Number(getMessageObj.temp) });
        }
        if (getMessageObj.hasOwnProperty('humi')) {
          that.setData({ 'sensorList[1].value': Number(getMessageObj.humi) });
        }
        if (getMessageObj.hasOwnProperty('gas')) {
          that.setData({ 'sensorList[2].value': Number(getMessageObj.gas) });
        }
        that.setData({ fireAlert });
      })

      client.on("reconnect", (error) => {
        console.log("正在重连：", error);
        wx.showToast({
          icon: "none",
          title: "正在重连",
        });
      });
      client.on("error", (error) => {
        console.log("连接失败：", error);
        wx.showToast({
          icon: "none",
          title: "MQTT连接失败",
        });
      });
    },
    addPush() {
      let that = this
      if (!this.data.isConnect) {
        wx.showToast({
          icon: "none",
          title: "请先连接"
        });
        return
      }
      client.subscribe(this.data.push, {
        qos: 0
      }, function (err) {
        if (!err) {
          console.log("订阅成功");
          wx.showToast({
            icon: "none",
            title: "订阅成功"
          });

    //       // 可以在这里写一些订阅主题成功的逻辑
          that.setData({isPush: true})
        }
      });
    },
addSubscr(){
  if (!this.data.isConnect) {
    wx.showToast({
      icon: "none",
      title: "请先连接"
    });
    return
  }
  let msg = "发出的消息"
  let that=this
  client.subscribe(this.data.subscr, { 
    qos: 0 
  }, 
   function(err){
    if (!err) {
  //     console.log("发出的", msg);
  console.log('添加成功');
  that.setData({
    isSubscr:true
  })
  //     client.publish(this.data.subscr,JSON.stringify(msg));
    }
  }
  );
},
 
});