;(function (factory) {
    if (typeof define === 'function' && define.amd) {
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
    } else {
        factory(jQuery);
    }
}(function ($) {
    var $keyboard = $.keyboard = function (el, options) {
        var o, base = this;
        base.$el = $(el);
        base.el = el;
        base.$el.data('keyboard', base);
        base.init = function () {
            var k, position, tmp,
                kbcss = $keyboard.css,
                kbevents = $keyboard.events;
            base.settings = options || {};
            base.options = o = $.extend(true, {}, $keyboard.defaultOptions, options);
            base.el.active = true;
            base.namespace = '.keyboard' + Math.random().toString(16).slice(2);
            base.rows = ['', '-shift', '-alt', '-alt-shift'];
            base.$keyboard = [];
            base.last = {
            };
            base.$el
                .addClass(kbcss.input + ' ' + o.css.input)
                .attr({
                });
            base.initialized = true;
        };
        base.setCurrent = function () {
            var kbcss = $keyboard.css,
                $current = $('.' + kbcss.isCurrent),
                kb = $current.data('keyboard');
            base.$el.addClass(kbcss.isCurrent);
            base.$keyboard.addClass(kbcss.hasFocus);
            base.isOpen = true;
        };
        base.hasKeyboard = function () {
            return base.$keyboard && base.$keyboard.length > 0;
        };
        base.isVisible = function () {
            return base.hasKeyboard() ? base.$keyboard.is(':visible') : false;
        };
        base.focusOn = function () {
            if (!base.isVisible()) {
                base.reveal();
            } else {
            }
        };
        base.reveal = function (redraw) {
            if (!base.$keyboard || base.$keyboard &&
                (!base.$keyboard.length || $.contains(base.el.ownerDocument.body, base.$keyboard[0]))) {
                base.startup();
            }
            base.showSet();
            if (
                base.initialized ||
                o.initialFocus ||
                (!o.initialFocus && base.$el.hasClass($keyboard.css.initialFocus))
            ) {
                base.setCurrent();
            }
            base.$keyboard.show();
            base.reposition();
            base.checkDecimal();
        };
        base.updateLanguage = function () {
            var layouts = $keyboard.layouts,
                lang = o.language || layouts[o.layout] && layouts[o.layout].lang &&
                    layouts[o.layout].lang || [o.language || 'en'],
                kblang = $keyboard.language;
            o.display = $.extend(true, {},
                kblang.en.display,
                kblang[lang] && kblang[lang].display || {},
                base.settings.display
            );
            base.decimal = /^\./.test(o.display.dec);
        };
        base.startup = function () {
            var kbcss = $keyboard.css;
            if (!base.hasKeyboard()) {
                base.updateLanguage();
                if (typeof $keyboard.builtLayouts[base.layout] === 'undefined') {
                    if ($.isFunction(o.create)) {
                    } else if (!base.$keyboard.length) {
                        base.buildKeyboard(base.layout, true);
                    }
                }
                base.$keyboard = $keyboard.builtLayouts[base.layout].$keyboard.clone();
                if ((base.el.id || '') !== '') {
                    base.$keyboard.attr('id', base.el.id + $keyboard.css.idSuffix);
                }
                base.makePreview();
            }
            base.$decBtn = base.$keyboard.find('.' + kbcss.keyPrefix + 'dec');
            base.$keyboard.appendTo(o.appendLocally ? base.$el.parent() : o.appendTo || 'body');
            base.bindKeys();
        };
        base.reposition = function () {
            base.position = $.isEmptyObject(o.position) ? false : o.position;
            if ($.ui && $.ui.position && base.position) {
                base.position.of =
                    base.position.of ||
                    base.$el.data('keyboardPosition') ||
                    base.$el;
                base.position.collision = base.position.collision || 'flipfit flipfit';
                if (base.isVisible()) {
                    base.$keyboard.position(base.position);
                }
            }
        };
        base.makePreview = function () {
            if (o.usePreview) {
                var indx, attrs, attr, removedAttr,
                    kbcss = $keyboard.css;
                base.$preview = base.$el.clone(false)
                    .data('keyboard', base)
                    .removeClass(kbcss.placeholder + ' ' + kbcss.input)
                    .addClass(kbcss.preview + ' ' + o.css.input)
                    .attr('tabindex', '-1')
                    .show(); 
                base.preview = base.$preview[0];
                removedAttr = /^(data-|id|aria-haspopup)/i;
                attrs = base.$preview.get(0).attributes;
                for (indx = attrs.length - 1; indx >= 0; indx--) {
                    attr = attrs[indx] && attrs[indx].name;
                    if (removedAttr.test(attr)) {
                        base.preview.removeAttribute(attr);
                    }
                }
                $('<div />')
                    .addClass(kbcss.wrapper)
                    .append(base.$preview)
                    .prependTo(base.$keyboard);
            } else {
            }
        };
        base.bindFocus = function () {
            if (o.openOn) {
                if (base && base.el.active) {
                    base.$el.bind(o.openOn + base.namespace, function () {
                        base.focusOn();
                    });
                }
            }
        };
        base.bindButton = function (events, handler) {
            var button = '.' + $keyboard.css.keyButton,
                callback = function (e) {
                    handler.call(this, e);
                };
            if ($.fn.on) {
                base.$keyboard.on(events, button, callback);
            } else if ($.fn.delegate) {
            }
            return base;
        };
        base.unbindButton = function (namespace) {
            return base;
        };
        base.bindKeys = function () {
            base
                .unbindButton(base.namespace + ' ' + base.namespace + 'kb')
                .bindButton('mouseenter mouseleave touchstart '.split(' ').join(base.namespace + ' '), function (e) {
                })
                .bindButton(o.keyBinding.split(' ').join(base.namespace + ' ') + base.namespace + ' ' +
                    $keyboard.events.kbRepeater, function (e) {
                    var action,
                        last = base.last,
                        $key = $(this),
                        timer = new Date().getTime();
                    action = $key.attr('data-action');
                    last.key = $key.attr('data-value');
                    if (action === last.key && typeof $keyboard.keyaction[action] === 'string') {
                    } else if (action in $keyboard.keyaction && $.isFunction($keyboard.keyaction[action])) {
                        if ($keyboard.keyaction[action](base, this, e) === false) {
                        }
                        action = null; 
                    }
                    if (typeof action !== 'undefined' && action !== null) {
                        base.insertText(last.key);
                    }
                    base.checkCombos();
                })
                .bindButton('mouseup' + base.namespace + ' ' + 'mouseleave touchend touchmove touchcancel '.split(' ')
                    .join(base.namespace + 'kb '), function (e) {
                })
                .bindButton('click' + base.namespace, function () {
                })
                .bindButton('mousewheel' + base.namespace, base.throttleEvent(function (e, delta) {
                }, 30))
                .bindButton('mousedown touchstart '.split(' ').join(base.namespace + 'kb '), function () {
                });
        };
        base.throttleEvent = function (cb, time) {
        };
        base.getValue = function ($el) {
            $el = $el || base.$preview;
            return $el[base.isContentEditable ? 'text' : 'val']();
        };
        base.setValue = function (txt, $el) {
            $el = $el || base.$preview;
            if (base.isContentEditable) {
            } else {
                $el.val(txt);
            }
        };
        base.insertText = function (txt) {
            var t,
                bksp = false,
                isBksp = txt === '\b',
                val = base.getValue(),
                pos = $keyboard.caret(base.$preview),
                len = val.length; 
            t = pos.start;
            val = val.substring(0, t - (bksp ? 1 : 0)) + txt + val.substring(pos.end);
            base.setValue(val);
        };
        base.checkMaxLength = function () {
            if (base.$decBtn.length) {
                base.checkDecimal();
            }
        };
        base.showSet = function (name) {
            var kbcss = $keyboard.css,
                prefix = '.' + kbcss.keyPrefix,
                active = o.css.buttonActive,
                key = '',
                toShow = (base.shiftActive ? 1 : 0) + (base.altActive ? 2 : 0);
            base.$keyboard.find('.' + kbcss.keySet + key + base.rows[toShow])[0].style.display = 'inline-block';
        };
        base.checkCombos = function () {
            var r, t, t2, repl,
                val = base.getValue(),
                pos = $keyboard.caret(base.$preview),
                layout = $keyboard.builtLayouts[base.layout],
                max = base.isContentEditable ? $keyboard.getEditableLength(base.el) : val.length,
                len = max;
            base.checkMaxLength();
            return val; 
        };
        base.checkDecimal = function () {
            if ((base.decimal && /\./g.test(base.preview.value)) ||
                (!base.decimal && /\,/g.test(base.preview.value))) {
                base.$decBtn
                    .attr({})
                    .removeClass(o.css.buttonHover)
                    .addClass(o.css.buttonDisabled);
            } else {
            }
        };
        base.close = function (accepted) {
            if (base.isOpen && base.$keyboard.length) {
                var kbcss = $keyboard.css,
                    kbevents = $keyboard.events,
                    val = accepted ? base.checkCombos() : base.originalContent;
                if (base.isContentEditable && !accepted) {
                } else {
                    base.setValue(val, base.$el);
                }
                base.$el
                    .removeClass(kbcss.isCurrent + ' ' + kbcss.inputAutoAccepted)
                    .addClass((accepted || false) ? accepted === true ? '' : kbcss.inputAutoAccepted : '')
                    .trigger(kbevents.inputChange);
                if (base) {
                    if (!(o.alwaysOpen || o.userClosed && accepted === 'true') && base.$keyboard.length) {
                        base.removeKeyboard();
                        base.timer = setTimeout(function () {
                            if (base) {
                                base.bindFocus();
                            }
                        }, 200);
                    }
                }
            }
        };
        base.keyBtn = $('<button />')
            .attr({})
            .addClass($keyboard.css.keyButton);
        base.processName = function (name) {
            var index, n,
                process = (name || '').replace(/[^a-z0-9-_]/gi, ''),
                len = process.length,
                newName = [];
            len = name.length;
            if (len) {
                for (index = 0; index < len; index++) {
                    n = name[index];
                    newName.push(/[a-z0-9-_]/i.test(n) ?
                        (/[-_]/.test(n) && index !== 0 ? '' : n) :
                        (index === 0 ? '' : '-') + n.charCodeAt(0)
                    );
                }
                return newName.join('');
            }
        };
        base.processKeys = function (name) {
            var tmp,
                parts = name.split(/:(?!\/\/)/),
                htmlIndex = name.indexOf('</'),
                colonIndex = name.indexOf(':', name.indexOf('<')),
                data = {};
            if (/\(.+\)/.test(parts[0]) || /^:\(.+\)/.test(name) || /\([(:)]\)/.test(name)) {
            } else {
                if (name !== '' && parts[0] === '') {
                } else {
                    data.name = parts[0];
                }
            }
            return data;
        };
        base.addKey = function (keyName, action, regKey) {
            var keyClass, tmp, keys,
                data = {},
                txt = base.processKeys(regKey ? keyName : action),
                kbcss = $keyboard.css;
            if (!regKey && o.display[txt.name]) {
                keys = base.processKeys(o.display[txt.name]);
                keys.action = base.processKeys(keyName).name;
            } else {
                keys = txt;
                keys.action = txt.name;
            }
            data.name = base.processName(txt.name);
            if (regKey) {
                keyClass = data.name === '' ? '' : kbcss.keyPrefix + data.name;
            } else {
                keyClass = kbcss.keyAction + ' ' + kbcss.keyPrefix + keys.action;
            }
            keyClass += (keys.name.length > 2 ? ' ' + kbcss.keyWide : '') + ' ' + o.css.buttonDefault;
            data.html = '<span class="' + kbcss.keyText + '">' +
                keys.name.replace(/[\u00A0-\u9999]/gim, function (i) {
                    return '&#' + i.charCodeAt(0) + ';';
                }) +
                '</span>';
            data.$key = base.keyBtn
                .clone()
                .attr({
                    'data-value': regKey ? keys.name : keys.action, 
                    'data-action': keys.action,
                })
                .addClass(keyClass)
                .html(data.html)
                .appendTo(base.temp[0]);
            return data.$key;
        };
        base.buildKeyboard = function (name, internal) {
            var index, row, $row, currentSet,
                kbcss = $keyboard.css,
                sets = 0,
                layout = $keyboard.builtLayouts[name || base.layout || o.layout] = {},
                acceptedKeys = layout.acceptedKeys = o.restrictInclude ?
                    ('' + o.restrictInclude).split(/\s+/) || [] :
                    [],
                $layout = kbcss.keyboard + ' ' + o.css.popup + ' ' + o.css.container +
                    (o.alwaysOpen || o.userClosed ? ' ' + kbcss.alwaysOpen : ''),
                container = $('<div />')
                    .addClass($layout)
                    .attr({})
                    .hide();
            if ((internal && o.layout === 'custom') || !$keyboard.layouts.hasOwnProperty(o.layout)) {
                $layout = $keyboard.layouts.custom = o.customLayout || {
                    'normal': ['{cancel}']
                };
            } else {
            }
            $.each($layout, function (set, keySet) {
                if (set !== '' && !/^(name|lang|rtl)$/i.test(set)) {
                    if (set === 'default') {
                        set = 'normal';
                    }
                    $row = $('<div />')
                        .attr('name', set) 
                        .addClass(kbcss.keySet + ' ' + kbcss.keySet + '-' + set)
                        .appendTo(container)
                        .toggle(set === 'normal');
                    for (row = 0; row < keySet.length; row++) {
                        currentSet = $.trim(keySet[row]).replace(/\{(\.?)[\s+]?:[\s+]?(\.?)\}/g, '{$1:$2}');
                        base.buildRow($row, row, currentSet.split(/\s+/), acceptedKeys);
                        $row.find('.' + kbcss.keyButton + ',.' + kbcss.keySpacer)
                            .filter(':last')
                            .after('<br class="' + kbcss.endRow + '"/>');
                    }
                }
            });
            layout.$keyboard = container;
        };
        base.buildRow = function ($row, row, keys, acceptedKeys) {
            var t, txt, key, isAction, action, margin,
                kbcss = $keyboard.css;
            for (key = 0; key < keys.length; key++) {
                base.temp = [$row, row, key];
                isAction = false;
                if (/^\{\S+\}$/.test(keys[key])) {
                    action = keys[key].match(/^\{(\S+)\}$/)[1];
                    if (/^meta[\w-]+\:?(\w+)?/i.test(action)) {
                        base
                            .addKey(action.split(':')[0], action)
                            .addClass(kbcss.keyHasActive);
                    }
                    txt = action.split(':');
                    switch (txt[0].toLowerCase()) {
                        case 'a':
                        case 'accept':
                            base
                                .addKey('accept', action)
                                .addClass(o.css.buttonAction + ' ' + kbcss.keyAction);
                            break;
                        case 'b':
                        case 'c':
                        case 'dec':
                            base.addKey('dec', action);
                            break;
                        case 'sign':
                            base.addKey('sign', action);
                        default:
                            if ($keyboard.keyaction.hasOwnProperty(txt[0])) {
                                base
                                    .addKey(txt[0], action)
                                    .toggleClass(o.css.buttonAction + ' ' + kbcss.keyAction, isAction);
                            }
                    }
                } else {
                    t = keys[key];
                    base.addKey(t, t, true);
                }
            }
        };
        base.removeKeyboard = function () {
            base.$keyboard.remove();
            base.$keyboard = [];
        };
        base.init();
    }; 
    $keyboard.css = {
        idSuffix: '_keyboard',
        input: 'ui-keyboard-input',
        wrapper: 'ui-keyboard-preview-wrapper',
        preview: 'ui-keyboard-preview',
        keyboard: 'ui-keyboard',
        keySet: 'ui-keyboard-keyset',
        keyButton: 'ui-keyboard-button',
        keyWide: 'ui-keyboard-widekey',
        keyPrefix: 'ui-keyboard-',
        keyText: 'ui-keyboard-text', 
        keyAction: 'ui-keyboard-actionkey',
        hasFocus: 'ui-keyboard-has-focus',
        isCurrent: 'ui-keyboard-input-current',
    };
    $keyboard.events = {
        inputChange: 'change',
    };
    $keyboard.keyaction = {
        accept: function (base) {
            base.close(true); 
        },
        clear: function (base) {
        },
    };
    $keyboard.builtLayouts = {};
    $keyboard.layouts = {};
    $keyboard.language = {
        en: {
            display: {
                'a': '\u2714:Accept (Shift+Enter)',
                'clear': 'C:Clear',
                'dec': '.:Decimal',
                'sign': '\u00b1:Change Sign',
            },
        }
    };
    $keyboard.defaultOptions = {
        position: {
            at: 'center top',
        },
        usePreview: true,
        css: {
            input: 'ui-widget-content ui-corner-all',
            container: 'ui-widget-content ui-widget ui-corner-all ui-helper-clearfix',
            popup: '',
            buttonDefault: 'ui-state-default ui-corner-all',
            buttonAction: 'ui-state-active',
            buttonDisabled: 'ui-state-disabled',
        },
        openOn: 'focus',
        keyBinding: 'mousedown touchstart',
    };
    $keyboard.caret = function ($el, param1, param2) {
        var start, end, txt, pos,
            kb = $el.data('keyboard'),
            noFocus = kb && kb.options.noFocus,
            formEl = /(textarea|input)/i.test($el[0].nodeName);
        if (formEl) {
            pos = $el.caret();
        } else {
        }
        start = pos.start;
        end = pos.end;
        txt = formEl && $el[0].value || $el.text() || '';
        return {
            start: start,
            end: end,
            text: txt.substring(start, end),
            replaceStr: function (str) {
            }
        };
    };
    $.fn.keyboard = function (options) {
        return this.each(function () {
            if (!$(this).data('keyboard')) {
                (new $.keyboard(this, options));
            }
        });
    };
    $.fn.getkeyboard = function () {
        return this.data('keyboard');
    };
    $.fn.caret = function (start, end, noFocus) {
        var selRange, range, stored_range, txt, val,
            $el = this,
            el = $el[0],
            selection = el.ownerDocument.selection,
            sTop = el.scrollTop,
            ss = false,
            supportCaret = true;
        if (/(email|number)/i.test(el.type)) {
        } else if (ss) {
        } else if (selection) {
        } else {
            start = end = (el.value || '').length;
        }
        txt = (el.value || '');
        return {
            start: start,
            end: end,
            text: txt.substring(start, end),
            replace: function (str) {
            }
        };
    };
}));
;(function (factory) {
    if (typeof define === 'function' && define.amd) {
    } else if (
        typeof module === 'object' &&
        typeof module.exports === 'object'
    ) {
    } else {
        factory(jQuery);
    }
}(function ($) {
    $.fn.addTyping = function (options) {
        return this.each(function () {
        });
    };
}));
$(document).ready(function () {
    $.extend($.keyboard.keyaction, {
        rad: function (base) {
        },
        deg: function (base) {
        },
        grad: function (base) {
        },
        clearall: function (base) {
        },
        ln: function (base) {
        },
        log: function (base) {
        },
        sqrt: function (base) {
        },
        cuberoot: function (base) {
        },
        x2: function (base) {
        },
        x3: function (base) {
        },
        '10x': function (base) {
        },
        'n!': function (base) {
        },
        invx: function (base) {
        },
        sin: function (base) {
        },
        sinh: function (base) {
        },
        cos: function (base) {
        },
        cosh: function (base) {
        },
        tan: function (base) {
        },
        tanh: function (base) {
        },
        pi: function (base) {
        },
        yroot: function (base) {
        },
        xy: function (base) {
        },
        mod: function (base) {
        },
        equals: function (base) {
            base.$preview.val(function (i, v) {
                var fx = base.memory2 || '';
                if (fx === '') {
                    return eval(v);
                }
            });
        }
    });
    $('#calc').keyboard({
        display: {
            'clearall': 'C',
            'equals': '=',
            'sqrt': '\u221a',
        },
        customLayout: {
            'default': [
                '{rad} {deg} {grad} {sp:.1} {MC} {MR} {MS} {MPLUS} {M-} {a}',
                '{meta1} {ln} ( ) {b} {clear} {clearall} {sign} {sqrt} {c}',
                '{sinh} {sin} {x2} {n!} 7 8 9 / %',
                '{cosh} {cos} {xy} {yroot} 4 5 6 * {invx}',
                '{tanh} {tan} {x3} {cuberoot} 1 2 3 - {equals}',
                '{pi} {Int} {mod} {log} {10x} 0 {dec} +'
            ],
        },
    })
        .addTyping()
        .getkeyboard().reveal();
});