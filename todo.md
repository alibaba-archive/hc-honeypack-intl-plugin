# 国际化loader工作计划

到`release 0.1.0`之前只支持`.properties`转`.json`文件。稳定版本需要提供以下内容：

1. 支持模块化开发，在每个`.js`文件中`require('xx/xx.properties')`，最终经过`naza-l20n-loader`插件处理后，会自动打包成一个统一的`.properties`文件。
2. 可以支持打包成多分语言的`.properties`文件，具体可以查看`webpack-block.js`

## release 0.1.0
这期版本要支持多种文件转换，`.properties`，`.l20n`，`.json`文件之间可以互相转换.

1. 代码结构上做调整，文件转换的代码放在`lib/format`目录总，第一级目录是开发的文件格式，第二级目录是生成的文件格式。
2. 优化加载效率。比如`.propeties`=>`'.properties`在filter.js做优化。
3. `naza-l20n`配合调试和升级。

## release 0.2.0
这期版本要提供支持`.properties`,`.l20n`,`.json`文件输出为`.js`文件，通过通过`hc-honeypack-intl-plugin`配合给index.html注入该js文件的路径。

同时`naza-l20n`组件也需要升级，支持静态js的语言文本，此时获取到的是dataCtx，即entities的集合。这样可以大大的提高效率。在页面加载时即完成了语言文本的请求。

