/**
 * jquery-simple-datetimepicker (jquery.simple-dtpicker.js)
 * v1.13.0
 * (c) Masanori Ohgita.
 * https://github.com/mugifly/jquery-simple-datetimepicker
 **/
(function($) {
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
      format: "YYYY-MM-DD",
      prevMonth: "Previous month",
      nextMonth: "Next month",
      today: "Today"
    },
  };
  /* ----- */
  /**
		PickerHandler Object
	**/
  var PickerHandler = function($picker, $input) {
    this.$pickerObject = $picker;
    this.$inputObject = $input;
  };
  /* Get a picker */
  PickerHandler.prototype.getPicker = function() {
    return this.$pickerObject;
  };
  /* Get a input-field */
  PickerHandler.prototype.getInput = function() {
    return this.$inputObject;
  };
  /* Get the display state of a picker */
  /* Hide a picker */
  /* Get a selected date from a picker */
  PickerHandler.prototype.getDate = function() {
    var $picker = this.$pickerObject;
    return getPickedDate($picker);
  };
  /* Set a specific date to a picker */
  PickerHandler.prototype.setDate = function(date) {
    var $picker = this.$pickerObject;
    if (!isObj("Date", date)) {
      date = new Date(date);
    }
    draw_date(
      $picker,
      {
        isOutputToInputObject: true
      },
      date
    );
  };
  /* Set a specific min date to a picker and redraw */
  PickerHandler.prototype.setMinDate = function(date) {
    var $picker = this.$pickerObject;
    var $input = this.$inputObject;
    if (!isObj("Date", date)) {
      date = new Date(date);
    }
    $picker.data("minDate", date);
    if ($input.val()) {
      datepicked = new Date(getPickedDate($picker));
      draw_date(
        $picker,
        {
          isOutputToInputObject: true
        },
        datepicked > date ? datepicked : date
      );
    } else {
      draw_date(
        $picker,
        {
          isOutputToInputObject: false
        },
        date
      );
    }
  };
  /* Set a specific max date to a picker and redraw */
  /* Destroy a picker */
  /* Relocate a picker to position of the appended input-field. */
  /* ----- */
  var PickerObjects = [];
  var InputObjects = [];
  var getParentPickerObject = function(obj) {
    return $(obj).closest(".datepicker");
  };
  var getPickersInputObject = function($obj) {
    var $picker = getParentPickerObject($obj);
    if ($picker.data("inputObjectId") != null) {
      return $(InputObjects[$picker.data("inputObjectId")]);
    }
    return null;
  };
  var setToNow = function($obj) {
    var $picker = getParentPickerObject($obj);
    var date = new Date();
    draw(
      $picker,
      {
        isOutputToInputObject: true
      },
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };
  var beforeMonth = function($obj) {
    var $picker = getParentPickerObject($obj);
    if ($picker.data("stateAllowBeforeMonth") === false) {
      // Not allowed
      return;
    }
    var date = getShownDate($picker);
    var targetMonth_lastDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      0
    ).getDate();
    if (targetMonth_lastDay < date.getDate()) {
      date.setDate(targetMonth_lastDay);
    }
    draw(
      $picker,
      {
        isOutputToInputObject: false,
        keepPickedDate: true
      },
      date.getFullYear(),
      date.getMonth() - 1,
      date.getDate()
    );
    var todayDate = new Date();
    if ($picker.data("current")) {
      todayDate = new Date($picker.data("current"));
    }
    var isCurrentYear = todayDate.getFullYear() == date.getFullYear();
    var isCurrentMonth =
      isCurrentYear && todayDate.getMonth() == date.getMonth();
    if (!isCurrentMonth) {
      if (targetMonth_lastDay < date.getDate()) {
        date.setDate(targetMonth_lastDay);
      }
      var newdate = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        date.getDate()
      );
      if ($picker.data("minDate") && newdate < $picker.data("minDate"))
        newdate = $picker.data("minDate");
      draw(
        $picker,
        {
          isOutputToInputObject: false,
          keepPickedDate: true
        },
        newdate.getFullYear(),
        newdate.getMonth(),
        newdate.getDate()
      );
    }
  };
  var nextMonth = function($obj) {
    var $picker = getParentPickerObject($obj);
    var date = getShownDate($picker);
    var targetMonth_lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    if (targetMonth_lastDay < date.getDate()) {
      date.setDate(targetMonth_lastDay);
    }
    // Check a last date of a next month
    if (getLastDate(date.getFullYear(), date.getMonth() + 1) < date.getDate()) {
      date.setDate(getLastDate(date.getFullYear(), date.getMonth() + 1));
    }
    var newdate = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
    draw(
      $picker,
      {
        isOutputToInputObject: false,
        keepPickedDate: true
      },
      newdate.getFullYear(),
      newdate.getMonth(),
      newdate.getDate()
    );
  };
  /**
		Check a last date of a specified year and month
	**/
  var getLastDate = function(year, month) {
    var date = new Date(year, month + 1, 0);
    return date.getDate();
  };
  var getDateFormat = function(format, locale, is_date_only, is_time_only) {
    if (format == "default") {
      // Default format
      format = translate(locale, "format");
      if (is_date_only) {
        // Convert the format to date-only (ex: YYYY/MM/DD)
        format = format.substring(0, format.search(" "));
      }
    }
    return format; // Return date-format
  };
  var normalizeYear = function(year) {
    if (year < 99) {
      // change year for 4 digits
      var date = new Date();
      return (
        parseInt(year) +
        parseInt(
          date
            .getFullYear()
            .toString()
            .substr(0, 2) + "00"
        )
      );
    }
    return year;
  };
  var parseDate = function(str, opt_date_format) {
    var re, m, date;
    if (opt_date_format != null) {
      // Match a string with date format
      var df = opt_date_format
        .replace(/hh:mm.*/, "(?:$&)?")
        .replace(/\s/, "\\s?")
        .replace(/(-|\/)/g, "[-/]")
        .replace(/YYYY/gi, "(\\d{2,4})")
        .replace(/(YY|MM|DD|HH|hh|mm)/g, "(\\d{1,2})")
        .replace(/(M|D|H|h|m)/g, "(\\d{1,2})");
      re = new RegExp(df);
      m = re.exec(str);
      if (m != null) {
        // Generate the formats array (convert-table)
        var formats = [];
        var format_buf = "";
        var format_before_c = "";
        var df_ = opt_date_format;
        while (df_ != null && 0 < df_.length) {
          var format_c = df_.substring(0, 1);
          df_ = df_.substring(1, df_.length);
          if (format_before_c != format_c) {
            if (
              /(YYYY|YY|MM|DD|mm|dd|M|D|HH|H|hh|h|m|tt|TT)/.test(format_buf)
            ) {
              formats.push(format_buf);
              format_buf = "";
            } else {
              format_buf = "";
            }
          }
          format_buf += format_c;
          format_before_c = format_c;
        }
        if (
          format_buf !== "" &&
          /(YYYY|YY|MM|DD|mm|dd|M|D|HH|H|hh|h|m|tt|TT)/.test(format_buf)
        ) {
          formats.push(format_buf);
        }
        // Convert a string (with convert-table) to a date object
        var year, month, day;
        var is_successful = false;
        for (var i = 0; i < formats.length; i++) {
          if (m.length < i) {
            break;
          }
          var f = formats[i];
          var d = m[i + 1]; // Matched part of date
          if (f == "YYYY") {
            year = normalizeYear(d);
            is_successful = true;
          } else if (f == "YY") {
            year = parseInt(d) + 2000;
            is_successful = true;
          } else if (f == "MM" || f == "M") {
            month = parseInt(d) - 1;
            is_successful = true;
          } else if (f == "DD" || f == "D") {
            day = d;
            is_successful = true;
          } else if (f == "tt" || f == "TT") {
            if (d == "pm" || d == "PM") {
              pm = true;
            }
            is_successful = true;
          }
        }
        date = new Date(year, month, day);
        if (
          is_successful === true &&
          isNaN(date) === false &&
          isNaN(date.getDate()) === false
        ) {
          // Parse successful
          return date;
        }
      }
    }
    // Parse date & time with common format
    re = /^(\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2}) (\d{1,2}):(\d{1,2})$/;
    m = re.exec(str);
    if (m !== null) {
      m[1] = normalizeYear(m[1]);
      date = new Date(m[1], m[2] - 1, m[3], m[4], m[5]);
    } else {
      // Parse for date-only
      re = /^(\d{2,4})[-\/](\d{1,2})[-\/](\d{1,2})$/;
      m = re.exec(str);
      if (m !== null) {
        m[1] = normalizeYear(m[1]);
        date = new Date(m[1], m[2] - 1, m[3]);
      }
    }
    if (isNaN(date) === false && isNaN(date.getDate()) === false) {
      // Parse successful
      return date;
    }
    return false;
  };
  var getFormattedDate = function(date, date_format) {
    if (date == null) {
      date = new Date();
    }
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    date_format = date_format
      .replace(/YYYY/gi, y)
      .replace(/YY/g, y - 2000) /* century */
      .replace(/MM/g, zpadding(m))
      .replace(/M/g, m)
      .replace(/DD/g, zpadding(d))
      .replace(/D/g, d)
    return date_format;
  };
  var outputToInputObject = function($picker) {
    var $inp = getPickersInputObject($picker);
    if ($inp == null) {
      return;
    }
    var date = getPickedDate($picker);
    var locale = $picker.data("locale");
    var format = getDateFormat(
      $picker.data("dateFormat"),
      locale,
      $picker.data("dateOnly")
    );
    var old = $inp.val();
    $inp.val(getFormattedDate(date, format));
    if (old != $inp.val()) {
      // only trigger if it actually changed to avoid a nasty loop condition
      $inp.trigger("change");
    }
  };
  var getShownDate = function($obj) {
    var $picker = getParentPickerObject($obj);
    return $picker.data("shownDate");
  };
  var getPickedDate = function($obj) {
    var $picker = getParentPickerObject($obj);
    return $picker.data("pickedDate");
  };
  var zpadding = function(num) {
    num = ("0" + num).slice(-2);
    return num;
  };
  var draw_date = function($picker, option, date) {
    //console.log("draw_date - " + date.toString());
    draw(
      $picker,
      option,
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };
  var translate = function(locale, s) {
    if (typeof lang[locale][s] !== "undefined") {
      return lang[locale][s];
    }
    return lang.en[s];
  };
  var draw = function($picker, option, year, month, day) {
    var date = new Date();
    if (year != null) {
      date = new Date(year, month, day);
    } else {
      date = new Date();
    }
    /* Read options */
    var isTodayButton = $picker.data("todayButton");
    var isFutureOnly = $picker.data("futureOnly");
    var minDate = $picker.data("minDate");
    var maxDate = $picker.data("maxDate");
    var isOutputToInputObject = option.isOutputToInputObject;
    var keepPickedDate = option.keepPickedDate;
    if (typeof keepPickedDate === "undefined") keepPickedDate = false;
    var firstDayOfWeek = $picker.data("firstDayOfWeek");
    var allowWdays = $picker.data("allowWdays");
    if (
      allowWdays == null ||
      isObj("Array", allowWdays) === false ||
      allowWdays.length <= 0
    ) {
      allowWdays = null;
    }
    /* Check a specified date */
    var todayDate = new Date();
    if (allowWdays != null && allowWdays.length <= 6) {
      while (true) {
        if ($.inArray(date.getDay(), allowWdays) == -1) {
          // Unallowed wday
          // Slide a date
          date.setDate(date.getDate() + 1);
        } else {
          break;
        }
      }
    }
    /* Read locale option */
    var locale = $picker.data("locale");
    /* Calculate dates */
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
    var isCurrentYear = todayDate.getFullYear() == date.getFullYear();
    var isCurrentMonth =
      isCurrentYear && todayDate.getMonth() == date.getMonth();
    var isNextYear = todayDate.getFullYear() + 1 == date.getFullYear();
    var isNextMonth =
      (isCurrentYear && todayDate.getMonth() + 1 == date.getMonth()) ||
      (isNextYear && todayDate.getMonth() === 11 && date.getMonth() === 0);
    var isPastMonth = false;
    if (
      date.getFullYear() < todayDate.getFullYear() ||
      (isCurrentYear && date.getMonth() < todayDate.getMonth())
    ) {
      isPastMonth = true;
    }
    /* Collect each part */
    var $header = $picker.children(".datepicker_header");
    var $calendar = $picker
      .children(".datepicker_inner_container")
      .children(".datepicker_calendar");
    var $table = $calendar.children(".datepicker_table");
    /* Grasp a point that will be changed */
    var oldDate = getPickedDate($picker);
    if (oldDate != null) {
      if (
        oldDate.getMonth() != date.getMonth() ||
        oldDate.getDate() != date.getDate()
      ) {
        changePoint = "calendar";
      }
    }
    /* Save newly date to Picker data */
    if (keepPickedDate === false) {
      $($picker).data("pickedDate", date);
    }
    $($picker).data("shownDate", date);
    /* Header ----- */
    $header.children().remove();
    var cDate = new Date(date.getTime());
    cDate.setDate(0); // last day of previous month
    var $link_before_month = null;
    if (
      (!isCurrentMonth) &&
      (minDate == null || minDate < cDate.getTime())
    ) {
      $link_before_month = $("<a>");
      $link_before_month.text("<");
      $link_before_month.prop("alt", translate(locale, "prevMonth"));
      $link_before_month.prop("title", translate(locale, "prevMonth"));
      $link_before_month.click(function() {
        beforeMonth($picker);
      });
      $picker.data("stateAllowBeforeMonth", true);
    } else {
      $picker.data("stateAllowBeforeMonth", false);
    }
    cDate.setDate(1); // First day of next month
    cDate.setMonth(date.getMonth() + 1);
    var $now_month = $("<span>");
    $now_month.text(
      date.getFullYear() +
        " " +
        translate(locale, "sep") +
        " " +
        translate(locale, "months")[date.getMonth()]
    );
    var $link_next_month = null;
    if (maxDate == null || maxDate > cDate.getTime()) {
      $link_next_month = $("<a>");
      $link_next_month.text(">");
      $link_next_month.prop("alt", translate(locale, "nextMonth"));
      $link_next_month.prop("title", translate(locale, "nextMonth"));
      $link_next_month.click(function() {
        nextMonth($picker);
      });
    }
    if (isTodayButton) {
      var $link_today = $("<a><div/></a>");
      $link_today.addClass("icon-home");
      $link_today.prop("alt", translate(locale, "today"));
      $link_today.prop("title", translate(locale, "today"));
      $link_today.click(function() {
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
    /* Calendar > Table ----- */
    $table.children().remove();
    var $tr = $("<tr>");
    $table.append($tr);
    /* Output wday cells */
    var firstDayDiff = 7 + firstDayOfWeek;
    var daysOfWeek = translate(locale, "days");
    var $td;
    for (var i = 0; i < 7; i++) {
      $td = $("<th>");
      $td.text(daysOfWeek[(i + firstDayDiff) % 7]);
      $tr.append($td);
    }
    /* Output day cells */
    var cellNum = Math.ceil((firstWday + lastDay) / 7) * 7;
    i = 0;
    if (firstWday < 0) {
      i = -7;
    }
    var realDayObj = new Date(date.getTime());
    var pickedDate = getPickedDate($picker);
    var shownDate = getShownDate($picker);
    for (var zz = 0; i < cellNum; i++) {
      var realDay = i + 1 - firstWday;
      var isPast =
        isPastMonth ||
        (isCurrentMonth && realDay < todayDate.getDate()) ||
        (isNextMonth &&
          firstWday > i &&
          beforeMonthLastDay + realDay < todayDate.getDate());
      if (i % 7 === 0) {
        $tr = $("<tr>");
        $table.append($tr);
      }
      $td = $("<td>");
      $td.data("day", realDay);
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
        realDayObj.setDate(beforeMonthLastDay + realDay);
        realDayObj.setMonth(dateBeforeMonth.getMonth());
        realDayObj.setYear(dateBeforeMonth.getFullYear());
      } else if (i < firstWday + lastDay) {
        /* Now months day */
        $td.text(realDay);
        $td.data(
          "dateStr",
          date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + realDay
        );
        realDayObj.setDate(realDay);
        realDayObj.setMonth(date.getMonth());
        realDayObj.setYear(date.getFullYear());
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
        realDayObj.setDate(realDay - lastDay);
        realDayObj.setMonth(dateNextMonth.getMonth());
        realDayObj.setYear(dateNextMonth.getFullYear());
      }
      /* Check a wday */
      var wday = (i + firstDayDiff) % 7;
      if (allowWdays != null) {
        if ($.inArray(wday, allowWdays) == -1) {
          $td.addClass("day_in_unallowed");
          continue; // Skip
        }
      } else if (wday === 0) {
        /* Sunday */
        $td.addClass("wday_sun");
      } else if (wday == 6) {
        /* Saturday */
        $td.addClass("wday_sat");
      }
      /* Set a special mark class */
      if (
        shownDate.getFullYear() == pickedDate.getFullYear() &&
        shownDate.getMonth() == pickedDate.getMonth() &&
        realDay == pickedDate.getDate()
      ) {
        /* selected day */
        $td.addClass("active");
      }
      if (isCurrentMonth && realDay == todayDate.getDate()) {
        /* today */
        $td.addClass("today");
      }
      if (isFutureOnly && isPast) {
        // Past day
        $td.addClass("day_in_past");
      } else {
        /* Set event-handler to day cell */
        $td.click(function(ev) {
          ev.stopPropagation();
          if ($(this).hasClass("hover")) {
            $(this).removeClass("hover");
          }
          $(this).addClass("active");
          var $picker = getParentPickerObject($(this));
          var targetDate = new Date($(this).data("dateStr"));
          draw(
            $picker,
            {
              isOutputToInputObject: true
            },
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate()
          );
          // Generate the handler of a picker
          // Call a event-hanlder for onSelect
        });
        $td.hover(
          function() {
            if (!$(this).hasClass("active")) {
              $(this).addClass("hover");
            }
          },
          function() {
            if ($(this).hasClass("hover")) {
              $(this).removeClass("hover");
            }
          }
        );
      }
      /* ---- */
    }
    /* Output to InputForm */
    if (isOutputToInputObject === true) {
      outputToInputObject($picker);
    }
  };
  /* Check for object type */
  var isObj = function(type, obj) {
    /* http://qiita.com/Layzie/items/465e715dae14e2f601de */
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
  };
  var init = function($obj, opt) {
    /* Container */
    var $picker = $("<div>");
    $picker.addClass("datepicker");
    $obj.append($picker);
    /* Set current date */
    if (!opt.current) {
      opt.current = new Date();
    } else {
      var format = getDateFormat(
        opt.dateFormat,
        opt.locale,
        opt.dateOnly
      );
      var date = parseDate(opt.current, format);
      if (date) {
        opt.current = date;
      } else {
        opt.current = new Date();
      }
    }
    /* Set options data to container object  */
    if (opt.inputObjectId != null)
      $picker.data("inputObjectId", opt.inputObjectId);
    $picker.data("dateOnly", opt.dateOnly);
    $picker.data("pickerId", PickerObjects.length);
    $picker.data("dateFormat", opt.dateFormat);
    $picker.data("locale", opt.locale);
    $picker.data("firstDayOfWeek", opt.firstDayOfWeek);
    $picker.data("calendarMouseScroll", opt.calendarMouseScroll);
    $picker.data("todayButton", opt.todayButton);
    $picker.data("onSelect", opt.onSelect);
    $picker.data("onInit", opt.onInit);
    $picker.data("allowWdays", opt.allowWdays);
    $picker.data("current", opt.current);
    var minDate = Date.parse(opt.minDate);
    if (isNaN(minDate)) {
      // invalid date?
      $picker.data("minDate", null); // set to null
    } else {
      $picker.data("minDate", minDate);
    }
    $picker.data("state", 0);
    /* Header */
    var $header = $("<div>");
    $header.addClass("datepicker_header");
    $picker.append($header);
    /* InnerContainer*/
    var $inner = $("<div>");
    $inner.addClass("datepicker_inner_container");
    $picker.append($inner);
    /* Calendar */
    var $calendar = $("<div>");
    $calendar.addClass("datepicker_calendar");
    var $table = $("<table>");
    $table.addClass("datepicker_table");
    $calendar.append($table);
    $inner.append($calendar);
    /* Set event-handler to calendar */
    PickerObjects.push($picker);
    draw_date(
      $picker,
      {
        isOutputToInputObject: opt.autodateOnStart
      },
      opt.current
    );
  };
  var getDefaults = function() {
    return {
      current: null,
      dateFormat: "default",
      locale: "en",
      firstDayOfWeek: 0,
      calendarMouseScroll: true,
      todayButton: true,
      dateOnly: false,
      autodateOnStart: true,
      onSelect: null,
      allowWdays: null,
      externalLocale: null
    };
  };
  /**
   * Initialize dtpicker
   */
  $.fn.dtpicker = function(config) {
    var defaults = getDefaults();
    defaults.inputObjectId = undefined;
    var options = $.extend(defaults, config);
    return this.each(function(i) {
      init($(this), options);
    });
  };
  /**
   * Initialize dtpicker, append to Text input field
   * */
  $.fn.appendDtpicker = function(config) {
    var defaults = getDefaults();
    var options = $.extend(defaults, config);
    if (options.externalLocale != null) {
      lang = $.extend(lang, options.externalLocale);
    }
    return this.each(function(i) {
      /* Checking exist a picker */
      var input = this;
      if (0 < $(PickerObjects[$(input).data("pickerId")]).length) {
        console.log("dtpicker - Already exist appended picker");
        return;
      }
      /* Add input-field with inputsObjects array */
      var inputObjectId = InputObjects.length;
      InputObjects.push(input);
      options.inputObjectId = inputObjectId;
      /* Current date */
      if ($(input).val() != null && $(input).val() !== "") {
        options.current = $(input).val();
      }
      /* Make parent-div for picker */
      var $d = $("<div>");
      if (options.inline) {
        // Inline mode
        $d.insertAfter(input);
      } else {
        // Float mode
        $d.css("position", "absolute");
        $("body").append($d);
      }
      /* Initialize picker */
      var pickerId = PickerObjects.length;
      var $picker_parent = $($d).dtpicker(options); // call dtpicker() method
      var $picker = $picker_parent.children(".datepicker");
      /* Link input-field with picker*/
      $(input).data("pickerId", pickerId);
      /* Set event handler to input-field */
      $(input).change(function() {
        $(this).trigger("keyup");
      });
      var handler = new PickerHandler($picker, $(input));
      if (options.inline === true) {
        /* inline mode */
        $picker.data("isInline", true);
      }
      // Set an event handler for removing of an input-field
      // Call a event-handler
      var func = $picker.data("onInit");
      if (func != null) {
        func(handler);
      }
    });
  };
  /**
   * Handle a appended dtpicker
   * */
  var methods = {
    setDate: function(date) {
      var $input = $(this);
      var $picker = $(PickerObjects[$input.data("pickerId")]);
      if ($picker != null) {
        var handler = new PickerHandler($picker, $input);
        // Set a date
        handler.setDate(date);
      }
    },
    getDate: function() {
      var $input = $(this);
      var $picker = $(PickerObjects[$input.data("pickerId")]);
      if ($picker != null) {
        var handler = new PickerHandler($picker, $input);
        // Get a date
        return handler.getDate();
      }
    }
  };
  $.fn.handleDtpicker = function(method) {
    if (methods[method]) {
      return methods[method].apply(
        this,
        Array.prototype.slice.call(arguments, 1)
      );
    }
  };
  /* Set event handler to Body element, for hide a floated-picker */
})(jQuery);
