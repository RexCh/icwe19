(function (factory, jQuery, Zepto) {
    if (typeof define === 'function' && define.amd) {
    } else if (typeof exports === 'object') {
    } else {
        factory(jQuery || Zepto);
    }
}(function ($) {
    var Mask = function (el, mask, options) {
        var p = {
            getCaret: function () {
            },
            events: function () {
                el
                    .on('keydown.mask', function (e) {
                    })
                    .on($.jMaskGlobals.useInput ? 'input.mask' : 'keyup.mask', p.behaviour)
                    .on('paste.mask drop.mask', function () {
                    })
                    .on('change.mask', function () {
                    })
                    .on('blur.mask', function () {
                    })
                    .on('blur.mask', function () {
                    })
                    .on('focus.mask', function (e) {
                    })
                    .on('focusout.mask', function () {
                    });
            },
            destroyEvents: function () {
                el.off(['input', 'keydown', 'keyup', 'paste', 'drop', 'blur', 'focusout', ''].join('.mask '));
            },
            val: function (v) {
                var isInput = el.is('input'),
                    method = isInput ? 'val' : 'text',
                    r;
                if (arguments.length > 0) {
                    if (el[method]() !== v) {
                        el[method](v);
                    }
                } else {
                    r = el[method]();
                }
                return r;
            },
            behaviour: function (e) {
                var keyCode = el.data('mask-keycode');
                if ($.inArray(keyCode, jMask.byPassKeys) === -1) {
                    var newVal = p.getMasked(),
                        caretPos = p.getCaret();
                    p.val(newVal);
                }
            },
            getMasked: function (skipMaskChars, val) {
                var buf = [],
                    value = val === undefined ? p.val() : val + '',
                    m = 0, maskLen = mask.length,
                    v = 0, valLen = value.length,
                    offset = 1, addMethod = 'push',
                    resetPos = -1,
                    maskDigitCount = 0,
                    maskDigitPosArr = [],
                    lastMaskChar,
                    check;
                if (options.reverse) {
                    addMethod = 'unshift';
                    offset = -1;
                    m = maskLen - 1;
                    v = valLen - 1;
                    check = function () {
                        return m > -1 && v > -1;
                    };
                } else {
                    check = function () {
                        return m < maskLen && v < valLen;
                    };
                }
                var lastUntranslatedMaskChar;
                while (check()) {
                    var maskDigit = mask.charAt(m),
                        valDigit = value.charAt(v),
                        translation = jMask.translation[maskDigit];
                    if (translation) {
                        if (valDigit.match(translation.pattern)) {
                            buf[addMethod](valDigit);
                            m += offset;
                        } else if (valDigit === lastUntranslatedMaskChar) {
                        } else if (translation.optional) {
                        } else if (translation.fallback) {
                        } else {
                        }
                        v += offset;
                    } else {
                        if (!skipMaskChars) {
                            buf[addMethod](maskDigit);
                        }
                        m += offset;
                    }
                }
                var newVal = buf.join('');
                return newVal;
            },
        };
        el = $(el);
        var jMask = this, oldValue = p.val(), regexMask;
        jMask.getMaskedVal = function (val) {
            return p.getMasked(false, val);
        };
        jMask.init = function (onlyMask) {
            jMask.translation = $.extend({}, $.jMaskGlobals.translation, options.translation);
            if (onlyMask) {
            } else {
                p.destroyEvents();
                p.events();
            }
        };
        jMask.init(!el.is('input'));
    };
    var HTMLAttributes = function () {
    },
        notSameMaskObject = function (field, mask, options) {
            try {
                return typeof maskObject !== 'object' || stringify(maskObject.options) !== stringify(options) || maskObject.mask !== mask;
            } catch (e) { }
        },
        eventSupported = function (eventName) {
            var el = document.createElement('div'), isSupported;
            eventName = 'on' + eventName;
            if (!isSupported) {
                el.setAttribute(eventName, 'return;');
                isSupported = typeof el[eventName] === 'function';
            }
            return isSupported;
        };
    $.fn.mask = function (mask, options) {
        options = options || {};
        var selector = this.selector,
            globals = $.jMaskGlobals,
            interval = globals.watchInterval,
            watchInputs = options.watchInputs || globals.watchInputs,
            maskFunction = function () {
                if (notSameMaskObject(this, mask, options)) {
                    return $(this).data('mask', new Mask(this, mask, options));
                }
            };
        $(this).each(maskFunction);
    };
    $.fn.masked = function (val) {
        return this.data('mask').getMaskedVal(val);
    };
    $.fn.unmask = function () {
    };
    var globals = {
        useInput: !/Chrome\/[2-4][0-9]|SamsungBrowser/.test(window.navigator.userAgent) && eventSupported('input'),
        translation: {
            '0': { pattern: /\d/ },
        }
    };
    globals = $.jMaskGlobals = $.extend(true, {}, globals, $.jMaskGlobals);
}, window.jQuery, window.Zepto));