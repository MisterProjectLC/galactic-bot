const get_phase = (guild) => {
    let retorno = -1;
    guild.members.cache.each((member) => {
        let role = member.roles.cache.find((role) => role.name.startsWith("Fase "));
        if (role)
            retorno = parseInt(role.name.slice(4));
    });

    return retorno;
}

// Exports
module.exports.get_phase = get_phase;
