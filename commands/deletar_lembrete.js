const db = require('../external/database.js');
const saved_messages = require('../utils/saved_messages');

var requestConfirmation = (nome, date, msg, m) => {
    m.edit(`Deletando evento: **${nome}**, às ${((date.getUTCHours()+21) % 24).toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}, no dia ` + 
    `${date.getDate().toString().padStart(2, '0')}/${(1+date.getMonth()).toString().padStart(2, '0')}/${date.getFullYear().toString()}. Confirma?`).then(m => {
        m.react('✅');
        m.react('❌');
        saved_messages.add_message(m.content + "delete_lembrete", [nome, msg.author.id, msg]);
    });
}

var deleteLembrete = (nome, date, msg) => {
    db.makeQuery("DELETE FROM lembretes WHERE nome ILIKE $1 AND usuario ILIKE $2", [nome, msg.author.id]);
}

// Exports
module.exports = {
    name: "deletar_lembrete", 
    verb: "deletar",
    verb_complement: "lembrete",
    category: "Lembretes",
    description: "Deleta um lembrete que você marcou.", 
    examples: [`abra, deleta o lembrete "Clube do Jogo": deleta um lembrete com o nome "Clube do Jogo", caso tenha sido você que o marcou.`],
    details: ["IMPORTANTE: O nome do lembrete PRECISA estar entre aspas."],
    min: 2, max: 10,
    execute: async (com_args, msg, quoted_list) => {

        if (quoted_list.length <= 0) {
            msg.reply("Ei, o nome do lembrete precisa estar entre aspas!");
            return;
        }

        let nome_evento = com_args[quoted_list[0]];
        msg.reply("Procurando lembrete...").then(async m => {
            await db.makeQuery("SELECT tempo, usuario FROM lembretes WHERE nome ILIKE $1 AND usuario ILIKE $2", [nome_evento, msg.author.id]).then(response => {
                if (response.rows.length <= 0)
                    m.edit("Desculpa, mas não consegui encontrar um evento com esse nome marcado por você...");
                else
                    requestConfirmation(nome_evento, response.rows[0].tempo, msg, m);
            });
        });

        
    },

    reaction: async (reaction, user) => {
        let msg = reaction.message;
        if (saved_messages.get_message(msg.content + "delete_lembrete")) {
            if (user != saved_messages.get_message(msg.content + "delete_lembrete")[0][2].author)
                return;

            if (reaction.emoji.toString() === "✅") {
                deleteLembrete(...saved_messages.get_message(msg.content + "delete_lembrete")[0]);
                msg.edit("Deletado!");
            } else
                msg.edit("Deleção cancelada!");

            saved_messages.remove_message(msg.content + "delete_lembrete");
            msg.reactions.removeAll();
        }
    },
    permission: (msg) => true
};
