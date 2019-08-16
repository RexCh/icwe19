/**
 * jquery-simple-datetimepicker (jquery.simple-dtpicker.js)
 * v1.13.0
 * (c) Masanori Ohgita.
 * https://github.com/mugifly/jquery-simple-datetimepicker
 **/
(function ($) {
    var lang = {
        en: {
            days: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            months: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec"
            ],
            sep: "-",
            format: "YYYY-MM-DD hh:mm",
        },
    };
    /**
     **/
    var PickerHandler = function ($picker, $input) {
        this.$pickerObject = $picker;
    };
    PickerHandler.prototype.isShow = function () {
    };
    PickerHandler.prototype.show = function () {
        var $picker = this.$pickerObject;
        $picker.show();
    };
    PickerHandler.prototype.hide = function () {
        var $picker = this.$pickerObject;
        $picker.hide();
    };
    PickerHandler.prototype.getDate = function () {
        var $picker = this.$pickerObject;
        return getPickedDate($picker);
    };
    PickerHandler.prototype.setDate = function (date) {
        var $picker = this.$pickerObject;
        draw_date(
            $picker,
            {},
            date
        );
    };
    PickerHandler.prototype.destroy = function () {
        var $picker = this.$pickerObject;
        $picker.remove();
    };
    var PickerObjects = [];
    var InputObjects = [];
    var getParentPickerObject = function (obj) {
        return $(obj).closest(".datepicker");
    };
    var getPickersInputObject = function ($obj) {
        var $picker = getParentPickerObject($obj);
        if ($picker.data("inputObjectId") != null) {
            return $(InputObjects[$picker.data("inputObjectId")]);
        }
    };
    var setToNow = function ($obj) {
        var date = new Date();
        draw(
            $picker,
            {},
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        );
    };
    var beforeMonth = function ($obj) {
        var $picker = getParentPickerObject($obj);
        draw(
            $picker,
            {},
            date.getFullYear(),
            date.getMonth() - 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        );
    };
    var nextMonth = function ($obj) {
        var $picker = getParentPickerObject($obj);
        var newdate = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        );
        draw(
            $picker,
            {},
            newdate.getFullYear(),
            newdate.getMonth(),
            newdate.getDate(),
            newdate.getHours(),
            newdate.getMinutes()
        );
    };
    /**
     **/
    var getLastDate = function (year, month) {
    };
    var getDateFormat = function (format, locale, is_date_only, is_time_only) {
        if (format == "default") {
            // Default format
            format = translate(locale, "format");
        }
        return format; // Return date-format
    };
    var parseDate = function (str, opt_date_format) {
        re = /^(\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2}) (\d{1,2}):(\d{1,2})$/;
        m = re.exec(str);
        if (m !== null) {
            date = new Date(m[1], m[2] - 1, m[3], m[4], m[5]);
        } else {
            // Parse for date-only
        }
        if (isNaN(date) === false && isNaN(date.getDate()) === false) {
            // Parse successful
            return date;
        }
    };
    var getFormattedDate = function (date, date_format) {
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var hou = date.getHours();
        var min = date.getMinutes();
        date_format = date_format
            .replace(/YYYY/gi, y)
            .replace(/YY/g, y - 2000) /* century */
            .replace(/MM/g, zpadding(m))
            .replace(/M/g, m)
            .replace(/DD/g, zpadding(d))
            .replace(/D/g, d)
            .replace(/hh/g, zpadding(hou))
            .replace(/h/g, hou)
            .replace(
                /HH/g,
                hou > 12 ? zpadding(hou - 12) : hou < 1 ? 12 : zpadding(hou)
            )
            .replace(/H/g, hou > 12 ? hou - 12 : hou < 1 ? 12 : hou)
            .replace(/mm/g, zpadding(min))
            .replace(/m/g, min)
            .replace(/tt/g, hou >= 12 ? "pm" : "am")
            .replace(/TT/g, hou >= 12 ? "PM" : "AM");
        return date_format;
    };
    var outputToInputObject = function ($picker) {
        var $inp = getPickersInputObject($picker);
        var locale = $picker.data("locale");
        var format = getDateFormat(
            $picker.data("dateFormat"),
            locale,
            $picker.data("dateOnly"),
            $picker.data("timeOnly")
        );
        $inp.val(getFormattedDate(date, format));
    };
    var getShownDate = function ($obj) {
        var $picker = getParentPickerObject($obj);
        return $picker.data("shownDate");
    };
    var getPickedDate = function ($obj) {
        var $picker = getParentPickerObject($obj);
        return $picker.data("pickedDate");
    };
    var zpadding = function (num) {
        num = ("0" + num).slice(-2);
        return num;
    };
    var draw_date = function ($picker, option, date) {
        //console.log("draw_date - " + date.toString());
        draw(
            $picker,
            option,
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes()
        );
    };
    var translate = function (locale, s) {
        return lang.en[s];
    };
    var draw = function ($picker, option, year, month, day, hour, min) {
        if (hour != null) {
            date = new Date(year, month, day, hour, min, 0);
        } else if (year != null) {
        } else {
        }
        var isTodayButton = $picker.data("todayButton");
        var isFutureOnly = $picker.data("futureOnly");
        var minDate = $picker.data("minDate");
        var maxDate = $picker.data("maxDate");
        var isOutputToInputObject = option.isOutputToInputObject;
        if (typeof keepPickedDate === "undefined") keepPickedDate = false;
        var firstDayOfWeek = $picker.data("firstDayOfWeek");
        var allowWdays = $picker.data("allowWdays");
        var locale = $picker.data("locale");
        var firstWday =
            new Date(date.getFullYear(), date.getMonth(), 1).getDay() -
            firstDayOfWeek;
        var lastDay = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0
        ).getDate();
        var beforeMonthLastDay = new Date(
            date.getFullYear(),
            date.getMonth(),
            0
        ).getDate();
        var dateBeforeMonth = new Date(date.getFullYear(), date.getMonth(), 0);
        var dateNextMonth = new Date(date.getFullYear(), date.getMonth() + 2, 0);
        var $header = $picker.children(".datepicker_header");
        var $calendar = $picker
            .children(".datepicker_inner_container")
            .children(".datepicker_calendar");
        var $table = $calendar.children(".datepicker_table");
        if (keepPickedDate === false) {
            $($picker).data("pickedDate", date);
        }
        $($picker).data("shownDate", date);
        $header.children().remove();
        if (
            (!isFutureOnly || !isCurrentMonth) &&
            (minDate == null || minDate < cDate.getTime())
        ) {
            $link_before_month = $("<a>");
            $link_before_month.text("<");
            $link_before_month.click(function () {
                beforeMonth($picker);
            });
        } else {
        }
        var $now_month = $("<span>");
        $now_month.text(
            date.getFullYear() +
            " " +
            translate(locale, "sep") +
            " " +
            translate(locale, "months")[date.getMonth()]
        );
        if (maxDate == null || maxDate > cDate.getTime()) {
            $link_next_month = $("<a>");
            $link_next_month.text(">");
            $link_next_month.click(function () {
                nextMonth($picker);
            });
        }
        if (isTodayButton) {
            var $link_today = $("<a><div/></a>");
            $link_today.addClass("icon-home");
            $link_today.click(function () {
                setToNow($picker);
            });
            $header.append($link_today);
        }
        if ($link_before_month != null) {
            $header.append($link_before_month);
        }
        $header.append($now_month);
        if ($link_next_month != null) {
            $header.append($link_next_month);
        }
        $table.children().remove();
        var $tr = $("<tr>");
        $table.append($tr);
        var firstDayDiff = 7 + firstDayOfWeek;
        var daysOfWeek = translate(locale, "days");
        for (var i = 0; i < 7; i++) {
            $td = $("<th>");
            $td.text(daysOfWeek[(i + firstDayDiff) % 7]);
            $tr.append($td);
        }
        var cellNum = Math.ceil((firstWday + lastDay) / 7) * 7;
        i = 0;
        var pickedDate = getPickedDate($picker);
        var shownDate = getShownDate($picker);
        for (var zz = 0; i < cellNum; i++) {
            var realDay = i + 1 - firstWday;
            if (i % 7 === 0) {
                $tr = $("<tr>");
                $table.append($tr);
            }
            $td = $("<td>");
            $tr.append($td);
            if (firstWday > i) {
                /* Before months day */
                $td.text(beforeMonthLastDay + realDay);
                $td.addClass("day_another_month");
                $td.data(
                    "dateStr",
                    dateBeforeMonth.getFullYear() +
                    "/" +
                    (dateBeforeMonth.getMonth() + 1) +
                    "/" +
                    (beforeMonthLastDay + realDay)
                );
            } else if (i < firstWday + lastDay) {
                /* Now months day */
                $td.text(realDay);
                $td.data(
                    "dateStr",
                    date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + realDay
                );
            } else {
                /* Next months day */
                $td.text(realDay - lastDay);
                $td.addClass("day_another_month");
                $td.data(
                    "dateStr",
                    dateNextMonth.getFullYear() +
                    "/" +
                    (dateNextMonth.getMonth() + 1) +
                    "/" +
                    (realDay - lastDay)
                );
            }
            var wday = (i + firstDayDiff) % 7;
            if (allowWdays != null) {
            } else if (wday === 0) {
                /* Sunday */
                $td.addClass("wday_sun");
            } else if (wday == 6) {
                /* Saturday */
                $td.addClass("wday_sat");
            }
            if (
                shownDate.getFullYear() == pickedDate.getFullYear() &&
                shownDate.getMonth() == pickedDate.getMonth() &&
                realDay == pickedDate.getDate()
            ) {
                /* selected day */
                $td.addClass("active");
            }
            if (
                // compare to 23:59:59 on the current day (if MIN is 1pm, then we still need to show this day
                (minDate != null && minDate > realDayObjMN.getTime()) ||
                (maxDate != null && maxDate < realDayObj.getTime()) // compare to 00:00:00
            ) {
                // Out of range day
            } else if (isFutureOnly && isPast) {
                // Past day
            } else {
                /* Set event-handler to day cell */
                $td.click(function (ev) {
                    var targetDate = new Date($(this).data("dateStr"));
                    var selectedDate = getPickedDate($picker);
                    draw(
                        $picker,
                        {
                            isOutputToInputObject: true
                        },
                        targetDate.getFullYear(),
                        targetDate.getMonth(),
                        targetDate.getDate(),
                        selectedDate.getHours(),
                        selectedDate.getMinutes()
                    );
                });
                $td.hover(
                    function () {
                        if (!$(this).hasClass("active")) {
                            $(this).addClass("hover");
                        }
                    },
                    function () {
                        if ($(this).hasClass("hover")) {
                            $(this).removeClass("hover");
                        }
                    }
                );
            }
            /* ---- */
        }
        if (isOutputToInputObject === true) {
            outputToInputObject($picker);
        }
    };
    var isObj = function (type, obj) {
        /* http://qiita.com/Layzie/items/465e715dae14e2f601de */
    };
    var init = function ($obj, opt) {
        /* Container */
        var $picker = $("<div>");
        $picker.addClass("datepicker");
        $obj.append($picker);
        if (!opt.current) {
            opt.current = new Date();
        } else {
            var format = getDateFormat(
                opt.dateFormat,
                opt.locale,
                opt.dateOnly,
                opt.timeOnly
            );
            var date = parseDate(opt.current, format);
            if (date) {
                opt.current = date;
            } else {
            }
        }
        if (opt.inputObjectId != null)
            $picker.data("inputObjectId", opt.inputObjectId);
        $picker.data("dateFormat", opt.dateFormat);
        $picker.data("firstDayOfWeek", opt.firstDayOfWeek);
        $picker.data("todayButton", opt.todayButton);
        var $header = $("<div>");
        $header.addClass("datepicker_header");
        $picker.append($header);
        var $inner = $("<div>");
        $inner.addClass("datepicker_inner_container");
        $picker.append($inner);
        var $calendar = $("<div>");
        $calendar.addClass("datepicker_calendar");
        var $table = $("<table>");
        $table.addClass("datepicker_table");
        $calendar.append($table);
        $inner.append($calendar);
        PickerObjects.push($picker);
        draw_date(
            $picker,
            {},
            opt.current
        );
    };
    var getDefaults = function () {
        return {
            current: null,
            dateFormat: "default",
            locale: "en",
            animation: true,
            minuteInterval: 30,
            firstDayOfWeek: 0,
            closeOnSelected: false,
            timelistScroll: true,
            calendarMouseScroll: true,
            todayButton: true,
            closeButton: true,
            dateOnly: false,
            timeOnly: false,
            futureOnly: false,
            minDate: null,
            maxDate: null,
            autodateOnStart: true,
            minTime: "00:00",
            maxTime: "23:59",
            onShow: null,
            onHide: null,
            onSelect: null,
            allowWdays: null,
            amPmInTimeList: false,
            externalLocale: null
        };
    };
    /**
     */
    $.fn.dtpicker = function (config) {
        var defaults = getDefaults();
        var options = $.extend(defaults, config);
        return this.each(function (i) {
            init($(this), options);
        });
    };
    /**
     * */
    $.fn.appendDtpicker = function (config) {
        var defaults = getDefaults();
        var options = $.extend(defaults, config);
        return this.each(function (i) {
            /* Checking exist a picker */
            var input = this;
            var inputObjectId = InputObjects.length;
            InputObjects.push(input);
            options.inputObjectId = inputObjectId;
            if ($(input).val() != null && $(input).val() !== "") {
                options.current = $(input).val();
            }
            var $d = $("<div>");
            if (options.inline) {
                // Inline mode
                $d.insertAfter(input);
            } else {
                // Float mode
                $("body").append($d);
            }
            var pickerId = PickerObjects.length;
            var $picker_parent = $($d).dtpicker(options); // call dtpicker() method
            var $picker = $picker_parent.children(".datepicker");
            $(input).data("pickerId", pickerId);
            var handler = new PickerHandler($picker, $(input));
            if (options.inline === true) {
                /* inline mode */
            } else {
                /* float mode */
                $picker.hide();
                $(input).on("click, focus", function (ev) {
                    var is_showed = handler.isShow();
                    if (!is_showed) {
                        // Show a picker
                        handler.show();
                    }
                });
            }
            $(input).bind("destroyed", function () {
                handler.destroy();
            });
        });
    };
    /**
     * */
    var methods = {
        hide: function () {
            var $input = $(this);
            var $picker = $(PickerObjects[$input.data("pickerId")]);
            if ($picker != null) {
                var handler = new PickerHandler($picker, $input);
                handler.hide();
            }
        },
        setDate: function (date) {
            var $input = $(this);
            var $picker = $(PickerObjects[$input.data("pickerId")]);
            if ($picker != null) {
                var handler = new PickerHandler($picker, $input);
                handler.setDate(date);
            }
        },
        getDate: function () {
            var $input = $(this);
            var $picker = $(PickerObjects[$input.data("pickerId")]);
            if ($picker != null) {
                var handler = new PickerHandler($picker, $input);
                return handler.getDate();
            }
        },
    };
    $.fn.handleDtpicker = function (method) {
        if (methods[method]) {
            return methods[method].apply(
                this,
                Array.prototype.slice.call(arguments, 1)
            );
        } else if (typeof method === "object" || !method) {
        } else {
        }
    };
    $.event.special.destroyed = {
        remove: function (o) {
            if (o.handler) {
                o.handler.apply(this, arguments);
            }
        }
    };
})(jQuery);