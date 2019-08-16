(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}(function ($, undefined) {
	function UTCDate() {
		return new Date(Date.UTC.apply(Date, arguments));
	}
	function UTCToday() {
		var today = new Date();
		return UTCDate(today.getFullYear(), today.getMonth(), today.getDate());
	}
	var DateArray = (function () {
		return function () {
			var a = [];
			return a;
		};
	})();
	var Datepicker = function (element, options) {
		$.data(element, 'datepicker', this);
		this._process_options(options);
		this.dates = new DateArray();
		this.viewDate = this.o.defaultViewDate;
		this.element = $(element);
		this.isInput = this.element.is('input');
		this.picker = $(DPGlobal.template);
		this._buildEvents();
		this._attachEvents();
	};
	Datepicker.prototype = {
		constructor: Datepicker,
		_resolveDaysOfWeek: function (daysOfWeek) {
			if (!$.isArray(daysOfWeek))
				daysOfWeek = daysOfWeek.split(/[,\s]*/);
			return $.map(daysOfWeek, Number);
		},
		_process_options: function (opts) {
			this._o = $.extend({}, this._o, opts);
			var o = this.o = $.extend({}, this._o);
			o.daysOfWeekHighlighted = this._resolveDaysOfWeek(o.daysOfWeekHighlighted || []);
			o.defaultViewDate = UTCToday();
		},
		_applyEvents: function (evs) {
			for (var i = 0, el, ch, ev; i < evs.length; i++) {
				el = evs[i][0];
				if (evs[i].length === 2) {
					ch = undefined;
					ev = evs[i][1];
				} else if (evs[i].length === 3) {
					ch = evs[i][1];
					ev = evs[i][2];
				}
				el.on(ev, ch);
			}
		},
		_buildEvents: function () {
			var events = {
				keyup: $.proxy(function (e) {
					if ($.inArray(e.keyCode, [27, 37, 39, 38, 40, 32, 13, 9]) === -1)
						this.update();
				}, this)
			};
			if (this.o.showOnFocus === true) {
				events.focus = $.proxy(this.show, this);
			}
			if (this.isInput) {
				this._events = [
					[this.element, events]
				];
			}
		},
		_attachEvents: function () {
			this._applyEvents(this._events);
		},
		show: function () {
			if (!this.isInline)
				this.picker.appendTo(this.o.container);
			this.picker.show();
			if ((window.navigator.msMaxTouchPoints || 'ontouchstart' in document) && this.o.disableTouchKeyboard) {
				$(this.element).blur();
			}
			return this;
		},
		update: function () {
			this.fill();
		},
		getClassNames: function (date) {
			var cls = [];
			if ($.inArray(date.getUTCDay(), this.o.daysOfWeekHighlighted) !== -1) {
				cls.push('highlighted');
			}
			return cls;
		},
		fill: function () {
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				tooltip,
				before;
			if (isNaN(year) || isNaN(month))
				return;
			this.picker.find('thead .datepicker-title')
				.text(this.o.title)
				.css('display', typeof this.o.title === 'string' && this.o.title !== '' ? 'table-cell' : 'none');
			var prevMonth = UTCDate(year, month, 0),
				day = prevMonth.getUTCDate();
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
			var nextMonth = new Date(prevMonth);
			if (prevMonth.getUTCFullYear() < 100) {
				nextMonth.setUTCFullYear(prevMonth.getUTCFullYear());
			}
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var weekDay, clsName;
			while (prevMonth.valueOf() < nextMonth) {
				weekDay = prevMonth.getUTCDay();
				if (weekDay === this.o.weekStart) {
					html.push('<tr>');
				}
				clsName = this.getClassNames(prevMonth);
				clsName.push('day');
				var content = prevMonth.getUTCDate();
				html.push('<td class="' + clsName.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + ' data-date="' + prevMonth.getTime().toString() + '">' + content + '</td>');
				tooltip = null;
				if (weekDay === this.o.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
			}
			this.picker.find('.datepicker-days tbody').html(html.join(''));
			var months = this.picker.find('.datepicker-months')
				.find('.datepicker-switch')
				.text(this.o.maxViewMode < 2 ? monthsTitle : year)
				.end()
				.find('tbody span').removeClass('active');
			$.each(this.dates, function (i, d) {
				if (d.getUTCFullYear() === year)
					months.eq(d.getUTCMonth()).addClass('active');
			});
		},
		setViewMode: function (viewMode) {
			this.viewMode = viewMode;
			this.picker
				.children('div')
				.filter('.datepicker-' + DPGlobal.viewModes[this.viewMode].clsName)
				.show();
		}
	};
	function opts_from_el(el, prefix) {
		var data = $(el).data(),
			out = {}, inkey,
			replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])');
		prefix = new RegExp('^' + prefix.toLowerCase());
		function re_lower(_, a) {
			return a.toLowerCase();
		}
		for (var key in data)
			if (prefix.test(key)) {
				inkey = key.replace(replace, re_lower);
				out[inkey] = data[key];
			}
		return out;
	}
	function opts_from_locale(lang) {
		var out = {};
		if (!dates[lang]) {
			lang = lang.split('-')[0];
			if (!dates[lang])
				return;
		}
		var d = dates[lang];
		$.each(locale_opts, function (i, k) {
			if (k in d)
				out[k] = d[k];
		});
		return out;
	}
	var datepickerPlugin = function (option) {
		var args = Array.apply(null, arguments);
		args.shift();
		var internal_return;
		this.each(function () {
			var $this = $(this),
				data = $this.data('datepicker'),
				options = typeof option === 'object' && option;
			if (!data) {
				var elopts = opts_from_el(this, 'date'),
					xopts = $.extend({}, defaults, elopts, options),
					locopts = opts_from_locale(xopts.language),
					opts = $.extend({}, defaults, locopts, elopts, options);
				if ($this.hasClass('input-daterange') || opts.inputs) {
					$.extend(opts, {
						inputs: opts.inputs || $this.find('input').toArray()
					});
					data = new DateRangePicker(this, opts);
				}
				else {
					data = new Datepicker(this, opts);
				}
				$this.data('datepicker', data);
			}
			if (typeof option === 'string' && typeof data[option] === 'function') {
				internal_return = data[option].apply(data, args);
			}
		});
		if (
			internal_return === undefined ||
			internal_return instanceof Datepicker ||
			internal_return instanceof DateRangePicker
		)
			return this;
		if (this.length > 1)
			throw new Error('Using only allowed for the collection of a single element (' + option + ' function)');
		else
			return internal_return;
	};
	$.fn.datepicker = datepickerPlugin;
	var defaults = $.fn.datepicker.defaults = {
		assumeNearbyYear: false,
		autoclose: false,
		beforeShowDay: $.noop,
		beforeShowMonth: $.noop,
		beforeShowYear: $.noop,
		beforeShowDecade: $.noop,
		beforeShowCentury: $.noop,
		calendarWeeks: false,
		clearBtn: false,
		toggleActive: false,
		daysOfWeekDisabled: [],
		daysOfWeekHighlighted: [],
		datesDisabled: [],
		endDate: Infinity,
		forceParse: true,
		format: 'mm/dd/yyyy',
		keepEmptyValues: false,
		keyboardNavigation: true,
		language: 'en',
		minViewMode: 0,
		maxViewMode: 4,
		multidate: false,
		multidateSeparator: ',',
		orientation: "auto",
		rtl: false,
		startDate: -Infinity,
		startView: 0,
		todayBtn: false,
		todayHighlight: false,
		updateViewDate: true,
		weekStart: 0,
		disableTouchKeyboard: false,
		enableOnReadonly: true,
		showOnFocus: true,
		zIndexOffset: 10,
		container: 'body',
		immediateUpdates: false,
		title: '',
		templates: {
			leftArrow: '&#x00AB;',
			rightArrow: '&#x00BB;'
		},
		showWeekDays: true
	};
	var locale_opts = $.fn.datepicker.locale_opts = [
		'format',
		'rtl',
		'weekStart'
	];
	$.fn.datepicker.Constructor = Datepicker;
	var dates = $.fn.datepicker.dates = {
	};
	var DPGlobal = {
		viewModes: [
			{
				names: ['days', 'month'],
				clsName: 'days',
				e: 'changeMonth'
			}
		]
	};
	DPGlobal.template = '<div class="datepicker">' +
		'<div class="datepicker-days">' +
		'<table class="table-condensed">' +
		'<tbody></tbody>' +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'</div>';
	$(document).on(
		'focus.datepicker.data-api click.datepicker.data-api',
		'[data-provide="datepicker"]',
		function (e) {
			var $this = $(this);
			if ($this.data('datepicker'))
				return;
			e.preventDefault();
			datepickerPlugin.call($this, 'show');
		}
	);
	$(function () {
		datepickerPlugin.call($('[data-provide="datepicker-inline"]'));
	});
}));
