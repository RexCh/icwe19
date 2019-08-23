(function (window, document, undefined) {
	'use strict';
	var skrollr = {
		get: function () {
			return _instance;
		},
		init: function (options) {
			return _instance || new Skrollr(options);
		},
		VERSION: '0.6.30'
	};
	var hasProp = Object.prototype.hasOwnProperty;
	var Math = window.Math;
	var getStyle = window.getComputedStyle;
	var documentElement;
	var body;
	var SKROLLABLE_CLASS = 'skrollable';
	var DEFAULT_EASING = 'linear';
	var SKROLLABLE_ID_DOM_PROPERTY = '___skrollable_id';
	var rxTouchIgnoreTags = /^(?:input|textarea|button|select)$/i;
	var rxTrim = /^\s+|\s+$/g;
	var rxKeyframeAttribute = /^data(?:-(_\w+))?(?:-?(-?\d*\.?\d+p?))?(?:-?(start|end|top|center|bottom))?(?:-?(top|center|bottom))?$/;
	var rxPropValue = /\s*(@?[\w\-\[\]]+)\s*:\s*(.+?)\s*(?:;|$)/gi;
	var rxPropEasing = /^(@?[a-z\-]+)\[(\w+)\]$/;
	var rxCamelCase = /-([a-z0-9_])/g;
	var rxCamelCaseFn = function (str, letter) {
		return letter.toUpperCase();
	};
	var rxNumericValue = /[\-+]?[\d]*\.?[\d]+/g;
	var rxInterpolateString = /\{\?\}/g;
	var rxRGBAIntegerColor = /rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+/g;
	var rxGradient = /[a-z\-]+-gradient/g;
	var theCSSPrefix = '';
	var theDashedCSSPrefix = '';
	var detectCSSPrefix = function () {
		var rxPrefixes = /^(?:O|Moz|webkit|ms)|(?:-(?:o|moz|webkit|ms)-)/;
		if (!getStyle) {
			return;
		}
		var style = getStyle(body, null);
		for (var k in style) {
			theCSSPrefix = (k.match(rxPrefixes) || (+k == k && style[k].match(rxPrefixes)));
			if (theCSSPrefix) {
				break;
			}
		}
		if (!theCSSPrefix) {
			theCSSPrefix = theDashedCSSPrefix = '';
			return;
		}
		theCSSPrefix = theCSSPrefix[0];
		if (theCSSPrefix.slice(0, 1) === '-') {
			theDashedCSSPrefix = theCSSPrefix;
			theCSSPrefix = ({
				'-webkit-': 'webkit',
				'-moz-': 'Moz',
				'-ms-': 'ms',
				'-o-': 'O'
			})[theCSSPrefix];
		} else {
			theDashedCSSPrefix = '-' + theCSSPrefix.toLowerCase() + '-';
		}
	};
	var polyfillRAF = function () {
		var requestAnimFrame = window.requestAnimationFrame || window[theCSSPrefix.toLowerCase() + 'RequestAnimationFrame'];
		var lastTime = _now();
		if (_isMobile || !requestAnimFrame) {
			requestAnimFrame = function (callback) {
				var deltaTime = _now() - lastTime;
				var delay = Math.max(0, 1000 / 60 - deltaTime);
				return window.setTimeout(function () {
					lastTime = _now();
					callback();
				}, delay);
			};
		}
		return requestAnimFrame;
	};
	var easings = {
		begin: function () {
			return 0;
		},
		end: function () {
			return 1;
		},
		linear: function (p) {
			return p;
		},
		quadratic: function (p) {
			return p * p;
		},
		cubic: function (p) {
			return p * p * p;
		},
		swing: function (p) {
			return (-Math.cos(p * Math.PI) / 2) + 0.5;
		},
		sqrt: function (p) {
			return Math.sqrt(p);
		},
		outCubic: function (p) {
			return (Math.pow((p - 1), 3) + 1);
		},
		bounce: function (p) {
			var a;
			if (p <= 0.5083) {
				a = 3;
			} else if (p <= 0.8489) {
				a = 9;
			} else if (p <= 0.96208) {
				a = 27;
			} else if (p <= 0.99981) {
				a = 91;
			} else {
				return 1;
			}
			return 1 - Math.abs(3 * Math.cos(p * a * 1.028) / a);
		}
	};
	function Skrollr(options) {
		documentElement = document.documentElement;
		body = document.body;
		detectCSSPrefix();
		_instance = this;
		options = options || {};
		_constants = options.constants || {};
		_edgeStrategy = options.edgeStrategy || 'set';
		_listeners = {
			beforerender: options.beforerender,
			render: options.render,
			keyframe: options.keyframe
		};
		_forceHeight = options.forceHeight !== false;
		_smoothScrolling = {
			targetTop: _instance.getScrollTop()
		};
		_instance.refresh();
		var requestAnimFrame = polyfillRAF();
		(function animloop() {
			_render();
			_animFrame = requestAnimFrame(animloop);
		}());
		return _instance;
	}
	Skrollr.prototype.refresh = function (elements) {
		var elementIndex;
		var elementsLength;
		var ignoreID = false;
		if (elements === undefined) {
			ignoreID = true;
			_skrollables = [];
			_skrollableIdCounter = 0;
			elements = document.getElementsByTagName('*');
		}
		elementIndex = 0;
		elementsLength = elements.length;
		for (; elementIndex < elementsLength; elementIndex++) {
			var el = elements[elementIndex];
			var anchorTarget = el;
			var keyFrames = [];
			var smoothScrollThis = _smoothScrollingEnabled;
			var edgeStrategy = _edgeStrategy;
			var emitEvents = false;
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
					element: el,
					eventType: attr.name.replace(rxCamelCase, rxCamelCaseFn)
				};
				keyFrames.push(kf);
				var constant = match[1];
				if (constant) {
					kf.constant = constant.substr(1);
				}
				var offset = match[2];
				if (/p$/.test(offset)) {
					kf.isPercentage = true;
					kf.offset = (offset.slice(0, -1) | 0) / 100;
				} else {
					kf.offset = (offset | 0);
				}
			}
			if (!keyFrames.length) {
				continue;
			}
			var styleAttr, classAttr;
			var id;
			if (!ignoreID && SKROLLABLE_ID_DOM_PROPERTY in el) {
			} else {
				id = (el[SKROLLABLE_ID_DOM_PROPERTY] = _skrollableIdCounter++);
				styleAttr = el.style.cssText;
				classAttr = _getClass(el);
			}
			_skrollables[id] = {
				element: el,
				styleAttr: styleAttr,
				classAttr: classAttr,
				anchorTarget: anchorTarget,
				keyFrames: keyFrames,
				smoothScrolling: smoothScrollThis,
				edgeStrategy: edgeStrategy,
				emitEvents: emitEvents,
				lastFrameIndex: -1
			};
			_updateClass(el, [SKROLLABLE_CLASS], []);
		}
		_reflow();
		elementIndex = 0;
		elementsLength = elements.length;
		for (; elementIndex < elementsLength; elementIndex++) {
			var sk = _skrollables[elements[elementIndex][SKROLLABLE_ID_DOM_PROPERTY]];
			if (sk === undefined) {
				continue;
			}
			_parseProps(sk);
			_fillProps(sk);
		}
		return _instance;
	};
	Skrollr.prototype.setScrollTop = function (top, force) {
		_forceRender = (force === true);
		if (_isMobile) {
			_mobileOffset = Math.min(Math.max(top, 0), _maxKeyFrame);
		} else {
			window.scrollTo(0, top);
		}
		return _instance;
	};
	Skrollr.prototype.getScrollTop = function () {
		if (_isMobile) {
			return _mobileOffset;
		} else {
			return window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0;
		}
	};
	Skrollr.prototype.on = function (name, fn) {
		_listeners[name] = fn;
		return _instance;
	};
	var _updateDependentKeyFrames = function () {
		var processedConstants = _processConstants();
		var skrollable;
		var element;
		var anchorTarget;
		var keyFrames;
		var keyFrameIndex;
		var keyFramesLength;
		var kf;
		var skrollableIndex;
		var skrollablesLength;
		var offset;
		var constantValue;
		skrollableIndex = 0;
		skrollablesLength = _skrollables.length;
		for (; skrollableIndex < skrollablesLength; skrollableIndex++) {
			skrollable = _skrollables[skrollableIndex];
			element = skrollable.element;
			anchorTarget = skrollable.anchorTarget;
			keyFrames = skrollable.keyFrames;
			keyFrameIndex = 0;
			keyFramesLength = keyFrames.length;
			for (; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
				kf = keyFrames[keyFrameIndex];
				offset = kf.offset;
				constantValue = processedConstants[kf.constant] || 0;
				kf.frame = offset;
				kf.frame += constantValue;
				if (_forceHeight) {
					if (!kf.isEnd && kf.frame > _maxKeyFrame) {
						_maxKeyFrame = kf.frame;
					}
				}
			}
		}
	};
	var _calcSteps = function (fakeFrame, actualFrame) {
		var skrollableIndex = 0;
		var skrollablesLength = _skrollables.length;
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
			var key;
			var value;
			if (beforeFirst || afterLast) {
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
						continue;
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
							progress = left.props[key].easing(progress);
							value = _calcInterpolation(left.props[key].value, right.props[key].value, progress);
							value = _interpolateString(value);
							if (key.indexOf('@') === 0) {
							} else {
								skrollr.setStyle(element, key, value);
							}
						}
					}
					break;
				}
			}
		}
	};
	var _render = function () {
		if (_requestReflow) {
			_requestReflow = false;
			_reflow();
		}
		var renderTop = _instance.getScrollTop();
		var afterAnimationCallback;
		var now = _now();
		if (_forceRender || _lastTop !== renderTop) {
			_direction = (renderTop > _lastTop) ? 'down' : (renderTop < _lastTop ? 'up' : _direction);
			_forceRender = false;
			var listenerParams = {
				curTop: renderTop,
				lastTop: _lastTop,
				maxTop: _maxKeyFrame,
				direction: _direction
			};
			var continueRendering = _listeners.beforerender && _listeners.beforerender.call(_instance, listenerParams);
			if (continueRendering !== false) {
				_calcSteps(renderTop, _instance.getScrollTop());
				_lastTop = renderTop;
				if (_listeners.render) {
					_listeners.render.call(_instance, listenerParams);
				}
			}
		}
		_lastRenderCall = now;
	};
	var _parseProps = function (skrollable) {
		var keyFrameIndex = 0;
		var keyFramesLength = skrollable.keyFrames.length;
		for (; keyFrameIndex < keyFramesLength; keyFrameIndex++) {
			var frame = skrollable.keyFrames[keyFrameIndex];
			var easing;
			var value;
			var prop;
			var props = {};
			var match;
			while ((match = rxPropValue.exec(frame.props)) !== null) {
				prop = match[1];
				value = match[2];
				easing = prop.match(rxPropEasing);
				if (easing !== null) {
					prop = easing[1];
					easing = easing[2];
				} else {
					easing = DEFAULT_EASING;
				}
				value = value.indexOf('!') ? _parseProp(value) : [value.slice(1)];
				props[prop] = {
					value: value,
					easing: easings[easing]
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
		var keyFrameIndex;
		var keyFramesLength;
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
		var key;
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
		var valueIndex;
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
		rxInterpolateString.lastIndex = 0;
		return val[0].replace(rxInterpolateString, function () {
			return val[valueIndex++];
		});
	};
	skrollr.setStyle = function (el, prop, val) {
		var style = el.style;
		prop = prop.replace(rxCamelCase, rxCamelCaseFn).replace('-', '');
		if (prop === 'zIndex') {
			if (isNaN(val)) {
				style[prop] = val;
			} else {
				style[prop] = '' + (val | 0);
			}
		}
		else if (prop === 'float') {
			style.styleFloat = style.cssFloat = val;
		}
		else {
			try {
				if (theCSSPrefix) {
					style[theCSSPrefix + prop.slice(0, 1).toUpperCase() + prop.slice(1)] = val;
				}
				style[prop] = val;
			} catch (ignore) { }
		}
	};
	var _reflow = function () {
		var pos = _instance.getScrollTop();
		_maxKeyFrame = 0;
		if (_forceHeight && !_isMobile) {
			body.style.height = '';
		}
		_updateDependentKeyFrames();
		if (_forceHeight && !_isMobile) {
			body.style.height = (_maxKeyFrame + documentElement.clientHeight) + 'px';
		}
		if (_isMobile) {
		} else {
			_instance.setScrollTop(pos, true);
		}
		_forceRender = true;
	};
	var _processConstants = function () {
		var viewportHeight = documentElement.clientHeight;
		var copy = {};
		var prop;
		var value;
		for (prop in _constants) {
			value = _constants[prop];
			if (typeof value === 'function') {
				value = value.call(_instance);
			}
			else if ((/p$/).test(value)) {
				value = (value.slice(0, -1) / 100) * viewportHeight;
			}
			copy[prop] = value;
		}
		return copy;
	};
	var _getClass = function (element) {
		var prop = 'className';
		if (window.SVGElement && element instanceof window.SVGElement) {
			element = element[prop];
			prop = 'baseVal';
		}
		return element[prop];
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
	var _now = Date.now || function () {
		return +new Date();
	};
	var _instance;
	var _skrollables;
	var _listeners;
	var _forceHeight;
	var _maxKeyFrame = 0;
	var _constants;
	var _direction = 'down';
	var _lastTop = -1;
	var _lastRenderCall = _now();
	var _requestReflow = false;
	var _smoothScrollingEnabled;
	var _smoothScrolling;
	var _forceRender;
	var _skrollableIdCounter = 0;
	var _edgeStrategy;
	var _isMobile = false;
	var _mobileOffset = 0;
	var _animFrame;
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