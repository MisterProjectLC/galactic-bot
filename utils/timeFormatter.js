module.exports.timeFormatter = (time) => {
    return `${
        time <= 60 ? 
    `${time} second(s)` : (time <= 3600 ? 
        `${Math.floor(time/60)} minute(s)` : (time <= 86400 ? 
            `${Math.floor(time/3600)} hour(s)` : 
                `${Math.floor(time/86400)} day(s)`
            )
        )
    }`;
}