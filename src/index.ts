/**
 * 定义全局变量
 * webkit：iOS通信桥接对象
 * js_android：Android通信桥接对象
 */

declare global {
  interface Window {
    webkit: any;
    js_android: any;
  }
}

/**
 * iOS 同步返回参数类型
 */
type PromptType = {
  type: string;
  [propName: string]: any;
};

class JSBridge {
  /**
   * 判断iOS设备
   */
  private static isiOS() {
    return /iPhone/i.test(window.navigator.userAgent);
  }

  /**
   * 判断安卓设备
   */
  private static isAndroid() {
    return /Linux|Android/i.test(window.navigator.userAgent);
  }

  /**
   * 调用原生方法通信
   * @param options
   * options.fnName 原生方法名
   * options.data 传递参数（对象类型）/如果没有，则传递null
   * options.iOSPrompt 处理iOS同步返回
   */
  private static call(options: { fnName: string; data?: object; iOSPrompt?: PromptType }) {
    if (JSBridge.isiOS()) {
      try {
        if (options.iOSPrompt) {
          return prompt(JSON.stringify(options.iOSPrompt));
        } else {
          return window.webkit.messageHandlers[options.fnName].postMessage(
            options.data ? JSON.stringify(options.data) : null,
          );
        }
      } catch (err) {
        console.log(err);
      }
    } else if (JSBridge.isAndroid()) {
      try {
        return window.js_android[options.fnName](options.data ? JSON.stringify(options.data) : null);
      } catch (err) {
        console.log(err);
      }
    }
  }

  /**
   * ================================ 黄金分割线：使用者只需阅读以下内容 ================================
   */

  /**
   * 跳转微信小程序
   * @param {*} options
   */
  public static launchMiniProgram(options: {
    userName: string /** 小程序原始id */;
    path: string /** 拉起小程序页面的可带参路径，不填默认拉起小程序首页 */;
    miniprogramType: 0 | 1 | 2 /** 打开类型；0：正式版，1：开发版，2：体验版 */;
  }) {
    JSBridge.call({
      fnName: 'launchMiniProgram',
      data: options,
    });
  }

  /**
   * H5调用原生支付
   */
  public static payment(params: {
    callback: string /** 支付回调函数名 */;
    payType: string /** 支付类型，目前仅支持支付宝支付、微信支付、 熊猫支付 */;
    payStr: string /** 支付参数（这里需要和后台沟通，将原生拉起支付的参数以JSON字符串形式返回，到时直接传递给原生并由原生解析即可） */;
    orderNo?: string /** 订单号（有时原生调用支付回调函数之后，H5这边需要通过订单号查询支付状态，所以这里将订单号传给原生，原生在回调时作为参数回传给H5使用） */;
  }) {
    JSBridge.call({
      fnName: 'payment',
      data: params,
    });
  }

  /**
   * H5调用原生分享
   */
  public static shareWith(options: {
    type: 0 | 1 | 2 | 3 | 4 /** 分享类型： 0 文字 / 1 图片 / 2 网页链接 / 3 视频连接 / 4 小程序 */;
    title?: string /** 标题（可选） */;
    link?: string /** 网页链接（可选） */;
    text?: string /** 文字内容/网页链接描述（可选） */;
    videoUrl?: string /** 视频连接地址（可选） */;
    imageUrl?: string /** 图片链接地址/网页链接缩略图（可选） */;
    imageBase64?: string /** 图片base64（可选） */;
  }) {
    JSBridge.call({
      fnName: 'shareWith',
      data: options,
    });
  }

  /**
   * 保存图片至手机相册
   * @param images 图片集合/这里将图片的在线链接放入集合传递给原生进行保存
   */
  public static saveImages(images: string[]) {
    JSBridge.call({
      fnName: 'saveImages',
      data: images,
    });
  }
  /**
   * 保存视频至手机相册
   * @param {string} videoUrls 视频地址集合/这里将视频的在线链接放入集合传递给原生进行保存
   */
  public static saveVideos(videoUrls: string[]) {
    JSBridge.call({
      fnName: 'saveVideos',
      data: videoUrls,
    });
  }

  /**
   * 通知原生返回上一页（原生pop控制器）
   */
  public static nativeBack() {
    // JSBridge.call('nativeBack');
    if (JSBridge.isiOS()) {
      try {
        window.webkit.messageHandlers.nativeBack.postMessage(null);
      } catch (err) {
        try {
          window.webkit.messageHandlers.gobackAPP.postMessage(null);
        } catch (e) {
          console.log(e);
        }
      }
    } else if (JSBridge.isAndroid()) {
      try {
        window.js_android.nativeBack(null);
      } catch (err) {
        try {
          window.js_android.gobackAPP(null);
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  /**
   * 通知原生绑定微信
   * @param callback 微信绑定之后的回调函数
   */
  public static bindWeChat(callback: string) {
    JSBridge.call({
      fnName: 'bindWeChat',
      data: { callback },
    });
  }
  /**
   * 通知原生打开微信
   */
  public static openWeChat() {
    JSBridge.call({
      fnName: 'openWeChat',
    });
  }

  /**
   * 通知原生定位
   * @param callback 原生定位成功以后调用H5回调函数，并将定位信息作为回调函数参数传递。
   */
  public static getLocation(callback: string) {
    JSBridge.call({
      fnName: 'getLocation',
      data: { callback },
    });
  }

  /**
   * 从原生获取token。
   *
   * iOS开发者注意：----- 此方法通过prompt触发，type类型为：GET_TOKEN
   */
  public static getToken() {
    const token = JSBridge.call({
      fnName: 'getToken',
      iOSPrompt: { type: 'GET_TOKEN' },
    });
    return token ? (token as string) : '';
  }

  /**
   * ================================ 【四川始生万物科技有限公司专用】 ================================
   */
  /**
   * 原生活动商品分享
   * @description 免费领和秒杀的分享
   * @param options 配置项
   * @param options.goodsType      0：免费领 1：秒杀
   * @param options.itemId         活动商品id
   */
  public static shareActivityGoods(options: { goodsType: 0 | 1; itemId: string }) {
    JSBridge.call({
      fnName: 'shareActivityGoods',
      data: options,
    });
  }
  /**
   * 邀请好友购买会员
   * @param callback 回调方法名
   */
  public static inviteMembers(callback: string) {
    JSBridge.call({
      fnName: 'inviteMembers',
      data: { callback },
    });
  }
  /**
   * 通知原生播放广告视频
   * @param callback
   */
  public static playADVideo(options: { callback: string; viewToken: string }) {
    JSBridge.call({
      fnName: 'playADVideo',
      data: options,
    });
  }
}

const jsBridge = JSBridge;
export default jsBridge;
