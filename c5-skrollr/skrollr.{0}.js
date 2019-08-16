(function (window, document, undefined) {
    var skrollr = {
        init: function (options) {
            return _instance || new Skrollr(options);
        },
    };
    var hasProp = Object.prototype.hasOwnProperty;
    var SKROLLABLE_CLASS = 'skrollable';
    var SKROLLABLE_BEFORE_CLASS = SKROLLABLE_CLASS + '-before';
    var SKROLLABLE_BETWEEN_CLASS = SKROLLABLE_CLASS + '-between';
    var SKROLLABLE_AFTER_CLASS = SKROLLABLE_CLASS + '-after';
    var SKROLLR_CLASS = 'skrollr';
    var NO_SKROLLR_CLASS = 'no-' + SKROLLR_CLASS;
    var SKROLLR_DESKTOP_CLASS = SKROLLR_CLASS + '-desktop';
    var DEFAULT_EASING = 'linear';
    var ANCHOR_START = 'start';
    var ANCHOR_END = 'end';
    var SKROLLABLE_ID_DOM_PROPERTY = '___skrollable_id';
    var rxTrim = /^\s+|\s+$/g;
    var rxKeyframeAttribute = /^data(?:-(_\w+))?(?:-?(-?\d*\.?\d+p?))?(?:-?(start|end|top|center|bottom))?(?:-?(top|center|bottom))?$/;
    var rxPropValue = /\s*(@?[\w\-\[\]]+)\s*:\s*(.+?)\s*(?:;|$)/gi;
    var rxPropEasing = /^(@?[a-z\-]+)\[(\w+)\]$/;
    var rxNumericValue = /[\-+]?[\d]*\.?[\d]+/g;
    var rxInterpolateString = /\{\?\}/g;
    var polyfillRAF = function () {
        var requestAnimFrame = window.requestAnimationFrame || window[theCSSPrefix.toLowerCase() + 'RequestAnimationFrame'];
        return requestAnimFrame;
    };
    var easings = {
    };
    function Skrollr(options) {
        documentElement = document.documentElement;
        body = document.body;
        _instance = this;
        _listeners = {
        };
        _forceHeight = options.forceHeight !== false;
        if (_isMobile) {
        } else {
            _updateClass(documentElement, [SKROLLR_CLASS, SKROLLR_DESKTOP_CLASS], [NO_SKROLLR_CLASS]);
        }
        _instance.refresh();
        var requestAnimFrame = polyfillRAF();
        (function animloop() {
            _render();
            _animFrame = requestAnimFrame(animloop);
        }());
    }
    Skrollr.prototype.refresh = function (elements) {
        if (elements === undefined) {
            ignoreID = true;
            _skrollables = [];
            _skrollableIdCounter = 0;
            elements = document.getElementsByTagName('*');
        } else if (elements.length === undefined) {
        }
        elementIndex = 0;
        elementsLength = elements.length;
        for (; elementIndex < elementsLength; elementIndex++) {
            var el = elements[elementIndex];
            var keyFrames = [];
            var attributeIndex = 0;
            var attributesLength = el.attributes.length;
            for (; attributeIndex < attributesLength; attributeIndex++) {
                var attr = el.attributes[attributeIndex];
                var match = attr.name.match(rxKeyframeAttribute);
                if (match === null) {
                    continue;
                }
                var kf = {
                    props: attr.value,
                };
                keyFrames.push(kf);
                var offset = match[2];
                if (/p$/.test(offset)) {
                } else {
                    kf.offset = (offset | 0);
                }
                var anchor1 = match[3];
                if (!anchor1 || anchor1 === ANCHOR_START || anchor1 === ANCHOR_END) {
                    if (anchor1 === ANCHOR_END) {
                        kf.isEnd = true;
                    } else if (!kf.isPercentage) {
                    }
                } else {
                }
            }
            if (!keyFrames.length) {
                continue;
            }
            if (!ignoreID && SKROLLABLE_ID_DOM_PROPERTY in el) {
            } else {
                id = (el[SKROLLABLE_ID_DOM_PROPERTY] = _skrollableIdCounter++);
            }
            _skrollables[id] = {
                element: el,
                keyFrames: keyFrames,
            };
            _updateClass(el, [SKROLLABLE_CLASS], []);
        }
        _reflow();
        elementIndex = 0;
        for (; elementIndex < elementsLength; elementIndex++) {
            var sk = _skrollables[elements[elementIndex][SKROLLABLE_ID_DOM_PROPERTY]];
            if (sk === undefined) {
                continue;
            }
            _parseProps(sk);
            _fillProps(sk);
        }
    };
    Skrollr.prototype.getScrollTop = function () {
        if (_isMobile) {
        } else {
            return window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
        }
    };
    var _updateDependentKeyFrames = function () {
        var processedConstants = _processConstants();
        skrollableIndex = 0;
        skrollablesLength = _skrollables.length;
        for (; skrollableIndex < skrollablesLength; skrollableIndex++) {
            skrollable = _skrollables[skrollableIndex];
            keyFrames = skrollable.keyFrames;
            keyFrameIndex = 0;
            keyFramesLength = keyFrames.length;
            for (; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
                kf = keyFrames[keyFrameIndex];
                offset = kf.offset;
                constantValue = processedConstants[kf.constant] || 0;
                kf.frame = offset;
                if (_forceHeight) {
                    if (!kf.isEnd && kf.frame > _maxKeyFrame) {
                        _maxKeyFrame = kf.frame;
                    }
                }
            }
        }
        skrollableIndex = 0;
        for (; skrollableIndex < skrollablesLength; skrollableIndex++) {
            skrollable = _skrollables[skrollableIndex];
            keyFrames = skrollable.keyFrames;
            keyFrameIndex = 0;
            for (; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
                kf = keyFrames[keyFrameIndex];
                if (kf.isEnd) {
                    kf.frame = _maxKeyFrame - kf.offset + constantValue;
                }
            }
        }
    };
    var _calcSteps = function (fakeFrame, actualFrame) {
        var skrollableIndex = 0;
        for (; skrollableIndex < skrollablesLength; skrollableIndex++) {
            var skrollable = _skrollables[skrollableIndex];
            var element = skrollable.element;
            var frame = skrollable.smoothScrolling ? fakeFrame : actualFrame;
            var frames = skrollable.keyFrames;
            var framesLength = frames.length;
            var firstFrame = frames[0];
            var lastFrame = frames[frames.length - 1];
            var beforeFirst = frame < firstFrame.frame;
            var afterLast = frame > lastFrame.frame;
            var firstOrLastFrame = beforeFirst ? firstFrame : lastFrame;
            if (beforeFirst || afterLast) {
                if (beforeFirst) {
                    _updateClass(element, [SKROLLABLE_BEFORE_CLASS], [SKROLLABLE_AFTER_CLASS, SKROLLABLE_BETWEEN_CLASS]);
                } else {
                    _updateClass(element, [SKROLLABLE_AFTER_CLASS], [SKROLLABLE_BEFORE_CLASS, SKROLLABLE_BETWEEN_CLASS]);
                }
                switch (skrollable.edgeStrategy) {
                    default:
                    case 'set':
                        var props = firstOrLastFrame.props;
                        for (key in props) {
                            if (hasProp.call(props, key)) {
                                value = _interpolateString(props[key].value);
                                if (key.indexOf('@') === 0) {
                                } else {
                                    skrollr.setStyle(element, key, value);
                                }
                            }
                        }
                }
            } else {
                if (skrollable.edge !== 0) {
                    _updateClass(element, [SKROLLABLE_CLASS, SKROLLABLE_BETWEEN_CLASS], [SKROLLABLE_BEFORE_CLASS, SKROLLABLE_AFTER_CLASS]);
                }
            }
            var keyFrameIndex = 0;
            for (; keyFrameIndex < framesLength - 1; keyFrameIndex++) {
                if (frame >= frames[keyFrameIndex].frame && frame <= frames[keyFrameIndex + 1].frame) {
                    var left = frames[keyFrameIndex];
                    var right = frames[keyFrameIndex + 1];
                    for (key in left.props) {
                        if (hasProp.call(left.props, key)) {
                            var progress = (frame - left.frame) / (right.frame - left.frame);
                            value = _calcInterpolation(left.props[key].value, right.props[key].value, progress);
                            value = _interpolateString(value);
                            if (key.indexOf('@') === 0) {
                            } else {
                                skrollr.setStyle(element, key, value);
                            }
                        }
                    }
                }
            }
        }
    };
    var _render = function () {
        var renderTop = _instance.getScrollTop();
        if (_forceRender || _lastTop !== renderTop) {
            var continueRendering = _listeners.beforerender && _listeners.beforerender.call(_instance, listenerParams);
            if (continueRendering !== false) {
                _calcSteps(renderTop, _instance.getScrollTop());
            }
        }
    };
    var _parseProps = function (skrollable) {
        var keyFrameIndex = 0;
        var keyFramesLength = skrollable.keyFrames.length;
        for (; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
            var frame = skrollable.keyFrames[keyFrameIndex];
            var props = {};
            while ((match = rxPropValue.exec(frame.props)) !== null) {
                prop = match[1];
                value = match[2];
                easing = prop.match(rxPropEasing);
                if (easing !== null) {
                    prop = easing[1];
                } else {
                }
                value = value.indexOf('!') ? _parseProp(value) : [value.slice(1)];
                props[prop] = {
                    value: value,
                };
            }
            frame.props = props;
        }
    };
    var _parseProp = function (val) {
        var numbers = [];
        val = val.replace(rxNumericValue, function (n) {
            numbers.push(+n);
            return '{?}';
        });
        numbers.unshift(val);
        return numbers;
    };
    var _fillProps = function (sk) {
        var propList = {};
        keyFrameIndex = 0;
        keyFramesLength = sk.keyFrames.length;
        for (; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
            _fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
        }
        propList = {};
        keyFrameIndex = sk.keyFrames.length - 1;
        for (; keyFrameIndex >= 0; keyFrameIndex--) {
            _fillPropForFrame(sk.keyFrames[keyFrameIndex], propList);
        }
    };
    var _fillPropForFrame = function (frame, propList) {
        for (key in propList) {
            if (!hasProp.call(frame.props, key)) {
                frame.props[key] = propList[key];
            }
        }
        for (key in frame.props) {
            propList[key] = frame.props[key];
        }
    };
    var _calcInterpolation = function (val1, val2, progress) {
        var val1Length = val1.length;
        var interpolated = [val1[0]];
        valueIndex = 1;
        for (; valueIndex < val1Length; valueIndex++) {
            interpolated[valueIndex] = val1[valueIndex] + ((val2[valueIndex] - val1[valueIndex]) * progress);
        }
        return interpolated;
    };
    var _interpolateString = function (val) {
        var valueIndex = 1;
        return val[0].replace(rxInterpolateString, function () {
            return val[valueIndex++];
        });
    };
    skrollr.setStyle = function (el, prop, val) {
        var style = el.style;
        if (prop === 'zIndex') {
        } else if (prop === 'float') {
        } else {
            try {
                style[prop] = val;
            } catch (ignore) {
            }
        }
    };
    var _reflow = function () {
        _maxKeyFrame = 0;
        _updateDependentKeyFrames();
        if (_forceHeight && !_isMobile) {
            body.style.height = (_maxKeyFrame + documentElement.clientHeight) + 'px';
        }
        _forceRender = true;
    };
    var _processConstants = function () {
        var copy = {};
        return copy;
    };
    var _updateClass = function (element, add, remove) {
        var prop = 'className';
        var val = element[prop];
        var classRemoveIndex = 0;
        var removeLength = remove.length;
        for (; classRemoveIndex < removeLength; classRemoveIndex++) {
            val = _untrim(val).replace(_untrim(remove[classRemoveIndex]), ' ');
        }
        val = _trim(val);
        var classAddIndex = 0;
        var addLength = add.length;
        for (; classAddIndex < addLength; classAddIndex++) {
            if (_untrim(val).indexOf(_untrim(add[classAddIndex])) === -1) {
                val += ' ' + add[classAddIndex];
            }
        }
        element[prop] = _trim(val);
    };
    var _trim = function (a) {
        return a.replace(rxTrim, '');
    };
    var _untrim = function (a) {
        return ' ' + a + ' ';
    };
    var _instance;
    var _isMobile = false;
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return skrollr;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = skrollr;
    } else {
        window.skrollr = skrollr;
    }
}(window, document));