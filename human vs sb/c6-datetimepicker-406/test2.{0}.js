(function (factory) {
    if (typeof define === 'function' && define.amd)
        define(['jquery'], factory);
    else if (typeof exports === 'object')
        factory(require('jquery'));
    else
        factory(jQuery);
}(function ($, undefined) {
    function UTCDate() {
        return new Date(Date.UTC.apply(Date, arguments));
    }
    var Datetimepicker = function (element, options) {
        var that = this;
        this.element = $(element);
        this.container = options.container || 'body';
        this.language = options.language || this.element.data('date-language') || 'en';
        this.formatType = options.formatType || this.element.data('format-type') || 'standard';
        this.format = DPGlobal.parseFormat(options.format || this.element.data('date-format') || dates[this.language].format || DPGlobal.getDefaultFormat(this.formatType, 'input'), this.formatType);
        this.bootcssVer = options.bootcssVer || (this.isInput ? (this.element.is('.form-control') ? 3 : 2) : (this.bootcssVer = this.element.is('.input-group') ? 3 : 2));
        this.component = this.element.is('.date') ? (this.bootcssVer === 3 ? this.element.find('.input-group-addon .glyphicon-th, .input-group-addon .glyphicon-time, .input-group-addon .glyphicon-remove, .input-group-addon .glyphicon-calendar, .input-group-addon .fa-calendar, .input-group-addon .fa-clock-o').parent() : this.element.find('.add-on .icon-th, .add-on .icon-time, .add-on .icon-calendar, .add-on .fa-calendar, .add-on .fa-clock-o').parent()) : false;
        this.hasInput = this.component && this.element.find('input').length;
        this.pickerPosition = options.pickerPosition || this.element.data('picker-position') || 'bottom-right';
        this.title = typeof options.title === 'undefined' ? false : options.title;
        this.icons = {
            leftArrow: this.fontAwesome ? 'fa-arrow-left' : (this.bootcssVer === 3 ? 'glyphicon-arrow-left' : 'icon-arrow-left'),
            rightArrow: this.fontAwesome ? 'fa-arrow-right' : (this.bootcssVer === 3 ? 'glyphicon-arrow-right' : 'icon-arrow-right')
        }
        this.icontype = this.fontAwesome ? 'fa' : 'glyphicon';
        this._attachEvents();
        this.clickedOutside = function (e) {
            if ($(e.target).closest('.datetimepicker').length === 0) {
                that.hide();
            }
        }
        this.minView = 0;
        if ('minView' in options) {
            this.minView = options.minView;
        } else if ('minView' in this.element.data()) {
        }
        this.maxView = DPGlobal.modes.length - 1;
        if ('startView' in options) {
            this.startViewMode = options.startView;
        } else if ('startView' in this.element.data()) {
        }
        this.viewMode = this.startViewMode;
        this.viewSelect = this.minView;
        var template = this.bootcssVer === 3 ? DPGlobal.templateV3 : DPGlobal.template;
        while (template.indexOf('{iconType}') !== -1) {
            template = template.replace('{iconType}', this.icontype);
        }
        while (template.indexOf('{leftArrow}') !== -1) {
            template = template.replace('{leftArrow}', this.icons.leftArrow);
        }
        while (template.indexOf('{rightArrow}') !== -1) {
            template = template.replace('{rightArrow}', this.icons.rightArrow);
        }
        this.picker = $(template)
            .appendTo(this.isInline ? this.element : this.container)
            .on({
                click: $.proxy(this.click, this),
            });
        if (this.isInline) {
        } else {
            this.picker.addClass('datetimepicker-dropdown-' + this.pickerPosition + ' dropdown-menu');
        }
        $(document).on('mousedown touchend', this.clickedOutside);
        if ('autoclose' in options) {
            this.autoclose = options.autoclose;
        } else if ('dateAutoclose' in this.element.data()) {
        }
        if (typeof options.weekStart !== 'undefined') {
            this.weekStart = options.weekStart;
        } else if (typeof this.element.data('date-weekstart') !== 'undefined') {
        } else if (typeof dates[this.language].weekStart !== 'undefined') {
        }
        this.onRenderDay = function (date) {
            var render = (options.onRenderDay || function () {
                return [];
            })(date);
            var res = ['day'];
            return res.concat((render ? render : []));
        };
        this.onRenderYear = function (date) {
            var render = (options.onRenderYear || function () {
                return [];
            })(date);
            var res = ['year'];
            if (this.date.getUTCFullYear() === date.getUTCFullYear()) {
                res.push('active');
            }
            return res.concat((render ? render : []));
        }
        this.onRenderMonth = function (date) {
            var render = (options.onRenderMonth || function () {
                return [];
            })(date);
            var res = ['month'];
            return res.concat((render ? render : []));
        }
        this.startDate = new Date(-8639968443048000);
        this.endDate = new Date(8639968443048000);
        this.fillDow();
        this.update();
        this.showMode();
    };
    Datetimepicker.prototype = {
        _attachEvents: function () {
            if (this.isInput) {
            } else if (this.component && this.hasInput) {
                this._events = [
                    [this.element.find('input'), {
                        focus: $.proxy(this.show, this),
                        keyup: $.proxy(this.update, this),
                        keydown: $.proxy(this.keydown, this)
                    }],
                    [this.component, {
                        click: $.proxy(this.show, this)
                    }]
                ];
            } else if (this.element.is('div')) {
            } else {
            }
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.on(ev);
            }
        },
        show: function (e) {
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
            this.place();
            this.isVisible = true;
        },
        hide: function () {
            if (!this.isVisible) return;
            this.picker.hide();
            this.viewMode = this.startViewMode;
            this.showMode();
        },
        setValue: function () {
            var formatted = this.getFormattedDate();
            if (!this.isInput) {
                if (this.component) {
                    this.element.find('input').val(formatted);
                }
            } else {
            }
        },
        getFormattedDate: function (format) {
            format = format || this.format;
            return DPGlobal.formatDate(this.date, format, this.language, this.formatType, this.timezone);
        },
        setTitle: function (selector, value) {
            return this.picker.find(selector)
                .find('th:eq(1)')
                .text(this.title === false ? value : this.title);
        },
        place: function () {
            if (!this.zIndex) {
                var index_highest = 0;
                $('div').each(function () {
                    var index_current = parseInt($(this).css('zIndex'), 10);
                    if (index_current > index_highest) {
                        index_highest = index_current;
                    }
                });
                this.zIndex = index_highest + 10;
            }
            var offset, top, left, containerOffset;
            if (this.component) {
                offset = this.component.offset();
                left = offset.left;
            } else {
            }
            var bodyWidth = document.body.clientWidth || window.innerWidth;
            if (left + 220 > bodyWidth) {
                left = bodyWidth - 220;
            }
            if (this.pickerPosition === 'top-left' || this.pickerPosition === 'top-right') {
            } else {
                top = offset.top + this.height;
            }
            this.picker.css({
                top: top,
                left: left,
                zIndex: this.zIndex
            });
        },
        update: function () {
            if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
            } else {
                date = (this.isInput ? this.element.val() : this.element.find('input').val()) || this.element.data('date') || this.initialDate;
            }
            if (!date) {
                date = new Date();
            }
            this.date = DPGlobal.parseDate(date, this.format, this.language, this.formatType, this.timezone);
            if (this.date < this.startDate) {
            } else if (this.date > this.endDate) {
            } else {
                this.viewDate = new Date(this.date);
            }
            this.fill();
        },
        fillDow: function () {
            var dowCnt = this.weekStart,
                html = '<tr>';
            while (dowCnt < this.weekStart + 7) {
                html += '<th class="dow">' + dates[this.language].daysMin[(dowCnt++) % 7] + '</th>';
            }
            this.picker.find('.datetimepicker-days thead').append(html);
        },
        fillMonths: function () {
            var html = '';
            var d = new Date(this.viewDate);
            for (var i = 0; i < 12; i++) {
                var classes = this.onRenderMonth(d);
                html += '<span class="' + classes.join(' ') + '">' + dates[this.language].monthsShort[i] + '</span>';
            }
            this.picker.find('.datetimepicker-months td').html(html);
        },
        fill: function () {
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                dayMonth = d.getUTCDate(),
                hours = d.getUTCHours(),
                startYear = this.startDate.getUTCFullYear(),
                startMonth = this.startDate.getUTCMonth(),
                endYear = this.endDate.getUTCFullYear(),
                endMonth = this.endDate.getUTCMonth() + 1,
                currentDate = (new UTCDate(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())).valueOf(),
                today = new Date();
            this.setTitle('.datetimepicker-days', dates[this.language].months[month] + ' ' + year)
            this.picker.find('tfoot th.today')
                .text(dates[this.language].today || dates['en'].today)
                .toggle(this.todayBtn !== false);
            this.fillMonths();
            var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
                day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
            prevMonth.setUTCDate(day);
            prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);
            var nextMonth = new Date(prevMonth);
            nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
            var html = [];
            while (prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getUTCDay() === this.weekStart) {
                    html.push('<tr>');
                }
                classes = this.onRenderDay(prevMonth);
                if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() === year && prevMonth.getUTCMonth() < month)) {
                    classes.push('old');
                } else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() === year && prevMonth.getUTCMonth() > month)) {
                    classes.push('new');
                }
                if (prevMonth.valueOf() === currentDate) {
                    classes.push('active');
                }
                html.push('<td class="' + classes.join(' ') + '">' + prevMonth.getUTCDate() + '</td>');
                prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
            }
            this.picker.find('.datetimepicker-days tbody').empty().append(html.join(''));
            var currentYear = this.date.getUTCFullYear();
            var months = this.setTitle('.datetimepicker-months', year)
                .end()
                .find('.month').removeClass('active');
            if (currentYear === year) {
                months.eq(this.date.getUTCMonth()).addClass('active');
            }
            html = '';
            year = parseInt(year / 10, 10) * 10;
            var yearCont = this.setTitle('.datetimepicker-years', year + '-' + (year + 9))
                .end()
                .find('td');
            year -= 1;
            for (var i = -1; i < 11; i++) {
                d.setUTCFullYear(year);
                classes = this.onRenderYear(d);
                html += '<span class="' + classes.join(' ') + '">' + year + '</span>';
                year += 1;
            }
            yearCont.html(html);
            this.place();
        },
        updateNavArrows: function () {
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                day = d.getUTCDate(),
                hour = d.getUTCHours();
            switch (this.viewMode) {
                case 2:
                    if (year <= this.startDate.getUTCFullYear()
                        && month <= this.startDate.getUTCMonth()) {
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (year >= this.endDate.getUTCFullYear()
                        && month >= this.endDate.getUTCMonth()) {
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
            }
        },
        click: function (e) {
            var target = $(e.target).closest('span, td, th, legend');
            if (target.length === 1) {
                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        switch (target[0].className) {
                            case 'switch':
                                this.showMode(1);
                                break;
                            case 'prev':
                            case 'next':
                                var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className === 'prev' ? -1 : 1);
                                switch (this.viewMode) {
                                    case 2:
                                        this.viewDate = this.moveMonth(this.viewDate, dir);
                                        break;
                                    case 3:
                                    case 4:
                                        this.viewDate = this.moveYear(this.viewDate, dir);
                                }
                                this.fill();
                                break;
                            case 'today':
                                this._setDate(date);
                                this.fill();
                                if (this.autoclose) {
                                    this.hide();
                                }
                        }
                        break;
                    case 'span':
                        if (!target.is('.disabled')) {
                            if (target.is('.month')) {
                                month = target.parent().find('span').index(target);
                                this.viewDate.setUTCMonth(month);
                            } else if (target.is('.year')) {
                                year = parseInt(target.text(), 10) || 0;
                                this.viewDate.setUTCFullYear(year);
                            } else if (target.is('.hour')) {
                            } else if (target.is('.minute')) {
                            }
                            if (this.viewMode !== 0) {
                                this.showMode(-1);
                                this.fill();
                            } else {
                            }
                        }
                        break;
                    case 'td':
                        if (target.is('.day') && !target.is('.disabled')) {
                            var day = parseInt(target.text(), 10) || 1;
                            var year = this.viewDate.getUTCFullYear(),
                                month = this.viewDate.getUTCMonth(),
                                hours = this.viewDate.getUTCHours(),
                                minutes = this.viewDate.getUTCMinutes(),
                                seconds = this.viewDate.getUTCSeconds();
                            if (target.is('.old')) {
                                if (month === 0) {
                                    month = 11;
                                    year -= 1;
                                } else {
                                    month -= 1;
                                }
                            } else if (target.is('.new')) {
                                if (month === 11) {
                                    month = 0;
                                    year += 1;
                                } else {
                                    month += 1;
                                }
                            }
                            this.viewDate.setUTCMonth(month, day);
                            if (this.viewSelect >= 2) {
                                this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                            }
                        }
                        var oldViewMode = this.viewMode;
                        this.showMode(-1);
                        this.fill();
                        if (oldViewMode === this.viewMode && this.autoclose) {
                            this.hide();
                        }
                }
            }
        },
        _setDate: function (date, which) {
            if (!which || which === 'date')
                this.date = date;
            if (!which || which === 'view')
                this.viewDate = date;
            this.setValue();
        },
        moveMonth: function (date, dir) {
            var new_date = new Date(date.valueOf()),
                day = new_date.getUTCDate(),
                month = new_date.getUTCMonth(),
                mag = Math.abs(dir),
                new_month, test;
            dir = dir > 0 ? 1 : -1;
            if (mag === 1) {
                new_month = month + dir;
                new_date.setUTCMonth(new_month);
            } else {
                for (var i = 0; i < mag; i++)
                    new_date = this.moveMonth(new_date, dir);
            }
            return new_date;
        },
        moveYear: function (date, dir) {
            return this.moveMonth(date, dir * 12);
        },
        showMode: function (dir) {
            if (dir) {
                var newViewMode = Math.max(0, Math.min(DPGlobal.modes.length - 1, this.viewMode + dir));
                if (newViewMode >= this.minView && newViewMode <= this.maxView) {
                    this.viewMode = newViewMode;
                }
            }
            this.picker.find('>div').hide().filter('.datetimepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
            this.updateNavArrows();
        },
    };
    $.fn.datetimepicker = function (option) {
        this.each(function () {
            var $this = $(this),
                data = $this.data('datetimepicker'),
                options = typeof option === 'object' && option;
            if (!data) {
                $this.data('datetimepicker', (data = new Datetimepicker(this, $.extend({}, $.fn.datetimepicker.defaults, options))));
            }
        });
    };
    var dates = $.fn.datetimepicker.dates = {
        en: {
            daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            today: 'Today',
        }
    };
    var DPGlobal = {
        modes: [
            {
                clsName: 'minutes',
                navFnc: 'Hours',
                navStep: 1
            },
            {
                clsName: 'hours',
                navFnc: 'Date',
                navStep: 1
            },
            {
                clsName: 'days',
                navFnc: 'Month',
                navStep: 1
            },
            {
                clsName: 'months',
                navFnc: 'FullYear',
                navStep: 1
            },
            {
                clsName: 'years',
                navFnc: 'FullYear',
                navStep: 10
            }
        ],
        isLeapYear: function (year) {
        },
        getDaysInMonth: function (year, month) {
            return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
        },
        validParts: function (type) {
            if (type === 'standard') {
                return /t|hh?|HH?|p|P|z|Z|ii?|ss?|dd?|DD?|mm?|MM?|yy(?:yy)?/g;
            } else if (type === 'php') {
            } else {
            }
        },
        nonpunctuation: /[^ -\/:-@\[-`{-~\t\n\rTZ]+/g,
        parseFormat: function (format, type) {
            var separators = format.replace(this.validParts(type), '\0').split('\0'),
                parts = format.match(this.validParts(type));
            return {separators: separators, parts: parts};
        },
        parseDate: function (date, format, language, type, timezone) {
            if (date instanceof Date) {
                var dateUTC = new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
                return dateUTC;
            }
            if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd hh:ii:ss', type);
            }
            var parts = date && date.toString().match(this.nonpunctuation) || [],
                date = new Date(0, 0, 0, 0, 0, 0, 0),
                parsed = {},
                setters_order = ['hh', 'h', 'ii', 'i', 'ss', 's', 'yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'D', 'DD', 'd', 'dd', 'H', 'HH', 'p', 'P', 'z', 'Z'],
                setters_map = {
                    hh: function (d, v) {
                    },
                    ii: function (d, v) {
                    },
                    ss: function (d, v) {
                    },
                    yyyy: function (d, v) {
                        return d.setUTCFullYear(v);
                    },
                    m: function (d, v) {
                        v -= 1;
                        while (d.getUTCMonth() !== v)
                            if (isNaN(d.getUTCMonth()))
                                return d;
                            else
                                d.setUTCDate(d.getUTCDate() - 1);
                    },
                    d: function (d, v) {
                    },
                },
                val, filtered, part;
            setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
            setters_map['dd'] = setters_map['d'];
            if (parts.length === format.parts.length) {
                for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10);
                    part = format.parts[i];
                    parsed[part] = val;
                }
                for (var i = 0, s; i < setters_order.length; i++) {
                    s = setters_order[i];
                    if (s in parsed && !isNaN(parsed[s]))
                        setters_map[s](date, parsed[s])
                }
            }
            return date;
        },
        formatDate: function (date, format, language, type, timezone) {
            if (type === 'standard') {
                val = {
                    yyyy: date.getUTCFullYear(),
                    MM: dates[language].months[date.getUTCMonth()],
                    d: date.getUTCDate(),
                };
                val.dd = (val.d < 10 ? '0' : '') + val.d;
            } else if (type === 'php') {
            } else {
            }
            var date = [],
                seps = $.extend([], format.separators);
            for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                if (seps.length) {
                    date.push(seps.shift());
                }
                date.push(val[format.parts[i]]);
            }
            return date.join('');
        },
        headTemplateV3: '<thead>' +
            '<tr>' +
            '<th class="prev"><span class="{iconType} {leftArrow}"></span> </th>' +
            '<th colspan="5" class="switch"></th>' +
            '<th class="next"><span class="{iconType} {rightArrow}"></span> </th>' +
            '</tr>' +
            '</thead>',
        contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
        footTemplate: '<tfoot>' +
            '<tr><th colspan="7" class="today"></th></tr>' +
            '<tr><th colspan="7" class="clear"></th></tr>' +
            '</tfoot>'
    };
    DPGlobal.templateV3 = '<div class="datetimepicker">' +
        '<div class="datetimepicker-minutes">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-hours">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-days">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplateV3 +
        '<tbody></tbody>' +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-months">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-years">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '</div>';
}));