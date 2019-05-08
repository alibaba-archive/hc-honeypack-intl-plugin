var p = require('path');
var fs = require('fs');

var FUNCTION_NAMES = ['defineMessage', 'pureMessage'];
var FUNCTION_NS = ['$m', '$em'];

var EXTRACTED = Symbol('L20nExtracted');
var MESSAGES = Symbol('L20nMessages');

const colorsMap = {
    yellow: '\x1b[33m',
    black: '\x1b[40m',
    red: '\x1b[31m',
    clear: '\x1b[0m'
}
function color(title, message, color){
    return colorsMap.black + colorsMap[color] + colorsMap.black + '[' + title + '] ' + colorsMap.clear + message;
}

var ATTRIBUTES = {
    global: [
        'title', 'aria-label', 'aria-valuetext', 'aria-moz-hint'
    ],
    a: ['download'],
    area: [
        'download', 'alt'
    ],
    // value is special-cased in isAttrAllowed
    input: [
        'alt', 'placeholder'
    ],
    menuitem: ['label'],
    menu: ['label'],
    optgroup: ['label'],
    option: ['label'],
    track: ['label'],
    img: ['alt'],
    textarea: ['placeholder'],
    th: ['abbr']
}
var attrsMap = {};
for (var key in ATTRIBUTES) {
    ATTRIBUTES[key]
        .forEach(function (v) {
            attrsMap[v] = true;
        })
}

module.exports = function (t) {
    var initMap = false;

    global.messageMap = {};
    global.messages = {};
    function getModuleSourceName(opts) {
        return opts.moduleSourceName || 'hc-l20n';
    }

    function storeMessage(discriptor, path, state) {
        var file = state.file;
        var id = discriptor.id;
        if (!id) {
            throw path.buildCodeFrameError('[L20n Error] Message Descriptors require an `id`.');
        }
        if (discriptor.message) {
            discriptor.message = discriptor.message;
        } else {
            discriptor.message = id.split('.').pop().replace(/_/g, ' ');
        }

        if (discriptor.attribute) {
            id += ':' + discriptor.attribute;
        }
        var messages = file.get(MESSAGES);

        if (messages[id]) {
            if (messages[id] === discriptor.message) {
                return;
            }
            console.error(color('L20n Error', `Duplicate message id: "${id}", ` + 'but the `description` and/or `message` are different.(' + messages[id] + ' vs ' + discriptor.message + ')', 'red'));
        } else if (!state.opts.duplicate) {
            if (global.messages[id] && global.messages[id] !== discriptor.message) {
                console.error(color('L20n Error', `Duplicate message id: "${id}", ` + 'but the `description` and/or `message` are different.(' + global.messages[id] + ' vs ' + discriptor.message + ')', 'red'));
            } else if (global.messageMap[discriptor.message] && global.messageMap[discriptor.message] !== id && !discriptor.duplicate) {
                console.warn(color('L20n Warn', `Duplicate message text: "${discriptor.message}", ` + `but the "${id}" and "${global.messageMap[discriptor.message]}" are different.`, 'yellow'));
            }
        }
        global.messageMap[discriptor.message] = id;

        if (discriptor.plural) {
            messages[id] = '{[plural(' + discriptor.plural.name + ')]}';
            for (var key in discriptor.plural.state) {
                messages[id + '[' + key + ']'] = discriptor.message + discriptor.plural.state[key];
            }
        } else {
            global.messages[id] = messages[id] = discriptor.message;
        }
    }

    function referencesImport(path, callee, mod) {
      if (path.isIdentifier() || path.isJSXIdentifier()) {
        return FUNCTION_NS.indexOf(callee.name) > -1 || FUNCTION_NAMES.some((name) => path.referencesImport(mod, name));
      } else if (path.isMemberExpression()) {
        return FUNCTION_NS.indexOf(callee.property.name) > -1;
      }
      return false;
    }

    function tagAsExtracted(path) {
        path.node[EXTRACTED] = true;
    }

    function wasExtracted(path) {
        return !!path.node[EXTRACTED];
    }

    return {
        pre(file) {
            const defaultMessages = {};
            if (!initMap) {
                initMap = true;
                global.l20nReverse = global.l20nReverse || {};
                if (this.opts.filenames) {
                    try {
                        const opt = this.opts;
                        []
                            .concat(opt.filenames)
                            .forEach(function (filename) {
                                var map = JSON.parse(fs.readFileSync(filename, 'utf-8').trim());
                                var override = filename === opt.filename;
                                for (var key in map) {
                                    if (global.l20nReverse[map[key]]) {
                                        console.warn(color('L20n Warn', `Duplicate message text: "${map[key]}", ` + `but the "${key}" and "${global.l20nReverse[map[key]]}" are different.`, 'yellow'));
                                    } else {
                                        global.l20nReverse[map[key]] = key;
                                        if (override) {
                                            defaultMessages[key] = map[key];
                                        }
                                    }
                                }
                            });
                    } catch (e) {}
                }
            }
            if (!file.has(MESSAGES)) {
                file.set(MESSAGES, defaultMessages);
            }
        },

        post(file) {
            const messages = file.get(MESSAGES);

            file.metadata['l20n'] = messages;
        },

        visitor: {

            CallExpression(path, state) {
                var moduleSourceName = getModuleSourceName(state.opts);
                var callee = path.get('callee');
                if (referencesImport(callee, path.node.callee, moduleSourceName)) {
                    var args = path.get('arguments');
                    var obj = args[0];
                    var attribute = args[1];

                    if (obj) {
                        if (wasExtracted(obj)) {
                            return;
                        }
                        var map = {};
                        if (obj.isObjectExpression()) {
                            obj
                                .get('properties')
                                .map(prop => {
                                    prop = prop.get('value');
                                    if (prop.isObjectExpression()) {
                                        map[prop.parent.key.name] = {};

                                        prop
                                            .get('properties')
                                            .map(o => {
                                                o = o.get('value');
                                                if (o.isObjectExpression()) {
                                                    map[prop.parent.key.name][o.parent.key.name] = {};

                                                    o
                                                        .get('properties')
                                                        .map(t => {
                                                            t = t.get('value');
                                                            map[prop.parent.key.name][o.parent.key.name][t.parent.key.name] = t.parent.value.value;
                                                        })
                                                } else {
                                                    map[prop.parent.key.name][o.parent.key.name] = o.parent.value.value;
                                                }
                                            });
                                    } else {
                                        map[prop.parent.key.name] = prop.parent.value.value;
                                    }
                                });
                            storeMessage(map, path, state);
                        } else {
                            if (attribute) {
                                map.id = obj.parent.arguments[0].value;
                                attribute = attribute.parent.arguments[1].value;
                            } else {
                                map.id = obj.parent.arguments[0].value;
                            }
                            
                            if (path.node.callee.name === 'pureMessage' || path.node.callee.name === '$m' || path.node.callee.property.name === '$m') {
                                map.message = attribute;
                                storeMessage(map, path, state);
                            } else {
                                // 暴力正则
                                if (path.parentPath.parent.type === 'JSXAttribute') {
                                    var str = path
                                        .hub
                                        .file
                                        .code
                                        .substr(path.parentPath.parent.start, 300);
                                    var mt = str.match(new RegExp('>([^<]*)</'));

                                    if (mt) {
                                        map.message = mt[1];
                                        storeMessage(map, path, state);
                                    }

                                    if (attribute) {
                                        map.attribute = attribute;
                                        mt = str.match(new RegExp(map.attribute + '="([^"]*)"'));
                                        if (mt) {
                                            map.message = mt[1];
                                        }
                                        storeMessage(map, path, state);
                                    }
                                }
                            }
                        }

                        // Tag the AST node so we don't try to extract it twice.
                        tagAsExtracted(obj);
                    }
                }
            }
        }
    };
}
