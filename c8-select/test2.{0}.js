/*!
* Select2 4.0.6-rc.1
* https://select2.github.io
*
* Released under the MIT license
* https://github.com/select2/select2/blob/master/LICENSE.md
*/
;(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function (jQuery) {
    // This is needed so we can catch the AMD loader configuration and use it
    // The inner file should be wrapped (by `banner.start.js`) in a function that
    // returns the AMD loader references.
    var S2 = (function () {
        // Restore the Select2 AMD loader so it can be used
        // Needed mostly in the language files, where the loader is not inserted
        var S2;
        (function () {
            if (!S2 || !S2.requirejs) {
                if (!S2) {
                    S2 = {};
                } else {
                    require = S2;
                }
                (function (undef) {
                    var main, req, makeMap, handlers,
                        defined = {},
                        waiting = {},
                        config = {},
                        defining = {},
                        hasOwn = Object.prototype.hasOwnProperty,
                        aps = [].slice,
                        jsSuffixRegExp = /\.js$/;
                    function hasProp(obj, prop) {
                        return hasOwn.call(obj, prop);
                    }
                    /**
                     */
                    function normalize(name, baseName) {
                        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
                            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
                            baseParts = baseName && baseName.split("/"),
                            map = config.map,
                            starMap = (map && map['*']) || {};
                        if (name) {
                            name = name.split('/');
                            if (name[0].charAt(0) === '.' && baseParts) {
                                //Convert baseName to array, and lop off the last part,
                                //so that . matches that 'directory' and not name of the baseName's
                                //module. For instance, baseName of 'one/two/three', maps to
                                //'one/two/three.js', but we want the directory, 'one/two' for
                                //this normalization.
                                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                                name = normalizedBaseParts.concat(name);
                            }
                            for (i = 0; i < name.length; i++) {
                                part = name[i];
                                if (part === '.') {
                                    name.splice(i, 1);
                                } else if (part === '..') {
                                    // If at the start, or previous value is still ..,
                                    // keep them so that when converted to a path it may
                                    // still work when converted to a path, even though
                                    // as an ID it is less than ideal. In larger point
                                    // releases, may be better to just kick out an error.
                                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                                    } else if (i > 0) {
                                        name.splice(i - 1, 2);
                                    }
                                }
                            }
                            name = name.join('/');
                        }
                        return name;
                    }
                    function callDep(name) {
                        if (hasProp(waiting, name)) {
                            var args = waiting[name];
                            delete waiting[name];
                            main.apply(undef, args);
                        }
                        return defined[name];
                    }
                    function splitPrefix(name) {
                        var prefix,
                            index = name ? name.indexOf('!') : -1;
                        return [prefix, name];
                    }
                    function makeRelParts(relName) {
                        return relName ? splitPrefix(relName) : [];
                    }
                    /**
                     */
                    makeMap = function (name, relParts) {
                        var plugin,
                            parts = splitPrefix(name),
                            prefix = parts[0],
                            relResourceName = relParts[1];
                        if (prefix) {
                        } else {
                            name = normalize(name, relResourceName);
                        }
                        return {
                            f: prefix ? prefix + '!' + name : name, //fullName
                            n: name,
                            pr: prefix,
                            p: plugin
                        };
                    };
                    main = function (name, deps, callback, relName) {
                        var cjsModule, depName, ret, map, i, relParts,
                            args = [],
                            callbackType = typeof callback,
                            usingExports;
                        relName = relName || name;
                        relParts = makeRelParts(relName);
                        if (callbackType === 'undefined' || callbackType === 'function') {
                            //Pull out the defined dependencies and pass the ordered
                            //values to the callback.
                            //Default to [require, exports, module] if no deps
                            for (i = 0; i < deps.length; i += 1) {
                                map = makeMap(deps[i], relParts);
                                depName = map.f;
                                if (depName === "require") {
                                } else if (depName === "exports") {
                                    //CommonJS module spec 1.1
                                } else if (depName === "module") {
                                    //CommonJS module spec 1.1
                                } else if (hasProp(defined, depName) ||
                                    hasProp(waiting, depName) ||
                                    hasProp(defining, depName)) {
                                    args[i] = callDep(depName);
                                } else if (map.p) {
                                } else {
                                }
                            }
                            ret = callback ? callback.apply(defined[name], args) : undefined;
                            if (name) {
                                //If setting exports via "module" is in play,
                                //favor that over return value and exports. After that,
                                //favor a non-undefined return value over exports use.
                                if (cjsModule && cjsModule.exports !== undef &&
                                    cjsModule.exports !== defined[name]) {
                                } else if (ret !== undef || !usingExports) {
                                    //Use the return value from the function.
                                    defined[name] = ret;
                                }
                            }
                        } else if (name) {
                            //May just be an object definition for the module. Only
                            //worry about defining if have a module name.
                        }
                    };
                    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
                        if (typeof deps === "string") {
                            return callDep(makeMap(deps, makeRelParts(callback)).f);
                        } else if (!deps.splice) {
                            //deps is a config object, not an array.
                        }
                    };
                    /**
                     */
                    define = function (name, deps, callback) {
                        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
                            waiting[name] = [name, deps, callback];
                        }
                    };
                }());
                S2.requirejs = requirejs;
                S2.require = require;
                S2.define = define;
            }
        }());
        S2.define('jquery', [], function () {
            var _$ = jQuery || $;
            return _$;
        });
        S2.define('select2/utils', [
            'jquery'
        ], function ($) {
            var Utils = {};
            Utils.Extend = function (ChildClass, SuperClass) {
                function BaseConstructor() {
                    this.constructor = ChildClass;
                }
                BaseConstructor.prototype = SuperClass.prototype;
                ChildClass.prototype = new BaseConstructor();
                ChildClass.__super__ = SuperClass.prototype;
            };
            function getMethods(theClass) {
                var proto = theClass.prototype;
                var methods = [];
                for (var methodName in proto) {
                    methods.push(methodName);
                }
                return methods;
            }
            Utils.Decorate = function (SuperClass, DecoratorClass) {
                var decoratedMethods = getMethods(DecoratorClass);
                var superMethods = getMethods(SuperClass);
                function DecoratedClass() {
                    var unshift = Array.prototype.unshift;
                    var argCount = DecoratorClass.prototype.constructor.length;
                    if (argCount > 0) {
                        unshift.call(arguments, SuperClass.prototype.constructor);
                        calledConstructor = DecoratorClass.prototype.constructor;
                    }
                    calledConstructor.apply(this, arguments);
                }
                for (var m = 0; m < superMethods.length; m++) {
                    var superMethod = superMethods[m];
                    DecoratedClass.prototype[superMethod] =
                        SuperClass.prototype[superMethod];
                }
                var calledMethod = function (methodName) {
                    // Stub out the original method if it's not decorating an actual method
                    var originalMethod = function () {
                    };
                    if (methodName in DecoratedClass.prototype) {
                        originalMethod = DecoratedClass.prototype[methodName];
                    }
                    var decoratedMethod = DecoratorClass.prototype[methodName];
                    return function () {
                        var unshift = Array.prototype.unshift;
                        unshift.call(arguments, originalMethod);
                        return decoratedMethod.apply(this, arguments);
                    };
                };
                for (var d = 0; d < decoratedMethods.length; d++) {
                    var decoratedMethod = decoratedMethods[d];
                    DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
                }
                return DecoratedClass;
            };
            var Observable = function () {
            };
            Observable.prototype.on = function (event, callback) {
                this.listeners = this.listeners || {};
                if (event in this.listeners) {
                    this.listeners[event].push(callback);
                } else {
                    this.listeners[event] = [callback];
                }
            };
            Observable.prototype.trigger = function (event) {
                var slice = Array.prototype.slice;
                if (event in this.listeners) {
                    this.invoke(this.listeners[event], slice.call(arguments, 1));
                }
                if ('*' in this.listeners) {
                    this.invoke(this.listeners['*'], arguments);
                }
            };
            Observable.prototype.invoke = function (listeners, params) {
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].apply(this, params);
                }
            };
            Utils.Observable = Observable;
            Utils.bind = function (func, context) {
                return function () {
                    func.apply(context, arguments);
                };
            };
            Utils.hasScroll = function (index, el) {
                // Adapted from the function created by @ShadowScripter
                // and adapted by @BillBarry on the Stack Exchange Code Review website.
                // The original code can be found at
                // http://codereview.stackexchange.com/q/13338
                // and was designed to be used with the Sizzle selector engine.
                var $el = $(el);
                return ($el.innerHeight() < el.scrollHeight ||
                    $el.innerWidth() < el.scrollWidth);
            };
            Utils.escapeMarkup = function (markup) {
                var replaceMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    '/': '&#47;'
                };
                return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
                    return replaceMap[match];
                });
            };
            Utils.appendMany = function ($element, $nodes) {
                // jQuery 1.7.x does not support $.fn.append() with an array
                // Fall back to a jQuery object collection using $.fn.add()
                if ($.fn.jquery.substr(0, 3) === '1.7') {
                    var $jqNodes = $();
                    $.map($nodes, function (node) {
                        $jqNodes = $jqNodes.add(node);
                    });
                    $nodes = $jqNodes;
                }
                $element.append($nodes);
            };
            Utils.__cache = {};
            var id = 0;
            Utils.GetUniqueElementId = function (element) {
                // Get a unique element Id. If element has no id,
                // creates a new unique number, stores it in the id
                // attribute and returns the new id.
                // If an id already exists, it simply returns it.
                var select2Id = element.getAttribute('data-select2-id');
                if (select2Id == null) {
                    // If element has id, use it.
                    if (element.id) {
                        select2Id = element.id;
                        element.setAttribute('data-select2-id', select2Id);
                    } else {
                        element.setAttribute('data-select2-id', ++id);
                        select2Id = id.toString();
                    }
                }
                return select2Id;
            };
            Utils.StoreData = function (element, name, value) {
                // Stores an item in the cache for a specified element.
                // name is the cache key.
                var id = Utils.GetUniqueElementId(element);
                if (!Utils.__cache[id]) {
                    Utils.__cache[id] = {};
                }
                Utils.__cache[id][name] = value;
            };
            Utils.GetData = function (element, name) {
                // Retrieves a value from the cache by its key (name)
                // name is optional. If no name specified, return
                // all cache items for the specified element.
                // and for a specified element.
                var id = Utils.GetUniqueElementId(element);
                if (name) {
                    if (Utils.__cache[id]) {
                        return Utils.__cache[id][name] != null ?
                            Utils.__cache[id][name] :
                            $(element).data(name); // Fallback to HTML5 data attribs.
                    }
                } else {
                }
            };
            return Utils;
        });
        S2.define('select2/results', [
            'jquery',
            './utils'
        ], function ($, Utils) {
            function Results($element, options, dataAdapter) {
                this.data = dataAdapter;
                this.options = options;
            }
            Utils.Extend(Results, Utils.Observable);
            Results.prototype.render = function () {
                var $results = $(
                    '<ul class="select2-results__options" role="tree"></ul>'
                );
                if (this.options.get('multiple')) {
                    $results.attr('aria-multiselectable', 'true');
                }
                this.$results = $results;
                return $results;
            };
            Results.prototype.clear = function () {
                this.$results.empty();
            };
            Results.prototype.append = function (data) {
                var $options = [];
                for (var d = 0; d < data.results.length; d++) {
                    var item = data.results[d];
                    var $option = this.option(item);
                    $options.push($option);
                }
                this.$results.append($options);
            };
            Results.prototype.position = function ($results, $dropdown) {
                var $resultsContainer = $dropdown.find('.select2-results');
                $resultsContainer.append($results);
            };
            Results.prototype.highlightFirstItem = function () {
                var $options = this.$results
                    .find('.select2-results__option[aria-selected]');
                var $selected = $options.filter('[aria-selected=true]');
                if ($selected.length > 0) {
                    // If there are selected options, highlight the first
                    $selected.first().trigger('mouseenter');
                } else {
                    // If there are no selected options, highlight the first option
                    // in the dropdown
                    $options.first().trigger('mouseenter');
                }
            };
            Results.prototype.setClasses = function () {
                var self = this;
                this.data.current(function (selected) {
                    var $options = self.$results
                        .find('.select2-results__option[aria-selected]');
                    $options.each(function () {
                        var $option = $(this);
                        var item = Utils.GetData(this, 'data');
                        if ((item.element != null && item.element.selected) ||
                            (item.element == null && $.inArray(id, selectedIds) > -1)) {
                            $option.attr('aria-selected', 'true');
                        } else {
                        }
                    });
                });
            };
            Results.prototype.option = function (data) {
                var option = document.createElement('li');
                option.className = 'select2-results__option';
                var attrs = {
                    'role': 'treeitem',
                    'aria-selected': 'false'
                };
                if (data._resultId != null) {
                    option.id = data._resultId;
                }
                if (data.children) {
                    attrs.role = 'group';
                    attrs['aria-label'] = data.text;
                    delete attrs['aria-selected'];
                }
                for (var attr in attrs) {
                    var val = attrs[attr];
                    option.setAttribute(attr, val);
                }
                if (data.children) {
                    var $option = $(option);
                    var label = document.createElement('strong');
                    label.className = 'select2-results__group';
                    this.template(data, label);
                    var $children = [];
                    for (var c = 0; c < data.children.length; c++) {
                        var child = data.children[c];
                        var $child = this.option(child);
                        $children.push($child);
                    }
                    var $childrenContainer = $('<ul></ul>', {
                        'class': 'select2-results__options select2-results__options--nested'
                    });
                    $childrenContainer.append($children);
                    $option.append(label);
                    $option.append($childrenContainer);
                } else {
                    this.template(data, option);
                }
                Utils.StoreData(option, 'data', data);
                return option;
            };
            Results.prototype.bind = function (container, $container) {
                var self = this;
                var id = container.id + '-results';
                this.$results.attr('id', id);
                container.on('results:all', function (params) {
                    self.clear();
                    self.append(params.data);
                    if (container.isOpen()) {
                        self.setClasses();
                        self.highlightFirstItem();
                    }
                });
                container.on('open', function () {
                    // When the dropdown is open, aria-expended="true"
                    self.$results.attr('aria-expanded', 'true');
                    self.$results.attr('aria-hidden', 'false');
                });
                container.on('results:focus', function (params) {
                    params.element.addClass('select2-results__option--highlighted');
                });
                this.$results.on('mouseup', '.select2-results__option[aria-selected]',
                    function (evt) {
                        var $this = $(this);
                        var data = Utils.GetData(this, 'data');
                        if ($this.attr('aria-selected') === 'true') {
                            if (self.options.get('multiple')) {
                                self.trigger('unselect', {
                                    data: data
                                });
                            } else {
                            }
                            return;
                        }
                        self.trigger('select', {
                            data: data
                        });
                    });
                this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
                    function (evt) {
                        var data = Utils.GetData(this, 'data');
                        self.getHighlightedResults()
                            .removeClass('select2-results__option--highlighted');
                        self.trigger('results:focus', {
                            data: data,
                            element: $(this)
                        });
                    });
            };
            Results.prototype.getHighlightedResults = function () {
                var $highlighted = this.$results
                    .find('.select2-results__option--highlighted');
                return $highlighted;
            };
            Results.prototype.template = function (result, container) {
                var template = this.options.get('templateResult');
                var escapeMarkup = this.options.get('escapeMarkup');
                var content = template(result, container);
                if (content == null) {
                } else if (typeof content === 'string') {
                    container.innerHTML = escapeMarkup(content);
                } else {
                }
            };
            return Results;
        });
        S2.define('select2/selection/base', [
            'jquery',
            '../utils',
            '../keys'
        ], function ($, Utils, KEYS) {
            function BaseSelection($element, options) {
                this.$element = $element;
                this.options = options;
            }
            Utils.Extend(BaseSelection, Utils.Observable);
            BaseSelection.prototype.render = function () {
                var $selection = $(
                    '<span class="select2-selection" role="combobox" ' +
                    ' aria-haspopup="true" aria-expanded="false">' +
                    '</span>'
                );
                if (Utils.GetData(this.$element[0], 'old-tabindex') != null) {
                    this._tabindex = Utils.GetData(this.$element[0], 'old-tabindex');
                } else if (this.$element.attr('tabindex') != null) {
                }
                this.$selection = $selection;
                return $selection;
            };
            BaseSelection.prototype.bind = function (container, $container) {
                var self = this;
                var resultsId = container.id + '-results';
                container.on('results:focus', function (params) {
                    self.$selection.attr('aria-activedescendant', params.data._resultId);
                });
                container.on('selection:update', function (params) {
                    self.update(params.data);
                });
                container.on('open', function () {
                    // When the dropdown is open, aria-expanded="true"
                    self.$selection.attr('aria-expanded', 'true');
                    self.$selection.attr('aria-owns', resultsId);
                });
                container.on('close', function () {
                    // When the dropdown is closed, aria-expanded="false"
                    self.$selection.attr('aria-expanded', 'false');
                    self.$selection.removeAttr('aria-activedescendant');
                    self.$selection.removeAttr('aria-owns');
                });
                container.on('enable', function () {
                    self.$selection.attr('tabindex', self._tabindex);
                });
            };
            BaseSelection.prototype.position = function ($selection, $container) {
                var $selectionContainer = $container.find('.selection');
                $selectionContainer.append($selection);
            };
            return BaseSelection;
        });
        S2.define('select2/selection/multiple', [
            'jquery',
            './base',
            '../utils'
        ], function ($, BaseSelection, Utils) {
            function MultipleSelection($element, options) {
                MultipleSelection.__super__.constructor.apply(this, arguments);
            }
            Utils.Extend(MultipleSelection, BaseSelection);
            MultipleSelection.prototype.render = function () {
                var $selection = MultipleSelection.__super__.render.call(this);
                $selection.addClass('select2-selection--multiple');
                $selection.html(
                    '<ul class="select2-selection__rendered"></ul>'
                );
                return $selection;
            };
            MultipleSelection.prototype.bind = function (container, $container) {
                var self = this;
                MultipleSelection.__super__.bind.apply(this, arguments);
                this.$selection.on('click', function (evt) {
                    self.trigger('toggle', {});
                });
                this.$selection.on(
                    'click',
                    '.select2-selection__choice__remove',
                    function (evt) {
                        // Ignore the event if it is disabled
                        if (self.options.get('disabled')) {
                            return;
                        }
                        var $remove = $(this);
                        var $selection = $remove.parent();
                        var data = Utils.GetData($selection[0], 'data');
                        self.trigger('unselect', {
                            data: data
                        });
                    }
                );
            };
            MultipleSelection.prototype.clear = function () {
                var $rendered = this.$selection.find('.select2-selection__rendered');
                $rendered.empty();
                $rendered.removeAttr('title');
            };
            MultipleSelection.prototype.display = function (data, container) {
                var template = this.options.get('templateSelection');
                var escapeMarkup = this.options.get('escapeMarkup');
                return escapeMarkup(template(data, container));
            };
            MultipleSelection.prototype.selectionContainer = function () {
                var $container = $(
                    '<li class="select2-selection__choice">' +
                    '<span class="select2-selection__choice__remove" role="presentation">' +
                    '&times;' +
                    '</span>' +
                    '</li>'
                );
                return $container;
            };
            MultipleSelection.prototype.update = function (data) {
                this.clear();
                var $selections = [];
                for (var d = 0; d < data.length; d++) {
                    var selection = data[d];
                    var $selection = this.selectionContainer();
                    var formatted = this.display(selection, $selection);
                    $selection.append(formatted);
                    $selection.attr('title', selection.title || selection.text);
                    Utils.StoreData($selection[0], 'data', selection);
                    $selections.push($selection);
                }
                var $rendered = this.$selection.find('.select2-selection__rendered');
                Utils.appendMany($rendered, $selections);
            };
            return MultipleSelection;
        });
        S2.define('select2/selection/search', [
            'jquery',
            '../utils',
            '../keys'
        ], function ($, Utils, KEYS) {
            function Search(decorated, $element, options) {
                decorated.call(this, $element, options);
            }
            Search.prototype.render = function (decorated) {
                var $search = $(
                    '<li class="select2-search select2-search--inline">' +
                    '<input class="select2-search__field" type="search" tabindex="-1"' +
                    ' autocomplete="off" autocorrect="off" autocapitalize="none"' +
                    ' spellcheck="false" role="textbox" aria-autocomplete="list" />' +
                    '</li>'
                );
                this.$searchContainer = $search;
                this.$search = $search.find('input');
                var $rendered = decorated.call(this);
                return $rendered;
            };
            Search.prototype.bind = function (decorated, container, $container) {
                var self = this;
                decorated.call(this, container, $container);
                container.on('open', function () {
                    self.$search.trigger('focus');
                });
                container.on('enable', function () {
                    self._transferTabIndex();
                });
                this.$selection.on('focusin', '.select2-search--inline', function (evt) {
                    self.trigger('focus', evt);
                });
            };
            /**
             */
            Search.prototype._transferTabIndex = function (decorated) {
                this.$search.attr('tabindex', this.$selection.attr('tabindex'));
                this.$selection.attr('tabindex', '-1');
            };
            Search.prototype.update = function (decorated, data) {
                this.$search.attr('placeholder', '');
                decorated.call(this, data);
                this.$selection.find('.select2-selection__rendered')
                    .append(this.$searchContainer);
                this.resizeSearch();
            };
            Search.prototype.resizeSearch = function () {
                if (this.$search.attr('placeholder') !== '') {
                } else {
                    var minimumWidth = this.$search.val().length + 1;
                    width = (minimumWidth * 0.75) + 'em';
                }
                this.$search.css('width', width);
            };
            return Search;
        });
        S2.define('select2/data/base', [
            '../utils'
        ], function (Utils) {
            function BaseAdapter($element, options) {
            }
            BaseAdapter.prototype.generateResultId = function (container, data) {
                var id = container.id + '-result-';
                if (data.id != null) {
                    id += '-' + data.id.toString();
                } else {
                }
                return id;
            };
            return BaseAdapter;
        });
        S2.define('select2/data/select', [
            './base',
            '../utils',
            'jquery'
        ], function (BaseAdapter, Utils, $) {
            function SelectAdapter($element, options) {
                this.$element = $element;
                this.options = options;
            }
            Utils.Extend(SelectAdapter, BaseAdapter);
            SelectAdapter.prototype.current = function (callback) {
                var data = [];
                var self = this;
                this.$element.find(':selected').each(function () {
                    var $option = $(this);
                    var option = self.item($option);
                    data.push(option);
                });
                callback(data);
            };
            SelectAdapter.prototype.select = function (data) {
                if ($(data.element).is('option')) {
                    data.element.selected = true;
                    this.$element.trigger('change');
                }
            };
            SelectAdapter.prototype.unselect = function (data) {
                if ($(data.element).is('option')) {
                    data.element.selected = false;
                    this.$element.trigger('change');
                }
            };
            SelectAdapter.prototype.bind = function (container, $container) {
                var self = this;
                this.container = container;
                container.on('select', function (params) {
                    self.select(params.data);
                });
                container.on('unselect', function (params) {
                    self.unselect(params.data);
                });
            };
            SelectAdapter.prototype.query = function (params, callback) {
                var data = [];
                var self = this;
                var $options = this.$element.children();
                $options.each(function () {
                    var $option = $(this);
                    var option = self.item($option);
                    var matches = self.matches(params, option);
                    if (matches !== null) {
                        data.push(matches);
                    }
                });
                callback({
                    results: data
                });
            };
            SelectAdapter.prototype.item = function ($option) {
                var data = {};
                data = Utils.GetData($option[0], 'data');
                if ($option.is('option')) {
                    data = {
                        id: $option.val(),
                        text: $option.text(),
                    };
                } else if ($option.is('optgroup')) {
                    data = {
                        text: $option.prop('label'),
                    };
                    var $children = $option.children('option');
                    var children = [];
                    for (var c = 0; c < $children.length; c++) {
                        var $child = $($children[c]);
                        var child = this.item($child);
                        children.push(child);
                    }
                    data.children = children;
                }
                data = this._normalizeItem(data);
                data.element = $option[0];
                return data;
            };
            SelectAdapter.prototype._normalizeItem = function (item) {
                var defaults = {};
                if (item._resultId == null && item.id && this.container != null) {
                    item._resultId = this.generateResultId(this.container, item);
                }
                return $.extend({}, defaults, item);
            };
            SelectAdapter.prototype.matches = function (params, data) {
                var matcher = this.options.get('matcher');
                return matcher(params, data);
            };
            return SelectAdapter;
        });
        S2.define('select2/dropdown', [
            'jquery',
            './utils'
        ], function ($, Utils) {
            function Dropdown($element, options) {
                this.options = options;
            }
            Utils.Extend(Dropdown, Utils.Observable);
            Dropdown.prototype.render = function () {
                var $dropdown = $(
                    '<span class="select2-dropdown">' +
                    '<span class="select2-results"></span>' +
                    '</span>'
                );
                $dropdown.attr('dir', this.options.get('dir'));
                this.$dropdown = $dropdown;
                return $dropdown;
            };
            return Dropdown;
        });
        S2.define('select2/dropdown/search', [
            'jquery',
            '../utils'
        ], function ($, Utils) {
            function Search() {
            }
            return Search;
        });
        S2.define('select2/dropdown/attachBody', [
            'jquery',
            '../utils'
        ], function ($, Utils) {
            function AttachBody(decorated, $element, options) {
                this.$dropdownParent = options.get('dropdownParent') || $(document.body);
                decorated.call(this, $element, options);
            }
            AttachBody.prototype.bind = function (decorated, container, $container) {
                var self = this;
                var setupResultsEvents = false;
                decorated.call(this, container, $container);
                container.on('open', function () {
                    self._showDropdown();
                    self._attachPositioningHandler(container);
                    if (!setupResultsEvents) {
                        container.on('results:all', function () {
                            self._resizeDropdown();
                        });
                    }
                });
                container.on('close', function () {
                    self._hideDropdown();
                });
            };
            AttachBody.prototype.position = function (decorated, $dropdown, $container) {
                // Clone all of the container classes
                $dropdown.attr('class', $container.attr('class'));
                $dropdown.removeClass('select2');
                $dropdown.addClass('select2-container--open');
                $dropdown.css({
                    position: 'absolute',
                    top: -999999
                });
                this.$container = $container;
            };
            AttachBody.prototype.render = function (decorated) {
                var $container = $('<span></span>');
                var $dropdown = decorated.call(this);
                $container.append($dropdown);
                this.$dropdownContainer = $container;
                return $container;
            };
            AttachBody.prototype._hideDropdown = function (decorated) {
                this.$dropdownContainer.detach();
            };
            AttachBody.prototype._attachPositioningHandler =
                function (decorated, container) {
                    var $watchers = this.$container.parents().filter(Utils.hasScroll);
                    $watchers.each(function () {
                        Utils.StoreData(this, 'select2-scroll-position', {});
                    });
                };
            AttachBody.prototype._positionDropdown = function () {
                var isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
                var isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');
                var offset = this.$container.offset();
                var container = {
                    height: this.$container.outerHeight(false)
                };
                container.bottom = offset.top + container.height;
                var css = {
                    left: offset.left,
                    top: container.bottom
                };
                if (!isCurrentlyAbove && !isCurrentlyBelow) {
                    newDirection = 'below';
                }
                if (newDirection != null) {
                    this.$dropdown
                        .removeClass('select2-dropdown--below select2-dropdown--above')
                        .addClass('select2-dropdown--' + newDirection);
                    this.$container
                        .removeClass('select2-container--below select2-container--above')
                        .addClass('select2-container--' + newDirection);
                }
                this.$dropdownContainer.css(css);
            };
            AttachBody.prototype._resizeDropdown = function () {
                var css = {
                    width: this.$container.outerWidth(false) + 'px'
                };
                this.$dropdown.css(css);
            };
            AttachBody.prototype._showDropdown = function (decorated) {
                this.$dropdownContainer.appendTo(this.$dropdownParent);
                this._positionDropdown();
            };
            return AttachBody;
        });
        S2.define('select2/dropdown/closeOnSelect', [], function () {
            function CloseOnSelect() {
            }
            CloseOnSelect.prototype.bind = function (decorated, container, $container) {
                var self = this;
                container.on('select', function (evt) {
                    self._selectTriggered(evt);
                });
                container.on('unselect', function (evt) {
                    self._selectTriggered(evt);
                });
            };
            CloseOnSelect.prototype._selectTriggered = function (_, evt) {
                this.trigger('close', {});
            };
            return CloseOnSelect;
        });
        S2.define('select2/defaults', [
            'jquery',
            'require',
            './results',
            './selection/single',
            './selection/multiple',
            './selection/placeholder',
            './selection/allowClear',
            './selection/search',
            './selection/eventRelay',
            './utils',
            './translation',
            './diacritics',
            './data/select',
            './data/array',
            './data/ajax',
            './data/tags',
            './data/tokenizer',
            './data/minimumInputLength',
            './data/maximumInputLength',
            './data/maximumSelectionLength',
            './dropdown',
            './dropdown/search',
            './dropdown/hidePlaceholder',
            './dropdown/infiniteScroll',
            './dropdown/attachBody',
            './dropdown/minimumResultsForSearch',
            './dropdown/selectOnClose',
            './dropdown/closeOnSelect',
            './i18n/en'
        ], function ($, require,
                     ResultsList,
                     SingleSelection, MultipleSelection, Placeholder, AllowClear,
                     SelectionSearch, EventRelay,
                     Utils, Translation, DIACRITICS,
                     SelectData, ArrayData, AjaxData, Tags, Tokenizer,
                     MinimumInputLength, MaximumInputLength, MaximumSelectionLength,
                     Dropdown, DropdownSearch, HidePlaceholder, InfiniteScroll,
                     AttachBody, MinimumResultsForSearch, SelectOnClose, CloseOnSelect,
                     EnglishTranslation) {
            function Defaults() {
                this.reset();
            }
            Defaults.prototype.apply = function (options) {
                options = $.extend(true, {}, this.defaults, options);
                if (options.dataAdapter == null) {
                    if (options.ajax != null) {
                    } else if (options.data != null) {
                    } else {
                        options.dataAdapter = SelectData;
                    }
                }
                if (options.resultsAdapter == null) {
                    options.resultsAdapter = ResultsList;
                }
                if (options.dropdownAdapter == null) {
                    if (options.multiple) {
                        options.dropdownAdapter = Dropdown;
                    } else {
                        var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);
                        options.dropdownAdapter = SearchableDropdown;
                    }
                    if (options.closeOnSelect) {
                        options.dropdownAdapter = Utils.Decorate(
                            options.dropdownAdapter,
                            CloseOnSelect
                        );
                    }
                    options.dropdownAdapter = Utils.Decorate(
                        options.dropdownAdapter,
                        AttachBody
                    );
                }
                if (options.selectionAdapter == null) {
                    if (options.multiple) {
                        options.selectionAdapter = MultipleSelection;
                    } else {
                    }
                    if (options.multiple) {
                        options.selectionAdapter = Utils.Decorate(
                            options.selectionAdapter,
                            SelectionSearch
                        );
                    }
                }
                return options;
            };
            Defaults.prototype.reset = function () {
                function matcher(params, data) {
                    // Always return the object if there is nothing to compare
                    if ($.trim(params.term) === '') {
                        return data;
                    }
                }
                this.defaults = {
                    closeOnSelect: true,
                    escapeMarkup: Utils.escapeMarkup,
                    matcher: matcher,
                    templateResult: function (result) {
                        return result.text;
                    },
                    templateSelection: function (selection) {
                        return selection.text;
                    },
                    theme: 'default',
                    width: 'resolve'
                };
            };
            var defaults = new Defaults();
            return defaults;
        });
        S2.define('select2/options', [
            'require',
            'jquery',
            './defaults',
            './utils'
        ], function (require, $, Defaults, Utils) {
            function Options(options, $element) {
                this.options = options;
                if ($element != null) {
                    this.fromElement($element);
                }
                this.options = Defaults.apply(this.options);
            }
            Options.prototype.fromElement = function ($e) {
                if (this.options.multiple == null) {
                    this.options.multiple = $e.prop('multiple');
                }
                if (this.options.dir == null) {
                    if ($e.prop('dir')) {
                    } else if ($e.closest('[dir]').prop('dir')) {
                    } else {
                        this.options.dir = 'ltr';
                    }
                }
                $e.prop('multiple', this.options.multiple);
            };
            Options.prototype.get = function (key) {
                return this.options[key];
            };
            return Options;
        });
        S2.define('select2/core', [
            'jquery',
            './options',
            './utils',
            './keys'
        ], function ($, Options, Utils, KEYS) {
            var Select2 = function ($element, options) {
                this.$element = $element;
                this.options = new Options(options, $element);
                var tabindex = $element.attr('tabindex') || 0;
                Utils.StoreData($element[0], 'old-tabindex', tabindex);
                $element.attr('tabindex', '-1');
                var DataAdapter = this.options.get('dataAdapter');
                this.dataAdapter = new DataAdapter($element, this.options);
                var $container = this.render();
                this._placeContainer($container);
                var SelectionAdapter = this.options.get('selectionAdapter');
                this.selection = new SelectionAdapter($element, this.options);
                this.$selection = this.selection.render();
                this.selection.position(this.$selection, $container);
                var DropdownAdapter = this.options.get('dropdownAdapter');
                this.dropdown = new DropdownAdapter($element, this.options);
                this.$dropdown = this.dropdown.render();
                this.dropdown.position(this.$dropdown, $container);
                var ResultsAdapter = this.options.get('resultsAdapter');
                this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
                this.$results = this.results.render();
                this.results.position(this.$results, this.$dropdown);
                var self = this;
                this._bindAdapters();
                this._registerDomEvents();
                this._registerSelectionEvents();
                this._registerDropdownEvents();
                this._registerResultsEvents();
                this._registerEvents();
                this.dataAdapter.current(function (initialData) {
                    self.trigger('selection:update', {
                        data: initialData
                    });
                });
                $element.addClass('select2-hidden-accessible');
                $element.attr('aria-hidden', 'true');
            };
            Utils.Extend(Select2, Utils.Observable);
            Select2.prototype._placeContainer = function ($container) {
                $container.insertAfter(this.$element);
                var width = this._resolveWidth(this.$element, this.options.get('width'));
                if (width != null) {
                    $container.css('width', width);
                }
            };
            Select2.prototype._resolveWidth = function ($element, method) {
                if (method == 'resolve') {
                    return this._resolveWidth($element, 'element');
                }
                if (method == 'element') {
                    var elementWidth = $element.outerWidth(false);
                    return elementWidth + 'px';
                }
            };
            Select2.prototype._bindAdapters = function () {
                this.dataAdapter.bind(this, this.$container);
                this.selection.bind(this, this.$container);
                this.dropdown.bind(this, this.$container);
                this.results.bind(this, this.$container);
            };
            Select2.prototype._registerDomEvents = function () {
                var self = this;
                this.$element.on('change.select2', function () {
                    self.dataAdapter.current(function (data) {
                        self.trigger('selection:update', {
                            data: data
                        });
                    });
                });
                this._syncA = Utils.bind(this._syncAttributes, this);
                var observer = window.MutationObserver ||
                    window.WebKitMutationObserver ||
                    window.MozMutationObserver
                ;
                if (observer != null) {
                    this._observer = new observer(function (mutations) {
                        $.each(mutations, self._syncA);
                    });
                    this._observer.observe(this.$element[0], {
                        attributes: true,
                    });
                } else if (this.$element[0].addEventListener) {
                }
            };
            Select2.prototype._registerSelectionEvents = function () {
                var self = this;
                this.selection.on('toggle', function () {
                    self.toggleDropdown();
                });
                this.selection.on('focus', function (params) {
                    self.focus(params);
                });
                this.selection.on('*', function (name, params) {
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerDropdownEvents = function () {
                var self = this;
                this.dropdown.on('*', function (name, params) {
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerResultsEvents = function () {
                var self = this;
                this.results.on('*', function (name, params) {
                    self.trigger(name, params);
                });
            };
            Select2.prototype._registerEvents = function () {
                var self = this;
                this.on('open', function () {
                    self.$container.addClass('select2-container--open');
                });
                this.on('close', function () {
                    self.$container.removeClass('select2-container--open');
                });
                this.on('query', function (params) {
                    if (!self.isOpen()) {
                        self.trigger('open', {});
                    }
                    this.dataAdapter.query(params, function (data) {
                        self.trigger('results:all', {
                            data: data,
                        });
                    });
                });
            };
            Select2.prototype._syncAttributes = function () {
                if (this.options.get('disabled')) {
                } else {
                    this.trigger('enable', {});
                }
            };
            /**
             */
            Select2.prototype.toggleDropdown = function () {
                if (this.isOpen()) {
                    this.close();
                } else {
                    this.open();
                }
            };
            Select2.prototype.open = function () {
                this.trigger('query', {});
            };
            Select2.prototype.close = function () {
                this.trigger('close', {});
            };
            Select2.prototype.isOpen = function () {
                return this.$container.hasClass('select2-container--open');
            };
            Select2.prototype.focus = function (data) {
                // No need to re-trigger focus events if we are already focused
                this.$container.addClass('select2-container--focus');
            };
            Select2.prototype.render = function () {
                var $container = $(
                    '<span class="select2 select2-container">' +
                    '<span class="selection"></span>' +
                    '<span class="dropdown-wrapper" aria-hidden="true"></span>' +
                    '</span>'
                );
                $container.attr('dir', this.options.get('dir'));
                this.$container = $container;
                this.$container.addClass('select2-container--' + this.options.get('theme'));
                Utils.StoreData($container[0], 'element', this.$element);
                return $container;
            };
            return Select2;
        });
        /*!
        */
        S2.define('jquery.select2', [
            'jquery',
            'jquery-mousewheel',
            './select2/core',
            './select2/defaults',
            './select2/utils'
        ], function ($, _, Select2, Defaults, Utils) {
            if ($.fn.select2 == null) {
                // All methods that should return the element
                $.fn.select2 = function (options) {
                    options = options || {};
                    if (typeof options === 'object') {
                        this.each(function () {
                            var instanceOptions = $.extend(true, {}, options);
                            var instance = new Select2($(this), instanceOptions);
                        });
                    } else if (typeof options === 'string') {
                    } else {
                    }
                };
            }
        });
        return {
            define: S2.define,
            require: S2.require
        };
    }());
    var select2 = S2.require('jquery.select2');
    jQuery.fn.select2.amd = S2;
}));