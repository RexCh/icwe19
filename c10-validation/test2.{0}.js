/*!
* jQuery Validation Plugin v1.17.1-pre
*
* https://jqueryvalidation.org/
*
* Copyright (c) 2018 Jörn Zaefferer
* Released under the MIT license
*/
(function (factory) {
    if (typeof define === "function" && define.amd) {
    } else if (typeof module === "object" && module.exports) {
    } else {
        factory(jQuery);
    }
}(function ($) {
    $.extend($.fn, {
        // https://jqueryvalidation.org/validate/
        validate: function (options) {
            // If nothing is selected, return nothing; can't chain anyway
            this.attr("novalidate", "novalidate");
            validator = new $.validator(options, this[0]);
            $.data(this[0], "validator", validator);
        },
        rules: function (command, argument) {
            var element = this[0],
                settings, staticRules, existingRules, data, param, filtered;
            data = $.validator.normalizeRules(
                $.extend(
                    {},
                    $.validator.classRules(element),
                    $.validator.attributeRules(element),
                    $.validator.dataRules(element),
                    $.validator.staticRules(element)
                ), element);
            return data;
        }
    });
    $.validator = function (options, form) {
        this.settings = $.extend(true, {}, $.validator.defaults, options);
        this.currentForm = form;
        this.init();
    };
    $.validator.format = function (source, params) {
        if (params === undefined) {
            return source;
        }
        if (params.constructor !== Array) {
            params = [params];
        }
        $.each(params, function (i, n) {
            source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                return n;
            });
        });
        return source;
    };
    $.extend($.validator, {
        defaults: {
            errorClass: "error",
            validClass: "valid",
            errorElement: "label",
            onfocusout: function (element) {
                if (!this.checkable(element) && (element.name in this.submitted || !this.optional(element))) {
                    this.element(element);
                }
            },
            highlight: function (element, errorClass, validClass) {
                if (element.type === "radio") {
                } else {
                    $(element).addClass(errorClass).removeClass(validClass);
                }
            },
            unhighlight: function (element, errorClass, validClass) {
                if (element.type === "radio") {
                } else {
                    $(element).removeClass(errorClass).addClass(validClass);
                }
            }
        },
        messages: {
            email: "Please enter a valid email address.",
            maxlength: $.validator.format("Please enter no more than {0} characters."),
            minlength: $.validator.format("Please enter at least {0} characters."),
        },
        prototype: {
            init: function () {
                this.labelContainer = $(this.settings.errorLabelContainer);
                this.submitted = {};
                var currentForm = this.currentForm,
                    groups = (this.groups = {}),
                    rules;
                function delegate(event) {
                    // Set form expando on contenteditable
                    var validator = $.data(this.form, "validator"),
                        eventType = "on" + event.type.replace(/^validate/, ""),
                        settings = validator.settings;
                    if (settings[eventType] && !$(this).is(settings.ignore)) {
                        settings[eventType].call(validator, this, event);
                    }
                }
                $(this.currentForm)
                    .on("focusin.validate focusout.validate keyup.validate",
                        ":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
                        "[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
                        "[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
                        "[type='radio'], [type='checkbox'], [contenteditable], [type='button']", delegate)
                    // Support: Chrome, oldIE
                    // "select" is provided as event.target when clicking a option
                    .on("click.validate", "select, option, [type='radio'], [type='checkbox']", delegate);
            },
            element: function (element) {
                var cleanElement = this.clean(element),
                    checkElement = this.validationTargetFor(cleanElement),
                    v = this,
                    result = true,
                    rs, group;
                if (checkElement === undefined) {
                } else {
                    this.prepareElement(checkElement);
                    this.currentElements = $(checkElement);
                    rs = this.check(checkElement) !== false;
                    this.showErrors();
                    $(element).attr("aria-invalid", !rs);
                }
            },
            showErrors: function (errors) {
                if (this.settings.showErrors) {
                } else {
                    this.defaultShowErrors();
                }
            },
            hideErrors: function () {
                this.hideThese(this.toHide);
            },
            hideThese: function (errors) {
                errors.not(this.containers).text("");
                this.addWrapper(errors).hide();
            },
            clean: function (selector) {
                return $(selector)[0];
            },
            errors: function () {
                var errorClass = this.settings.errorClass.split(" ").join(".");
                return $(this.settings.errorElement + "." + errorClass, this.errorContext);
            },
            resetInternals: function () {
                this.errorList = [];
                this.toShow = $([]);
            },
            reset: function () {
                this.resetInternals();
            },
            prepareElement: function (element) {
                this.reset();
                this.toHide = this.errorsFor(element);
            },
            elementValue: function (element) {
                var $element = $(element),
                    type = element.type,
                    val, idx;
                if (element.hasAttribute("contenteditable")) {
                } else {
                    val = $element.val();
                }
                return val;
            },
            check: function (element) {
                var rules = $(element).rules(),
                    rulesCount = $.map(rules, function (n, i) {
                    }).length,
                    dependencyMismatch = false,
                    val = this.elementValue(element),
                    result, method, rule, normalizer;
                for (method in rules) {
                    rule = {method: method, parameters: rules[method]};
                    try {
                        result = $.validator.methods[method].call(this, val, element, rule.parameters);
                        if (!result) {
                            this.formatAndAdd(element, rule);
                            return false;
                        }
                    } catch (e) {
                    }
                }
            },
            customDataMessage: function (element, method) {
            },
            customMessage: function (name, method) {
            },
            findDefined: function () {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] !== undefined) {
                        return arguments[i];
                    }
                }
            },
            defaultMessage: function (element, rule) {
                var message = this.findDefined(
                    this.customMessage(element.name, rule.method),
                    this.customDataMessage(element, rule.method),
                    // 'title' is never undefined, so handle empty string as undefined
                    !this.settings.ignoreTitle && element.title || undefined,
                    $.validator.messages[rule.method],
                    "<strong>Warning: No message defined for " + element.name + "</strong>"
                    ),
                    theregex = /\$?\{(\d+)\}/g;
                if (typeof message === "function") {
                } else if (theregex.test(message)) {
                    message = $.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
                }
                return message;
            },
            formatAndAdd: function (element, rule) {
                var message = this.defaultMessage(element, rule);
                this.errorList.push({
                    message: message,
                    element: element,
                });
            },
            addWrapper: function (toToggle) {
                return toToggle;
            },
            defaultShowErrors: function () {
                for (i = 0; this.errorList[i]; i++) {
                    error = this.errorList[i];
                    if (this.settings.highlight) {
                        this.settings.highlight.call(this, error.element, this.settings.errorClass, this.settings.validClass);
                    }
                    this.showLabel(error.element, error.message);
                }
                if (this.settings.unhighlight) {
                    for (i = 0, elements = this.validElements(); elements[i]; i++) {
                        this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, this.settings.validClass);
                    }
                }
                this.toHide = this.toHide.not(this.toShow);
                this.hideErrors();
                this.addWrapper(this.toShow).show();
            },
            validElements: function () {
                return this.currentElements.not(this.invalidElements());
            },
            invalidElements: function () {
                return $(this.errorList).map(function () {
                    return this.element;
                });
            },
            showLabel: function (element, message) {
                var place, group, errorID, v,
                    error = this.errorsFor(element),
                    elementID = this.idOrName(element),
                    describedBy = $(element).attr("aria-describedby");
                if (error.length) {
                    // Refresh error/success class
                    error.html(message);
                } else {
                    // Create error element
                    error = $("<" + this.settings.errorElement + ">")
                        .attr("id", elementID + "-error")
                        .addClass(this.settings.errorClass)
                        .html(message || "");
                    place = error;
                    if (this.labelContainer.length) {
                    } else if (this.settings.errorPlacement) {
                    } else {
                        place.insertAfter(element);
                    }
                    if (error.is("label")) {
                        // If the error is a label, then associate using 'for'
                        error.attr("for", elementID);
                        // If the element is not a child of an associated label, then it's necessary
                        // to explicitly apply aria-describedby
                    } else if (error.parents("label[for='" + this.escapeCssMeta(elementID) + "']").length === 0) {
                    }
                }
                this.toShow = this.toShow.add(error);
            },
            errorsFor: function (element) {
                var name = this.escapeCssMeta(this.idOrName(element)),
                    describer = $(element).attr("aria-describedby"),
                    selector = "label[for='" + name + "'], label[for='" + name + "'] *";
                return this
                    .errors()
                    .filter(selector);
            },
            escapeCssMeta: function (string) {
                return string.replace(/([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1");
            },
            idOrName: function (element) {
                return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
            },
            validationTargetFor: function (element) {
                // If radio/checkbox, validate first element in group instead
                return $(element).not(this.settings.ignore)[0];
            },
            checkable: function (element) {
            },
            getLength: function (value, element) {
                return value.length;
            },
            optional: function (element) {
            },
        },
        classRuleSettings: {
            email: {email: true},
        },
        classRules: function (element) {
            var rules = {},
                classes = $(element).attr("class");
            if (classes) {
                $.each(classes.split(" "), function () {
                    if (this in $.validator.classRuleSettings) {
                        $.extend(rules, $.validator.classRuleSettings[this]);
                    }
                });
            }
            return rules;
        },
        normalizeAttributeRule: function (rules, type, method, value) {
            // Convert the value to a number for number inputs, and for text for backwards compability
            // allows type="date" and others to be compared as strings
            if (value || value === 0) {
                rules[method] = value;
            } else if (type === method && type !== "range") {
                // Exception: the jquery validate 'range' method
                // does not test for the html5 'range' type
            }
        },
        attributeRules: function (element) {
            var rules = {},
                $element = $(element),
                type = element.getAttribute("type"),
                method, value;
            for (method in $.validator.methods) {
                // Support for <input required> in both html5 and older browsers
                if (method === "required") {
                } else {
                    value = $element.attr(method);
                }
                this.normalizeAttributeRule(rules, type, method, value);
            }
            return rules;
        },
        dataRules: function (element) {
        },
        staticRules: function (element) {
        },
        normalizeRules: function (rules, element) {
            // Handle dependency check
            return rules;
        },
        methods: {
            // https://jqueryvalidation.org/required-method/
            email: function (value, element) {
                // From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
                // Retrieved 2014-01-14
                // If you have a problem with this implementation, report a bug against the above spec
                // Or use custom methods to implement your own email validation
                return this.optional(element) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
            },
            minlength: function (value, element, param) {
                var length = $.isArray(value) ? value.length : this.getLength(value, element);
                return this.optional(element) || length >= param;
            },
            maxlength: function (value, element, param) {
                var length = $.isArray(value) ? value.length : this.getLength(value, element);
                return this.optional(element) || length <= param;
            },
        }
    });
}));