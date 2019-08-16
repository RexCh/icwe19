/**
 * Owl Carousel v2.3.4
 * Copyright 2013-2018 David Deutsch
 * Licensed under: SEE LICENSE IN https://github.com/OwlCarousel2/OwlCarousel2/blob/master/LICENSE
 */
/**
 * Owl carousel
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 * @todo Lazy Load Icon
 * @todo prevent animationend bubling
 * @todo itemsScaleUp
 * @todo Test Zepto
 * @todo stagePadding calculate wrong active classes
 */
;(function ($, window, document, undefined) {
    /**
     * Creates a carousel.
     * @class The Owl Carousel.
     * @public
     * @param {HTMLElement|jQuery} element - The element to create the carousel for.
     * @param {Object} [options] - The options
     */
    function Owl(element, options) {
        /**
         * Current settings for the carousel.
         * @public
         */
        this.settings = null;
        /**
         * Current options set by the caller including defaults.
         * @public
         */
        this.options = $.extend({}, Owl.Defaults, options);
        /**
         * Plugin element.
         * @public
         */
        this.$element = $(element);
        /**
         * Proxied event handlers.
         * @protected
         */
        this._handlers = {};
        /**
         * References to the running plugins of this carousel.
         * @protected
         */
        this._plugins = {};
        /**
         * Currently suppressed events to prevent them from being retriggered.
         * @protected
         */
        this._supress = {};
        /**
         * Absolute current position.
         * @protected
         */
        this._current = null;
        /**
         * Animation speed in milliseconds.
         * @protected
         */
        this._speed = null;
        /**
         * Coordinates of all items in pixel.
         * @todo The name of this member is missleading.
         * @protected
         */
        this._coordinates = [];
        /**
         * Current breakpoint.
         * @todo Real media queries would be nice.
         * @protected
         */
        this._breakpoint = null;
        /**
         * Current width of the plugin element.
         */
        this._width = null;
        /**
         * All real items.
         * @protected
         */
        this._items = [];
        /**
         * All cloned items.
         * @protected
         */
        this._clones = [];
        /**
         * Merge values of all items.
         * @todo Maybe this could be part of a plugin.
         * @protected
         */
        this._mergers = [];
        /**
         * Widths of all items.
         */
        this._widths = [];
        /**
         * Invalidated parts within the update process.
         * @protected
         */
        this._invalidated = {};
        /**
         * Ordered list of workers for the update process.
         * @protected
         */
        this._pipe = [];
        /**
         * Current state information for the drag operation.
         * @todo #261
         * @protected
         */
        this._drag = {
            stage: {},
        };
        /**
         * Current state information and their tags.
         * @type {Object}
         * @protected
         */
        this._states = {
            current: {},
            tags: {}
        };
        $.each(['onResize', 'onThrottledResize'], $.proxy(function (i, handler) {
        }, this));
        $.each(Owl.Plugins, $.proxy(function (key, plugin) {
            this._plugins[key.charAt(0).toLowerCase() + key.slice(1)]
                = new plugin(this);
        }, this));
        $.each(Owl.Workers, $.proxy(function (priority, worker) {
            this._pipe.push({
                'filter': worker.filter,
                'run': $.proxy(worker.run, this)
            });
        }, this));
        this.setup();
        this.initialize();
    }
    /**
     */
    Owl.Defaults = {
        items: 3,
        loop: false,
        center: false,
        rewind: false,
        checkVisibility: true,
        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
        freeDrag: false,
        margin: 0,
        stagePadding: 0,
        merge: false,
        mergeFit: true,
        autoWidth: false,
        startPosition: 0,
        rtl: false,
        smartSpeed: 250,
        fluidSpeed: false,
        dragEndSpeed: false,
        responsive: {},
        responsiveRefreshRate: 200,
        responsiveBaseElement: window,
        fallbackEasing: 'swing',
        slideTransition: '',
        info: false,
        nestedItemSelector: false,
        itemElement: 'div',
        stageElement: 'div',
        refreshClass: 'owl-refresh',
        loadedClass: 'owl-loaded',
        loadingClass: 'owl-loading',
        rtlClass: 'owl-rtl',
        responsiveClass: 'owl-responsive',
        dragClass: 'owl-drag',
        itemClass: 'owl-item',
        stageClass: 'owl-stage',
        stageOuterClass: 'owl-stage-outer',
        grabClass: 'owl-grab'
    };
    /**
     */
    Owl.Width = {
        Default: 'default',
        Inner: 'inner',
        Outer: 'outer'
    };
    /**
     */
    Owl.Type = {
        Event: 'event',
        State: 'state'
    };
    /**
     */
    Owl.Plugins = {};
    /**
     */
    Owl.Workers = [{
        filter: ['width', 'settings'],
        run: function () {
            this._width = this.$element.width();
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function (cache) {
            cache.current = this._items && this._items[this.relative(this._current)];
        }
    }, {
        filter: ['items', 'settings'],
        run: function () {
            this.$stage.children('.cloned').remove();
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function (cache) {
            var margin = this.settings.margin || '',
                grid = !this.settings.autoWidth,
                rtl = this.settings.rtl,
                css = {
                    'width': 'auto',
                    'margin-right': rtl ? '' : margin
                };
            !grid && this.$stage.children().css(css);
            cache.css = css;
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function (cache) {
            var width = (this.width() / this.settings.items).toFixed(3) - this.settings.margin,
                merge = null,
                iterator = this._items.length,
                grid = !this.settings.autoWidth,
                widths = [];
            cache.items = {};
            while (iterator--) {
                merge = this._mergers[iterator];
                merge = this.settings.mergeFit && Math.min(merge, this.settings.items) || merge;
                cache.items.merge = merge > 1 || cache.items.merge;
                widths[iterator] = !grid ? this._items[iterator].width() : width * merge;
            }
            this._widths = widths;
        }
    }, {
        filter: ['items', 'settings'],
        run: function () {
            var clones = [],
                items = this._items,
                settings = this.settings,
                // TODO: Should be computed from number of min width items in stage
                view = Math.max(settings.items * 2, 4),
                size = Math.ceil(items.length / 2) * 2,
                repeat = settings.loop && items.length ? settings.rewind ? view : Math.max(view, size) : 0,
                append = '',
                prepend = '';
            repeat /= 2;
            while (repeat > 0) {
                // Switch to only using appended clones
                clones.push(this.normalize(clones.length / 2, true));
                append = append + items[clones[clones.length - 1]][0].outerHTML;
                clones.push(this.normalize(items.length - 1 - (clones.length - 1) / 2, true));
                prepend = items[clones[clones.length - 1]][0].outerHTML + prepend;
                repeat -= 1;
            }
            this._clones = clones;
            $(append).addClass('cloned').appendTo(this.$stage);
            $(prepend).addClass('cloned').prependTo(this.$stage);
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function () {
            var rtl = this.settings.rtl ? 1 : -1,
                size = this._clones.length + this._items.length,
                iterator = -1,
                previous = 0,
                current = 0,
                coordinates = [];
            while (++iterator < size) {
                previous = coordinates[iterator - 1] || 0;
                current = this._widths[this.relative(iterator)] + this.settings.margin;
                coordinates.push(previous + current * rtl);
            }
            this._coordinates = coordinates;
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function () {
            var padding = this.settings.stagePadding,
                coordinates = this._coordinates,
                css = {
                    'width': Math.ceil(Math.abs(coordinates[coordinates.length - 1])) + padding * 2,
                };
            this.$stage.css(css);
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function (cache) {
            var iterator = this._coordinates.length,
                grid = !this.settings.autoWidth,
                items = this.$stage.children();
            if (grid && cache.items.merge) {
                while (iterator--) {
                    cache.css.width = this._widths[this.relative(iterator)];
                    items.eq(iterator).css(cache.css);
                }
            } else if (grid) {
            }
        }
    }, {
        filter: ['items'],
        run: function () {
            this._coordinates.length < 1 && this.$stage.removeAttr('style');
        }
    }, {
        filter: ['width', 'items', 'settings'],
        run: function (cache) {
            cache.current = cache.current ? this.$stage.children().index(cache.current) : 0;
            cache.current = Math.max(this.minimum(), Math.min(this.maximum(), cache.current));
            this.reset(cache.current);
        }
    }, {
        filter: ['position'],
        run: function () {
            this.animate(this.coordinates(this._current));
        }
    }, {
        filter: ['width', 'position', 'items', 'settings'],
        run: function () {
            var rtl = this.settings.rtl ? 1 : -1,
                padding = this.settings.stagePadding * 2,
                begin = this.coordinates(this.current()) + padding,
                end = begin + this.width() * rtl,
                inner, outer, matches = [], i, n;
            for (i = 0, n = this._coordinates.length; i < n; i++) {
                inner = this._coordinates[i - 1] || 0;
                if ((this.op(inner, '<=', begin) && (this.op(inner, '>', end)))
                    || (this.op(outer, '<', begin) && this.op(outer, '>', end))) {
                    matches.push(i);
                }
            }
            this.$stage.children('.active').removeClass('active');
            this.$stage.children(':eq(' + matches.join('), :eq(') + ')').addClass('active');
            this.$stage.children('.center').removeClass('center');
            if (this.settings.center) {
            }
        }
    }];
    /**
     */
    Owl.prototype.initializeStage = function () {
        this.$stage = this.$element.find('.' + this.settings.stageClass);
        // if the stage is already in the DOM, grab it and skip stage initialization
        if (this.$stage.length) {
        }
        this.$element.addClass(this.options.loadingClass);
        // create stage
        this.$stage = $('<' + this.settings.stageElement + '>', {
            "class": this.settings.stageClass
        }).wrap($('<div/>', {
            "class": this.settings.stageOuterClass
        }));
        // append stage
        this.$element.append(this.$stage.parent());
    };
    /**
     */
    Owl.prototype.initializeItems = function () {
        var $items = this.$element.find('.owl-item');
        // if the items are already in the DOM, grab them and skip item initialization
        if ($items.length) {
        }
        // append content
        this.replace(this.$element.children().not(this.$stage.parent()));
        // check visibility
        if (this.isVisible()) {
            // update view
            this.refresh();
        } else {
            // invalidate width
        }
        this.$element
            .removeClass(this.options.loadingClass)
            .addClass(this.options.loadedClass);
    };
    /**
     */
    Owl.prototype.initialize = function () {
        this.enter('initializing');
        this.trigger('initialize');
        this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl);
        if (this.settings.autoWidth && !this.is('pre-loading')) {
        }
        this.initializeStage();
        this.initializeItems();
        // register event handlers
        this.registerEventHandlers();
        this.leave('initializing');
        this.trigger('initialized');
    };
    /**
     */
    Owl.prototype.isVisible = function () {
        return this.settings.checkVisibility
            ? this.$element.is(':visible')
            : true;
    };
    /**
     */
    Owl.prototype.setup = function () {
        var viewport = this.viewport(),
            overwrites = this.options.responsive,
            match = -1,
            settings = null;
        if (!overwrites) {
        } else {
            settings = $.extend({}, this.options, overwrites[match]);
        }
        this._breakpoint = match;
        this.settings = settings;
        this.invalidate('settings');
    };
    /**
     */
    Owl.prototype.optionsLogic = function () {
        if (this.settings.autoWidth) {
        }
    };
    /**
     */
    Owl.prototype.prepare = function (item) {
        var event = this.trigger('prepare', {content: item});
        if (!event.data) {
            event.data = $('<' + this.settings.itemElement + '/>')
                .addClass(this.options.itemClass).append(item)
        }
        return event.data;
    };
    /**
     */
    Owl.prototype.update = function () {
        var i = 0,
            n = this._pipe.length,
            filter = $.proxy(function (p) {
                return this[p]
            }, this._invalidated),
            cache = {};
        while (i < n) {
            if (this._invalidated.all || $.grep(this._pipe[i].filter, filter).length > 0) {
                this._pipe[i].run(cache);
            }
            i++;
        }
        this._invalidated = {};
        !this.is('valid') && this.enter('valid');
    };
    /**
     */
    Owl.prototype.width = function (dimension) {
        dimension = dimension || Owl.Width.Default;
        switch (dimension) {
            default:
                return this._width - this.settings.stagePadding * 2 + this.settings.margin;
        }
    };
    /**
     */
    Owl.prototype.refresh = function () {
        this.enter('refreshing');
        this.trigger('refresh');
        this.setup();
        this.optionsLogic();
        this.$element.addClass(this.options.refreshClass);
        this.update();
        this.$element.removeClass(this.options.refreshClass);
        this.leave('refreshing');
        this.trigger('refreshed');
    };
    /**
     /**
     /**
     */
    Owl.prototype.registerEventHandlers = function () {
        if ($.support.transition) {
        }
        if (this.settings.responsive !== false) {
        }
        if (this.settings.mouseDrag) {
            this.$element.addClass(this.options.dragClass);
            this.$stage.on('mousedown.owl.core', $.proxy(this.onDragStart, this));
        }
        if (this.settings.touchDrag) {
        }
    };
    /**
     */
    Owl.prototype.onDragStart = function (event) {
        var stage = null;
        if (event.which === 3) {
        }
        if ($.support.transform) {
            stage = this.$stage.css('transform').replace(/.*\(|\)| /g, '').split(',');
            stage = {
                x: stage[stage.length === 16 ? 12 : 4],
            };
        } else {
        }
        if (this.is('animating')) {
        }
        this.$element.toggleClass(this.options.grabClass, event.type === 'mousedown');
        this.speed(0);
        this._drag.time = new Date().getTime();
        this._drag.target = $(event.target);
        this._drag.stage.start = stage;
        this._drag.stage.current = stage;
        this._drag.pointer = this.pointer(event);
        $(document).on('mouseup.owl.core touchend.owl.core', $.proxy(this.onDragEnd, this));
        $(document).one('mousemove.owl.core touchmove.owl.core', $.proxy(function (event) {
            $(document).on('mousemove.owl.core touchmove.owl.core', $.proxy(this.onDragMove, this));
        }, this));
    };
    /**
     */
    Owl.prototype.onDragMove = function (event) {
        var minimum = null,
            maximum = null,
            pull = null,
            delta = this.difference(this._drag.pointer, this.pointer(event)),
            stage = this.difference(this._drag.stage.start, delta);
        if (!this.is('dragging')) {
        }
        event.preventDefault();
        if (this.settings.loop) {
        } else {
        }
        this._drag.stage.current = stage;
        this.animate(stage.x);
    };
    /**
     */
    Owl.prototype.onDragEnd = function (event) {
        var delta = this.difference(this._drag.pointer, this.pointer(event)),
            stage = this._drag.stage.current,
            direction = delta.x > 0 ^ this.settings.rtl ? 'left' : 'right';
        $(document).off('.owl.core');
        this.$element.removeClass(this.options.grabClass);
        if (delta.x !== 0 && this.is('dragging') || !this.is('valid')) {
            this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed);
            this.current(this.closest(stage.x, delta.x !== 0 ? direction : this._drag.direction));
            this.update();
        }
        if (!this.is('dragging')) {
        }
        this.leave('dragging');
        this.trigger('dragged');
    };
    /**
     */
    Owl.prototype.closest = function (coordinate, direction) {
        var position = -1,
            pull = 30,
            width = this.width(),
            coordinates = this.coordinates();
        if (!this.settings.freeDrag) {
            // check closest item
            $.each(coordinates, $.proxy(function (index, value) {
                // on a left pull, check on current index
                if (direction === 'left' && coordinate > value - pull && coordinate < value + pull) {
                    // on a right pull, check on previous index
                    // to do so, subtract width from value and set position = index + 1
                } else if (direction === 'right' && coordinate > value - width - pull && coordinate < value - width + pull) {
                } else if (this.op(coordinate, '<', value)
                    && this.op(coordinate, '>', coordinates[index + 1] !== undefined ? coordinates[index + 1] : value - width)) {
                    position = direction === 'left' ? index + 1 : index;
                }
            }, this));
        }
        if (!this.settings.loop) {
            // non loop boundries
        }
        return position;
    };
    /**
     */
    Owl.prototype.animate = function (coordinate) {
        var animate = this.speed() > 0;
        this.is('animating') && this.onTransitionEnd();
        if (animate) {
        }
        if ($.support.transform3d && $.support.transition) {
            this.$stage.css({
                transform: 'translate3d(' + coordinate + 'px,0px,0px)',
                transition: (this.speed() / 1000) + 's' + (
                    this.settings.slideTransition ? ' ' + this.settings.slideTransition : ''
                )
            });
        } else if (animate) {
        } else {
        }
    };
    /**
     */
    Owl.prototype.is = function (state) {
        return this._states.current[state] && this._states.current[state] > 0;
    };
    /**
     */
    Owl.prototype.current = function (position) {
        if (position === undefined) {
            return this._current;
        }
        if (this._items.length === 0) {
        }
        position = this.normalize(position);
        if (this._current !== position) {
            this._current = position;
            this.invalidate('position');
            this.trigger('changed', {property: {name: 'position', value: this._current}});
        }
        return this._current;
    };
    /**
     */
    Owl.prototype.invalidate = function (part) {
        if ($.type(part) === 'string') {
            this._invalidated[part] = true;
        }
        return $.map(this._invalidated, function (v, i) {
            return i
        });
    };
    /**
     */
    Owl.prototype.reset = function (position) {
        position = this.normalize(position);
        if (position === undefined) {
        }
        this._speed = 0;
        this._current = position;
        this.suppress(['translate', 'translated']);
        this.animate(this.coordinates(position));
        this.release(['translate', 'translated']);
    };
    /**
     */
    Owl.prototype.normalize = function (position, relative) {
        var n = this._items.length,
            m = relative ? 0 : this._clones.length;
        if (!this.isNumeric(position) || n < 1) {
        } else if (position < 0 || position >= n + m) {
            position = ((position - m / 2) % n + n) % n + m / 2;
        }
        return position;
    };
    /**
     */
    Owl.prototype.relative = function (position) {
        position -= this._clones.length / 2;
        return this.normalize(position, true);
    };
    /**
     */
    Owl.prototype.maximum = function (relative) {
        var settings = this.settings,
            maximum = this._coordinates.length,
            iterator,
            reciprocalItemsWidth,
            elementWidth;
        if (settings.loop) {
        } else if (settings.autoWidth || settings.merge) {
        } else if (settings.center) {
        } else {
        }
        if (relative) {
        }
        return Math.max(maximum, 0);
    };
    /**
     */
    Owl.prototype.minimum = function (relative) {
        return relative ? 0 : this._clones.length / 2;
    };
    /**
     */
    Owl.prototype.items = function (position) {
        if (position === undefined) {
            return this._items.slice();
        }
        position = this.normalize(position, true);
        return this._items[position];
    };
    /**
     */
    Owl.prototype.mergers = function (position) {
        if (position === undefined) {
        }
        position = this.normalize(position, true);
        return this._mergers[position];
    };
    /**
     */
    Owl.prototype.clones = function (position) {
        var odd = this._clones.length / 2,
            even = odd + this._items.length,
            map = function (index) {
                return index % 2 === 0 ? even + index / 2 : odd - (index + 1) / 2
            };
        if (position === undefined) {
            return $.map(this._clones, function (v, i) {
                return map(i)
            });
        }
    };
    /**
     */
    Owl.prototype.speed = function (speed) {
        if (speed !== undefined) {
            this._speed = speed;
        }
        return this._speed;
    };
    /**
     */
    Owl.prototype.coordinates = function (position) {
        var multiplier = 1,
            newPosition = position - 1,
            coordinate;
        if (position === undefined) {
            return $.map(this._coordinates, $.proxy(function (coordinate, index) {
                return this.coordinates(index);
            }, this));
        }
        if (this.settings.center) {
        } else {
            coordinate = this._coordinates[newPosition] || 0;
        }
        coordinate = Math.ceil(coordinate);
        return coordinate;
    };
    /**
     */
    Owl.prototype.duration = function (from, to, factor) {
        if (factor === 0) {
        }
        return Math.min(Math.max(Math.abs(to - from), 1), 6) * Math.abs((factor || this.settings.smartSpeed));
    };
    /**
     */
    Owl.prototype.to = function (position, speed) {
        var current = this.current(),
            revert = null,
            distance = position - this.relative(current),
            direction = (distance > 0) - (distance < 0),
            items = this._items.length,
            minimum = this.minimum(),
            maximum = this.maximum();
        if (this.settings.loop) {
            if (!this.settings.rewind && Math.abs(distance) > items / 2) {
                distance += direction * -1 * items;
            }
            position = current + distance;
        } else if (this.settings.rewind) {
        } else {
        }
        this.speed(this.duration(current, position, speed));
        this.current(position);
        if (this.isVisible()) {
            this.update();
        }
    };
    /**
     /**
     /**
     */
    Owl.prototype.onTransitionEnd = function (event) {
        // if css2 animation then event object is undefined
        if (event !== undefined) {
        }
        this.leave('animating');
        this.trigger('translated');
    };
    /**
     */
    Owl.prototype.viewport = function () {
        var width;
        if (this.options.responsiveBaseElement !== window) {
        } else if (window.innerWidth) {
        } else if (document.documentElement && document.documentElement.clientWidth) {
        } else {
        }
        return width;
    };
    /**
     */
    Owl.prototype.replace = function (content) {
        this.$stage.empty();
        this._items = [];
        if (content) {
            content = (content instanceof jQuery) ? content : $(content);
        }
        if (this.settings.nestedItemSelector) {
        }
        content.filter(function () {
            return this.nodeType === 1;
        }).each($.proxy(function (index, item) {
            item = this.prepare(item);
            this.$stage.append(item);
            this._items.push(item);
            this._mergers.push(item.find('[data-merge]').addBack('[data-merge]').attr('data-merge') * 1 || 1);
        }, this));
        this.reset(this.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0);
        this.invalidate('items');
    };
    /**
     */
    Owl.prototype.add = function (content, position) {
        var current = this.relative(this._current);
        position = position === undefined ? this._items.length : this.normalize(position, true);
        content = content instanceof jQuery ? content : $(content);
        content = this.prepare(content);
        if (this._items.length === 0 || position === this._items.length) {
            this._items.length !== 0 && this._items[position - 1].after(content);
            this._items.push(content);
            this._mergers.push(content.find('[data-merge]').addBack('[data-merge]').attr('data-merge') * 1 || 1);
        } else {
        }
        this._items[current] && this.reset(this._items[current].index());
        this.invalidate('items');
    };
    /**
     */
    Owl.prototype.remove = function (position) {
        position = this.normalize(position, true);
        if (position === undefined) {
        }
        this._items[position].remove();
        this._items.splice(position, 1);
        this._mergers.splice(position, 1);
        this.invalidate('items');
    };
    /**
     /**
     */
    Owl.prototype.destroy = function () {
        this.$element.off('.owl.core');
        this.$stage.off('.owl.core');
        $(document).off('.owl.core');
        if (this.settings.responsive !== false) {
        }
        for (var i in this._plugins) {
            this._plugins[i].destroy();
        }
        this.$stage.children('.cloned').remove();
        this.$stage.unwrap();
        this.$stage.children().contents().unwrap();
        this.$stage.children().unwrap();
        this.$stage.remove();
        this.$element
            .removeClass(this.options.refreshClass)
            .removeClass(this.options.loadingClass)
            .removeClass(this.options.loadedClass)
            .removeClass(this.options.rtlClass)
            .removeClass(this.options.dragClass)
            .removeClass(this.options.grabClass)
            .attr('class', this.$element.attr('class').replace(new RegExp(this.options.responsiveClass + '-\\S+\\s', 'g'), ''))
            .removeData('owl.carousel');
    };
    /**
     */
    Owl.prototype.op = function (a, o, b) {
        var rtl = this.settings.rtl;
        switch (o) {
            case '<':
                return rtl ? a > b : a < b;
            case '>':
                return rtl ? a < b : a > b;
            case '<=':
                return rtl ? a >= b : a <= b;
        }
    };
    /**
     */
    Owl.prototype.on = function (element, event, listener, capture) {
        if (element.addEventListener) {
        } else if (element.attachEvent) {
        }
    };
    /**
     */
    Owl.prototype.off = function (element, event, listener, capture) {
        if (element.removeEventListener) {
        } else if (element.detachEvent) {
        }
    };
    /**
     */
    Owl.prototype.trigger = function (name, data, namespace, state, enter) {
        var status = {}, handler = $.camelCase(
            $.grep(['on', name, namespace], function (v) {
                return v
            })
                .join('-').toLowerCase()
        ), event = $.Event(
            [name, 'owl', namespace || 'carousel'].join('.').toLowerCase(),
            $.extend({relatedTarget: this}, status, data)
        );
        if (!this._supress[name]) {
            this.$element.trigger(event);
        }
        return event;
    };
    /**
     */
    Owl.prototype.enter = function (name) {
        $.each([name].concat(this._states.tags[name] || []), $.proxy(function (i, name) {
        }, this));
    };
    /**
     */
    Owl.prototype.leave = function (name) {
        $.each([name].concat(this._states.tags[name] || []), $.proxy(function (i, name) {
        }, this));
    };
    /**
     */
    Owl.prototype.register = function (object) {
        if (object.type === Owl.Type.Event) {
            if (!$.event.special[object.name]) {
                $.event.special[object.name] = {};
            }
            if (!$.event.special[object.name].owl) {
                $.event.special[object.name]._default = function (e) {
                };
            }
        } else if (object.type === Owl.Type.State) {
        }
    };
    /**
     */
    Owl.prototype.suppress = function (events) {
        $.each(events, $.proxy(function (index, event) {
        }, this));
    };
    /**
     */
    Owl.prototype.release = function (events) {
        $.each(events, $.proxy(function (index, event) {
        }, this));
    };
    /**
     */
    Owl.prototype.pointer = function (event) {
        var result = {x: null, y: null};
        event = event.originalEvent || event || window.event;
        event = event.touches && event.touches.length ?
            event.touches[0] : event.changedTouches && event.changedTouches.length ?
                event.changedTouches[0] : event;
        if (event.pageX) {
            result.x = event.pageX;
        } else {
        }
        return result;
    };
    /**
     */
    Owl.prototype.isNumeric = function (number) {
        return !isNaN(parseFloat(number));
    };
    /**
     */
    Owl.prototype.difference = function (first, second) {
        return {
            x: first.x - second.x,
            y: first.y - second.y
        };
    };
    /**
     */
    $.fn.owlCarousel = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var $this = $(this),
                data = $this.data('owl.carousel');
            if (!data) {
                data = new Owl(this, typeof option == 'object' && option);
                $this.data('owl.carousel', data);
                $.each([
                    'next', 'prev', 'to', 'destroy', 'refresh', 'replace', 'add', 'remove'
                ], function (i, event) {
                    data.register({type: Owl.Type.Event, name: event});
                    data.$element.on(event + '.owl.carousel.core', $.proxy(function (e) {
                        if (e.namespace && e.relatedTarget !== this) {
                            data[event].apply(this, [].slice.call(arguments, 1));
                        }
                    }, data));
                });
            }
            if (typeof option == 'string' && option.charAt(0) !== '_') {
                data[option].apply(data, args);
            }
        });
    };
    /**
     */
    $.fn.owlCarousel.Constructor = Owl;
})(window.Zepto || window.jQuery, window, document);
/**
 * AutoRefresh Plugin
 * @version 2.3.4
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
/**
 * Lazy Plugin
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
/**
 * AutoHeight Plugin
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
/**
 * Video Plugin
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
/**
 * Animate Plugin
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
/**
 * Autoplay Plugin
 * @version 2.3.4
 * @author Bartosz Wojciechowski
 * @author Artus Kolanowski
 * @author David Deutsch
 * @author Tom De Caluwé
 * @license The MIT License (MIT)
 */
/**
 * Navigation Plugin
 * @version 2.3.4
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {
    /**
     */
    var Navigation = function (carousel) {
        /**
         * Reference to the core.
         * @protected
         * @type {Owl}
         */
        this._core = carousel;
        /**
         * Indicates whether the plugin is initialized or not.
         * @protected
         * @type {Boolean}
         */
        this._initialized = false;
        /**
         * The current paging indexes.
         * @protected
         * @type {Array}
         */
        this._pages = [];
        /**
         * All DOM elements of the user interface.
         * @protected
         * @type {Object}
         */
        this._controls = {};
        /**
         * Markup for an indicator.
         * @protected
         * @type {Array.<String>}
         */
        this._templates = [];
        /**
         * The carousel element.
         * @type {jQuery}
         */
        this.$element = this._core.$element;
        /**
         * Overridden methods of the carousel.
         * @protected
         * @type {Object}
         */
        this._overrides = {
            to: this._core.to
        };
        /**
         * All event handlers.
         * @protected
         * @type {Object}
         */
        this._handlers = {
            'changed.owl.carousel': $.proxy(function (e) {
                if (e.namespace && e.property.name == 'position') {
                    this.draw();
                }
            }, this),
            'initialized.owl.carousel': $.proxy(function (e) {
                if (e.namespace && !this._initialized) {
                    this.initialize();
                    this.update();
                    this.draw();
                    this._initialized = true;
                }
            }, this),
            'refreshed.owl.carousel': $.proxy(function (e) {
                if (e.namespace && this._initialized) {
                    this.update();
                    this.draw();
                }
            }, this)
        };
        // set default options
        this._core.options = $.extend({}, Navigation.Defaults, this._core.options);
        // register event handlers
        this.$element.on(this._handlers);
    };
    /**
     */
    Navigation.Defaults = {
        nav: false,
        navText: [
            '<span aria-label="' + 'Previous' + '">&#x2039;</span>',
            '<span aria-label="' + 'Next' + '">&#x203a;</span>'
        ],
        navSpeed: false,
        navElement: 'button type="button" role="presentation"',
        navContainer: false,
        navContainerClass: 'owl-nav',
        navClass: [
            'owl-prev',
            'owl-next'
        ],
        slideBy: 1,
        dotClass: 'owl-dot',
        dotsClass: 'owl-dots',
        dots: true,
        dotsEach: false,
        dotsData: false,
        dotsSpeed: false,
        dotsContainer: false
    };
    /**
     */
    Navigation.prototype.initialize = function () {
        var override,
            settings = this._core.settings;
        // create DOM structure for relative navigation
        this._controls.$relative = (settings.navContainer ? $(settings.navContainer)
            : $('<div>').addClass(settings.navContainerClass).appendTo(this.$element)).addClass('disabled');
        this._controls.$previous = $('<' + settings.navElement + '>')
            .addClass(settings.navClass[0])
            .html(settings.navText[0])
            .prependTo(this._controls.$relative)
            .on('click', $.proxy(function (e) {
            }, this));
        this._controls.$next = $('<' + settings.navElement + '>')
            .addClass(settings.navClass[1])
            .html(settings.navText[1])
            .appendTo(this._controls.$relative)
            .on('click', $.proxy(function (e) {
            }, this));
        // create DOM structure for absolute navigation
        if (!settings.dotsData) {
            this._templates = [$('<button role="button">')
                .addClass(settings.dotClass)
                .append($('<span>'))
                .prop('outerHTML')];
        }
        this._controls.$absolute = (settings.dotsContainer ? $(settings.dotsContainer)
            : $('<div>').addClass(settings.dotsClass).appendTo(this.$element)).addClass('disabled');
        this._controls.$absolute.on('click', 'button', $.proxy(function (e) {
            var index = $(e.target).parent().is(this._controls.$absolute)
                ? $(e.target).index() : $(e.target).parent().index();
            this.to(index, settings.dotsSpeed);
        }, this));
        /*$el.on('focusin', function() {
        $(document).off(".carousel");
        $(document).on('keydown.carousel', function(e) {
        if(e.keyCode == 37) {
        $el.trigger('prev.owl')
        }
        if(e.keyCode == 39) {
        $el.trigger('next.owl')
        }
        });
        });*/
        // override public methods of the carousel
        for (override in this._overrides) {
        }
    };
    /**
     */
    Navigation.prototype.destroy = function () {
        var handler, control, property, override, settings;
        settings = this._core.settings;
        for (handler in this._handlers) {
        }
        for (control in this._controls) {
            if (control === '$relative' && settings.navContainer) {
            } else {
                this._controls[control].remove();
            }
        }
        for (override in this.overides) {
        }
        for (property in Object.getOwnPropertyNames(this)) {
        }
    };
    /**
     */
    Navigation.prototype.update = function () {
        var i, j, k,
            lower = this._core.clones().length / 2,
            upper = lower + this._core.items().length,
            maximum = this._core.maximum(true),
            settings = this._core.settings,
            size = settings.center || settings.autoWidth || settings.dotsData
                ? 1 : settings.dotsEach || settings.items;
        if (settings.slideBy !== 'page') {
        }
        if (settings.dots || settings.slideBy == 'page') {
            this._pages = [];
            for (i = lower, j = 0, k = 0; i < upper; i++) {
                if (j >= size || j === 0) {
                    this._pages.push({
                        start: Math.min(maximum, i - lower),
                        end: i - lower + size - 1
                    });
                    j = 0, ++k;
                }
                j += this._core.mergers(this._core.relative(i));
            }
        }
    };
    /**
     */
    Navigation.prototype.draw = function () {
        var difference,
            settings = this._core.settings,
            disabled = this._core.items().length <= settings.items,
            index = this._core.relative(this._core.current()),
            loop = settings.loop || settings.rewind;
        this._controls.$relative.toggleClass('disabled', !settings.nav || disabled);
        if (settings.nav) {
        }
        this._controls.$absolute.toggleClass('disabled', !settings.dots || disabled);
        if (settings.dots) {
            difference = this._pages.length - this._controls.$absolute.children().length;
            if (settings.dotsData && difference !== 0) {
            } else if (difference > 0) {
                this._controls.$absolute.append(new Array(difference + 1).join(this._templates[0]));
            } else if (difference < 0) {
                this._controls.$absolute.children().slice(difference).remove();
            }
            this._controls.$absolute.find('.active').removeClass('active');
            this._controls.$absolute.children().eq($.inArray(this.current(), this._pages)).addClass('active');
        }
    };
    /**
     /**
     */
    Navigation.prototype.current = function () {
        var current = this._core.relative(this._core.current());
        return $.grep(this._pages, $.proxy(function (page, index) {
            return page.start <= current && page.end >= current;
        }, this)).pop();
    };
    /**
     /**
     /**
     /**
     */
    Navigation.prototype.to = function (position, speed, standard) {
        var length;
        if (!standard && this._pages.length) {
            length = this._pages.length;
            $.proxy(this._overrides.to, this._core)(this._pages[((position % length) + length) % length].start, speed);
        } else {
        }
    };
    $.fn.owlCarousel.Constructor.Plugins.Navigation = Navigation;
})(window.Zepto || window.jQuery, window, document);
/**
 * Hash Plugin
 * @version 2.3.4
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
/**
 * Support Plugin
 *
 * @version 2.3.4
 * @author Vivid Planet Software GmbH
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {
    var style = $('<support>').get(0).style,
        prefixes = 'Webkit Moz O ms'.split(' '),
        events = {
            transition: {
                end: {}
            },
            animation: {}
        },
        tests = {
            csstransforms: function () {
                return !!test('transform');
            },
            csstransforms3d: function () {
                return !!test('perspective');
            },
            csstransitions: function () {
                return !!test('transition');
            },
            cssanimations: function () {
            }
        };
    function test(property, prefixed) {
        var result = false,
            upper = property.charAt(0).toUpperCase() + property.slice(1);
        $.each((property + ' ' + prefixes.join(upper + ' ') + upper).split(' '), function (i, property) {
            if (style[property] !== undefined) {
                result = prefixed ? property : true;
            }
        });
        return result;
    }
    function prefixed(property) {
        return test(property, true);
    }
    if (tests.csstransitions()) {
        /* jshint -W053 */
        $.support.transition = new String(prefixed('transition'))
        $.support.transition.end = events.transition.end[$.support.transition];
    }
    if (tests.csstransforms()) {
        /* jshint -W053 */
        $.support.transform = new String(prefixed('transform'));
        $.support.transform3d = tests.csstransforms3d();
    }
})(window.Zepto || window.jQuery, window, document);