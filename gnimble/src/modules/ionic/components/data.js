/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { p as printIonWarning } from './index4.js';

/**
 * Returns true if the selected day is equal to the reference day
 */
const isSameDay = (baseParts, compareParts) => {
    return (baseParts.month === compareParts.month && baseParts.day === compareParts.day && baseParts.year === compareParts.year);
};
/**
 * Returns true is the selected day is before the reference day.
 */
const isBefore = (baseParts, compareParts) => {
    return !!(baseParts.year < compareParts.year ||
        (baseParts.year === compareParts.year && baseParts.month < compareParts.month) ||
        (baseParts.year === compareParts.year &&
            baseParts.month === compareParts.month &&
            baseParts.day !== null &&
            baseParts.day < compareParts.day));
};
/**
 * Returns true is the selected day is after the reference day.
 */
const isAfter = (baseParts, compareParts) => {
    return !!(baseParts.year > compareParts.year ||
        (baseParts.year === compareParts.year && baseParts.month > compareParts.month) ||
        (baseParts.year === compareParts.year &&
            baseParts.month === compareParts.month &&
            baseParts.day !== null &&
            baseParts.day > compareParts.day));
};
const warnIfValueOutOfBounds = (value, min, max) => {
    const valueArray = Array.isArray(value) ? value : [value];
    for (const val of valueArray) {
        if ((min !== undefined && isBefore(val, min)) || (max !== undefined && isAfter(val, max))) {
            printIonWarning('[ion-datetime] - The value provided to ion-datetime is out of bounds.\n\n' +
                `Min: ${JSON.stringify(min)}\n` +
                `Max: ${JSON.stringify(max)}\n` +
                `Value: ${JSON.stringify(value)}`);
            break;
        }
    }
};

/**
 * Determines if given year is a
 * leap year. Returns `true` if year
 * is a leap year. Returns `false`
 * otherwise.
 */
const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};
/**
 * Determines the hour cycle for a user.
 * If the hour cycle is explicitly defined, just use that.
 * Otherwise, we try to derive it from either the specified
 * locale extension tags or from Intl.DateTimeFormat directly.
 */
const getHourCycle = (locale, hourCycle) => {
    /**
     * If developer has explicitly enabled 24-hour time
     * then return early and do not look at the system default.
     */
    if (hourCycle !== undefined) {
        return hourCycle;
    }
    /**
     * If hourCycle was not specified, check the locale
     * that is set on the user's device. We first check the
     * Intl.DateTimeFormat hourCycle option as developers can encode this
     * option into the locale string. Example: `en-US-u-hc-h23`
     */
    const formatted = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
    const options = formatted.resolvedOptions();
    if (options.hourCycle !== undefined) {
        return options.hourCycle;
    }
    /**
     * If hourCycle is not specified (either through lack
     * of browser support or locale information) then fall
     * back to this slower hourCycle check.
     */
    const date = new Date('5/18/2021 00:00');
    const parts = formatted.formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour');
    if (!hour) {
        throw new Error('Hour value not found from DateTimeFormat');
    }
    /**
     * Midnight for h11 starts at 0:00am
     * Midnight for h12 starts at 12:00am
     * Midnight for h23 starts at 00:00
     * Midnight for h24 starts at 24:00
     */
    switch (hour.value) {
        case '0':
            return 'h11';
        case '12':
            return 'h12';
        case '00':
            return 'h23';
        case '24':
            return 'h24';
        default:
            throw new Error(`Invalid hour cycle "${hourCycle}"`);
    }
};
/**
 * Determine if the hour cycle uses a 24-hour format.
 * Returns true for h23 and h24. Returns false otherwise.
 * If you don't know the hourCycle, use getHourCycle above
 * and pass the result into this function.
 */
const is24Hour = (hourCycle) => {
    return hourCycle === 'h23' || hourCycle === 'h24';
};
/**
 * Given a date object, returns the number
 * of days in that month.
 * Month value begin at 1, not 0.
 * i.e. January = month 1.
 */
const getNumDaysInMonth = (month, year) => {
    return month === 4 || month === 6 || month === 9 || month === 11
        ? 30
        : month === 2
            ? isLeapYear(year)
                ? 29
                : 28
            : 31;
};
/**
 * Certain locales display month then year while
 * others display year then month.
 * We can use Intl.DateTimeFormat to determine
 * the ordering for each locale.
 * The formatOptions param can be used to customize
 * which pieces of a date to compare against the month
 * with. For example, some locales render dd/mm/yyyy
 * while others render mm/dd/yyyy. This function can be
 * used for variations of the same "month first" check.
 */
const isMonthFirstLocale = (locale, formatOptions = {
    month: 'numeric',
    year: 'numeric',
}) => {
    /**
     * By setting month and year we guarantee that only
     * month, year, and literal (slashes '/', for example)
     * values are included in the formatToParts results.
     *
     * The ordering of the parts will be determined by
     * the locale. So if the month is the first value,
     * then we know month should be shown first. If the
     * year is the first value, then we know year should be shown first.
     *
     * This ordering can be controlled by customizing the locale property.
     */
    const parts = new Intl.DateTimeFormat(locale, formatOptions).formatToParts(new Date());
    return parts[0].type === 'month';
};
/**
 * Determines if the given locale formats the day period (am/pm) to the
 * left or right of the hour.
 * @param locale The locale to check.
 * @returns `true` if the locale formats the day period to the left of the hour.
 */
const isLocaleDayPeriodRTL = (locale) => {
    const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).formatToParts(new Date());
    return parts[0].type === 'dayPeriod';
};

const ISO_8601_REGEXP = 
// eslint-disable-next-line no-useless-escape
/^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
// eslint-disable-next-line no-useless-escape
const TIME_REGEXP = /^((\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
/**
 * Use to convert a string of comma separated numbers or
 * an array of numbers, and clean up any user input
 */
const convertToArrayOfNumbers = (input) => {
    if (input === undefined) {
        return;
    }
    let processedInput = input;
    if (typeof input === 'string') {
        // convert the string to an array of strings
        // auto remove any whitespace and [] characters
        processedInput = input.replace(/\[|\]|\s/g, '').split(',');
    }
    let values;
    if (Array.isArray(processedInput)) {
        // ensure each value is an actual number in the returned array
        values = processedInput.map((num) => parseInt(num, 10)).filter(isFinite);
    }
    else {
        values = [processedInput];
    }
    return values;
};
/**
 * Extracts date information
 * from a .calendar-day element
 * into DatetimeParts.
 */
const getPartsFromCalendarDay = (el) => {
    return {
        month: parseInt(el.getAttribute('data-month'), 10),
        day: parseInt(el.getAttribute('data-day'), 10),
        year: parseInt(el.getAttribute('data-year'), 10),
        dayOfWeek: parseInt(el.getAttribute('data-day-of-week'), 10),
    };
};
function parseDate(val) {
    if (Array.isArray(val)) {
        const parsedArray = [];
        for (const valStr of val) {
            const parsedVal = parseDate(valStr);
            /**
             * If any of the values weren't parsed correctly, consider
             * the entire batch incorrect. This simplifies the type
             * signatures by having "undefined" be a general error case
             * instead of returning (Datetime | undefined)[], which is
             * harder for TS to perform type narrowing on.
             */
            if (!parsedVal) {
                return undefined;
            }
            parsedArray.push(parsedVal);
        }
        return parsedArray;
    }
    // manually parse IS0 cuz Date.parse cannot be trusted
    // ISO 8601 format: 1994-12-15T13:47:20Z
    let parse = null;
    if (val != null && val !== '') {
        // try parsing for just time first, HH:MM
        parse = TIME_REGEXP.exec(val);
        if (parse) {
            // adjust the array so it fits nicely with the datetime parse
            parse.unshift(undefined, undefined);
            parse[2] = parse[3] = undefined;
        }
        else {
            // try parsing for full ISO datetime
            parse = ISO_8601_REGEXP.exec(val);
        }
    }
    if (parse === null) {
        // wasn't able to parse the ISO datetime
        printIonWarning(`[ion-datetime] - Unable to parse date string: ${val}. Please provide a valid ISO 8601 datetime string.`);
        return undefined;
    }
    // ensure all the parse values exist with at least 0
    for (let i = 1; i < 8; i++) {
        parse[i] = parse[i] !== undefined ? parseInt(parse[i], 10) : undefined;
    }
    // can also get second and millisecond from parse[6] and parse[7] if needed
    return {
        year: parse[1],
        month: parse[2],
        day: parse[3],
        hour: parse[4],
        minute: parse[5],
        ampm: parse[4] < 12 ? 'am' : 'pm',
    };
}
const clampDate = (dateParts, minParts, maxParts) => {
    if (minParts && isBefore(dateParts, minParts)) {
        return minParts;
    }
    else if (maxParts && isAfter(dateParts, maxParts)) {
        return maxParts;
    }
    return dateParts;
};
/**
 * Parses an hour and returns if the value is in the morning (am) or afternoon (pm).
 * @param hour The hour to format, should be 0-23
 * @returns `pm` if the hour is greater than or equal to 12, `am` if less than 12.
 */
const parseAmPm = (hour) => {
    return hour >= 12 ? 'pm' : 'am';
};
/**
 * Takes a max date string and creates a DatetimeParts
 * object, filling in any missing information.
 * For example, max="2012" would fill in the missing
 * month, day, hour, and minute information.
 */
const parseMaxParts = (max, todayParts) => {
    const result = parseDate(max);
    /**
     * If min was not a valid date then return undefined.
     */
    if (result === undefined) {
        return;
    }
    const { month, day, year, hour, minute } = result;
    /**
     * When passing in `max` or `min`, developers
     * can pass in any ISO-8601 string. This means
     * that not all of the date/time fields are defined.
     * For example, passing max="2012" is valid even though
     * there is no month, day, hour, or minute data.
     * However, all of this data is required when clamping the date
     * so that the correct initial value can be selected. As a result,
     * we need to fill in any omitted data with the min or max values.
     */
    const yearValue = year !== null && year !== void 0 ? year : todayParts.year;
    const monthValue = month !== null && month !== void 0 ? month : 12;
    return {
        month: monthValue,
        day: day !== null && day !== void 0 ? day : getNumDaysInMonth(monthValue, yearValue),
        /**
         * Passing in "HH:mm" is a valid ISO-8601
         * string, so we just default to the current year
         * in this case.
         */
        year: yearValue,
        hour: hour !== null && hour !== void 0 ? hour : 23,
        minute: minute !== null && minute !== void 0 ? minute : 59,
    };
};
/**
 * Takes a min date string and creates a DatetimeParts
 * object, filling in any missing information.
 * For example, min="2012" would fill in the missing
 * month, day, hour, and minute information.
 */
const parseMinParts = (min, todayParts) => {
    const result = parseDate(min);
    /**
     * If min was not a valid date then return undefined.
     */
    if (result === undefined) {
        return;
    }
    const { month, day, year, hour, minute } = result;
    /**
     * When passing in `max` or `min`, developers
     * can pass in any ISO-8601 string. This means
     * that not all of the date/time fields are defined.
     * For example, passing max="2012" is valid even though
     * there is no month, day, hour, or minute data.
     * However, all of this data is required when clamping the date
     * so that the correct initial value can be selected. As a result,
     * we need to fill in any omitted data with the min or max values.
     */
    return {
        month: month !== null && month !== void 0 ? month : 1,
        day: day !== null && day !== void 0 ? day : 1,
        /**
         * Passing in "HH:mm" is a valid ISO-8601
         * string, so we just default to the current year
         * in this case.
         */
        year: year !== null && year !== void 0 ? year : todayParts.year,
        hour: hour !== null && hour !== void 0 ? hour : 0,
        minute: minute !== null && minute !== void 0 ? minute : 0,
    };
};

const twoDigit = (val) => {
    return ('0' + (val !== undefined ? Math.abs(val) : '0')).slice(-2);
};
const fourDigit = (val) => {
    return ('000' + (val !== undefined ? Math.abs(val) : '0')).slice(-4);
};
function convertDataToISO(data) {
    if (Array.isArray(data)) {
        return data.map((parts) => convertDataToISO(parts));
    }
    // https://www.w3.org/TR/NOTE-datetime
    let rtn = '';
    if (data.year !== undefined) {
        // YYYY
        rtn = fourDigit(data.year);
        if (data.month !== undefined) {
            // YYYY-MM
            rtn += '-' + twoDigit(data.month);
            if (data.day !== undefined) {
                // YYYY-MM-DD
                rtn += '-' + twoDigit(data.day);
                if (data.hour !== undefined) {
                    // YYYY-MM-DDTHH:mm:SS
                    rtn += `T${twoDigit(data.hour)}:${twoDigit(data.minute)}:00`;
                }
            }
        }
    }
    else if (data.hour !== undefined) {
        // HH:mm
        rtn = twoDigit(data.hour) + ':' + twoDigit(data.minute);
    }
    return rtn;
}
/**
 * Converts an 12 hour value to 24 hours.
 */
const convert12HourTo24Hour = (hour, ampm) => {
    if (ampm === undefined) {
        return hour;
    }
    /**
     * If AM and 12am
     * then return 00:00.
     * Otherwise just return
     * the hour since it is
     * already in 24 hour format.
     */
    if (ampm === 'am') {
        if (hour === 12) {
            return 0;
        }
        return hour;
    }
    /**
     * If PM and 12pm
     * just return 12:00
     * since it is already
     * in 24 hour format.
     * Otherwise add 12 hours
     * to the time.
     */
    if (hour === 12) {
        return 12;
    }
    return hour + 12;
};
const getStartOfWeek = (refParts) => {
    const { dayOfWeek } = refParts;
    if (dayOfWeek === null || dayOfWeek === undefined) {
        throw new Error('No day of week provided');
    }
    return subtractDays(refParts, dayOfWeek);
};
const getEndOfWeek = (refParts) => {
    const { dayOfWeek } = refParts;
    if (dayOfWeek === null || dayOfWeek === undefined) {
        throw new Error('No day of week provided');
    }
    return addDays(refParts, 6 - dayOfWeek);
};
const getNextDay = (refParts) => {
    return addDays(refParts, 1);
};
const getPreviousDay = (refParts) => {
    return subtractDays(refParts, 1);
};
const getPreviousWeek = (refParts) => {
    return subtractDays(refParts, 7);
};
const getNextWeek = (refParts) => {
    return addDays(refParts, 7);
};
/**
 * Given datetime parts, subtract
 * numDays from the date.
 * Returns a new DatetimeParts object
 * Currently can only go backward at most 1 month.
 */
const subtractDays = (refParts, numDays) => {
    const { month, day, year } = refParts;
    if (day === null) {
        throw new Error('No day provided');
    }
    const workingParts = {
        month,
        day,
        year,
    };
    workingParts.day = day - numDays;
    /**
     * If wrapping to previous month
     * update days and decrement month
     */
    if (workingParts.day < 1) {
        workingParts.month -= 1;
    }
    /**
     * If moving to previous year, reset
     * month to December and decrement year
     */
    if (workingParts.month < 1) {
        workingParts.month = 12;
        workingParts.year -= 1;
    }
    /**
     * Determine how many days are in the current
     * month
     */
    if (workingParts.day < 1) {
        const daysInMonth = getNumDaysInMonth(workingParts.month, workingParts.year);
        /**
         * Take num days in month and add the
         * number of underflow days. This number will
         * be negative.
         * Example: 1 week before Jan 2, 2021 is
         * December 26, 2021 so:
         * 2 - 7 = -5
         * 31 + (-5) = 26
         */
        workingParts.day = daysInMonth + workingParts.day;
    }
    return workingParts;
};
/**
 * Given datetime parts, add
 * numDays to the date.
 * Returns a new DatetimeParts object
 * Currently can only go forward at most 1 month.
 */
const addDays = (refParts, numDays) => {
    const { month, day, year } = refParts;
    if (day === null) {
        throw new Error('No day provided');
    }
    const workingParts = {
        month,
        day,
        year,
    };
    const daysInMonth = getNumDaysInMonth(month, year);
    workingParts.day = day + numDays;
    /**
     * If wrapping to next month
     * update days and increment month
     */
    if (workingParts.day > daysInMonth) {
        workingParts.day -= daysInMonth;
        workingParts.month += 1;
    }
    /**
     * If moving to next year, reset
     * month to January and increment year
     */
    if (workingParts.month > 12) {
        workingParts.month = 1;
        workingParts.year += 1;
    }
    return workingParts;
};
/**
 * Given DatetimeParts, generate the previous month.
 */
const getPreviousMonth = (refParts) => {
    /**
     * If current month is January, wrap backwards
     *  to December of the previous year.
     */
    const month = refParts.month === 1 ? 12 : refParts.month - 1;
    const year = refParts.month === 1 ? refParts.year - 1 : refParts.year;
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const day = numDaysInMonth < refParts.day ? numDaysInMonth : refParts.day;
    return { month, year, day };
};
/**
 * Given DatetimeParts, generate the next month.
 */
const getNextMonth = (refParts) => {
    /**
     * If current month is December, wrap forwards
     *  to January of the next year.
     */
    const month = refParts.month === 12 ? 1 : refParts.month + 1;
    const year = refParts.month === 12 ? refParts.year + 1 : refParts.year;
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const day = numDaysInMonth < refParts.day ? numDaysInMonth : refParts.day;
    return { month, year, day };
};
const changeYear = (refParts, yearDelta) => {
    const month = refParts.month;
    const year = refParts.year + yearDelta;
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const day = numDaysInMonth < refParts.day ? numDaysInMonth : refParts.day;
    return { month, year, day };
};
/**
 * Given DatetimeParts, generate the previous year.
 */
const getPreviousYear = (refParts) => {
    return changeYear(refParts, -1);
};
/**
 * Given DatetimeParts, generate the next year.
 */
const getNextYear = (refParts) => {
    return changeYear(refParts, 1);
};
/**
 * If PM, then internal value should
 * be converted to 24-hr time.
 * Does not apply when public
 * values are already 24-hr time.
 */
const getInternalHourValue = (hour, use24Hour, ampm) => {
    if (use24Hour) {
        return hour;
    }
    return convert12HourTo24Hour(hour, ampm);
};
/**
 * Unless otherwise stated, all month values are
 * 1 indexed instead of the typical 0 index in JS Date.
 * Example:
 *   January = Month 0 when using JS Date
 *   January = Month 1 when using this datetime util
 */
/**
 * Given the current datetime parts and a new AM/PM value
 * calculate what the hour should be in 24-hour time format.
 * Used when toggling the AM/PM segment since we store our hours
 * in 24-hour time format internally.
 */
const calculateHourFromAMPM = (currentParts, newAMPM) => {
    const { ampm: currentAMPM, hour } = currentParts;
    let newHour = hour;
    /**
     * If going from AM --> PM, need to update the
     *
     */
    if (currentAMPM === 'am' && newAMPM === 'pm') {
        newHour = convert12HourTo24Hour(newHour, 'pm');
        /**
         * If going from PM --> AM
         */
    }
    else if (currentAMPM === 'pm' && newAMPM === 'am') {
        newHour = Math.abs(newHour - 12);
    }
    return newHour;
};
/**
 * Updates parts to ensure that month and day
 * values are valid. For days that do not exist,
 * or are outside the min/max bounds, the closest
 * valid day is used.
 */
const validateParts = (parts, minParts, maxParts) => {
    const { month, day, year } = parts;
    const partsCopy = clampDate(Object.assign({}, parts), minParts, maxParts);
    const numDays = getNumDaysInMonth(month, year);
    /**
     * If the max number of days
     * is greater than the day we want
     * to set, update the DatetimeParts
     * day field to be the max days.
     */
    if (day !== null && numDays < day) {
        partsCopy.day = numDays;
    }
    /**
     * If value is same day as min day,
     * make sure the time value is in bounds.
     */
    if (minParts !== undefined && isSameDay(partsCopy, minParts)) {
        /**
         * If the hour is out of bounds,
         * update both the hour and minute.
         * This is done so that the new time
         * is closest to what the user selected.
         */
        if (partsCopy.hour !== undefined && minParts.hour !== undefined) {
            if (partsCopy.hour < minParts.hour) {
                partsCopy.hour = minParts.hour;
                partsCopy.minute = minParts.minute;
                /**
                 * If only the minute is out of bounds,
                 * set it to the min minute.
                 */
            }
            else if (partsCopy.hour === minParts.hour &&
                partsCopy.minute !== undefined &&
                minParts.minute !== undefined &&
                partsCopy.minute < minParts.minute) {
                partsCopy.minute = minParts.minute;
            }
        }
    }
    /**
     * If value is same day as max day,
     * make sure the time value is in bounds.
     */
    if (maxParts !== undefined && isSameDay(parts, maxParts)) {
        /**
         * If the hour is out of bounds,
         * update both the hour and minute.
         * This is done so that the new time
         * is closest to what the user selected.
         */
        if (partsCopy.hour !== undefined && maxParts.hour !== undefined) {
            if (partsCopy.hour > maxParts.hour) {
                partsCopy.hour = maxParts.hour;
                partsCopy.minute = maxParts.minute;
                /**
                 * If only the minute is out of bounds,
                 * set it to the max minute.
                 */
            }
            else if (partsCopy.hour === maxParts.hour &&
                partsCopy.minute !== undefined &&
                maxParts.minute !== undefined &&
                partsCopy.minute > maxParts.minute) {
                partsCopy.minute = maxParts.minute;
            }
        }
    }
    return partsCopy;
};
/**
 * Returns the closest date to refParts
 * that also meets the constraints of
 * the *Values params.
 */
const getClosestValidDate = ({ refParts, monthValues, dayValues, yearValues, hourValues, minuteValues, minParts, maxParts, }) => {
    const { hour, minute, day, month, year } = refParts;
    const copyParts = Object.assign(Object.assign({}, refParts), { dayOfWeek: undefined });
    if (yearValues !== undefined) {
        // Filters out years that are out of the min/max bounds
        const filteredYears = yearValues.filter((year) => {
            if (minParts !== undefined && year < minParts.year) {
                return false;
            }
            if (maxParts !== undefined && year > maxParts.year) {
                return false;
            }
            return true;
        });
        copyParts.year = findClosestValue(year, filteredYears);
    }
    if (monthValues !== undefined) {
        // Filters out months that are out of the min/max bounds
        const filteredMonths = monthValues.filter((month) => {
            if (minParts !== undefined && copyParts.year === minParts.year && month < minParts.month) {
                return false;
            }
            if (maxParts !== undefined && copyParts.year === maxParts.year && month > maxParts.month) {
                return false;
            }
            return true;
        });
        copyParts.month = findClosestValue(month, filteredMonths);
    }
    // Day is nullable but cannot be undefined
    if (day !== null && dayValues !== undefined) {
        // Filters out days that are out of the min/max bounds
        const filteredDays = dayValues.filter((day) => {
            if (minParts !== undefined && isBefore(Object.assign(Object.assign({}, copyParts), { day }), minParts)) {
                return false;
            }
            if (maxParts !== undefined && isAfter(Object.assign(Object.assign({}, copyParts), { day }), maxParts)) {
                return false;
            }
            return true;
        });
        copyParts.day = findClosestValue(day, filteredDays);
    }
    if (hour !== undefined && hourValues !== undefined) {
        // Filters out hours that are out of the min/max bounds
        const filteredHours = hourValues.filter((hour) => {
            if ((minParts === null || minParts === void 0 ? void 0 : minParts.hour) !== undefined && isSameDay(copyParts, minParts) && hour < minParts.hour) {
                return false;
            }
            if ((maxParts === null || maxParts === void 0 ? void 0 : maxParts.hour) !== undefined && isSameDay(copyParts, maxParts) && hour > maxParts.hour) {
                return false;
            }
            return true;
        });
        copyParts.hour = findClosestValue(hour, filteredHours);
        copyParts.ampm = parseAmPm(copyParts.hour);
    }
    if (minute !== undefined && minuteValues !== undefined) {
        // Filters out minutes that are out of the min/max bounds
        const filteredMinutes = minuteValues.filter((minute) => {
            if ((minParts === null || minParts === void 0 ? void 0 : minParts.minute) !== undefined &&
                isSameDay(copyParts, minParts) &&
                copyParts.hour === minParts.hour &&
                minute < minParts.minute) {
                return false;
            }
            if ((maxParts === null || maxParts === void 0 ? void 0 : maxParts.minute) !== undefined &&
                isSameDay(copyParts, maxParts) &&
                copyParts.hour === maxParts.hour &&
                minute > maxParts.minute) {
                return false;
            }
            return true;
        });
        copyParts.minute = findClosestValue(minute, filteredMinutes);
    }
    return copyParts;
};
/**
 * Finds the value in "values" that is
 * numerically closest to "reference".
 * This function assumes that "values" is
 * already sorted in ascending order.
 * @param reference The reference number to use
 * when finding the closest value
 * @param values The allowed values that will be
 * searched to find the closest value to "reference"
 */
const findClosestValue = (reference, values) => {
    let closestValue = values[0];
    let rank = Math.abs(closestValue - reference);
    for (let i = 1; i < values.length; i++) {
        const value = values[i];
        /**
         * This code prioritizes the first
         * closest result. Given two values
         * with the same distance from reference,
         * this code will prioritize the smaller of
         * the two values.
         */
        const valueRank = Math.abs(value - reference);
        if (valueRank < rank) {
            closestValue = value;
            rank = valueRank;
        }
    }
    return closestValue;
};

const getFormattedDayPeriod = (dayPeriod) => {
    if (dayPeriod === undefined) {
        return '';
    }
    return dayPeriod.toUpperCase();
};
/**
 * Including time zone options may lead to the rendered text showing a
 * different time from what was selected in the Datetime, which could cause
 * confusion.
 */
const stripTimeZone = (formatOptions) => {
    return Object.assign(Object.assign({}, formatOptions), { 
        /**
         * Setting the time zone to UTC ensures that the value shown is always the
         * same as what was selected and safeguards against older Safari bugs with
         * Intl.DateTimeFormat.
         */
        timeZone: 'UTC', 
        /**
         * We do not want to display the time zone name
         */
        timeZoneName: undefined });
};
const getLocalizedTime = (locale, refParts, hourCycle, formatOptions = { hour: 'numeric', minute: 'numeric' }) => {
    const timeParts = {
        hour: refParts.hour,
        minute: refParts.minute,
    };
    if (timeParts.hour === undefined || timeParts.minute === undefined) {
        return 'Invalid Time';
    }
    return new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, stripTimeZone(formatOptions)), { 
        /**
         * We use hourCycle here instead of hour12 due to:
         * https://bugs.chromium.org/p/chromium/issues/detail?id=1347316&q=hour12&can=2
         */
        hourCycle })).format(new Date(convertDataToISO(Object.assign({ 
        /**
         * JS uses a simplified ISO 8601 format which allows for
         * date-only formats and date-time formats, but not
         * time-only formats: https://tc39.es/ecma262/#sec-date-time-string-format
         * As a result, developers who only pass a time will get
         * an "Invalid Date" error. To account for this, we make sure that
         * year/day/month values are set when passing to new Date().
         * The Intl.DateTimeFormat call above only uses the hour/minute
         * values, so passing these date values should have no impact
         * on the time output.
         */
        year: 2023, day: 1, month: 1 }, timeParts)) + 'Z'));
};
/**
 * Adds padding to a time value so
 * that it is always 2 digits.
 */
const addTimePadding = (value) => {
    const valueToString = value.toString();
    if (valueToString.length > 1) {
        return valueToString;
    }
    return `0${valueToString}`;
};
/**
 * Formats 24 hour times so that
 * it always has 2 digits. For
 * 12 hour times it ensures that
 * hour 0 is formatted as '12'.
 */
const getFormattedHour = (hour, hourCycle) => {
    /**
     * Midnight for h11 starts at 0:00am
     * Midnight for h12 starts at 12:00am
     * Midnight for h23 starts at 00:00
     * Midnight for h24 starts at 24:00
     */
    if (hour === 0) {
        switch (hourCycle) {
            case 'h11':
                return '0';
            case 'h12':
                return '12';
            case 'h23':
                return '00';
            case 'h24':
                return '24';
            default:
                throw new Error(`Invalid hour cycle "${hourCycle}"`);
        }
    }
    const use24Hour = is24Hour(hourCycle);
    /**
     * h23 and h24 use 24 hour times.
     */
    if (use24Hour) {
        return addTimePadding(hour);
    }
    return hour.toString();
};
/**
 * Generates an aria-label to be read by screen readers
 * given a local, a date, and whether or not that date is
 * today's date.
 */
const generateDayAriaLabel = (locale, today, refParts) => {
    if (refParts.day === null) {
        return null;
    }
    /**
     * MM/DD/YYYY will return midnight in the user's timezone.
     */
    const date = getNormalizedDate(refParts);
    const labelString = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(date);
    /**
     * If date is today, prepend "Today" so screen readers indicate
     * that the date is today.
     */
    return today ? `Today, ${labelString}` : labelString;
};
/**
 * Given a locale and a date object,
 * return a formatted string that includes
 * the month name and full year.
 * Example: May 2021
 */
const getMonthAndYear = (locale, refParts) => {
    const date = getNormalizedDate(refParts);
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
};
/**
 * Given a locale and a date object,
 * return a formatted string that includes
 * the numeric day.
 * Note: Some languages will add literal characters
 * to the end. This function removes those literals.
 * Example: 29
 */
const getDay = (locale, refParts) => {
    return getLocalizedDateTimeParts(locale, refParts, { day: 'numeric' }).find((obj) => obj.type === 'day').value;
};
/**
 * Given a locale and a date object,
 * return a formatted string that includes
 * the numeric year.
 * Example: 2022
 */
const getYear = (locale, refParts) => {
    return getLocalizedDateTime(locale, refParts, { year: 'numeric' });
};
/**
 * Given reference parts, return a JS Date object
 * with a normalized time.
 */
const getNormalizedDate = (refParts) => {
    var _a, _b, _c;
    const timeString = refParts.hour !== undefined && refParts.minute !== undefined ? ` ${refParts.hour}:${refParts.minute}` : '';
    /**
     * We use / notation here for the date
     * so we do not need to do extra work and pad values with zeroes.
     * Values such as YYYY-MM are still valid, so
     * we add fallback values so we still get
     * a valid date otherwise we will pass in a string
     * like "//2023". Some browsers, such as Chrome, will
     * account for this and still return a valid date. However,
     * this is not a consistent behavior across all browsers.
     */
    return new Date(`${(_a = refParts.month) !== null && _a !== void 0 ? _a : 1}/${(_b = refParts.day) !== null && _b !== void 0 ? _b : 1}/${(_c = refParts.year) !== null && _c !== void 0 ? _c : 2023}${timeString} GMT+0000`);
};
/**
 * Given a locale, DatetimeParts, and options
 * format the DatetimeParts according to the options
 * and locale combination. This returns a string. If
 * you want an array of the individual pieces
 * that make up the localized date string, use
 * getLocalizedDateTimeParts.
 */
const getLocalizedDateTime = (locale, refParts, options) => {
    const date = getNormalizedDate(refParts);
    return getDateTimeFormat(locale, stripTimeZone(options)).format(date);
};
/**
 * Given a locale, DatetimeParts, and options
 * format the DatetimeParts according to the options
 * and locale combination. This returns an array of
 * each piece of the date.
 */
const getLocalizedDateTimeParts = (locale, refParts, options) => {
    const date = getNormalizedDate(refParts);
    return getDateTimeFormat(locale, options).formatToParts(date);
};
/**
 * Wrapper function for Intl.DateTimeFormat.
 * Allows developers to apply an allowed format to DatetimeParts.
 * This function also has built in safeguards for older browser bugs
 * with Intl.DateTimeFormat.
 */
const getDateTimeFormat = (locale, options) => {
    return new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, options), { timeZone: 'UTC' }));
};
/**
 * Gets a localized version of "Today"
 * Falls back to "Today" in English for
 * browsers that do not support RelativeTimeFormat.
 */
const getTodayLabel = (locale) => {
    if ('RelativeTimeFormat' in Intl) {
        const label = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day');
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
    else {
        return 'Today';
    }
};
/**
 * When calling toISOString(), the browser
 * will convert the date to UTC time by either adding
 * or subtracting the time zone offset.
 * To work around this, we need to either add
 * or subtract the time zone offset to the Date
 * object prior to calling toISOString().
 * This allows us to get an ISO string
 * that is in the user's time zone.
 *
 * Example:
 * Time zone offset is 240
 * Meaning: The browser needs to add 240 minutes
 * to the Date object to get UTC time.
 * What Ionic does: We subtract 240 minutes
 * from the Date object. The browser then adds
 * 240 minutes in toISOString(). The result
 * is a time that is in the user's time zone
 * and not UTC.
 *
 * Note: Some timezones include minute adjustments
 * such as 30 or 45 minutes. This is why we use setMinutes
 * instead of setHours.
 * Example: India Standard Time
 * Timezone offset: -330 = -5.5 hours.
 *
 * List of timezones with 30 and 45 minute timezones:
 * https://www.timeanddate.com/time/time-zones-interesting.html
 */
const removeDateTzOffset = (date) => {
    const tzOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - tzOffset);
    return date;
};
const DATE_AM = removeDateTzOffset(new Date('2022T01:00'));
const DATE_PM = removeDateTzOffset(new Date('2022T13:00'));
/**
 * Formats the locale's string representation of the day period (am/pm) for a given
 * ref parts day period.
 *
 * @param locale The locale to format the day period in.
 * @param value The date string, in ISO format.
 * @returns The localized day period (am/pm) representation of the given value.
 */
const getLocalizedDayPeriod = (locale, dayPeriod) => {
    const date = dayPeriod === 'am' ? DATE_AM : DATE_PM;
    const localizedDayPeriod = new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        timeZone: 'UTC',
    })
        .formatToParts(date)
        .find((part) => part.type === 'dayPeriod');
    if (localizedDayPeriod) {
        return localizedDayPeriod.value;
    }
    return getFormattedDayPeriod(dayPeriod);
};
/**
 * Formats the datetime's value to a string, for use in the native input.
 *
 * @param value The value to format, either an ISO string or an array thereof.
 */
const formatValue = (value) => {
    return Array.isArray(value) ? value.join(',') : value;
};

/**
 * Returns the current date as
 * an ISO string in the user's
 * time zone.
 */
const getToday = () => {
    /**
     * ion-datetime intentionally does not
     * parse time zones/do automatic time zone
     * conversion when accepting user input.
     * However when we get today's date string,
     * we want it formatted relative to the user's
     * time zone.
     *
     * When calling toISOString(), the browser
     * will convert the date to UTC time by either adding
     * or subtracting the time zone offset.
     * To work around this, we need to either add
     * or subtract the time zone offset to the Date
     * object prior to calling toISOString().
     * This allows us to get an ISO string
     * that is in the user's time zone.
     */
    return removeDateTzOffset(new Date()).toISOString();
};
const minutes = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
];
// h11 hour system uses 0-11. Midnight starts at 0:00am.
const hour11 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// h12 hour system uses 0-12. Midnight starts at 12:00am.
const hour12 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// h23 hour system uses 0-23. Midnight starts at 0:00.
const hour23 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
// h24 hour system uses 1-24. Midnight starts at 24:00.
const hour24 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
/**
 * Given a locale and a mode,
 * return an array with formatted days
 * of the week. iOS should display days
 * such as "Mon" or "Tue".
 * MD should display days such as "M"
 * or "T".
 */
const getDaysOfWeek = (locale, mode, firstDayOfWeek = 0) => {
    /**
     * Nov 1st, 2020 starts on a Sunday.
     * ion-datetime assumes weeks start on Sunday,
     * but is configurable via `firstDayOfWeek`.
     */
    const weekdayFormat = mode === 'ios' ? 'short' : 'narrow';
    const intl = new Intl.DateTimeFormat(locale, { weekday: weekdayFormat });
    const startDate = new Date('11/01/2020');
    const daysOfWeek = [];
    /**
     * For each day of the week,
     * get the day name.
     */
    for (let i = firstDayOfWeek; i < firstDayOfWeek + 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        daysOfWeek.push(intl.format(currentDate));
    }
    return daysOfWeek;
};
/**
 * Returns an array containing all of the
 * days in a month for a given year. Values are
 * aligned with a week calendar starting on
 * the firstDayOfWeek value (Sunday by default)
 * using null values.
 */
const getDaysOfMonth = (month, year, firstDayOfWeek, showAdjacentDays = false) => {
    const numDays = getNumDaysInMonth(month, year);
    let previousNumDays; //previous month number of days
    if (month === 1) {
        // If the current month is January, the previous month should be December of the previous year.
        previousNumDays = getNumDaysInMonth(12, year - 1);
    }
    else {
        // Otherwise, the previous month should be the current month - 1 of the same year.
        previousNumDays = getNumDaysInMonth(month - 1, year);
    }
    const firstOfMonth = new Date(`${month}/1/${year}`).getDay();
    /**
     * To get the first day of the month aligned on the correct
     * day of the week, we need to determine how many "filler" days
     * to generate. These filler days as empty/disabled buttons
     * that fill the space of the days of the week before the first
     * of the month.
     *
     * There are two cases here:
     *
     * 1. If firstOfMonth = 4, firstDayOfWeek = 0 then the offset
     * is (4 - (0 + 1)) = 3. Since the offset loop goes from 0 to 3 inclusive,
     * this will generate 4 filler days (0, 1, 2, 3), and then day of week 4 will have
     * the first day of the month.
     *
     * 2. If firstOfMonth = 2, firstDayOfWeek = 4 then the offset
     * is (6 - (4 - 2)) = 4. Since the offset loop goes from 0 to 4 inclusive,
     * this will generate 5 filler days (0, 1, 2, 3, 4), and then day of week 5 will have
     * the first day of the month.
     */
    const offset = firstOfMonth >= firstDayOfWeek ? firstOfMonth - (firstDayOfWeek + 1) : 6 - (firstDayOfWeek - firstOfMonth);
    let days = [];
    for (let i = 1; i <= numDays; i++) {
        days.push({ day: i, dayOfWeek: (offset + i) % 7, isAdjacentDay: false });
    }
    if (showAdjacentDays) {
        for (let i = 0; i <= offset; i++) {
            // Using offset create previous month adjacent day, starting from last day
            days = [{ day: previousNumDays - i, dayOfWeek: (previousNumDays - i) % 7, isAdjacentDay: true }, ...days];
        }
        // Calculate positiveOffset
        // The calendar will display 42 days (6 rows of 7 columns)
        // Knowing this the offset is 41 (we start at index 0)
        // minus (the previous offset + the current month days)
        const positiveOffset = 41 - (numDays + offset);
        for (let i = 0; i < positiveOffset; i++) {
            days.push({ day: i + 1, dayOfWeek: (numDays + offset + i) % 7, isAdjacentDay: true });
        }
    }
    else {
        for (let i = 0; i <= offset; i++) {
            days = [{ day: null, dayOfWeek: null, isAdjacentDay: false }, ...days];
        }
    }
    return days;
};
/**
 * Returns an array of pre-defined hour
 * values based on the provided hourCycle.
 */
const getHourData = (hourCycle) => {
    switch (hourCycle) {
        case 'h11':
            return hour11;
        case 'h12':
            return hour12;
        case 'h23':
            return hour23;
        case 'h24':
            return hour24;
        default:
            throw new Error(`Invalid hour cycle "${hourCycle}"`);
    }
};
/**
 * Given a local, reference datetime parts and option
 * max/min bound datetime parts, calculate the acceptable
 * hour and minute values according to the bounds and locale.
 */
const generateTime = (locale, refParts, hourCycle = 'h12', minParts, maxParts, hourValues, minuteValues) => {
    const computedHourCycle = getHourCycle(locale, hourCycle);
    const use24Hour = is24Hour(computedHourCycle);
    let processedHours = getHourData(computedHourCycle);
    let processedMinutes = minutes;
    let isAMAllowed = true;
    let isPMAllowed = true;
    if (hourValues) {
        processedHours = processedHours.filter((hour) => hourValues.includes(hour));
    }
    if (minuteValues) {
        processedMinutes = processedMinutes.filter((minute) => minuteValues.includes(minute));
    }
    if (minParts) {
        /**
         * If ref day is the same as the
         * minimum allowed day, filter hour/minute
         * values according to min hour and minute.
         */
        if (isSameDay(refParts, minParts)) {
            /**
             * Users may not always set the hour/minute for
             * min value (i.e. 2021-06-02) so we should allow
             * all hours/minutes in that case.
             */
            if (minParts.hour !== undefined) {
                processedHours = processedHours.filter((hour) => {
                    const convertedHour = refParts.ampm === 'pm' ? (hour + 12) % 24 : hour;
                    return (use24Hour ? hour : convertedHour) >= minParts.hour;
                });
                isAMAllowed = minParts.hour < 13;
            }
            if (minParts.minute !== undefined) {
                /**
                 * The minimum minute range should not be enforced when
                 * the hour is greater than the min hour.
                 *
                 * For example with a minimum range of 09:30, users
                 * should be able to select 10:00-10:29 and beyond.
                 */
                let isPastMinHour = false;
                if (minParts.hour !== undefined && refParts.hour !== undefined) {
                    if (refParts.hour > minParts.hour) {
                        isPastMinHour = true;
                    }
                }
                processedMinutes = processedMinutes.filter((minute) => {
                    if (isPastMinHour) {
                        return true;
                    }
                    return minute >= minParts.minute;
                });
            }
            /**
             * If ref day is before minimum
             * day do not render any hours/minute values
             */
        }
        else if (isBefore(refParts, minParts)) {
            processedHours = [];
            processedMinutes = [];
            isAMAllowed = isPMAllowed = false;
        }
    }
    if (maxParts) {
        /**
         * If ref day is the same as the
         * maximum allowed day, filter hour/minute
         * values according to max hour and minute.
         */
        if (isSameDay(refParts, maxParts)) {
            /**
             * Users may not always set the hour/minute for
             * max value (i.e. 2021-06-02) so we should allow
             * all hours/minutes in that case.
             */
            if (maxParts.hour !== undefined) {
                processedHours = processedHours.filter((hour) => {
                    const convertedHour = refParts.ampm === 'pm' ? (hour + 12) % 24 : hour;
                    return (use24Hour ? hour : convertedHour) <= maxParts.hour;
                });
                isPMAllowed = maxParts.hour >= 12;
            }
            if (maxParts.minute !== undefined && refParts.hour === maxParts.hour) {
                // The available minutes should only be filtered when the hour is the same as the max hour.
                // For example if the max hour is 10:30 and the current hour is 10:00,
                // users should be able to select 00-30 minutes.
                // If the current hour is 09:00, users should be able to select 00-60 minutes.
                processedMinutes = processedMinutes.filter((minute) => minute <= maxParts.minute);
            }
            /**
             * If ref day is after minimum
             * day do not render any hours/minute values
             */
        }
        else if (isAfter(refParts, maxParts)) {
            processedHours = [];
            processedMinutes = [];
            isAMAllowed = isPMAllowed = false;
        }
    }
    return {
        hours: processedHours,
        minutes: processedMinutes,
        am: isAMAllowed,
        pm: isPMAllowed,
    };
};
/**
 * Given DatetimeParts, generate the previous,
 * current, and and next months.
 */
const generateMonths = (refParts, forcedDate) => {
    const current = { month: refParts.month, year: refParts.year, day: refParts.day };
    /**
     * If we're forcing a month to appear, and it's different from the current month,
     * ensure it appears by replacing the next or previous month as appropriate.
     */
    if (forcedDate !== undefined && (refParts.month !== forcedDate.month || refParts.year !== forcedDate.year)) {
        const forced = { month: forcedDate.month, year: forcedDate.year, day: forcedDate.day };
        const forcedMonthIsBefore = isBefore(forced, current);
        return forcedMonthIsBefore
            ? [forced, current, getNextMonth(refParts)]
            : [getPreviousMonth(refParts), current, forced];
    }
    return [getPreviousMonth(refParts), current, getNextMonth(refParts)];
};
const getMonthColumnData = (locale, refParts, minParts, maxParts, monthValues, formatOptions = {
    month: 'long',
}) => {
    const { year } = refParts;
    const months = [];
    if (monthValues !== undefined) {
        let processedMonths = monthValues;
        if ((maxParts === null || maxParts === void 0 ? void 0 : maxParts.month) !== undefined) {
            processedMonths = processedMonths.filter((month) => month <= maxParts.month);
        }
        if ((minParts === null || minParts === void 0 ? void 0 : minParts.month) !== undefined) {
            processedMonths = processedMonths.filter((month) => month >= minParts.month);
        }
        processedMonths.forEach((processedMonth) => {
            const date = new Date(`${processedMonth}/1/${year} GMT+0000`);
            const monthString = new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, formatOptions), { timeZone: 'UTC' })).format(date);
            months.push({ text: monthString, value: processedMonth });
        });
    }
    else {
        const maxMonth = maxParts && maxParts.year === year ? maxParts.month : 12;
        const minMonth = minParts && minParts.year === year ? minParts.month : 1;
        for (let i = minMonth; i <= maxMonth; i++) {
            /**
             *
             * There is a bug on iOS 14 where
             * Intl.DateTimeFormat takes into account
             * the local timezone offset when formatting dates.
             *
             * Forcing the timezone to 'UTC' fixes the issue. However,
             * we should keep this workaround as it is safer. In the event
             * this breaks in another browser, we will not be impacted
             * because all dates will be interpreted in UTC.
             *
             * Example:
             * new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date('Sat Apr 01 2006 00:00:00 GMT-0400 (EDT)')) // "March"
             * new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date('Sat Apr 01 2006 00:00:00 GMT-0400 (EDT)')) // "April"
             *
             * In certain timezones, iOS 14 shows the wrong
             * date for .toUTCString(). To combat this, we
             * force all of the timezones to GMT+0000 (UTC).
             *
             * Example:
             * Time Zone: Central European Standard Time
             * new Date('1/1/1992').toUTCString() // "Tue, 31 Dec 1991 23:00:00 GMT"
             * new Date('1/1/1992 GMT+0000').toUTCString() // "Wed, 01 Jan 1992 00:00:00 GMT"
             */
            const date = new Date(`${i}/1/${year} GMT+0000`);
            const monthString = new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, formatOptions), { timeZone: 'UTC' })).format(date);
            months.push({ text: monthString, value: i });
        }
    }
    return months;
};
/**
 * Returns information regarding
 * selectable dates (i.e 1st, 2nd, 3rd, etc)
 * within a reference month.
 * @param locale The locale to format the date with
 * @param refParts The reference month/year to generate dates for
 * @param minParts The minimum bound on the date that can be returned
 * @param maxParts The maximum bound on the date that can be returned
 * @param dayValues The allowed date values
 * @returns Date data to be used in ion-picker-column
 */
const getDayColumnData = (locale, refParts, minParts, maxParts, dayValues, formatOptions = {
    day: 'numeric',
}) => {
    const { month, year } = refParts;
    const days = [];
    /**
     * If we have max/min bounds that in the same
     * month/year as the refParts, we should
     * use the define day as the max/min day.
     * Otherwise, fallback to the max/min days in a month.
     */
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const maxDay = (maxParts === null || maxParts === void 0 ? void 0 : maxParts.day) !== null && (maxParts === null || maxParts === void 0 ? void 0 : maxParts.day) !== undefined && maxParts.year === year && maxParts.month === month
        ? maxParts.day
        : numDaysInMonth;
    const minDay = (minParts === null || minParts === void 0 ? void 0 : minParts.day) !== null && (minParts === null || minParts === void 0 ? void 0 : minParts.day) !== undefined && minParts.year === year && minParts.month === month
        ? minParts.day
        : 1;
    if (dayValues !== undefined) {
        let processedDays = dayValues;
        processedDays = processedDays.filter((day) => day >= minDay && day <= maxDay);
        processedDays.forEach((processedDay) => {
            const date = new Date(`${month}/${processedDay}/${year} GMT+0000`);
            const dayString = new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, formatOptions), { timeZone: 'UTC' })).format(date);
            days.push({ text: dayString, value: processedDay });
        });
    }
    else {
        for (let i = minDay; i <= maxDay; i++) {
            const date = new Date(`${month}/${i}/${year} GMT+0000`);
            const dayString = new Intl.DateTimeFormat(locale, Object.assign(Object.assign({}, formatOptions), { timeZone: 'UTC' })).format(date);
            days.push({ text: dayString, value: i });
        }
    }
    return days;
};
const getYearColumnData = (locale, refParts, minParts, maxParts, yearValues) => {
    var _a, _b;
    let processedYears = [];
    if (yearValues !== undefined) {
        processedYears = yearValues;
        if ((maxParts === null || maxParts === void 0 ? void 0 : maxParts.year) !== undefined) {
            processedYears = processedYears.filter((year) => year <= maxParts.year);
        }
        if ((minParts === null || minParts === void 0 ? void 0 : minParts.year) !== undefined) {
            processedYears = processedYears.filter((year) => year >= minParts.year);
        }
    }
    else {
        const { year } = refParts;
        const maxYear = (_a = maxParts === null || maxParts === void 0 ? void 0 : maxParts.year) !== null && _a !== void 0 ? _a : year;
        const minYear = (_b = minParts === null || minParts === void 0 ? void 0 : minParts.year) !== null && _b !== void 0 ? _b : year - 100;
        for (let i = minYear; i <= maxYear; i++) {
            processedYears.push(i);
        }
    }
    return processedYears.map((year) => ({
        text: getYear(locale, { year, month: refParts.month, day: refParts.day }),
        value: year,
    }));
};
/**
 * Given a starting date and an upper bound,
 * this functions returns an array of all
 * month objects in that range.
 */
const getAllMonthsInRange = (currentParts, maxParts) => {
    if (currentParts.month === maxParts.month && currentParts.year === maxParts.year) {
        return [currentParts];
    }
    return [currentParts, ...getAllMonthsInRange(getNextMonth(currentParts), maxParts)];
};
/**
 * Creates and returns picker items
 * that represent the days in a month.
 * Example: "Thu, Jun 2"
 */
const getCombinedDateColumnData = (locale, todayParts, minParts, maxParts, dayValues, monthValues) => {
    let items = [];
    let parts = [];
    /**
     * Get all month objects from the min date
     * to the max date. Note: Do not use getMonthColumnData
     * as that function only generates dates within a
     * single year.
     */
    let months = getAllMonthsInRange(minParts, maxParts);
    /**
     * Filter out any disallowed month values.
     */
    if (monthValues) {
        months = months.filter(({ month }) => monthValues.includes(month));
    }
    /**
     * Get all of the days in the month.
     * From there, generate an array where
     * each item has the month, date, and day
     * of work as the text.
     */
    months.forEach((monthObject) => {
        const referenceMonth = { month: monthObject.month, day: null, year: monthObject.year };
        const monthDays = getDayColumnData(locale, referenceMonth, minParts, maxParts, dayValues, {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
        });
        const dateParts = [];
        const dateColumnItems = [];
        monthDays.forEach((dayObject) => {
            const isToday = isSameDay(Object.assign(Object.assign({}, referenceMonth), { day: dayObject.value }), todayParts);
            /**
             * Today's date should read as "Today" (localized)
             * not the actual date string
             */
            dateColumnItems.push({
                text: isToday ? getTodayLabel(locale) : dayObject.text,
                value: `${referenceMonth.year}-${referenceMonth.month}-${dayObject.value}`,
            });
            /**
             * When selecting a date in the wheel picker
             * we need access to the raw datetime parts data.
             * The picker column only accepts values of
             * type string or number, so we need to return
             * two sets of data: A data set to be passed
             * to the picker column, and a data set to
             * be used to reference the raw data when
             * updating the picker column value.
             */
            dateParts.push({
                month: referenceMonth.month,
                year: referenceMonth.year,
                day: dayObject.value,
            });
        });
        parts = [...parts, ...dateParts];
        items = [...items, ...dateColumnItems];
    });
    return {
        parts,
        items,
    };
};
const getTimeColumnsData = (locale, refParts, hourCycle, minParts, maxParts, allowedHourValues, allowedMinuteValues) => {
    const computedHourCycle = getHourCycle(locale, hourCycle);
    const use24Hour = is24Hour(computedHourCycle);
    const { hours, minutes, am, pm } = generateTime(locale, refParts, computedHourCycle, minParts, maxParts, allowedHourValues, allowedMinuteValues);
    const hoursItems = hours.map((hour) => {
        return {
            text: getFormattedHour(hour, computedHourCycle),
            value: getInternalHourValue(hour, use24Hour, refParts.ampm),
        };
    });
    const minutesItems = minutes.map((minute) => {
        return {
            text: addTimePadding(minute),
            value: minute,
        };
    });
    const dayPeriodItems = [];
    if (am && !use24Hour) {
        dayPeriodItems.push({
            text: getLocalizedDayPeriod(locale, 'am'),
            value: 'am',
        });
    }
    if (pm && !use24Hour) {
        dayPeriodItems.push({
            text: getLocalizedDayPeriod(locale, 'pm'),
            value: 'pm',
        });
    }
    return {
        minutesData: minutesItems,
        hoursData: hoursItems,
        dayPeriodData: dayPeriodItems,
    };
};

export { getClosestValidDate as A, generateMonths as B, getNumDaysInMonth as C, getCombinedDateColumnData as D, getMonthColumnData as E, getDayColumnData as F, getYearColumnData as G, isMonthFirstLocale as H, getTimeColumnsData as I, isLocaleDayPeriodRTL as J, calculateHourFromAMPM as K, getMonthAndYear as L, getDaysOfWeek as M, getDaysOfMonth as N, getHourCycle as O, getLocalizedTime as P, getLocalizedDateTime as Q, formatValue as R, isAfter as a, getNextMonth as b, isSameDay as c, getDay as d, generateDayAriaLabel as e, getPartsFromCalendarDay as f, getPreviousMonth as g, getNextYear as h, isBefore as i, getPreviousYear as j, getEndOfWeek as k, getStartOfWeek as l, getPreviousDay as m, getNextDay as n, getPreviousWeek as o, getNextWeek as p, parseMinParts as q, parseMaxParts as r, parseDate as s, parseAmPm as t, clampDate as u, validateParts as v, warnIfValueOutOfBounds as w, convertToArrayOfNumbers as x, convertDataToISO as y, getToday as z };
