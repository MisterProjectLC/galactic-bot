module.exports.timeFormatter = (time) => {
    return `${
        time <= 60 ? 
    `${time} segundo(s)` : (time <= 3600 ? 
        `${Math.floor(time/60)} minuto(s)` : (time <= 86400 ? 
            `${Math.floor(time/3600)} hora(s)` : 
                `${Math.floor(time/86400)} dia(s)`
            )
        )
    }`;
}