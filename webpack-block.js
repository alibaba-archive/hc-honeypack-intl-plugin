var ExtractTextPlugin = require('hc-honeypack-extract-plugin');
var path = require('path');
var filters = require('./lib/filter');
var L20nPlugin = require('./babel-l20n-plugin');

module.exports = function l20nWebpckBlock(newWebPackConfig, locals, version) {
  var default_locale = locals['default'] || 'zh-CN';
  var l20nMetas = [];

  if (!locals.available) {
    var available = locals.available = [default_locale + ':' + version];
  } else {
    var available = locals
      .available
      .map(function (lang) {
        return lang + ':' + version;
      });
  }
  l20nMetas.push('l20n!availableLanguages=' + available);
  l20nMetas.push('l20n!defaultLanguage=' + default_locale);
  l20nMetas.push('l20n!appVersion=' + version);
  if (locals.extName) {
    l20nMetas.push('l20n!extName=' + locals.extName);
  }
  var formAndTo = ['properties', 'json'];
  formAndTo[0] = locals.form || formAndTo[0];
  formAndTo[1] = locals.to || formAndTo[1];
  var extName = locals.extName || ('.' + formAndTo[1]);
  var assetPath = locals.path || newWebPackConfig[0].output.path;
  var distFileName = path.join(assetPath, default_locale + extName);

  var langExtractTextPlugin = new ExtractTextPlugin(default_locale, distFileName, {
    dataFilter: filters[formAndTo[1] + 'Filter']
  });
  newWebPackConfig[0]
    .plugins
    .unshift(langExtractTextPlugin);
  newWebPackConfig[0]
    .module
    .loaders
    .push({
      test: new RegExp('\\.' + formAndTo[0] + '\$'),
      //提取json文件到内存，否则最终注入到js文件中
      loader: langExtractTextPlugin.extract("hc-honeypack-intl-plugin/lib/format/" + formAndTo[0] + '/' + formAndTo[1])
    });

  var loaders = newWebPackConfig[0].module.loaders;
  var jsLoader = [];
  for (var i = 0, len = loaders.length; i < len; i++) {
    if (loaders[i].test.toString().indexOf('.js') > -1) {
      jsLoader[0] = Object.assign({}, loaders[i]);
      if (loaders[i].query && loaders[i].query.plugins) {
        loaders[i].query.cacheDirectory = !locals.nocache;
        loaders[i]
          .query
          .plugins
          .push([
            'hc-honeypack-intl-plugin/babel-l20n-loader', {
              duplicate: !!locals.duplicate,
              filename: distFileName,
              filenames: locals.duplicateFileNames
                ? locals
                  .duplicateFileNames
                  .map(function (filename) {
                    return path.join(assetPath, filename)
                  })
                : null
            }
          ]);
        loaders[i].query.metadataSubscribers = [L20nPlugin.metadataContextFunctionName];
        newWebPackConfig[0]
          .plugins
          .unshift(new L20nPlugin({filename: distFileName}));
      }
      break;
    }
  }
  return l20nMetas;
}