# 概述

此库主要用作 H5 和原生通过 **方法** 通信，使用本库，必须原生根据本库要求定义相应的方法，否则无法使用。严格上，原生接收参数的类型为 **对象类型**，由于 Android 无法直接接收对象，所以本库 **在处理安卓参数时，先 JSON 序列化之后再进行传递**。H5 在调用原生方法时，如果没有参数设置，本库会默认传递 `null` ，原生在处理参数时需注意。

如果调用原生方法时，只设置一个参数，本库会默认以对象进行传递，比如 getLocation 获取定位信息，H5 在调用时直接传递回调函数名即可，如下所示：

```
getLocation('handler');
```

其中，handler 为 H5 挂载在 window 上的全局方法，供原生调用的方法名。本库会做特殊处理，原生接收到的类型为：

```
{callback: 'handler'}
```

再次强调，由于 Android 无法直接接收对象，所以本库在处理安卓参数时，如果是对象类型，则先 JSON 序列化之后再进行传递。

**同步返回：**

在H5和原生交互的方法中，可能会遇到调用原生方法同步返回的情况，比如，我要调用 *getToken* 方法获取用户token，期望原生能够直接返回，而不是再定义一个方法供原生调用将token传递给H5。由于安卓在方法内部可以直接返回，而iOS不能，所以这里H5采用`prompt`方式处理，那么iOS开发者在如下方法：

```objective-c
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString * _Nullable result))completionHandler;
```

中统一拦截H5中的prompt，并通过H5传递过来的type类型判断并做相应处理。

# 原生实现/H5 调用声明文件如下

特别说明：

1. 如下示例中的 callback 表示 H5 给原生作为回调的函数名变量，H5 调用时将原生回调的函数名作为参数设置;

```typescript
/**
 * 跳转微信小程序
 * @param {*} options
 */
static launchMiniProgram(options: {
    userName: string /** 小程序原始id */;
    path: string /** 拉起小程序页面的可带参路径，不填默认拉起小程序首页 */;
    miniprogramType: 0 | 1 | 2 /** 打开类型；0：正式版，1：开发版，2：体验版 */;
}): void;
/**
 * H5调用原生支付
 */
static payment(params: {
    callback: string /** 支付回调函数名 */;
    payType: string /** 支付类型，目前仅支持支付宝支付、微信支付、 熊猫支付 */;
    payStr: string /** 支付参数（这里需要和后台沟通，将原生拉起支付的参数以JSON字符串形式返回，到时直接传递给原生并由原生解析即可） */;
    orderNo?: string /** 订单号（有时原生调用支付回调函数之后，H5这边需要通过订单号查询支付状态，所以这里将订单号传给原生，原生在回调时作为参数回传给H5使用） */;
}): void;
/**
 * H5调用原生分享
 */
static shareWith(options: {
    type: 0 | 1 | 2 | 3 | 4 /** 分享类型： 0 文字 / 1 图片 / 2 网页链接 / 3 视频连接 / 4 小程序 */;
    title?: string /** 标题（可选） */;
    link?: string /** 网页链接（可选） */;
    text?: string /** 文字内容/网页链接描述（可选） */;
    videoUrl?: string /** 视频连接地址（可选） */;
    imageUrl?: string /** 图片链接地址/网页链接缩略图（可选） */;
    imageBase64?: string /** 图片base64（可选） */;
}): void;
/**
 * 保存图片至手机相册
 * @param images 图片集合/这里将图片的在线链接放入集合传递给原生进行保存
 */
static saveImages(images: string[]): void;
/**
 * 保存视频至手机相册
 * @param {string} videoUrls 视频地址集合/这里将视频的在线链接放入集合传递给原生进行保存
 */
static saveVideos(videoUrls: string[]): void;
/**
 * 通知原生返回上一页（原生pop控制器）
 */
static nativeBack(): void;
/**
 * 通知原生绑定微信
 * @param callback 微信绑定之后的回调函数
 */
static bindWeChat(callback: string): void;
/**
 * 通知原生打开微信
 */
static openWeChat(): void;
/**
 * 通知原生定位
 * @param callback 原生定位成功以后调用H5回调函数，并将定位信息作为回调函数参数传递。
 */
static getLocation(callback: string): void;
/**
 * 从原生获取token
 *
 * 由于H5在和iOS通信时，iOS不能直接返回数据，所以这里H5采用prompt方式处理。然后iOS开发者在如下方法：
 * - (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString * _Nullable result))completionHandler
 * 中拦截H5中的prompt，通过type类型判断并做相应处理
 *
 * 「iOS开发者注意」----- 此方法的type类型为：GET_TOKEN
 */
static getToken(): void;
/**
 * ———————————————————————————————— 【始生万物产品特有交互】 ————————————————————————————————
 */
/**
 * 原生活动商品分享
 * @description 免费领和秒杀的分享
 * @param options 配置项
 * @param options.goodsType      0：免费领 1：秒杀
 * @param options.itemId         活动商品id
 */
static shareActivityGoods(options: {
    goodsType: 0 | 1;
    itemId: string;
}): void;
/**
 * 邀请好友购买会员
 * @param callback 回调方法名
 */
static inviteMembers(callback: string): void;
```
