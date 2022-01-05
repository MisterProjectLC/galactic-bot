const add_seconds = (time, seconds) => {
    return new Date(time.getTime() + 1000 * seconds);
}

const add_minutes = (time, minutes) => {
    return add_seconds(time, minutes*60);
}

const add_hours = (time, hours) => {
    return add_minutes(time, hours*60);
}

const add_days = (time, days) => {
    return add_hours(time, days*24);
}

const add_weeks = (time, weeks) => {
    return add_days(time, weeks*7);
}

const add_months = (time, weeks) => {
    return add_days(time, weeks*30);
}

// Exports
module.exports.add_seconds = add_seconds;
module.exports.add_minutes = add_minutes;
module.exports.add_hours = add_hours;
module.exports.add_days = add_days;
module.exports.add_weeks = add_weeks;
module.exports.add_months = add_months;