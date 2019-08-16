/*! jQuery UI Virtual Keyboard v1.28.9 *//*
Author: Jeremy Satterfield
Maintained: Rob Garrison (Mottie on github)
Licensed under the MIT License
An on-screen virtual keyboard embedded within the browser window which
will popup when a specified entry field is focused. The user can then
type and preview their input before Accepting or Canceling.
This plugin adds default class names to match jQuery UI theme styling.
Bootstrap & custom themes may also be applied - See
https://github.com/Mottie/Keyboard#themes
Requires:
	jQuery v1.4.3+
	Caret plugin (included)
Optional:
	jQuery UI (position utility only) & CSS theme
	jQuery mousewheel
Setup/Usage:
	Please refer to https://github.com/Mottie/Keyboard/wiki
-----------------------------------------
Caret code modified from jquery.caret.1.02.js
Licensed under the MIT License:
http://www.opensource.org/licenses/mit-license.php
-----------------------------------------
*/
/*jshint browser:true, jquery:true, unused:false */
/*global require:false, define:false, module:false */
;(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(function ($) {
    'use strict';
    var $keyboard = $.keyboard = function (el, options) {
        var o, base = this;
        base.version = '1.28.9';
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        // Add a reverse reference to the DOM object
        base.$el.data('keyboard', base);
        base.init = function () {
            base.initialized = false;
            var k, position, tmp,
                kbcss = $keyboard.css,
                kbevents = $keyboard.events;
            base.settings = options || {};
            // shallow copy position to prevent performance issues; see #357
            if (options && options.position) {
                position = $.extend({}, options.position);
                options.position = null;
            }
            base.options = o = $.extend(true, {}, $keyboard.defaultOptions, options);
            if (position) {
                o.position = position;
                options.position = position;
            }
            // keyboard is active (not destroyed);
            base.el.active = true;
            // unique keyboard namespace
            base.namespace = '.keyboard' + Math.random().toString(16).slice(2);
            // extension namespaces added here (to unbind listeners on base.$el upon destroy)
            base.extensionNamespace = [];
            // Class names of the basic key set - meta keysets are handled by the keyname
            base.rows = ['', '-shift', '-alt', '-alt-shift'];
            base.inPlaceholder = base.$el.attr('placeholder') || '';
            // html 5 placeholder/watermark
            base.watermark = $keyboard.watermark && base.inPlaceholder !== '';
            // delay in ms to prevent mousedown & touchstart from both firing events at the same time
            o.preventDoubleEventTime = o.preventDoubleEventTime || 100;
            // flag indication that a keyboard is open
            base.isOpen = false;
            // is mousewheel plugin loaded?
            base.wheel = $.isFunction($.fn.mousewheel);
            // special character in regex that need to be escaped
            base.escapeRegex = /[-\/\\^$*+?.()|[\]{}]/g;
            base.isTextArea = base.el.nodeName.toLowerCase() === 'textarea';
            base.isInput = base.el.nodeName.toLowerCase() === 'input';
            // detect contenteditable
            base.isContentEditable = !base.isTextArea &&
                !base.isInput &&
                base.el.isContentEditable;
            // keyCode of keys always allowed to be typed
            k = $keyboard.keyCodes;
            // base.alwaysAllowed = [20,33,34,35,36,37,38,39,40,45,46];
            base.alwaysAllowed = [
                k.pageUp,
                k.pageDown,
                k.end,
                k.home,
                k.left,
                k.up,
                k.right,
                k.down,
                k.insert,
                k.delete
            ];
            base.$keyboard = [];
            // keyboard enabled; set to false on destroy
            base.enabled = true;
            base.checkCaret = (o.lockInput || $keyboard.checkCaretSupport());
            // disable problematic usePreview for contenteditable
            if (base.isContentEditable) {
                o.usePreview = false;
            }
            base.last = {
                start: 0,
                end: 0,
                key: '',
                val: '',
                preVal: '',
                virtual: true,
                keyset: [false, false, false], // [shift, alt, meta]
                wheel_$Keys: [],
                wheelIndex: 0,
                wheelLayers: []
            };
            // used when building the keyboard - [keyset element, row, index]
            base.temp = ['', 0, 0];
            // Callbacks
            $.each([
                kbevents.kbInit,
                kbevents.kbVisible,
                kbevents.inputAccepted
            ], function (i, callback) {
                if ($.isFunction(o[callback])) {
                    // bind callback functions within options to triggered events
                    base.$el.bind(callback + base.namespace + 'callbacks', o[callback]);
                }
            });
            // Close with esc key & clicking outside
            if (o.alwaysOpen) {
                o.stayOpen = true;
            }
            tmp = $(document);
            if (base.el.ownerDocument !== document) {
                tmp = tmp.add(base.el.ownerDocument);
            }
            var bindings = 'keyup checkkeyboard mousedown touchstart ';
            if (o.closeByClickEvent) {
                bindings += 'click ';
            }
            // Display keyboard on focus
            base.$el
                .addClass(kbcss.input + ' ' + o.css.input)
                .attr({
                    'aria-haspopup': 'true',
                    'role': 'textbox'
                });
            // set lockInput if the element is readonly; or make the element readonly if lockInput is set
            if (o.lockInput || base.el.readOnly) {
                o.lockInput = true;
                base.$el
                    .addClass(kbcss.locked)
                    .attr({
                        'readonly': 'readonly'
                    });
            }
            // add disabled/readonly class - dynamically updated on reveal
            if (base.isUnavailable()) {
                base.$el.addClass(kbcss.noKeyboard);
            }
            if (o.openOn) {
                base.bindFocus();
            }
            // Add placeholder if not supported by the browser
            if (
                !base.watermark &&
                base.getValue(base.$el) === '' &&
                base.inPlaceholder !== '' &&
                base.$el.attr('placeholder') !== ''
            ) {
                // css watermark style (darker text)
                base.$el.addClass(kbcss.placeholder);
                base.setValue(base.inPlaceholder, base.$el);
            }
            base.$el.trigger(kbevents.kbInit, [base, base.el]);
            // initialized with keyboard open
            if (o.alwaysOpen) {
                base.reveal();
            }
            base.initialized = true;
        };
        base.toggle = function () {
            if (!base.hasKeyboard()) {
                return;
            }
            var $toggle = base.$keyboard.find('.' + $keyboard.css.keyToggle),
                locked = !base.enabled;
            // prevent physical keyboard from working
            base.preview.readonly = locked || base.options.lockInput;
            // disable all buttons
            base.$keyboard
                .toggleClass($keyboard.css.keyDisabled, locked)
                .find('.' + $keyboard.css.keyButton)
                .not($toggle)
                .attr('aria-disabled', locked)
                .each(function () {
                    this.disabled = locked;
                });
            $toggle.toggleClass($keyboard.css.keyDisabled, locked);
            // stop auto typing
            if (locked && base.typing_options) {
                base.typing_options.text = '';
            }
            // allow chaining
            return base;
        };
        base.setCurrent = function () {
            var kbcss = $keyboard.css,
                // close any "isCurrent" keyboard (just in case they are always open)
                $current = $('.' + kbcss.isCurrent),
                kb = $current.data('keyboard');
            // close keyboard, if not self
            if (!$.isEmptyObject(kb) && kb.el !== base.el) {
                kb.close(kb.options.autoAccept ? 'true' : false);
            }
            $current.removeClass(kbcss.isCurrent);
            // ui-keyboard-has-focus is applied in case multiple keyboards have
            // alwaysOpen = true and are stacked
            $('.' + kbcss.hasFocus).removeClass(kbcss.hasFocus);
            base.$el.addClass(kbcss.isCurrent);
            base.$keyboard.addClass(kbcss.hasFocus);
            base.isCurrent(true);
            base.isOpen = true;
        };
        base.isUnavailable = function () {
            return (
                base.$el.is(':disabled') || (
                    !base.options.activeOnReadonly &&
                    base.$el.attr('readonly') &&
                    !base.$el.hasClass($keyboard.css.locked)
                )
            );
        };
        base.isCurrent = function (set) {
            var cur = $keyboard.currentKeyboard || false;
            if (set) {
                cur = $keyboard.currentKeyboard = base.el;
            } else if (set === false && cur === base.el) {
                cur = $keyboard.currentKeyboard = '';
            }
            return cur === base.el;
        };
        base.hasKeyboard = function () {
            return base.$keyboard && base.$keyboard.length > 0;
        };
        base.isVisible = function () {
            return base.hasKeyboard() ? base.$keyboard.is(':visible') : false;
        };
        base.setFocus = function () {
            var $el = base.$preview || base.$el;
            if (!o.noFocus) {
                $el.focus();
            }
            if (base.isContentEditable) {
                $keyboard.setEditableCaret($el, base.last.start, base.last.end);
            } else {
                $keyboard.caret($el, base.last);
            }
        };
        base.focusOn = function () {
            if (!base && base.el.active) {
                // keyboard was destroyed
                return;
            }
            if (!base.isVisible()) {
                clearTimeout(base.timer);
                base.reveal();
            } else {
                // keyboard already open, make it the current keyboard
                base.setCurrent();
            }
        };
        // add redraw method to make API more clear
        base.redraw = function (layout) {
            if (layout) {
                // allow updating the layout by calling redraw
                base.options.layout = layout;
            }
            base.isOpen = o.alwaysOpen;
            return base;
        };
        base.reveal = function (redraw) {
            var temp,
                alreadyOpen = base.isOpen,
                kbcss = $keyboard.css;
            base.opening = !alreadyOpen;
            // remove all 'extra' keyboards by calling close function
            $('.' + kbcss.keyboard).not('.' + kbcss.alwaysOpen).each(function () {
                var kb = $(this).data('keyboard');
                if (!$.isEmptyObject(kb)) {
                    // this closes previous keyboard when clicking another input - see #515
                    kb.close(kb.options.autoAccept ? 'true' : false);
                }
            });
            // Don't open if disabled
            if (base.isUnavailable()) {
                return;
            }
            base.$el.removeClass(kbcss.noKeyboard);
            // Unbind focus to prevent recursion - openOn may be empty if keyboard is opened externally
            if (o.openOn) {
                base.$el.unbind($.trim((o.openOn + ' ').split(/\s+/).join(base.namespace + ' ')));
            }
            // build keyboard if it doesn't exist; or attach keyboard if it was removed, but not cleared
            if (!base.$keyboard || base.$keyboard &&
                (!base.$keyboard.length || $.contains(base.el.ownerDocument.body, base.$keyboard[0]))) {
                base.startup();
            }
            // clear watermark
            if (!base.watermark && base.getValue() === base.inPlaceholder) {
                base.$el.removeClass(kbcss.placeholder);
                base.setValue('', base.$el);
            }
            // disable/enable accept button
            if (o.acceptValid && o.checkValidOnInit) {
                base.checkValid();
            }
            // beforeVisible event
            if (!base.isVisible()) {
                base.$el.trigger($keyboard.events.kbBeforeVisible, [base, base.el]);
            }
            if (
                base.initialized ||
                o.initialFocus ||
                (!o.initialFocus && base.$el.hasClass($keyboard.css.initialFocus))
            ) {
                base.setCurrent();
            }
            // update keyboard - enabled or disabled?
            base.toggle();
            // show keyboard
            base.$keyboard.show();
            // adjust keyboard preview window width - save width so IE won't keep expanding (fix issue #6)
            if (o.usePreview && $keyboard.msie) {
                if (typeof base.width === 'undefined') {
                    base.$preview.hide(); // preview is 100% browser width in IE7, so hide the damn thing
                    base.width = Math.ceil(base.$keyboard.width()); // set input width to match the widest keyboard row
                    base.$preview.show();
                }
                base.$preview.width(base.width);
            }
            base.reposition();
            base.checkDecimal();
            // get preview area line height
            // add roughly 4px to get line height from font height, works well for font-sizes from 14-36px
            // needed for textareas
            base.lineHeight = parseInt(base.$preview.css('lineHeight'), 10) ||
                parseInt(base.$preview.css('font-size'), 10) + 4;
            if (o.caretToEnd) {
                temp = base.isContentEditable ? $keyboard.getEditableLength(base.el) : base.originalContent.length;
                base.saveCaret(temp, temp);
            }
            // IE caret haxx0rs
            if ($keyboard.allie) {
                // sometimes end = 0 while start is > 0
                if (base.last.end === 0 && base.last.start > 0) {
                    base.last.end = base.last.start;
                }
                // IE will have start -1, end of 0 when not focused (see demo: https://jsfiddle.net/Mottie/fgryQ/3/)
                if (base.last.start < 0) {
                    // ensure caret is at the end of the text (needed for IE)
                    base.last.start = base.last.end = base.originalContent.length;
                }
            }
            if (alreadyOpen || redraw) {
                // restore caret position (userClosed)
                $keyboard.caret(base.$preview, base.last);
                base.opening = false;
                return base;
            }
            // opening keyboard flag; delay allows switching between keyboards without immediately closing
            // the keyboard
            base.timer2 = setTimeout(function () {
                var undef;
                base.opening = false;
                // Number inputs don't support selectionStart and selectionEnd
                // Number/email inputs don't support selectionStart and selectionEnd
                if (!/(number|email)/i.test(base.el.type) && !o.caretToEnd) {
                    // caret position is always 0,0 in webkit; and nothing is focused at this point... odd
                    // save caret position in the input to transfer it to the preview
                    // inside delay to get correct caret position
                    base.saveCaret(undef, undef, base.$el);
                }
                if (o.initialFocus || base.$el.hasClass($keyboard.css.initialFocus)) {
                    $keyboard.caret(base.$preview, base.last);
                }
                // save event time for keyboards with stayOpen: true
                base.last.eventTime = new Date().getTime();
                base.$el.trigger($keyboard.events.kbVisible, [base, base.el]);
                base.timer = setTimeout(function () {
                    // get updated caret information after visible event - fixes #331
                    if (base) { // Check if base exists, this is a case when destroy is called, before timers fire
                        base.saveCaret();
                    }
                }, 200);
            }, 10);
            // return base to allow chaining in typing extension
            return base;
        };
        base.updateLanguage = function () {
            // change language if layout is named something like 'french-azerty-1'
            var layouts = $keyboard.layouts,
                lang = o.language || layouts[o.layout] && layouts[o.layout].lang &&
                    layouts[o.layout].lang || [o.language || 'en'],
                kblang = $keyboard.language;
            // some languages include a dash, e.g. 'en-gb' or 'fr-ca'
            // allow o.language to be a string or array...
            // array is for future expansion where a layout can be set for multiple languages
            lang = ($.isArray(lang) ? lang[0] : lang);
            base.language = lang;
            lang = lang.split('-')[0];
            // set keyboard language
            o.display = $.extend(true, {},
                kblang.en.display,
                kblang[lang] && kblang[lang].display || {},
                base.settings.display
            );
            o.wheelMessage = kblang[lang] && kblang[lang].wheelMessage || kblang.en.wheelMessage;
            // rtl can be in the layout or in the language definition; defaults to false
            o.rtl = layouts[o.layout] && layouts[o.layout].rtl || kblang[lang] && kblang[lang].rtl || false;
            // save default regex (in case loading another layout changes it)
            if (kblang[lang] && kblang[lang].comboRegex) {
                base.regex = kblang[lang].comboRegex;
            }
            // determine if US '.' or European ',' system being used
            base.decimal = /^\./.test(o.display.dec);
            base.$el
                .toggleClass('rtl', o.rtl)
                .css('direction', o.rtl ? 'rtl' : '');
        };
        base.startup = function () {
            var kbcss = $keyboard.css;
            // ensure base.$preview is defined; but don't overwrite it if keyboard is always visible
            if (!((o.alwaysOpen || o.userClosed) && base.$preview)) {
                base.makePreview();
            }
            if (!base.hasKeyboard()) {
                // custom layout - create a unique layout name based on the hash
                if (o.layout === 'custom') {
                    o.layoutHash = 'custom' + base.customHash();
                }
                base.layout = o.layout === 'custom' ? o.layoutHash : o.layout;
                base.last.layout = base.layout;
                base.updateLanguage();
                if (typeof $keyboard.builtLayouts[base.layout] === 'undefined') {
                    if ($.isFunction(o.create)) {
                        // create must call buildKeyboard() function; or create it's own keyboard
                        base.$keyboard = o.create(base);
                    } else if (!base.$keyboard.length) {
                        base.buildKeyboard(base.layout, true);
                    }
                }
                base.$keyboard = $keyboard.builtLayouts[base.layout].$keyboard.clone();
                base.$keyboard.data('keyboard', base);
                if ((base.el.id || '') !== '') {
                    // add ID to keyboard for styling purposes
                    base.$keyboard.attr('id', base.el.id + $keyboard.css.idSuffix);
                }
                base.makePreview();
            }
            // Add layout and laguage data-attibutes
            base.$keyboard
                .attr('data-' + kbcss.keyboard + '-layout', o.layout)
                .attr('data-' + kbcss.keyboard + '-language', base.language);
            base.$decBtn = base.$keyboard.find('.' + kbcss.keyPrefix + 'dec');
            // add enter to allowed keys; fixes #190
            if (o.enterNavigation || base.isTextArea) {
                base.alwaysAllowed.push($keyboard.keyCodes.enter);
            }
            base.bindKeyboard();
            base.$keyboard.appendTo(o.appendLocally ? base.$el.parent() : o.appendTo || 'body');
            base.bindKeys();
            // reposition keyboard on window resize
            if (o.reposition && $.ui && $.ui.position && o.appendTo === 'body') {
                $(window).bind('resize' + base.namespace, function () {
                    base.reposition();
                });
            }
        };
        base.reposition = function () {
            base.position = $.isEmptyObject(o.position) ? false : o.position;
            // position after keyboard is visible (required for UI position utility)
            // and appropriately sized
            if ($.ui && $.ui.position && base.position) {
                base.position.of =
                    // get single target position
                    base.position.of ||
                    // OR target stored in element data (multiple targets)
                    base.$el.data('keyboardPosition') ||
                    // OR default @ element
                    base.$el;
                base.position.collision = base.position.collision || 'flipfit flipfit';
                base.position.at = o.usePreview ? o.position.at : o.position.at2;
                if (base.isVisible()) {
                    base.$keyboard.position(base.position);
                }
            }
            // make chainable
            return base;
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
                    .show(); // for hidden inputs
                base.preview = base.$preview[0];
                // Switch the number input field to text so the caret positioning will work again
                if (base.preview.type === 'number') {
                    base.preview.type = 'text';
                }
                // remove extraneous attributes.
                removedAttr = /^(data-|id|aria-haspopup)/i;
                attrs = base.$preview.get(0).attributes;
                for (indx = attrs.length - 1; indx >= 0; indx--) {
                    attr = attrs[indx] && attrs[indx].name;
                    if (removedAttr.test(attr)) {
                        // remove data-attributes - see #351
                        base.preview.removeAttribute(attr);
                    }
                }
                // build preview container and append preview display
                $('<div />')
                    .addClass(kbcss.wrapper)
                    .append(base.$preview)
                    .prependTo(base.$keyboard);
            } else {
                base.$preview = base.$el;
                base.preview = base.el;
            }
        };
        // Added in v1.26.8 to allow chaining of the caret function, e.g.
        // keyboard.reveal().caret(4,5).insertText('test').caret('end');
        base.caret = function (param1, param2) {
            var result = $keyboard.caret(base.$preview, param1, param2),
                wasSetCaret = result instanceof $;
            // Caret was set, save last position & make chainable
            if (wasSetCaret) {
                base.saveCaret(result.start, result.end);
                return base;
            }
            // return caret position if using .caret()
            return result;
        };
        base.saveCaret = function (start, end, $el) {
            if (base.isCurrent()) {
                var p;
                if (typeof start === 'undefined') {
                    // grab & save current caret position
                    p = $keyboard.caret($el || base.$preview);
                } else {
                    p = $keyboard.caret($el || base.$preview, start, end);
                }
                base.last.start = typeof start === 'undefined' ? p.start : start;
                base.last.end = typeof end === 'undefined' ? p.end : end;
            }
        };
        base.setScroll = function () {
            // Set scroll so caret & current text is in view
            // needed for virtual keyboard typing, NOT manual typing - fixes #23
            if (!base.isContentEditable && base.last.virtual) {
                var scrollWidth, clientWidth, adjustment, direction,
                    value = base.last.val.substring(0, Math.max(base.last.start, base.last.end));
                if (!base.$previewCopy) {
                    // clone preview
                    base.$previewCopy = base.$preview.clone()
                        .removeAttr('id') // fixes #334
                        .css({
                            position: 'absolute',
                            left: 0,
                            zIndex: -10,
                            visibility: 'hidden'
                        })
                        .addClass($keyboard.css.inputClone);
                    // prevent submitting content on form submission
                    base.$previewCopy[0].disabled = true;
                    if (!base.isTextArea) {
                        // make input zero-width because we need an accurate scrollWidth
                        base.$previewCopy.css({
                            'white-space': 'pre',
                            'width': 0
                        });
                    }
                    if (o.usePreview) {
                        // add clone inside of preview wrapper
                        base.$preview.after(base.$previewCopy);
                    } else {
                        // just slap that thing in there somewhere
                        base.$keyboard.prepend(base.$previewCopy);
                    }
                }
                if (base.isTextArea) {
                    // need the textarea scrollHeight, so set the clone textarea height to be the line height
                    base.$previewCopy
                        .height(base.lineHeight)
                        .val(value);
                    // set scrollTop for Textarea
                    base.preview.scrollTop = base.lineHeight *
                        (Math.floor(base.$previewCopy[0].scrollHeight / base.lineHeight) - 1);
                } else {
                    // add non-breaking spaces
                    base.$previewCopy.val(value.replace(/\s/g, '\xa0'));
                    // if scrollAdjustment option is set to "c" or "center" then center the caret
                    adjustment = /c/i.test(o.scrollAdjustment) ? base.preview.clientWidth / 2 : o.scrollAdjustment;
                    scrollWidth = base.$previewCopy[0].scrollWidth - 1;
                    // set initial state as moving right
                    if (typeof base.last.scrollWidth === 'undefined') {
                        base.last.scrollWidth = scrollWidth;
                        base.last.direction = true;
                    }
                    // if direction = true; we're scrolling to the right
                    direction = base.last.scrollWidth === scrollWidth ?
                        base.last.direction :
                        base.last.scrollWidth < scrollWidth;
                    clientWidth = base.preview.clientWidth - adjustment;
                    // set scrollLeft for inputs; try to mimic the inherit caret positioning + scrolling:
                    // hug right while scrolling right...
                    if (direction) {
                        if (scrollWidth < clientWidth) {
                            base.preview.scrollLeft = 0;
                        } else {
                            base.preview.scrollLeft = scrollWidth - clientWidth;
                        }
                    } else {
                        // hug left while scrolling left...
                        if (scrollWidth >= base.preview.scrollWidth - clientWidth) {
                            base.preview.scrollLeft = base.preview.scrollWidth - adjustment;
                        } else if (scrollWidth - adjustment > 0) {
                            base.preview.scrollLeft = scrollWidth - adjustment;
                        } else {
                            base.preview.scrollLeft = 0;
                        }
                    }
                    base.last.scrollWidth = scrollWidth;
                    base.last.direction = direction;
                }
            }
        };
        base.bindFocus = function () {
            if (o.openOn) {
                // make sure keyboard isn't destroyed
                // Check if base exists, this is a case when destroy is called, before timers have fired
                if (base && base.el.active) {
                    base.$el.bind(o.openOn + base.namespace, function () {
                        base.focusOn();
                    });
                    // remove focus from element (needed for IE since blur doesn't seem to work)
                    if ($(':focus')[0] === base.el) {
                        base.$el.blur();
                    }
                }
            }
        };
        base.bindKeyboard = function () {
            var keyCodes = $keyboard.keyCodes,
                layout = $keyboard.builtLayouts[base.layout],
                namespace = base.namespace + 'keybindings';
            base.$preview
                .unbind(base.namespace)
                .bind('click' + namespace + ' touchstart' + namespace, function () {
                    if (o.alwaysOpen && !base.isCurrent()) {
                        base.reveal();
                    }
                    // update last caret position after user click, use at least 150ms or it doesn't work in IE
                    base.timer2 = setTimeout(function () {
                        if (base) {
                            base.saveCaret();
                        }
                    }, 150);
                })
                .bind('keypress' + namespace, function (e) {
                    if (o.lockInput) {
                        return false;
                    }
                    if (!base.isCurrent()) {
                        return;
                    }
                    var k = e.charCode || e.which,
                        // capsLock can only be checked while typing a-z
                        k1 = k >= keyCodes.A && k <= keyCodes.Z,
                        k2 = k >= keyCodes.a && k <= keyCodes.z,
                        str = base.last.key = String.fromCharCode(k);
                    // check, that keypress wasn't rise by functional key
                    // space is first typing symbol in UTF8 table
                    if (k < keyCodes.space) { //see #549
                        return;
                    }
                    base.last.virtual = false;
                    base.last.event = e;
                    base.last.$key = []; // not a virtual keyboard key
                    if (base.checkCaret) {
                        base.saveCaret();
                    }
                    // restrict input - keyCode in keypress special keys:
                    // see http://www.asquare.net/javascript/tests/KeyCode.html
                    if ((e.ctrlKey || e.metaKey) &&
                        (e.which === keyCodes.A || e.which === keyCodes.C || e.which === keyCodes.V ||
                            (e.which >= keyCodes.X && e.which <= keyCodes.Z))) {
                        // Allow select all (ctrl-a), copy (ctrl-c), paste (ctrl-v) & cut (ctrl-x) &
                        // redo (ctrl-y)& undo (ctrl-z); meta key for mac
                        return;
                    }
                    // Mapped Keys - allows typing on a regular keyboard and the mapped key is entered
                    // Set up a key in the layout as follows: 'm(a):label'; m = key to map, (a) = actual keyboard key
                    // to map to (optional), ':label' = title/tooltip (optional)
                    // example: \u0391 or \u0391(A) or \u0391:alpha or \u0391(A):alpha
                    if (layout.hasMappedKeys && layout.mappedKeys.hasOwnProperty(str)) {
                        base.last.key = layout.mappedKeys[str];
                        // base.insertText(base.last.key);
                        e.preventDefault();
                    }
                    base.checkMaxLength();
                })
                .bind('keyup' + namespace, function (e) {
                    if (!base.isCurrent()) {
                        return;
                    }
                    base.last.virtual = false;
                    switch (e.which) {
                        // Insert tab key
                        case keyCodes.tab:
                            // Added a flag to prevent from tabbing into an input, keyboard opening, then adding the tab
                            // to the keyboard preview area on keyup. Sadly it still happens if you don't release the tab
                            // key immediately because keydown event auto-repeats
                            if (base.tab && !o.lockInput) {
                                // when switching inputs, the tab keyaction returns false
                                var notSwitching = $keyboard.keyaction.tab(base);
                                base.tab = false;
                                if (!notSwitching) {
                                    return false;
                                }
                            } else {
                                e.preventDefault();
                            }
                            break;
                        // Escape will hide the keyboard
                        case keyCodes.escape:
                            if (!o.ignoreEsc) {
                                base.close(o.autoAccept && o.autoAcceptOnEsc ? 'true' : false);
                            }
                            return false;
                    }
                    base.checkMaxLength();
                    base.last.preVal = '' + base.last.val;
                    // don't alter "e" or the "keyup" event never finishes processing; fixes #552
                    var event = $.Event($keyboard.events.kbChange);
                    // base.last.key may be empty string (shift, enter, tab, etc) when keyboard is first visible
                    // use e.key instead, if browser supports it
                    event.action = base.last.key;
                    base.$el.trigger(event, [base, base.el]);
                    // change callback is no longer bound to the input element as the callback could be
                    // called during an external change event with all the necessary parameters (issue #157)
                })
                .bind('keydown' + namespace, function (e) {
                    base.last.keyPress = e.which;
                    // ensure alwaysOpen keyboards are made active
                    if (o.alwaysOpen && !base.isCurrent()) {
                        base.reveal();
                    }
                    // prevent tab key from leaving the preview window
                    if (e.which === keyCodes.tab) {
                        // allow tab to pass through - tab to next input/shift-tab for prev
                        base.tab = true;
                        return false;
                    }
                    if (o.lockInput || e.timeStamp === base.last.timeStamp) {
                        return !o.lockInput;
                    }
                    base.last.timeStamp = e.timeStamp; // fixes #659
                    base.last.virtual = false;
                    switch (e.which) {
                        case keyCodes.backSpace:
                            $keyboard.keyaction.bksp(base, null, e);
                            e.preventDefault();
                            break;
                        case keyCodes.enter:
                            $keyboard.keyaction.enter(base, null, e);
                            break;
                        case keyCodes.V:
                            // prevent ctrl-v/cmd-v
                            if (e.ctrlKey || e.metaKey) {
                                if (o.preventPaste) {
                                    e.preventDefault();
                                    return;
                                }
                            }
                            break;
                    }
                })
                .bind('mouseup touchend '.split(' ').join(namespace + ' '), function () {
                    base.last.virtual = true;
                    base.saveCaret();
                });
            // prevent keyboard event bubbling
            base.$keyboard.bind('mousedown click touchstart '.split(' ').join(base.namespace + ' '), function (e) {
                e.stopPropagation();
                if (!base.isCurrent()) {
                    base.reveal();
                    $(base.el.ownerDocument).trigger('checkkeyboard' + base.namespace);
                }
                base.setFocus();
            });
            // If preventing paste, block context menu (right click)
            if (o.preventPaste) {
                base.$preview.bind('contextmenu' + base.namespace, function (e) {
                    e.preventDefault();
                });
                base.$el.bind('contextmenu' + base.namespace, function (e) {
                    e.preventDefault();
                });
            }
        };
        base.bindButton = function (events, handler) {
            var button = '.' + $keyboard.css.keyButton,
                callback = function (e) {
                    e.stopPropagation();
                    // save closest keyboard wrapper/input to check in checkClose function
                    e.$target = $(this).closest('.' + $keyboard.css.keyboard + ', .' + $keyboard.css.input);
                    handler.call(this, e);
                };
            if ($.fn.on) {
                // jQuery v1.7+
                base.$keyboard.on(events, button, callback);
            } else if ($.fn.delegate) {
                // jQuery v1.4.2 - 3.0.0
                base.$keyboard.delegate(button, events, callback);
            }
            return base;
        };
        base.unbindButton = function (namespace) {
            if ($.fn.off) {
                // jQuery v1.7+
                base.$keyboard.off(namespace);
            } else if ($.fn.undelegate) {
                // jQuery v1.4.2 - 3.0.0 (namespace only added in v1.6)
                base.$keyboard.undelegate('.' + $keyboard.css.keyButton, namespace);
            }
            return base;
        };
        base.bindKeys = function () {
            var kbcss = $keyboard.css;
            base
                .unbindButton(base.namespace + ' ' + base.namespace + 'kb')
                // Change hover class and tooltip - moved this touchstart before option.keyBinding touchstart
                // to prevent mousewheel lag/duplication - Fixes #379 & #411
                .bindButton('mouseenter mouseleave touchstart '.split(' ').join(base.namespace + ' '), function (e) {
                    if ((o.alwaysOpen || o.userClosed) && e.type !== 'mouseleave' && !base.isCurrent()) {
                        base.reveal();
                        base.setFocus();
                    }
                    if (!base.isCurrent() || this.disabled) {
                        return;
                    }
                    var $keys, txt,
                        last = base.last,
                        $this = $(this),
                        type = e.type;
                    if (o.useWheel && base.wheel) {
                        $keys = base.getLayers($this);
                        txt = ($keys.length ? $keys.map(function () {
                            return $(this).attr('data-value') || '';
                        })
                            .get() : '') || [$this.text()];
                        last.wheel_$Keys = $keys;
                        last.wheelLayers = txt;
                        last.wheelIndex = $.inArray($this.attr('data-value'), txt);
                    }
                    if ((type === 'mouseenter' || type === 'touchstart') && base.el.type !== 'password' &&
                        !$this.hasClass(o.css.buttonDisabled)) {
                        $this.addClass(o.css.buttonHover);
                        if (o.useWheel && base.wheel) {
                            $this.attr('title', function (i, t) {
                                // show mouse wheel message
                                return (base.wheel && t === '' && base.sets && txt.length > 1 && type !== 'touchstart') ?
                                    o.wheelMessage : t;
                            });
                        }
                    }
                    if (type === 'mouseleave') {
                        // needed or IE flickers really bad
                        $this.removeClass((base.el.type === 'password') ? '' : o.css.buttonHover);
                        if (o.useWheel && base.wheel) {
                            last.wheelIndex = 0;
                            last.wheelLayers = [];
                            last.wheel_$Keys = [];
                            $this
                                .attr('title', function (i, t) {
                                    return (t === o.wheelMessage) ? '' : t;
                                })
                                .html($this.attr('data-html')); // restore original button text
                        }
                    }
                })
                // keyBinding = 'mousedown touchstart' by default
                .bindButton(o.keyBinding.split(' ').join(base.namespace + ' ') + base.namespace + ' ' +
                    $keyboard.events.kbRepeater, function (e) {
                    e.preventDefault();
                    // prevent errors when external triggers attempt to 'type' - see issue #158
                    if (!base.$keyboard.is(':visible') || this.disabled) {
                        return false;
                    }
                    var action,
                        last = base.last,
                        $key = $(this),
                        // prevent mousedown & touchstart from both firing events at the same time - see #184
                        timer = new Date().getTime();
                    if (o.useWheel && base.wheel) {
                        // get keys from other layers/keysets (shift, alt, meta, etc) that line up by data-position
                        // target mousewheel selected key
                        $key = last.wheel_$Keys.length && last.wheelIndex > -1 ? last.wheel_$Keys.eq(last.wheelIndex) : $key;
                    }
                    action = $key.attr('data-action');
                    if (timer - (last.eventTime || 0) < o.preventDoubleEventTime) {
                        return;
                    }
                    last.eventTime = timer;
                    last.event = e;
                    last.virtual = true;
                    last.$key = $key;
                    last.key = $key.attr('data-value');
                    last.keyPress = '';
                    // Start caret in IE when not focused (happens with each virtual keyboard button click
                    base.setFocus();
                    if (/^meta/.test(action)) {
                        action = 'meta';
                    }
                    // keyaction is added as a string, override original action & text
                    if (action === last.key && typeof $keyboard.keyaction[action] === 'string') {
                        last.key = action = $keyboard.keyaction[action];
                    } else if (action in $keyboard.keyaction && $.isFunction($keyboard.keyaction[action])) {
                        // stop processing if action returns false (close & cancel)
                        if ($keyboard.keyaction[action](base, this, e) === false) {
                            return false;
                        }
                        action = null; // prevent inserting action name
                    }
                    // stop processing if keyboard closed and keyaction did not return false - see #536
                    if (!base.hasKeyboard()) {
                        return false;
                    }
                    if (typeof action !== 'undefined' && action !== null) {
                        last.key = $(this).hasClass(kbcss.keyAction) ? action : last.key;
                        base.insertText(last.key);
                    }
                    // set caret if caret moved by action function; also, attempt to fix issue #131
                    $keyboard.caret(base.$preview, last);
                    e = $.extend({}, e, $.Event($keyboard.events.kbChange));
                    e.target = base.el;
                    e.action = last.key;
                    base.$el.trigger(e, [base, base.el]);
                    last.preVal = '' + last.val;
                })
                // using 'kb' namespace for mouse repeat functionality to keep it separate
                // I need to trigger a 'repeater.keyboard' to make it work
                .bindButton('mouseup' + base.namespace + ' ' + 'mouseleave touchend touchmove touchcancel '.split(' ')
                    .join(base.namespace + 'kb '), function (e) {
                    base.last.virtual = true;
                    var offset,
                        $this = $(this);
                    if (e.type === 'touchmove') {
                        // if moving within the same key, don't stop repeating
                        offset = $this.offset();
                        offset.right = offset.left + $this.outerWidth();
                        offset.bottom = offset.top + $this.outerHeight();
                        if (e.originalEvent.touches[0].pageX >= offset.left &&
                            e.originalEvent.touches[0].pageX < offset.right &&
                            e.originalEvent.touches[0].pageY >= offset.top &&
                            e.originalEvent.touches[0].pageY < offset.bottom) {
                            return true;
                        }
                    } else if (/(mouseleave|touchend|touchcancel)/i.test(e.type)) {
                        $this.removeClass(o.css.buttonHover); // needed for touch devices
                    } else {
                        if (!o.noFocus && base.isCurrent() && base.isVisible()) {
                            base.$preview.focus();
                        }
                        if (base.checkCaret) {
                            $keyboard.caret(base.$preview, base.last);
                        }
                    }
                    base.mouseRepeat = [false, ''];
                    clearTimeout(base.repeater); // make sure key repeat stops!
                    return false;
                })
                // prevent form submits when keyboard is bound locally - issue #64
                .bindButton('click' + base.namespace, function () {
                    return false;
                })
                // Allow mousewheel to scroll through other keysets of the same (non-action) key
                .bindButton('mousewheel' + base.namespace, base.throttleEvent(function (e, delta) {
                    var $btn = $(this);
                    // no mouse repeat for action keys (shift, ctrl, alt, meta, etc)
                    if (!$btn || $btn.hasClass(kbcss.keyAction) || base.last.wheel_$Keys[0] !== this) {
                        return;
                    }
                    if (o.useWheel && base.wheel) {
                        // deltaY used by newer versions of mousewheel plugin
                        delta = delta || e.deltaY;
                        var n,
                            txt = base.last.wheelLayers || [];
                        if (txt.length > 1) {
                            n = base.last.wheelIndex + (delta > 0 ? -1 : 1);
                            if (n > txt.length - 1) {
                                n = 0;
                            }
                            if (n < 0) {
                                n = txt.length - 1;
                            }
                        } else {
                            n = 0;
                        }
                        base.last.wheelIndex = n;
                        $btn.html(txt[n]);
                        return false;
                    }
                }, 30))
            ;
        };
        // No call on tailing event
        base.throttleEvent = function (cb, time) {
            var interm;
            return function () {
                if (!interm) {
                    cb.apply(this, arguments);
                    interm = true;
                    setTimeout(function () {
                        interm = false;
                    }, time);
                }
            };
        };
        base.execCommand = function (cmd, str) {
            base.el.ownerDocument.execCommand(cmd, false, str);
            base.el.normalize();
            if (o.reposition) {
                base.reposition();
            }
        };
        base.getValue = function ($el) {
            $el = $el || base.$preview;
            return $el[base.isContentEditable ? 'text' : 'val']();
        };
        base.setValue = function (txt, $el) {
            $el = $el || base.$preview;
            if (base.isContentEditable) {
                if (txt !== $el.text()) {
                    $keyboard.replaceContent($el, txt);
                    base.saveCaret();
                }
            } else {
                $el.val(txt);
            }
            return base;
        };
        // Insert text at caret/selection - thanks to Derek Wickwire for fixing this up!
        base.insertText = function (txt) {
            if (!base.$preview) {
                return base;
            }
            if (typeof txt === 'undefined' || txt === false) {
                base.last.key = '';
                return base;
            }
            if (base.isContentEditable) {
                return base.insertContentEditable(txt);
            }
            var t,
                bksp = false,
                isBksp = txt === '\b',
                // use base.$preview.val() instead of base.preview.value (val.length includes carriage returns in IE).
                val = base.getValue(),
                pos = $keyboard.caret(base.$preview),
                len = val.length; // save original content length
            // silly IE caret hacks... it should work correctly, but navigating using arrow keys in a textarea
            // is still difficult
            // in IE, pos.end can be zero after input loses focus
            if (pos.end < pos.start) {
                pos.end = pos.start;
            }
            if (pos.start > len) {
                pos.end = pos.start = len;
            }
            if (base.isTextArea) {
                // This makes sure the caret moves to the next line after clicking on enter (manual typing works fine)
                if ($keyboard.msie && val.substring(pos.start, pos.start + 1) === '\n') {
                    pos.start += 1;
                    pos.end += 1;
                }
            }
            t = pos.start;
            if (txt === '{d}') {
                txt = '';
                pos.end += 1;
            }
            if (isBksp) {
                txt = '';
                bksp = isBksp && t === pos.end && t > 0;
            }
            val = val.substring(0, t - (bksp ? 1 : 0)) + txt + val.substring(pos.end);
            t += bksp ? -1 : txt.length;
            base.setValue(val);
            base.saveCaret(t, t); // save caret in case of bksp
            base.setScroll();
            // see #506.. allow chaining of insertText
            return base;
        };
        base.insertContentEditable = function (txt) {
            base.$preview.focus();
            base.execCommand('insertText', txt);
            base.saveCaret();
            return base;
        };
        // check max length
        base.checkMaxLength = function () {
            if (!base.$preview) {
                return;
            }
            var start, caret,
                val = base.getValue(),
                len = base.isContentEditable ? $keyboard.getEditableLength(base.el) : val.length;
            if (o.maxLength !== false && len > o.maxLength) {
                start = $keyboard.caret(base.$preview).start;
                caret = Math.min(start, o.maxLength);
                // prevent inserting new characters when maxed #289
                if (!o.maxInsert) {
                    val = base.last.val;
                    caret = start - 1; // move caret back one
                }
                base.setValue(val.substring(0, o.maxLength));
                // restore caret on change, otherwise it ends up at the end.
                base.saveCaret(caret, caret);
            }
            if (base.$decBtn.length) {
                base.checkDecimal();
            }
            // allow chaining
            return base;
        };
        base.getKeySet = function () {
            var sets = [];
            return sets.length ? sets.join('+') : 'normal';
        };
        // check for key combos (dead keys)
        base.checkCombos = function () {
            // return val for close function
            if (!(
                base.isVisible() || (
                    base.hasKeyboard() &&
                    base.$keyboard.hasClass($keyboard.css.hasFocus)
                )
            )) {
                return base.getValue(base.$preview || base.$el);
            }
            var t, t2, repl,
                // use base.$preview.val() instead of base.preview.value
                // (val.length includes carriage returns in IE).
                val = base.getValue(),
                pos = $keyboard.caret(base.$preview),
                max = base.isContentEditable ? $keyboard.getEditableLength(base.el) : val.length,
                // save original content length
                len = max;
            // silly IE caret hacks... it should work correctly, but navigating using arrow keys in a textarea
            // is still difficult
            // in IE, pos.end can be zero after input loses focus
            if (pos.end < pos.start) {
                pos.end = pos.start;
            }
            if (pos.start > len) {
                pos.end = pos.start = len;
            }
            // This makes sure the caret moves to the next line after clicking on enter (manual typing works fine)
            if ($keyboard.msie && val.substring(pos.start, pos.start + 1) === '\n') {
                pos.start += 1;
                pos.end += 1;
            }
            if (o.useCombos) {
                // keep 'a' and 'o' in the regex for ae and oe ligature (æ,œ)
                // thanks to KennyTM: http://stackoverflow.com/q/4275077
                // original regex /([`\'~\^\"ao])([a-z])/mig moved to $.keyboard.comboRegex
                if ($keyboard.msie) {
                    // old IE may not have the caret positioned correctly, so just check the whole thing
                    val = val.replace(base.regex, function (s, accent, letter) {
                        return (o.combos.hasOwnProperty(accent)) ? o.combos[accent][letter] || s : s;
                    });
                    // prevent combo replace error, in case the keyboard closes - see issue #116
                } else if (base.$preview.length) {
                    // Modern browsers - check for combos from last two characters left of the caret
                    t = pos.start - (pos.start - 2 >= 0 ? 2 : 0);
                    // target last two characters
                    $keyboard.caret(base.$preview, t, pos.end);
                    // do combo replace
                    t = $keyboard.caret(base.$preview);
                    repl = function (txt) {
                        return (txt || '').replace(base.regex, function (s, accent, letter) {
                            return (o.combos.hasOwnProperty(accent)) ? o.combos[accent][letter] || s : s;
                        });
                    };
                    t2 = repl(t.text);
                    // add combo back
                    // prevent error if caret doesn't return a function
                    if (t && t.replaceStr && t2 !== t.text) {
                        if (base.isContentEditable) {
                            $keyboard.replaceContent(el, repl);
                        } else {
                            base.setValue(t.replaceStr(t2));
                        }
                    }
                    val = base.getValue();
                }
            }
            // save changes, then reposition caret
            pos.start += max - len;
            pos.end += max - len;
            base.setValue(val);
            base.saveCaret(pos.start, pos.end);
            // set scroll to keep caret in view
            base.setScroll();
            base.checkMaxLength();
            return val; // return text, used for keyboard closing section
        };
        // Toggle accept button classes, if validating
        base.checkValid = function () {
            var kbcss = $keyboard.css,
                $accept = base.$keyboard.find('.' + kbcss.keyPrefix + 'accept'),
                valid = true;
            if ($.isFunction(o.validate)) {
                valid = o.validate(base, base.getValue(), false);
            }
            // toggle accept button classes; defined in the css
            $accept
                .toggleClass(kbcss.inputInvalid, !valid)
                .toggleClass(kbcss.inputValid, valid)
                // update title to indicate that the entry is valid or invalid
                .attr('title', $accept.attr('data-title') + ' (' + o.display[valid ? 'valid' : 'invalid'] + ')');
        };
        // Decimal button for num pad - only allow one (not used by default)
        base.checkDecimal = function () {
            // Check US '.' or European ',' format
            if ((base.decimal && /\./g.test(base.preview.value)) ||
                (!base.decimal && /\,/g.test(base.preview.value))) {
                base.$decBtn
                    .attr({
                        'disabled': 'disabled',
                        'aria-disabled': 'true'
                    })
                    .removeClass(o.css.buttonHover)
                    .addClass(o.css.buttonDisabled);
            } else {
                base.$decBtn
                    .removeAttr('disabled')
                    .attr({
                        'aria-disabled': 'false'
                    })
                    .addClass(o.css.buttonDefault)
                    .removeClass(o.css.buttonDisabled);
            }
        };
        // get other layer values for a specific key
        base.getLayers = function ($el) {
            var kbcss = $keyboard.css,
                key = $el.attr('data-pos'),
                $keys = $el.closest('.' + kbcss.keyboard)
                    .find('button[data-pos="' + key + '"]');
            return $keys.filter(function () {
                return $(this)
                    .find('.' + kbcss.keyText)
                    .text() !== '';
            })
                .add($el);
        };
        // Close the keyboard, if visible. Pass a status of true, if the content was accepted
        // (for the event trigger).
        base.close = function (accepted) {
            if (base.isOpen && base.$keyboard.length) {
                clearTimeout(base.throttled);
                var kbcss = $keyboard.css,
                    kbevents = $keyboard.events,
                    val = accepted ? base.checkCombos() : base.originalContent;
                // validate input if accepted
                if (accepted && $.isFunction(o.validate) && !o.validate(base, val, true)) {
                    val = base.originalContent;
                    accepted = false;
                    if (o.cancelClose) {
                        return;
                    }
                }
                base.isCurrent(false);
                base.isOpen = o.alwaysOpen || o.userClosed;
                if (base.isContentEditable && !accepted) {
                    // base.originalContent stores the HTML
                    base.$el.html(val);
                } else {
                    base.setValue(val, base.$el);
                }
                base.$el
                    .removeClass(kbcss.isCurrent + ' ' + kbcss.inputAutoAccepted)
                    // add 'ui-keyboard-autoaccepted' to inputs - see issue #66
                    .addClass((accepted || false) ? accepted === true ? '' : kbcss.inputAutoAccepted : '')
                    // trigger default change event - see issue #146
                    .trigger(kbevents.inputChange);
                // save caret after updating value (fixes userClosed issue with changing focus)
                $keyboard.caret(base.$preview, base.last);
                base.$el
                    .trigger(((accepted || false) ? kbevents.inputAccepted : kbevents.inputCanceled), [base, base.el])
                    .trigger((o.alwaysOpen) ? kbevents.kbInactive : kbevents.kbHidden, [base, base.el])
                    .blur();
                // base is undefined if keyboard was destroyed - fixes #358
                if (base) {
                    // add close event time
                    base.last.eventTime = new Date().getTime();
                    if (!(o.alwaysOpen || o.userClosed && accepted === 'true') && base.$keyboard.length) {
                        // free up memory
                        base.removeKeyboard();
                        // rebind input focus - delayed to fix IE issue #72
                        base.timer = setTimeout(function () {
                            if (base) {
                                base.bindFocus();
                            }
                        }, 200);
                    }
                    if (!base.watermark && base.el.value === '' && base.inPlaceholder !== '') {
                        base.$el.addClass(kbcss.placeholder);
                        base.setValue(base.inPlaceholder, base.$el);
                    }
                }
            }
            return !!accepted;
        };
        base.accept = function () {
            return base.close(true);
        };
        // Build default button
        base.keyBtn = $('<button />')
            .attr({
                'role': 'button',
                'type': 'button',
                'aria-disabled': 'false',
                'tabindex': '-1'
            })
            .addClass($keyboard.css.keyButton);
        // convert key names into a class name
        base.processName = function (name) {
            var index, n,
                process = (name || '').replace(/[^a-z0-9-_]/gi, ''),
                len = process.length,
                newName = [];
            if (len > 1 && name === process) {
                // return name if basic text
                return name;
            }
            // return character code sequence
            len = name.length;
            if (len) {
                for (index = 0; index < len; index++) {
                    n = name[index];
                    // keep '-' and '_'... so for dash, we get two dashes in a row
                    newName.push(/[a-z0-9-_]/i.test(n) ?
                        (/[-_]/.test(n) && index !== 0 ? '' : n) :
                        (index === 0 ? '' : '-') + n.charCodeAt(0)
                    );
                }
                return newName.join('');
            }
            return name;
        };
        base.processKeys = function (name) {
            var tmp,
                // Don't split colons followed by //, e.g. https://; Fixes #555
                parts = name.split(/:(?!\/\/)/),
                htmlIndex = name.indexOf('</'),
                colonIndex = name.indexOf(':', name.indexOf('<')),
                data = {
                    name: null,
                    map: '',
                    title: ''
                };
            if (htmlIndex > -1 && (colonIndex < 0 || colonIndex > htmlIndex)) {
                // html includes colons; see #701
                data.name = name;
                return data;
            }
            /* map defined keys
		format 'key(A):Label_for_key_(ignore_parentheses_here)'
			'key' = key that is seen (can any character(s); but it might need to be escaped using '\'
			or entered as unicode '\u####'
			'(A)' = the actual key on the real keyboard to remap
			':Label_for_key' ends up in the title/tooltip
		Examples:
			'\u0391(A):alpha', 'x(y):this_(might)_cause_problems
			or edge cases of ':(x)', 'x(:)', 'x(()' or 'x())'
		Enhancement (if I can get alt keys to work):
			A mapped key will include the mod key, e.g. 'x(alt-x)' or 'x(alt-shift-x)'
		*/
            if (/\(.+\)/.test(parts[0]) || /^:\(.+\)/.test(name) || /\([(:)]\)/.test(name)) {
                // edge cases 'x(:)', 'x(()' or 'x())'
                if (/\([(:)]\)/.test(name)) {
                    tmp = parts[0].match(/([^(]+)\((.+)\)/);
                    if (tmp && tmp.length) {
                        data.name = tmp[1];
                        data.map = tmp[2];
                        data.title = parts.length > 1 ? parts.slice(1).join(':') : '';
                    } else {
                        // edge cases 'x(:)', ':(x)' or ':(:)'
                        data.name = name.match(/([^(]+)/)[0];
                        if (data.name === ':') {
                            // ':(:):test' => parts = [ '', '(', ')', 'title' ] need to slice 1
                            parts = parts.slice(1);
                        }
                        if (tmp === null) {
                            // 'x(:):test' => parts = [ 'x(', ')', 'title' ] need to slice 2
                            data.map = ':';
                            parts = parts.slice(2);
                        }
                        data.title = parts.length ? parts.join(':') : '';
                    }
                } else {
                    // example: \u0391(A):alpha; extract 'A' from '(A)'
                    data.map = name.match(/\(([^()]+?)\)/)[1];
                    // remove '(A)', left with '\u0391:alpha'
                    name = name.replace(/\(([^()]+)\)/, '');
                    tmp = name.split(':');
                    // get '\u0391' from '\u0391:alpha'
                    if (tmp[0] === '') {
                        data.name = ':';
                        parts = parts.slice(1);
                    } else {
                        data.name = tmp[0];
                    }
                    data.title = parts.length > 1 ? parts.slice(1).join(':') : '';
                }
            } else {
                // find key label
                // corner case of '::;' reduced to ':;', split as ['', ';']
                if (name !== '' && parts[0] === '') {
                    data.name = ':';
                    parts = parts.slice(1);
                } else {
                    data.name = parts[0];
                }
                data.title = parts.length > 1 ? parts.slice(1).join(':') : '';
            }
            data.title = $.trim(data.title).replace(/_/g, ' ');
            return data;
        };
        // Add key function
        // keyName = the name of the function called in $.keyboard.keyaction when the button is clicked
        // name = name added to key, or cross-referenced in the display options
        // base.temp[0] = keyset to attach the new button
        // regKey = true when it is not an action key
        base.addKey = function (keyName, action, regKey) {
            var keyClass, tmp, keys,
                data = {},
                txt = base.processKeys(regKey ? keyName : action),
                kbcss = $keyboard.css;
            if (!regKey && o.display[txt.name]) {
                keys = base.processKeys(o.display[txt.name]);
                // action contained in "keyName" (e.g. keyName = "accept",
                // action = "a" (use checkmark instead of text))
                keys.action = base.processKeys(keyName).name;
            } else {
                // when regKey is true, keyName is the same as action
                keys = txt;
                keys.action = txt.name;
            }
            data.name = base.processName(txt.name);
            if (keys.name !== '') {
                if (keys.map !== '') {
                    $keyboard.builtLayouts[base.layout].mappedKeys[keys.map] = keys.name;
                    $keyboard.builtLayouts[base.layout].acceptedKeys.push(keys.name);
                } else if (regKey) {
                    $keyboard.builtLayouts[base.layout].acceptedKeys.push(keys.name);
                }
            }
            if (regKey) {
                keyClass = data.name === '' ? '' : kbcss.keyPrefix + data.name;
            } else {
                // Action keys will have the 'ui-keyboard-actionkey' class
                keyClass = kbcss.keyAction + ' ' + kbcss.keyPrefix + keys.action;
            }
            // '\u2190'.length = 1 because the unicode is converted, so if more than one character,
            // add the wide class
            keyClass += (keys.name.length > 2 ? ' ' + kbcss.keyWide : '') + ' ' + o.css.buttonDefault;
            data.html = '<span class="' + kbcss.keyText + '">' +
                // this prevents HTML from being added to the key
                keys.name.replace(/[\u00A0-\u9999]/gim, function (i) {
                    return '&#' + i.charCodeAt(0) + ';';
                }) +
                '</span>';
            data.$key = base.keyBtn
                .clone()
                .attr({
                    'data-value': regKey ? keys.name : keys.action, // value
                    'data-name': keys.action,
                    'data-pos': base.temp[1] + ',' + base.temp[2],
                    'data-action': keys.action,
                    'data-html': data.html
                })
                // add 'ui-keyboard-' + data.name for all keys
                //  (e.g. 'Bksp' will have 'ui-keyboard-bskp' class)
                // any non-alphanumeric characters will be replaced with
                //  their decimal unicode value
                //  (e.g. '~' is a regular key, class = 'ui-keyboard-126'
                //  (126 is the unicode decimal value - same as &#126;)
                //  See https://en.wikipedia.org/wiki/List_of_Unicode_characters#Control_codes
                .addClass(keyClass)
                .html(data.html)
                .appendTo(base.temp[0]);
            if (keys.map) {
                data.$key.attr('data-mapped', keys.map);
            }
            if (keys.title || txt.title) {
                data.$key.attr({
                    'data-title': txt.title || keys.title, // used to allow adding content to title
                    'title': txt.title || keys.title
                });
            }
            if (typeof o.buildKey === 'function') {
                data = o.buildKey(base, data);
                // copy html back to attributes
                tmp = data.$key.html();
                data.$key.attr('data-html', tmp);
            }
            return data.$key;
        };
        base.customHash = function (layout) {
            /*jshint bitwise:false */
            var i, array, hash, character, len,
                arrays = [],
                merged = [];
            // pass layout to allow for testing
            layout = typeof layout === 'undefined' ? o.customLayout : layout;
            // get all layout arrays
            for (array in layout) {
                if (layout.hasOwnProperty(array)) {
                    arrays.push(layout[array]);
                }
            }
            // flatten array
            merged = merged.concat.apply(merged, arrays).join(' ');
            // produce hash name - http://stackoverflow.com/a/7616484/145346
            hash = 0;
            len = merged.length;
            if (len === 0) {
                return hash;
            }
            for (i = 0; i < len; i++) {
                character = merged.charCodeAt(i);
                hash = ((hash << 5) - hash) + character;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        };
        base.buildKeyboard = function (name, internal) {
            // o.display is empty when this is called from the scramble extension (when alwaysOpen:true)
            if ($.isEmptyObject(o.display)) {
                // set keyboard language
                base.updateLanguage();
            }
            var index, row, $row, currentSet,
                kbcss = $keyboard.css,
                sets = 0,
                layout = $keyboard.builtLayouts[name || base.layout || o.layout] = {
                    mappedKeys: {},
                    acceptedKeys: []
                },
                acceptedKeys = layout.acceptedKeys = o.restrictInclude ?
                    ('' + o.restrictInclude).split(/\s+/) || [] :
                    [],
                // using $layout temporarily to hold keyboard popup classnames
                $layout = kbcss.keyboard + ' ' + o.css.popup + ' ' + o.css.container +
                    (o.alwaysOpen || o.userClosed ? ' ' + kbcss.alwaysOpen : ''),
                container = $('<div />')
                    .addClass($layout)
                    .attr({
                        'role': 'textbox'
                    })
                    .hide();
            // allow adding "{space}" as an accepted key - Fixes #627
            index = $.inArray('{space}', acceptedKeys);
            if (index > -1) {
                acceptedKeys[index] = ' ';
            }
            // verify layout or setup custom keyboard
            if ((internal && o.layout === 'custom') || !$keyboard.layouts.hasOwnProperty(o.layout)) {
                o.layout = 'custom';
                $layout = $keyboard.layouts.custom = o.customLayout || {
                    'normal': ['{cancel}']
                };
            } else {
                $layout = $keyboard.layouts[internal ? o.layout : name || base.layout || o.layout];
            }
            // Main keyboard building loop
            $.each($layout, function (set, keySet) {
                // skip layout name & lang settings
                if (set !== '' && !/^(name|lang|rtl)$/i.test(set)) {
                    // keep backwards compatibility for change from default to normal naming
                    if (set === 'default') {
                        set = 'normal';
                    }
                    sets++;
                    $row = $('<div />')
                        .attr('name', set) // added for typing extension
                        .addClass(kbcss.keySet + ' ' + kbcss.keySet + '-' + set)
                        .appendTo(container)
                        .toggle(set === 'normal');
                    for (row = 0; row < keySet.length; row++) {
                        // remove extra spaces before spliting (regex probably could be improved)
                        currentSet = $.trim(keySet[row]).replace(/\{(\.?)[\s+]?:[\s+]?(\.?)\}/g, '{$1:$2}');
                        base.buildRow($row, row, currentSet.split(/\s+/), acceptedKeys);
                        $row.find('.' + kbcss.keyButton + ',.' + kbcss.keySpacer)
                            .filter(':last')
                            .after('<br class="' + kbcss.endRow + '"/>');
                    }
                }
            });
            if (sets > 1) {
                base.sets = true;
            }
            layout.hasMappedKeys = !($.isEmptyObject(layout.mappedKeys));
            layout.$keyboard = container;
            return container;
        };
        base.buildRow = function ($row, row, keys, acceptedKeys) {
            var t, txt, key, isAction, action, margin,
                kbcss = $keyboard.css;
            for (key = 0; key < keys.length; key++) {
                // used by addKey function
                base.temp = [$row, row, key];
                isAction = false;
                // ignore empty keys
                if (keys[key].length === 0) {
                    continue;
                }
                // process here if it's an action key
                if (/^\{\S+\}$/.test(keys[key])) {
                    action = keys[key].match(/^\{(\S+)\}$/)[1];
                    // add active class if there are double exclamation points in the name
                    if (/\!\!/.test(action)) {
                        action = action.replace('!!', '');
                        isAction = true;
                    }
                    // add empty space
                    if (/^sp:((\d+)?([\.|,]\d+)?)(em|px)?$/i.test(action)) {
                        // not perfect globalization, but allows you to use {sp:1,1em}, {sp:1.2em} or {sp:15px}
                        margin = parseFloat(action
                            .replace(/,/, '.')
                            .match(/^sp:((\d+)?([\.|,]\d+)?)(em|px)?$/i)[1] || 0
                        );
                        $('<span class="' + kbcss.keyText + '"></span>')
                        // previously {sp:1} would add 1em margin to each side of a 0 width span
                        // now Firefox doesn't seem to render 0px dimensions, so now we set the
                        // 1em margin x 2 for the width
                            .width((action.match(/px/i) ? margin + 'px' : (margin * 2) + 'em'))
                            .addClass(kbcss.keySpacer)
                            .appendTo($row);
                    }
                    // add empty button
                    if (/^empty(:((\d+)?([\.|,]\d+)?)(em|px)?)?$/i.test(action)) {
                        margin = (/:/.test(action)) ? parseFloat(action
                            .replace(/,/, '.')
                            .match(/^empty:((\d+)?([\.|,]\d+)?)(em|px)?$/i)[1] || 0
                        ) : '';
                        base
                            .addKey('', ' ', true)
                            .addClass(o.css.buttonDisabled + ' ' + o.css.buttonEmpty)
                            .attr('aria-disabled', true)
                            .width(margin ? (action.match('px') ? margin + 'px' : (margin * 2) + 'em') : '');
                        continue;
                    }
                    // meta keys
                    if (/^meta[\w-]+\:?(\w+)?/i.test(action)) {
                        base
                            .addKey(action.split(':')[0], action)
                            .addClass(kbcss.keyHasActive);
                        continue;
                    }
                    // switch needed for action keys with multiple names/shortcuts or
                    // default will catch all others
                    txt = action.split(':');
                    switch (txt[0].toLowerCase()) {
                        case 'a':
                        case 'accept':
                            base
                                .addKey('accept', action)
                                .addClass(o.css.buttonAction + ' ' + kbcss.keyAction);
                            break;
                        default:
                            if ($keyboard.keyaction.hasOwnProperty(txt[0])) {
                                base
                                    .addKey(txt[0], action)
                                    .toggleClass(o.css.buttonAction + ' ' + kbcss.keyAction, isAction);
                            }
                    }
                } else {
                    // regular button (not an action key)
                    t = keys[key];
                    base.addKey(t, t, true);
                }
            }
        };
        base.removeBindings = function (namespace) {
            $(document).unbind(namespace);
            if (base.el.ownerDocument !== document) {
                $(base.el.ownerDocument).unbind(namespace);
            }
            $(window).unbind(namespace);
            base.$el.unbind(namespace);
        };
        base.removeKeyboard = function () {
            base.$decBtn = [];
            // base.$preview === base.$el when o.usePreview is false - fixes #442
            if (o.usePreview) {
                base.$preview.removeData('keyboard');
            }
            base.$preview.unbind(base.namespace + 'keybindings');
            base.preview = null;
            base.$preview = null;
            base.$previewCopy = null;
            base.$keyboard.removeData('keyboard');
            base.$keyboard.remove();
            base.$keyboard = [];
            base.isOpen = false;
            base.isCurrent(false);
        };
        base.destroy = function (callback) {
            var index,
                kbcss = $keyboard.css,
                len = base.extensionNamespace.length,
                tmp = [
                    kbcss.input,
                    kbcss.locked,
                    kbcss.placeholder,
                    kbcss.noKeyboard,
                    kbcss.alwaysOpen,
                    o.css.input,
                    kbcss.isCurrent
                ].join(' ');
            clearTimeout(base.timer);
            clearTimeout(base.timer2);
            clearTimeout(base.timer3);
            if (base.$keyboard.length) {
                base.removeKeyboard();
            }
            base.removeBindings(base.namespace);
            base.removeBindings(base.namespace + 'callbacks');
            for (index = 0; index < len; index++) {
                base.removeBindings(base.extensionNamespace[index]);
            }
            base.el.active = false;
            base.$el
                .removeClass(tmp)
                .removeAttr('aria-haspopup')
                .removeAttr('role')
                .removeData('keyboard');
            base = null;
            if (typeof callback === 'function') {
                callback();
            }
        };
        // Run initializer
        base.init();
    }; // end $.keyboard definition
    // event.which & ASCII values
    $keyboard.keyCodes = {
        capsLock: 20
    };
    $keyboard.css = {
        // keyboard id suffix
        idSuffix: '_keyboard',
        // class name to set initial focus
        initialFocus: 'keyboard-init-focus',
        // element class names
        input: 'ui-keyboard-input',
        inputClone: 'ui-keyboard-preview-clone',
        wrapper: 'ui-keyboard-preview-wrapper',
        preview: 'ui-keyboard-preview',
        keyboard: 'ui-keyboard',
        keySet: 'ui-keyboard-keyset',
        keyButton: 'ui-keyboard-button',
        keyWide: 'ui-keyboard-widekey',
        keyPrefix: 'ui-keyboard-',
        keyText: 'ui-keyboard-text', // span with button text
        keyHasActive: 'ui-keyboard-hasactivestate',
        keyAction: 'ui-keyboard-actionkey',
        keySpacer: 'ui-keyboard-spacer', // empty keys
        keyToggle: 'ui-keyboard-toggle',
        keyDisabled: 'ui-keyboard-disabled',
        // Class for BRs with a div wrapper inside of contenteditable
        divWrapperCE: 'ui-keyboard-div-wrapper',
        // states
        locked: 'ui-keyboard-lockedinput',
        alwaysOpen: 'ui-keyboard-always-open',
        noKeyboard: 'ui-keyboard-nokeyboard',
        placeholder: 'ui-keyboard-placeholder',
        hasFocus: 'ui-keyboard-has-focus',
        isCurrent: 'ui-keyboard-input-current',
        // validation & autoaccept
        inputValid: 'ui-keyboard-valid-input',
        inputInvalid: 'ui-keyboard-invalid-input',
        inputAutoAccepted: 'ui-keyboard-autoaccepted',
        endRow: 'ui-keyboard-button-endrow' // class added to <br>
    };
    $keyboard.events = {
        // keyboard events
        kbChange: 'keyboardChange',
        kbBeforeVisible: 'beforeVisible',
        kbVisible: 'visible',
        kbInit: 'initialized',
        kbInactive: 'inactive',
        kbHidden: 'hidden',
        kbRepeater: 'repeater',
        kbKeysetChange: 'keysetChange',
        // input events
        inputAccepted: 'accepted',
        inputChange: 'change'
    };
    // Action key function list
    $keyboard.keyaction = {
        accept: function (base) {
            base.close(true); // same as base.accept();
            return false; // return false prevents further processing
        }
    };
    // Default keyboard layouts
    $keyboard.builtLayouts = {};
    $keyboard.layouts = {};
    $keyboard.language = {
        en: {
            display: {
                // check mark - same action as accept
                'a': '\u2714:Accept (Shift+Enter)',
                'accept': 'Accept:Accept (Shift+Enter)'
            }
        }
    };
    $keyboard.defaultOptions = {
        // set this to ISO 639-1 language code to override language set by the layout
        // http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
        // language defaults to 'en' if not found
        language: null,
        rtl: false,
        // *** choose layout & positioning ***
        layout: 'qwerty',
        customLayout: null,
        position: {
            // optional - null (attach to input/textarea) or a jQuery object (attach elsewhere)
            of: null,
            my: 'center top',
            at: 'center top',
            // used when 'usePreview' is false (centers the keyboard at the bottom of the input/textarea)
            at2: 'center bottom'
        },
        // allow jQuery position utility to reposition the keyboard on window resize
        reposition: true,
        // preview added above keyboard if true, original input/textarea used if false
        usePreview: true,
        // if true, the keyboard will always be visible
        alwaysOpen: false,
        // give the preview initial focus when the keyboard becomes visible
        initialFocus: true,
        // avoid changing the focus (hardware keyboard probably won't work)
        noFocus: false,
        // if true, keyboard will remain open even if the input loses focus, but closes on escape
        // or when another keyboard opens.
        stayOpen: false,
        // Prevents the keyboard from closing when the user clicks or presses outside the keyboard
        // the `autoAccept` option must also be set to true when this option is true or changes are lost
        userClosed: false,
        // if true, keyboard will not close if you press escape.
        ignoreEsc: false,
        // if true, keyboard will only closed on click event instead of mousedown and touchstart
        closeByClickEvent: false,
        css: {
            // input & preview
            input: 'ui-widget-content ui-corner-all',
            // keyboard container
            container: 'ui-widget-content ui-widget ui-corner-all ui-helper-clearfix',
            // keyboard container extra class (same as container, but separate)
            popup: '',
            // default state
            buttonDefault: 'ui-state-default ui-corner-all',
            // hovered button
            buttonHover: 'ui-state-hover',
            // Action keys (e.g. Accept, Cancel, Tab, etc); this replaces 'actionClass' option
            buttonAction: 'ui-state-active',
            // Active keys (e.g. shift down, meta keyset active, combo keys active)
            buttonActive: 'ui-state-active',
            // used when disabling the decimal button {dec} when a decimal exists in the input area
            buttonDisabled: 'ui-state-disabled',
            buttonEmpty: 'ui-keyboard-empty'
        },
        // *** Useability ***
        // Auto-accept content when clicking outside the keyboard (popup will close)
        autoAccept: false,
        // Auto-accept content even if the user presses escape (only works if `autoAccept` is `true`)
        autoAcceptOnEsc: false,
        // Prevents direct input in the preview window when true
        lockInput: false,
        // Check input against validate function, if valid the accept button gets a class name of
        // 'ui-keyboard-valid-input'. If invalid, the accept button gets a class name of
        // 'ui-keyboard-invalid-input'
        acceptValid: false,
        // Auto-accept when input is valid; requires `acceptValid` set `true` & validate callback
        autoAcceptOnValid: false,
        // Check validation on keyboard initialization. If false, the "Accept" key state (color)
        // will not change to show if the content is valid, or not
        checkValidOnInit: true,
        // if acceptValid is true & the validate function returns a false, this option will cancel
        // a keyboard close only after the accept button is pressed
        cancelClose: true,
        // tab to go to next, shift-tab for previous (default behavior)
        tabNavigation: false,
        // enter for next input; shift+enter accepts content & goes to next
        // shift + 'enterMod' + enter ('enterMod' is the alt as set below) will accept content and go
        // to previous in a textarea
        enterNavigation: false,
        // mod key options: 'ctrlKey', 'shiftKey', 'altKey', 'metaKey' (MAC only)
        enterMod: 'altKey', // alt-enter to go to previous; shift-alt-enter to accept & go to previous
        // if true, the next button will stop on the last keyboard input/textarea; prev button stops at first
        // if false, the next button will wrap to target the first input/textarea; prev will go to the last
        stopAtEnd: true,
        // Set this to append the keyboard after the input/textarea (appended to the input/textarea parent).
        // This option works best when the input container doesn't have a set width & when the 'tabNavigation'
        // option is true.
        appendLocally: false,
        // When appendLocally is false, the keyboard will be appended to this object
        appendTo: 'body',
        // Wrap all <br>s inside of a contenteditable in a div; without wrapping, the caret
        // position will not be accurate
        wrapBRs: true,
        // If false, the shift key will remain active until the next key is (mouse) clicked on; if true it will
        // stay active until pressed again
        stickyShift: true,
        // Prevent pasting content into the area
        preventPaste: false,
        // caret placed at the end of any text when keyboard becomes visible
        caretToEnd: false,
        // caret stays this many pixels from the edge of the input while scrolling left/right;
        // use "c" or "center" to center the caret while scrolling
        scrollAdjustment: 10,
        // Set the max number of characters allowed in the input, setting it to false disables this option
        maxLength: false,
        // allow inserting characters @ caret when maxLength is set
        maxInsert: true,
        // resets the keyboard to the default keyset when visible
        resetDefault: true,
        // Event (namespaced) on the input to reveal the keyboard. To disable it, just set it to ''.
        openOn: 'focus',
        // enable the keyboard on readonly inputs
        activeOnReadonly: false,
        // Event (namepaced) for when the character is added to the input (clicking on the keyboard)
        keyBinding: 'mousedown touchstart',
        // enable/disable mousewheel functionality
        // enabling still depends on the mousewheel plugin
        useWheel: true,
        // combos (emulate dead keys : http://en.wikipedia.org/wiki/Keyboard_layout#US-International)
        // if user inputs `a the script converts it to à, ^o becomes ô, etc.
        useCombos: true,
        /*
			// *** Methods ***
			// commenting these out to reduce the size of the minified version
			// Callbacks - attach a function to any of these callbacks as desired
			initialized   : function(e, keyboard, el) {},
			beforeVisible : function(e, keyboard, el) {},
			visible       : function(e, keyboard, el) {},
			beforeInsert  : function(e, keyboard, el, textToAdd) { return textToAdd; },
			change        : function(e, keyboard, el) {},
			beforeClose   : function(e, keyboard, el, accepted) {},
			accepted      : function(e, keyboard, el) {},
			hidden        : function(e, keyboard, el) {},
			// called instead of base.switchInput
			switchInput   : function(keyboard, goToNext, isAccepted) {},
			// used if you want to create a custom layout or modify the built-in keyboard
			create        : function(keyboard) { return keyboard.buildKeyboard(); },
			// build key callback
			buildKey : function( keyboard, data ) {
				/ *
				data = {
				// READ ONLY
				isAction : [boolean] true if key is an action key
				name     : [string]  key class name suffix ( prefix = 'ui-keyboard-' );
														 may include decimal ascii value of character
				value    : [string]  text inserted (non-action keys)
				title    : [string]  title attribute of key
				action   : [string]  keyaction name
				html     : [string]  HTML of the key; it includes a <span> wrapping the text
				// use to modify key HTML
				$key     : [object]  jQuery selector of key which is already appended to keyboard
				}
				* /
				return data;
			},
		*/
        // this callback is called, if the acceptValid is true, and just before the 'beforeClose' to check
        // the value if the value is valid, return true and the keyboard will continue as it should
        // (close if not always open, etc). If the value is not valid, return false and clear the keyboard
        // value ( like this "keyboard.$preview.val('');" ), if desired. The validate function is called after
        // each input, the 'isClosing' value will be false; when the accept button is clicked,
        // 'isClosing' is true
        validate: function (/* keyboard, value, isClosing */) {
            return true;
        }
    };
    // for checking combos
    $keyboard.comboRegex = /([`\'~\^\"ao])([a-z])/mig;
    // store current keyboard element; used by base.isCurrent()
    $keyboard.currentKeyboard = '';
    $('<!--[if lte IE 8]><script>jQuery("body").addClass("oldie");</script><![endif]--><!--[if IE]>' +
        '<script>jQuery("body").addClass("ie");</script><![endif]-->')
        .appendTo('body')
        .remove();
    $keyboard.msie = $('body').hasClass('oldie'); // Old IE flag, used for caret positioning
    $keyboard.allie = $('body').hasClass('ie');
    $keyboard.watermark = (typeof (document.createElement('input').placeholder) !== 'undefined');
    $keyboard.checkCaretSupport = function () {
        if (typeof $keyboard.checkCaret !== 'boolean') {
            // Check if caret position is saved when input is hidden or loses focus
            // (*cough* all versions of IE and I think Opera has/had an issue as well
            var $temp = $('<div style="height:0px;width:0px;overflow:hidden;position:fixed;top:0;left:-100px;">' +
                '<input type="text" value="testing"/></div>').prependTo('body'); // stop page scrolling
            $keyboard.caret($temp.find('input'), 3, 3);
            // Also save caret position of the input if it is locked
            $keyboard.checkCaret = $keyboard.caret($temp.find('input').hide().show()).start !== 3;
            $temp.remove();
        }
        return $keyboard.checkCaret;
    };
    $keyboard.caret = function ($el, param1, param2) {
        if (!$el || !$el.length || $el.is(':hidden') || $el.css('visibility') === 'hidden') {
            return {};
        }
        var start, end, txt, pos,
            kb = $el.data('keyboard'),
            noFocus = kb && kb.options.noFocus,
            formEl = /(textarea|input)/i.test($el[0].nodeName);
        if (!noFocus) {
            $el.focus();
        }
        // set caret position
        if (typeof param1 !== 'undefined') {
            // allow setting caret using ( $el, { start: x, end: y } )
            if (typeof param1 === 'object' && 'start' in param1 && 'end' in param1) {
                start = param1.start;
                end = param1.end;
            } else if (typeof param2 === 'undefined') {
                param2 = param1; // set caret using start position
            }
            // set caret using ( $el, start, end );
            if (typeof param1 === 'number' && typeof param2 === 'number') {
                start = param1;
                end = param2;
            } else if (param1 === 'start') {
                start = end = 0;
            } else if (typeof param1 === 'string') {
                // unknown string setting, move caret to end
                start = end = 'end';
            }
            // *** SET CARET POSITION ***
            // modify the line below to adapt to other caret plugins
            return formEl ?
                $el.caret(start, end, noFocus) :
                $keyboard.setEditableCaret($el, start, end);
        }
        // *** GET CARET POSITION ***
        // modify the line below to adapt to other caret plugins
        if (formEl) {
            // modify the line below to adapt to other caret plugins
            pos = $el.caret();
        } else {
            // contenteditable
            pos = $keyboard.getEditableCaret($el[0]);
        }
        start = pos.start;
        end = pos.end;
        // *** utilities ***
        txt = formEl && $el[0].value || $el.text() || '';
        return {
            start: start,
            end: end,
            // return selected text
            text: txt.substring(start, end),
            // return a replace selected string method
            replaceStr: function (str) {
                return txt.substring(0, start) + str + txt.substring(end, txt.length);
            }
        };
    };
    $keyboard.isTextNode = function (el) {
        return el && el.nodeType === 3;
    };
    $keyboard.isBlock = function (el, node) {
        var win = el.ownerDocument.defaultView;
        if (
            node && node.nodeType === 1 && node !== el &&
            win.getComputedStyle(node).display === 'block'
        ) {
            return 1;
        }
        return 0;
    };
    // Wrap all BR's inside of contenteditable
    $keyboard.wrapBRs = function (container) {
        var $el = $(container).find('br:not(.' + $keyboard.css.divWrapperCE + ')');
        if ($el.length) {
            $.each($el, function (i, el) {
                var len = el.parentNode.childNodes.length;
                if (
                    // wrap BRs if not solo child
                    len !== 1 ||
                    // Or if BR is wrapped by a span
                    len === 1 && !$keyboard.isBlock(container, el.parentNode)
                ) {
                    $(el).addClass($keyboard.css.divWrapperCE).wrap('<div>');
                }
            });
        }
    };
    $keyboard.getEditableCaret = function (container) {
        container = $(container)[0];
        if (!container.isContentEditable) {
            return {};
        }
        var end, text,
            options = ($(container).data('keyboard') || {}).options,
            doc = container.ownerDocument,
            range = doc.getSelection().getRangeAt(0),
            result = pathToNode(range.startContainer, range.startOffset),
            start = result.position;
        if (options.wrapBRs !== false) {
            $keyboard.wrapBRs(container);
        }
        function pathToNode(endNode, offset) {
            var node, adjust,
                txt = '',
                done = false,
                position = 0,
                nodes = $.makeArray(container.childNodes);
            function checkBlock(val) {
                if (val) {
                    position += val;
                    txt += options && options.replaceCR || '\n';
                }
            }
            while (!done && nodes.length) {
                node = nodes.shift();
                if (node === endNode) {
                    done = true;
                }
                // Add one if previous sibling was a block node (div, p, etc)
                adjust = $keyboard.isBlock(container, node.previousSibling);
                checkBlock(adjust);
                if ($keyboard.isTextNode(node)) {
                    position += done ? offset : node.length;
                    txt += node.textContent;
                    if (done) {
                        return {position: position, text: txt};
                    }
                } else if (!done && node.childNodes) {
                    nodes = $.makeArray(node.childNodes).concat(nodes);
                }
                // Add one if we're inside a block node (div, p, etc)
                // and previous sibling was a text node
                adjust = $keyboard.isTextNode(node.previousSibling) && $keyboard.isBlock(container, node);
                checkBlock(adjust);
            }
            return {position: position, text: txt};
        }
        // check of start and end are the same
        if (range.endContainer === range.startContainer && range.endOffset === range.startOffset) {
            end = start;
            text = '';
        } else {
            result = pathToNode(range.endContainer, range.endOffset);
            end = result.position;
            text = result.text.substring(start, end);
        }
        return {
            start: start,
            end: end,
            text: text
        };
    };
    $keyboard.getEditableLength = function (container) {
        var result = $keyboard.setEditableCaret(container, 'getMax');
        // if not a number, the container is not a contenteditable element
        return typeof result === 'number' ? result : null;
    };
    $keyboard.setEditableCaret = function (container, start, end) {
        container = $(container)[0];
        if (!container.isContentEditable) {
            return {};
        }
        var doc = container.ownerDocument,
            range = doc.createRange(),
            sel = doc.getSelection(),
            options = ($(container).data('keyboard') || {}).options,
            s = start,
            e = end,
            text = '',
            result = findNode(start === 'getMax' ? 'end' : start);
        function findNode(offset) {
            if (offset === 'end') {
                // Set some value > content length; but return max
                offset = container.innerHTML.length;
            } else if (offset < 0) {
                offset = 0;
            }
            var node, check,
                txt = '',
                done = false,
                position = 0,
                last = 0,
                max = 0,
                nodes = $.makeArray(container.childNodes);
            function updateText(val) {
                txt += val ? options && options.replaceCR || '\n' : '';
                return val > 0;
            }
            function checkDone(adj) {
                var val = position + adj;
                last = max;
                max += adj;
                if (offset - val >= 0) {
                    position = val;
                    return offset - position <= 0;
                }
                return offset - val <= 0;
            }
            while (!done && nodes.length) {
                node = nodes.shift();
                // Add one if the previous sibling was a block node (div, p, etc)
                check = $keyboard.isBlock(container, node.previousSibling);
                if (updateText(check) && checkDone(check)) {
                    done = true;
                }
                // Add one if we're inside a block node (div, p, etc)
                check = $keyboard.isTextNode(node.previousSibling) && $keyboard.isBlock(container, node);
                if (updateText(check) && checkDone(check)) {
                    done = true;
                }
                if ($keyboard.isTextNode(node)) {
                    txt += node.textContent;
                    if (checkDone(node.length)) {
                        check = offset - position === 0 && position - last >= 1 ? node.length : offset - position;
                        return {
                            node: node,
                            offset: check,
                            position: offset,
                            text: txt
                        };
                    }
                } else if (!done && node.childNodes) {
                    nodes = $.makeArray(node.childNodes).concat(nodes);
                }
            }
            return nodes.length ?
                {node: node, offset: offset - position, position: offset, text: txt} :
                // Offset is larger than content, return max
                {node: node, offset: node && node.length || 0, position: max, text: txt};
        }
        if (result.node) {
            s = result.position; // Adjust if start > content length
            if (start === 'getMax') {
                return s;
            }
            range.setStart(result.node, result.offset);
            // Only find end if > start and is defined... this allows passing
            // setEditableCaret(el, 'end') or setEditableCaret(el, 10, 'end');
            if (typeof end !== 'undefined' && end !== start) {
                result = findNode(end);
            }
            if (result.node) {
                e = result.position; // Adjust if end > content length
                range.setEnd(result.node, result.offset);
                text = s === e ? '' : result.text.substring(s, e);
            }
            sel.removeAllRanges();
            sel.addRange(range);
        }
        return {
            start: s,
            end: e,
            text: text
        };
    };
    $keyboard.replaceContent = function (el, param) {
        el = $(el)[0];
        var node, i, str,
            type = typeof param,
            caret = $keyboard.getEditableCaret(el).start,
            charIndex = 0,
            nodeStack = [el];
        while ((node = nodeStack.pop())) {
            if ($keyboard.isTextNode(node)) {
                if (type === 'function') {
                    if (caret >= charIndex && caret <= charIndex + node.length) {
                        node.textContent = param(node.textContent);
                    }
                } else if (type === 'string') {
                    // maybe not the best method, but it works for simple changes
                    str = param.substring(charIndex, charIndex + node.length);
                    if (str !== node.textContent) {
                        node.textContent = str;
                    }
                }
                charIndex += node.length;
            } else if (node && node.childNodes) {
                i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }
        i = $keyboard.getEditableCaret(el);
        $keyboard.setEditableCaret(el, i.start, i.start);
    };
    $.fn.keyboard = function (options) {
        return this.each(function () {
            if (!$(this).data('keyboard')) {
                /*jshint nonew:false */
                (new $.keyboard(this, options));
            }
        });
    };
    $.fn.getkeyboard = function () {
        return this.data('keyboard');
    };
    /* Copyright (c) 2010 C. F., Wong (<a href="http://cloudgen.w0ng.hk">Cloudgen Examplet Store</a>)
	 * Licensed under the MIT License:
	 * http://www.opensource.org/licenses/mit-license.php
	 * Highly modified from the original
	 */
    $.fn.caret = function (start, end, noFocus) {
        if (
            typeof this[0] === 'undefined' ||
            this.is(':hidden') ||
            this.css('visibility') === 'hidden' ||
            !/(INPUT|TEXTAREA)/i.test(this[0].nodeName)
        ) {
            return this;
        }
        var selRange, range, stored_range, txt, val,
            $el = this,
            el = $el[0],
            selection = el.ownerDocument.selection,
            sTop = el.scrollTop,
            ss = false,
            supportCaret = true;
        try {
            ss = 'selectionStart' in el;
        } catch (err) {
            supportCaret = false;
        }
        if (supportCaret && typeof start !== 'undefined') {
            if (!/(email|number)/i.test(el.type)) {
                if (ss) {
                    el.selectionStart = start;
                    el.selectionEnd = end;
                } else {
                    selRange = el.createTextRange();
                    selRange.collapse(true);
                    selRange.moveStart('character', start);
                    selRange.moveEnd('character', end - start);
                    selRange.select();
                }
            }
            // must be visible or IE8 crashes; IE9 in compatibility mode works fine - issue #56
            if (!noFocus && ($el.is(':visible') || $el.css('visibility') !== 'hidden')) {
                el.focus();
            }
            el.scrollTop = sTop;
            return this;
        }
        if (/(email|number)/i.test(el.type)) {
            // fix suggested by raduanastase (https://github.com/Mottie/Keyboard/issues/105#issuecomment-40456535)
            start = end = $el.val().length;
        } else if (ss) {
            start = el.selectionStart;
            end = el.selectionEnd;
        } else if (selection) {
            if (el.nodeName.toUpperCase() === 'TEXTAREA') {
                val = $el.val();
                range = selection.createRange();
                stored_range = range.duplicate();
                stored_range.moveToElementText(el);
                stored_range.setEndPoint('EndToEnd', range);
                // thanks to the awesome comments in the rangy plugin
                start = stored_range.text.replace(/\r/g, '\n').length;
                end = start + range.text.replace(/\r/g, '\n').length;
            } else {
                val = $el.val().replace(/\r/g, '\n');
                range = selection.createRange().duplicate();
                range.moveEnd('character', val.length);
                start = (range.text === '' ? val.length : val.lastIndexOf(range.text));
                range = selection.createRange().duplicate();
                range.moveStart('character', -val.length);
                end = range.text.length;
            }
        } else {
            // caret positioning not supported
            start = end = (el.value || '').length;
        }
        txt = (el.value || '');
        return {
            start: start,
            end: end,
            text: txt.substring(start, end),
            replace: function (str) {
                return txt.substring(0, start) + str + txt.substring(end, txt.length);
            }
        };
    };
    return $keyboard;
}));
/* Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */
/*! Mousewheel version: 3.1.12 * (c) 2014 Brandon Aaron * MIT License */
/*! jQuery UI Virtual Keyboard Typing Simulator v1.11.1 *//*
 * for Keyboard v1.18+ only (3/15/2017)
 *
 * By Rob Garrison (aka Mottie)
 * Licensed under the MIT License
 *
 * Use this extension with the Virtual Keyboard to simulate
 * typing for tutorials or whatever else use you can find
 *
 * Requires:
 *  jQuery
 *  Keyboard plugin : https://github.com/Mottie/Keyboard
 *
 * Setup:
 *  $('.ui-keyboard-input')
 *   .keyboard(options)
 *   .addTyping(typing-options);
 *
 *  // or if targeting a specific keyboard
 *  $('#keyboard1')
 *   .keyboard(options)
 *   .addTyping(typing-options);
 *
 * Basic Usage:
 *  // To disable manual typing on the virtual keyboard, just set "showTyping"
 *  // option to false
 *  $('#keyboard-input').keyboard(options).addTyping({ showTyping: false });
 *
 *  // Change the default typing delay (time the virtual keyboard highlights the
 *  // manually typed key) - default = 250 milliseconds
 *  $('#keyboard-input').keyboard(options).addTyping({ delay: 500 });
 *
 *  // get keyboard object, open it, then start typing simulation
 *  $('#keyboard-input').getkeyboard().reveal().typeIn('Hello World', 700);
 *
 *  // get keyboard object, open it, type in "This is a test" with 700ms delay
 *  // between types, then accept & close the keyboard
 *  $('#keyboard-input')
 *    .getkeyboard()
 *    .reveal()
 *    .typeIn('This is a test', 700, function(keyboard) {
 *      keyboard.accept();
 *    });
 */
/* More Examples:
 * $('#inter').getkeyboard().reveal().typeIn('\tHello \b\n\tWorld', 500);
 * $('#meta')
 *  .getkeyboard().reveal()
 *  .typeIn('abCDd11123\u2648\u2649\u264A\u264B', 700, function() {
 *    alert('all done!');
 *  });
*/
/* jshint browser:true, jquery:true, unused:false */
/* global require:false, define:false, module:false */
;(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (
        typeof module === 'object' &&
        typeof module.exports === 'object'
    ) {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(function ($) {
    $.fn.addTyping = function (options) {
        //Set the default values, use comma to separate the settings, example:
        var defaults = {
                lockTypeIn: false,
                delay: 250,
                hoverDelay: 250
            },
            $keyboard = $.keyboard;
        return this.each(function () {
            // make sure a keyboard is attached
            var o, base = $(this).data('keyboard');
            if (!base) {
                return;
            }
            // variables
            o = base.typing_options = $.extend({}, defaults, options);
            base.typing_keymap = {
                ' ': 'space',
                '"': '34',
                "'": '39',
                '&nbsp;': 'space',
                '\b': 'bksp', // delete character to the left
                '{b}': 'bksp',
                '{d}': 'del',  // delete character to the right
                '{l}': 'left', // move caret left
                '{r}': 'right', // move caret right
                '\n': 'enter',
                '\r': 'enter',
                '{e}': 'enter',
                '\t': 'tab',
                '{t}': 'tab'
            };
            base.typing_xref = {
                8: 'bksp',
                9: 'tab',
                13: 'enter',
                32: 'space',
                37: 'left',
                39: 'right',
                46: 'del'
            };
            base.typing_event = false;
            base.typing_namespace = base.namespace + 'typing';
            base.extensionNamespace.push(base.typing_namespace);
            // save lockInput setting
            o.savedLockInput = base.options.lockInput;
            base.typing_setup_reset = function () {
                var kbevents = $keyboard.events,
                    namespace = base.typing_namespace,
                    events = [kbevents.kbHidden, kbevents.kbInactive, '']
                        .join(namespace + ' ');
                // reset "typeIn" when keyboard is closed
                base.$el
                    .unbind(namespace)
                    .bind(events, function () {
                        base.typing_reset();
                    });
                base
                    .unbindButton(namespace)
                    .bindButton('mousedown' + namespace, function () {
                        base.typing_reset();
                    });
            };
            base.typing_setup = function () {
                var namespace = base.typing_namespace;
                base.typing_setup_reset();
                base.$el
                    .bind($keyboard.events.kbBeforeVisible + namespace, function () {
                        base.typing_setup();
                    });
                base.$preview
                    .unbind(namespace)
                    .bind('keyup' + namespace, function (e) {
                        if (o.init && o.lockTypeIn) {
                            return false;
                        }
                        if (e.which >= 37 && e.which <= 40) {
                            return; // ignore arrow keys
                        }
                        if (e.which === 16) {
                            base.shiftActive = false;
                        }
                        if (e.which === 18) {
                            base.altActive = false;
                        }
                        if (e.which === 16 || e.which === 18) {
                            // Alt key will shift focus to the menu - doesn't work in Windows
                            setTimeout(function () {
                                if (base.$preview) {
                                    base.$preview.focus();
                                }
                            }, 200);
                            return;
                        }
                    })
                    // change keyset when either shift or alt is held down
                    .bind('keypress' + namespace, function (e) {
                        if (o.init && o.lockTypeIn) {
                            return false;
                        }
                        // Simulate key press on virtual keyboard
                        if (base.typing_event && !base.options.lockInput) {
                            base.typing_reset();
                            base.typing_event = true;
                            base.typing_findKey('', e); // pass event object
                        }
                    });
            };
            base.typing_reset = function () {
                base.typing_event = o.init = false;
                o.text = '';
                o.len = o.current = 0;
                base.options.lockInput = o.savedLockInput;
                // clearTimeout( base.typing_timer );
            };
            // Store typing text
            base.typeIn = function (txt, delay, callback, e) {
                if (!base.isVisible()) {
                    // keyboard was closed
                    clearTimeout(base.typing_timer);
                    base.typing_reset();
                    return;
                }
                if (!base.typing_event) {
                    if (o.init !== true) {
                        o.init = true;
                        base.options.lockInput = o.lockTypeIn;
                        o.text = txt || o.text || '';
                        o.len = o.text.length;
                        o.delay = delay || o.delay;
                        o.current = 0; // position in text string
                        if (callback) {
                            o.callback = callback;
                        }
                    }
                    // function that loops through and types each character
                    txt = o.text.substring(o.current, ++o.current);
                    // add support for curly-wrapped single character: {l}, {r}, {d}, etc.
                    if (
                        txt === '{' &&
                        o.text.substring(o.current + 1, o.current + 2) === '}'
                    ) {
                        txt += o.text.substring(o.current, o.current += 2);
                    }
                    base.typing_findKey(txt, e);
                } else if (typeof txt === 'undefined') {
                    // typeIn called by user input
                    base.typing_event = false;
                    base.options.lockInput = o.savedLockInput;
                    return;
                }
            };
            base.typing_findKey = function (txt, e) {
                var tar, m, n, k, key, ks, set,
                    kbcss = $keyboard.css,
                    mappedKeys = $keyboard.builtLayouts[base.layout].mappedKeys;
                // stop if keyboard is closed
                if (!base.isOpen || !base.$keyboard.length) {
                    return;
                }
                ks = base.$keyboard.find('.' + kbcss.keySet);
                k = txt in base.typing_keymap ? base.typing_keymap[txt] : txt;
                // typing_event is true when typing on the actual keyboard - look for
                // actual key; All of this breaks when the CapLock is on... unable to
                // find a cross-browser method that works.
                tar = '.' + kbcss.keyButton + '[data-action="' + k + '"]';
                if (base.typing_event && e) {
                    // xref used for keydown
                    // ( 46 = delete in keypress & period on keydown )
                    if (
                        e.type !== 'keypress' &&
                        base.typing_xref.hasOwnProperty(e.keyCode || e.which)
                    ) {
                        // special named keys: bksp, tab and enter
                        tar = '.' +
                            kbcss.keyPrefix +
                            base.processName(base.typing_xref[e.keyCode || e.which]);
                    } else {
                        m = String.fromCharCode(e.charCode || e.which);
                        tar = (mappedKeys.hasOwnProperty(m)) ?
                            '.' + kbcss.keyButton + '[data-value="' +
                            mappedKeys[m].replace(/"/g, '\\"') + '"]' :
                            '.' + kbcss.keyPrefix + base.processName(m);
                    }
                }
                // find key
                key = ks.filter(':visible').find(tar);
                if (key.length) {
                    // key is visible, simulate typing
                    base.typing_simulateKey(key, txt, e);
                } else {
                    // key not found, check if it is in the keymap
                    // (tab, space, enter, etc)
                    if (base.typing_event) {
                        key = ks.find(tar);
                    } else {
                        // key not found, check if it is in the keymap
                        // (tab, space, enter, etc)
                        n = txt in base.typing_keymap ?
                            base.typing_keymap[txt] :
                            base.processName(txt);
                        // find actual key on keyboard
                        key = ks.find('.' + kbcss.keyPrefix + n);
                    }
                    // find the keyset
                    set = key.closest('.' + kbcss.keySet);
                    // figure out which keyset the key is in then simulate clicking on
                    // that meta key, then on the key
                    if (set.attr('name')) {
                        // Add the key
                        base.typing_simulateKey(key, txt, e);
                    } else {
                        if (!base.typing_event) {
                            // Key doesn't exist on the keyboard, so just enter it
                            if (
                                txt in base.typing_keymap &&
                                base.typing_keymap[txt] in $keyboard.keyaction
                            ) {
                                $keyboard.keyaction[base.typing_keymap[txt]](base, key, e);
                            } else {
                                base.insertText(txt);
                            }
                            base.$el.trigger($keyboard.events.kbChange, [base, base.el]);
                        }
                    }
                }
                if (o.current <= o.len && o.len !== 0) {
                    if (!base.isVisible()) {
                        return; // keyboard was closed, abort!!
                    }
                    base.typing_timer = setTimeout(function () {
                        base.typeIn();
                    }, o.delay);
                } else if (o.len !== 0) {
                    // o.len is zero when the user typed on the actual keyboard during
                    // simulation
                    base.typing_reset();
                    if ($.isFunction(o.callback)) {
                        // ensure all typing animation is done before the callback
                        base.typing_timer = setTimeout(function () {
                            // if the user typed during the key simulation, the "o" variable
                            // may sometimes be undefined
                            if ($.isFunction(o.callback)) {
                                o.callback(base);
                            }
                        }, o.delay);
                    }
                    return;
                } else {
                    base.typing_reset();
                }
            };
            // mouseover the key, add the text directly, then mouseout on the key
            base.typing_simulateKey = function (el, txt, e) {
                var len = el.length;
                if (!base.isVisible()) {
                    return;
                }
                if (len) {
                    el.filter(':visible').trigger('mouseenter' + base.namespace);
                    if (len) {
                        setTimeout(function () {
                            el.trigger('mouseleave' + base.namespace);
                        }, Math.min(o.hoverDelay, o.delay));
                    }
                }
                if (!base.typing_event) {
                    // delay required or initial tab does not get added
                    // in the main demo (international keyboard)
                    setTimeout(function () {
                        if (
                            txt in base.typing_keymap &&
                            base.typing_keymap[txt] in $keyboard.keyaction
                        ) {
                            e = e || $.Event('keypress');
                            e.target = el; // "Enter" checks for the e.target
                            $keyboard.keyaction[base.typing_keymap[txt]](base, el, e);
                        } else {
                            base.insertText(txt);
                        }
                        base.$el.trigger($keyboard.events.kbChange, [base, base.el]);
                    }, o.delay / 3);
                }
            };
            // visible event is fired before this extension is initialized, so check!
            if (base.options.alwaysOpen && base.isVisible()) {
                base.typing_setup();
            } else {
                // capture and simulate typing
                base.$el
                    .unbind($keyboard.events.kbBeforeVisible + base.typing_namespace)
                    .bind($keyboard.events.kbBeforeVisible + base.typing_namespace, function () {
                        base.typing_setup_reset();
                    });
            }
        });
    };
}));
$(document).ready(function () {
    // Add calculator key actions
    // ***************************
    $.extend($.keyboard.keyaction, {
        // Process multi-parameter math functions
        // ***************************
        equals: function (base) {
            base.$preview.val(function (i, v) {
                var fx = base.memory2 || '';
                if (fx === '') {
                    return eval(v);
                }
                if (fx[0] === 'yroot') {
                    return Math.pow($.trim(fx[1]), 1 / $.trim(v));
                }
                if (fx[0] === 'xy') {
                    return Math.pow($.trim(fx[1]), $.trim(v));
                }
            });
            base.memory2 = '';
        }
    });
    // Initialize keyboard
    // ********************
    $('#calc').keyboard({
        layout: 'custom',
        display: {
            'equals': '='
        },
        customLayout: {
            'default': [
                '{a}',
                '7 8 9 /',
                '4 5 6 *',
                '1 2 3 - {equals}',
                '0 +'
            ],
            'meta1': [
                '{a}',
                '7 8 9 / ',
                '4 5 6 *',
                '1 2 3 - {equals}',
                '0 +'
            ]
        },
    })
        .addTyping()
        .getkeyboard().reveal();
});
