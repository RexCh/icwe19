/*
* Backstretch
* http://srobbin.com/jquery-plugins/backstretch/
*
* Copyright (c) 2013 Scott Robbin
* Licensed under the MIT license.
*/
;(function ($, window, undefined) {
    /* PLUGIN DEFINITION
    * ========================= */
    $.fn.backstretch = function (images, options) {
        /*
        */
        var returnValues;
        this.each(function (eachIndex) {
            var $this = $(this)
                , obj = $this.data('backstretch');
            if (obj) {
                // Is this a method they're trying to execute?
                options = $.extend(obj.options, options);
            }
            obj = new Backstretch(this, images, options || {});
            $this.data('backstretch', obj);
        });
        return returnValues ? returnValues.length === 1 ? returnValues[0] : returnValues : this;
    };
    $.backstretch = function (images, options) {
        // Return the instance
        return $('body')
            .backstretch(images, options)
            .data('backstretch');
    };
    /* DEFAULTS
    * ========================= */
    $.fn.backstretch.defaults = {
        duration: 5000                // Amount of time in between slides (if slideshow)
        , alignY: 0.5                 // The y-alignment for the image, can be 'top'|'center'|'bottom' or any number between 0.0 and 1.0
        , start: 0                    // Index of the first image to show
    };
    /* STYLES
    * ========================= */
    var styles = {
        wrap: {
            left: 0
            , top: 0
            , overflow: 'hidden'
            , margin: 0
            , padding: 0
            , height: '100%'
            , width: '100%'
            , zIndex: -999999
        }
        , itemWrapper: {
            position: 'absolute'
            , display: 'none'
            , margin: 0
            , padding: 0
            , border: 'none'
            , width: '100%'
            , height: '100%'
            , zIndex: -999999
        }
        , item: {
            position: 'absolute'
            , margin: 0
            , padding: 0
            , border: 'none'
            , width: '100%'
            , height: '100%'
            , maxWidth: 'none'
        }
    };
    /* Given an array of different options for an image,
    */
    var isVideoSource = function (source) {
    };
    var processImagesArray = function (images) {
        var processed = [];
        for (var i = 0; i < images.length; i++) {
            if (typeof images[i] === 'string') {
                processed.push({url: images[i]});
            } else if ($.isArray(images[i])) {
            } else {
            }
        }
        return processed;
    };
    var processOptions = function (options, required) {
        // Convert old options
        // centeredX/centeredY are deprecated
        if (options.fade !== undefined) {
            options.transitionDuration = options.fade;
            options.transition = 'fade';
        }
    };
    function validScale(scale) {
    }
    /* CLASS DEFINITION
    * ========================= */
    var Backstretch = function (container, images, options) {
        this.options = $.extend({}, $.fn.backstretch.defaults, options || {});
        processOptions(this.options, true);
        /* In its simplest form, we allow Backstretch to be called on an image path.
        */
        this.images = processImagesArray($.isArray(images) ? images : [images]);
        /**
         */
        this.isBody = container === document.body;
        /* We're keeping track of a few different elements
        */
        var $window = $(window);
        this.$container = $(container);
        this.$root = this.isBody ? supportsFixedPosition ? $window : $(document) : this.$container;
        /**
         */
        var $existing = this.$container.children(".backstretch").first();
        this.$wrap = $existing.length ? $existing :
            $('<div class="backstretch"></div>')
                .css(this.options.bypassCss ? {} : styles.wrap)
                .appendTo(this.$container);
        if (!this.options.bypassCss) {
            // Non-body elements need some style adjustments
            this.$wrap.css({
                position: this.isBody && supportsFixedPosition ? 'fixed' : 'absolute'
            });
        }
        this.index = this.options.start;
        this.show(this.index);
    };
    var performTransition = function (options) {
        var transition = options.transition || 'fade';
        var $new = options['new'];
        switch (transition.toString().toLowerCase()) {
            case 'fade':
                $new.fadeIn({
                    duration: options.duration,
                    complete: options.complete,
                });
        }
    };
    /* PUBLIC METHODS
    * ========================= */
    Backstretch.prototype = {
        resize: function () {
            try {
                // Check for a better suited image after the resize
                var bgCSS = {left: 0, top: 0, right: 'auto', bottom: 'auto'}
                    , boxWidth = this.isBody ? this.$root.width() : this.$root.innerWidth()
                    ,
                    boxHeight = this.isBody ? (window.innerHeight ? window.innerHeight : this.$root.height()) : this.$root.innerHeight()
                    , naturalWidth = this.$itemWrapper.data('width')
                    , naturalHeight = this.$itemWrapper.data('height')
                    , ratio = (naturalWidth / naturalHeight) || 1
                    , alignY = this._currentImage.alignY === undefined ? this.options.alignY : this._currentImage.alignY
                    , scale = validScale(this._currentImage.scale || this.options.scale);
                if (scale === 'fit' || scale === 'fit-smaller') {
                } else if (scale === 'fill') {
                } else { // 'cover'
                    width = Math.max(boxHeight * ratio, boxWidth);
                    height = Math.max(width / ratio, boxHeight);
                }
                bgCSS.top = -(height - boxHeight) * alignY;
                bgCSS.width = width;
                bgCSS.height = height;
                if (!this.options.bypassCss) {
                    this.$wrap
                        .css({width: boxWidth, height: boxHeight})
                        .find('>.backstretch-item').not('.deleteable')
                        .each(function () {
                            var $wrapper = $(this);
                            $wrapper.find('img,video,iframe')
                                .css(bgCSS);
                        });
                }
            } catch (err) {
                // IE7 seems to trigger resize before the image is loaded.
                // This try/catch block is a hack to let it fail gracefully.
            }
        }
        , show: function (newIndex, overrideOptions) {
            // Validate index
            var that = this
                , $oldItemWrapper = that.$wrap.find('>.backstretch-item').addClass('deleteable')
                , oldVideoWrapper = that.videoWrapper
            var selectedImage = that.images[newIndex];
            var isVideo = isVideoSource(selectedImage);
            if (isVideo) {
            } else {
                that.$item = $('<img />');
            }
            that.$itemWrapper = $('<div class="backstretch-item">')
                .append(that.$item);
            if (this.options.bypassCss) {
            } else {
                that.$itemWrapper.css(styles.itemWrapper);
                that.$item.css(styles.item);
            }
            that.$item.bind(isVideo ? 'canplay' : 'load', function (e) {
                var $this = $(this)
                    , $wrapper = $this.parent()
                    , options = $wrapper.data('options');
                var imgWidth = this.naturalWidth || this.videoWidth || this.width
                    , imgHeight = this.naturalHeight || this.videoHeight || this.height;
                $wrapper
                    .data('width', imgWidth)
                    .data('height', imgHeight);
                var getOption = function (opt) {
                    return options[opt] !== undefined ?
                        options[opt] :
                        that.options[opt];
                };
                var transition = getOption('transition');
                var transitionDuration = getOption('transitionDuration');
                var bringInNextImage = function () {
                    $oldItemWrapper.remove();
                    // Resume the slideshow
                    // Now we can clear the background on the element, to spare memory
                    // Trigger the "after" and "show" events
                    // "show" is being deprecated
                };
                if ((that.firstShow && !that.options.animateFirst) || !transitionDuration || !transition) {
                    // Avoid transition on first show or if there's no transitionDuration value
                } else {
                    performTransition({
                        'new': $wrapper,
                        duration: transitionDuration,
                        complete: bringInNextImage
                    });
                }
                that.resize();
            });
            that.$itemWrapper.appendTo(that.$wrap);
            that.$item.attr('alt', selectedImage.alt || '');
            that.$itemWrapper.data('options', selectedImage);
            if (!isVideo) {
                that.$item.attr('src', selectedImage.url);
            }
            that._currentImage = selectedImage;
        }
    };
    /**
     * ========================= */
    var supportsFixedPosition = (function () {
        var ua = navigator.userAgent
            , platform = navigator.platform
            // Rendering engine is Webkit, and capture major version
            , wkmatch = ua.match(/AppleWebKit\/([0-9]+)/)
            , wkversion = !!wkmatch && wkmatch[1]
            , ffmatch = ua.match(/Fennec\/([0-9]+)/)
            , ffversion = !!ffmatch && ffmatch[1]
            , operammobilematch = ua.match(/Opera Mobi\/([0-9]+)/)
            , omversion = !!operammobilematch && operammobilematch[1]
            , iematch = ua.match(/MSIE ([0-9]+)/)
            , ieversion = !!iematch && iematch[1];
        return !(
            // iOS 4.3 and older : Platform is iPhone/Pad/Touch and Webkit version is less than 534 (ios5)
            ((platform.indexOf("iPhone") > -1 || platform.indexOf("iPad") > -1 || platform.indexOf("iPod") > -1) && wkversion && wkversion < 534) ||
            // Opera Mini
            (window.operamini && ({}).toString.call(window.operamini) === "[object OperaMini]") ||
            (operammobilematch && omversion < 7458) ||
            //Android lte 2.1: Platform is Android and Webkit version is less than 533 (Android 2.2)
            (ua.indexOf("Android") > -1 && wkversion && wkversion < 533) ||
            // Firefox Mobile before 6.0 -
            (ffversion && ffversion < 6) ||
            // WebOS less than 3
            ("palmGetResource" in window && wkversion && wkversion < 534) ||
            // MeeGo
            (ua.indexOf("MeeGo") > -1 && ua.indexOf("NokiaBrowser/8.5.0") > -1) ||
            // IE6
            (ieversion && ieversion <= 6)
        );
    }());
}(jQuery, window));