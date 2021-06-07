# 概述

此库主要用作 H5 调用原生方法通信，H5开发者若要使用本库，需提示原生开发者根据本库 `声明文件` 要求定义相应的方法，否则无法使用。本库约定，安卓开发者注入到H5的方法对象为 `js_android`。



为了统一入参，便于后期拓展，原生接收参数的类型为对象类型（注意：本库会将对象类型JSON序列化为字符串之后再进行传递）。H5 在调用原生方法时，如果没有参数设置，本库会默认传递 `null` 对象给原生，原生在处理参数时需注意。



H5开发者在使用本库时，对于需传递供原生调用的JS方法，本库默认接收字符串方法名，并做特殊处理，将其转为 `{callback: 'fnName'}` 给原生。比如本库封装了一个 `getLocation` 的通信方法，H5在调用时，只需传递方法名即可，如下所示：

```
getLocation('handler');
```

其中，handler 为 H5 挂载在 window 上的全局方法，供原生调用的方法名。本库会做特殊处理，原生接收到的类型为：

```
{callback: 'handler'}
```

再次强调，由于 Android 无法直接接收对象，所以本库在处理安卓参数时，如果是对象类型，则先 JSON 序列化之后再进行传递。



**同步返回：**



在H5和原生交互的方法中，可能会遇到调用原生方法同步返回的情况，比如，我要调用 *getToken* 方法获取用户token，期望原生能够直接返回，而不是再定义一个方法供原生调用将token传递给H5。由于安卓在方法内部可以return供H5接收，而iOS不能，所以这里H5采用 `prompt` 方式处理，那么iOS开发者在如下方法：

```objective-c
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString * _Nullable result))completionHandler;
```

中统一拦截H5中的prompt，并通过H5传递过来的type类型判断并做相应处理。如下所示:

```objective-c
// 设置代理
self.webView.UIDelegate = self;

// JS端调用prompt函数时，会触发此代理方法。
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(NSString * __nullable result))completionHandler {
    NSError *err = nil;
    NSData *dataFromString = [prompt dataUsingEncoding:NSUTF8StringEncoding];
    // 读取数据
    NSDictionary *data = [NSJSONSerialization JSONObjectWithData:dataFromString options:NSJSONReadingMutableContainers error:&err];
    if (!err){
        // 根据data中type类型的返回指定数据
        completionHandler(returnValue);
    }
}
```

# 安装

H5开发通过如下方式安装本库：

```shell
$ npm install lg-js-bridge
$ yarn add lg-js-bridge
```

# 使用

这里以获取Token为例：

```js
import jsBridge from 'lg-js-bridge';

const token = jsBridge.getToken();
```

# 声明文件

> 特别说明：如下示例中的 callback 表示 H5 给原生作为回调的函数名变量，H5 调用时将原生回调的函数名作为参数设置;

```typescript
/**
 * 1. 跳转微信小程序
 * @param {*} options
 */
JSBridge.launchMiniProgram = function (options) {
    JSBridge.call({
        fnName: 'launchMiniProgram',
        data: options,
    });
};
/**
 * 2. H5调用原生支付
 */
JSBridge.payment = function (params) {
    JSBridge.call({
        fnName: 'payment',
        data: params,
    });
};
/**
 * 3. H5调用原生分享
 */
JSBridge.shareWith = function (options) {
    JSBridge.call({
        fnName: 'shareWith',
        data: options,
    });
};
/**
 * 4. 保存图片至手机相册
 * @param images 图片集合/这里将图片的在线链接放入集合传递给原生进行保存
 */
JSBridge.saveImages = function (images) {
    JSBridge.call({
        fnName: 'saveImages',
        data: images,
    });
};
/**
 * 5. 保存视频至手机相册
 * @param {string} videoUrls 视频地址集合/这里将视频的在线链接放入集合传递给原生进行保存
 */
JSBridge.saveVideos = function (videoUrls) {
    JSBridge.call({
        fnName: 'saveVideos',
        data: videoUrls,
    });
};
/**
 * 6. 通知原生返回上一页（原生pop控制器）
 */
JSBridge.nativeBack = function () {
    switch (JSBridge.getEnv()) {
        case 'ios':
            try {
                window.webkit.messageHandlers.nativeBack.postMessage(null);
            }
            catch (err) {
                try {
                    window.webkit.messageHandlers.gobackAPP.postMessage(null);
                }
                catch (e) {
                    console.log(e);
                }
            }
            break;
        case 'android':
            try {
                window.js_android.gobackAPP(null);
            }
            catch (e) {
                console.log(e);
            }
            break;
        default:
    }
};
/**
 * 7. 通知原生绑定微信
 * @param callback 微信绑定之后的回调函数
 */
JSBridge.bindWeChat = function (callback) {
    JSBridge.call({
        fnName: 'bindWeChat',
        data: { callback: callback },
    });
};
/**
 * 8. 通知原生打开微信
 */
JSBridge.openWeChat = function () {
    JSBridge.call({
        fnName: 'openWeChat',
    });
};
/**
 * 9. 通知原生定位
 * @param callback 原生定位成功以后调用H5回调函数，并将定位信息作为回调函数参数传递。
 */
JSBridge.getLocation = function (callback) {
    JSBridge.call({
        fnName: 'getLocation',
        data: { callback: callback },
    });
};
/**
 * 10. 从原生获取token。
 *
 * iOS开发者注意：----- 此方法通过prompt触发，type类型为：GET_TOKEN
 */
JSBridge.getToken = function () {
    var token = JSBridge.call({
        fnName: 'getToken',
        iOSPrompt: { type: 'GET_TOKEN' },
    });
    return token ? token : '';
};
```
