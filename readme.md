# l20n加载器
基于l20n规范，并考虑开发易用性，开发符合webpack-loader的加载器。

## 设计思路
依赖于`extract-text-webpack-plugin`插件，用于生成一份语言描述文件`json`格式，l20n的语言描述文件可以分3种类型，分别是`.properties`文件、`.json`文件、`.l20n`文件。`naza-l20n-loader`暂只支持生成`.json`文件，以便于后期发布到`cdn`服务器。

    var ExtractTextPlugin = require('extract-text-webpack-plugin');
    var poExtractTextPlugin = new ExtractTextPlugin(1, 'app.lang.json');
在webpack其中配置项加入
  
    module: {
        loaders: [{
            test: /\.properties$/,
            loader: poExtractTextPlugin.extract("hc-honeypack-intl-plugin")
        }, ...],
    }
    plugins: [
      poExtractTextPlugin,
      ...
    ]
* `module`和`plugins`是webpack的配置项，`module`用于配置加载器，当webpack启动时，先通过
* 加载器获取各种类型的文件内容，存到内存中。以供编译器使用，`plugins`则是配置编译器插件，上一个plugin执行成功后，才会执行下一个plugin。
* 所以实际上`naza-l20n-loader`所做就是在加载时，遍历项目中所有.properties文件，收集文件内容。在编译时，打包生成一个`.json`文件。
* 更多配置项参考[webpack configuration](http://webpack.github.io/docs/configuration.html)
* 另外，我们在loader期间，通过`java-properties`模块，把`.properties`文件编译成json格式的文件。从而`.properies`文件支持定义xx.xx.xx格式的文件。

在浏览器端通过`aliyun-naza-l20n`封装一个调用l20n的angular provider。

## release 0.0.7
1. 抽取webpack的配置项到该模块中，webpack.config.js只需要引入webpack-block.js即可。

## release 0.0.9

1. 修复webpack-block.js，指定filter
2. 对于filter，输出的json和properties文件需要按顺序排列，这是l20n.js的一个bug。

对于l20n.js在解析文件时，以下格式的json解析会报错，即[other]不能在[one],[two]等最前面

    key[other]=xxx
    key[one]=xxx

## release 0.0.10
1. 修复`resolveLoader`要指向当前目录的node_modules

## release 0.0.11
1. 修复output，如果filename: '[name].[hash].js,这会导致build出错.

## release 0.0.12
1. 修复json,properties文件打包时，要去掉重复的key，以及做深度复制

## release 0.0.13
1. 修复ES6时国际化打包的问题