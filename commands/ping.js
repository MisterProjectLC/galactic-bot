// Exports
module.exports = {
    name: "ping", 
    verb: "pingar",
    category: "Geral",
    description: "Testa minha latência, retornando o tempo de espera das minhas respostas.", 
    min: 0, max: 0,
    execute: async (com_args, msg, quoted_list, client) => {
        msg.channel.send(`**Pinging...**`).then(m => {
            var ping = m.createdTimestamp - msg.createdTimestamp;
            var api_ping = Math.round(client.ws.ping);

            m.edit(`**:ping_pong: Pong!**\n**Minha latência é:** ${ping}ms.\n**A latência da API é:** ${api_ping}ms.`);

        });
    }, 
    permission: (msg) => true
};
