const db = require('../external/database.js');
const time_adder = require('../utils/time_adder');
const saved_messages = require('../utils/saved_messages');

var requestConfirmation = (nome, date, msg) => {
    msg.reply(`Marcando evento: **${nome}**, às ${((date.getUTCHours()+21) % 24).toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}, no dia ` + 
    `${date.getDate().toString().padStart(2, '0')}/${(1+date.getMonth()).toString().padStart(2, '0')}/${date.getFullYear().toString()}. Confirma?`).then(m => {
        m.react('✅');
        m.react('❌');
        saved_messages.add_message(m.content + "lembrete", [nome, date, msg]);
    });
}

var insertLembrete = (nome, date, msg) => {
    db.makeQuery("INSERT INTO lembretes(nome, tempo, usuario, canal) VALUES ($1, to_timestamp($2/1000.0), $3, $4)", 
    [nome, date.getTime(), msg.author.id, msg.channel.id]);
}


const re_number = /^\d+[!?,.;]?$/;
const re_hours = /(\d+)(:|h|-)(\d+)?/;
const re_date = /(\d+)\/(\d+)/;
const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// Exports
module.exports = {
    name: "lembrete", 
    verb: "marcar",
    category: "Lembretes",
    description: "Marca um lembrete para você mesmo do futuro! Quando a data dada for atingida, eu te marcarei com um lembrete.", 
    examples: [`abra, lembrete "Aniversário de Sorocaba" às 15:33 de 14 de agosto: marca um lembrete para 15h33 do próximo dia 14 de agosto`,
    `abra, marcar "Natal" às 20h de 25/12: marca um lembrete para 20:00 do próximo dia 25 de dezembro`,
    `abra, lembrete "Jogatina" daqui meia hora: marca um lembrete para daqui 30 minutos`,
    `abra, marca "Clube do Jogo" às 20:00 daqui 2 semanas: marca um lembrete para as 20h do dia daqui 2 semanas`,
    `abra, lembrete "Clube do Jogo" na terça às 20h: marca um lembrete para as 20h da próxima terça`,
    `abra, lembrete padrão gamedev: marca um lembrete chamado 'Esperar a galera' para daqui 15 minutos`,],
    details: ["IMPORTANTE: O nome do lembrete PRECISA estar entre aspas."],
    min: 2, max: 10,
    execute: async (com_args, msg, quoted_list) => {
        let best_match = "";
        let best_score = 0;
        let current_time = new Date();

        if (com_args.includes("padrão") && com_args.includes("gamedev")) {
            requestConfirmation("Esperar a galera", time_adder.add_minutes(current_time, 15), msg);
            return;
        }

        if (quoted_list.length <= 0) {
            msg.reply("Ei, o nome do lembrete precisa estar entre aspas!");
            return;
        }

        let nome_evento = com_args[quoted_list[0]];
        let tempo = new Date();
        
        let daqui_index = com_args.includes("daqui") ? com_args.indexOf("daqui") : com_args.length;
        daqui_index = com_args.includes("até") ? com_args.indexOf("até") : daqui_index;
        daqui_index = com_args.includes("em") ? com_args.indexOf("em") : daqui_index;

        // Somando datas (daqui, até) -----------------
        for (let index = daqui_index; index < com_args.length; index += 1) {
            let element = com_args[index];

            // Daqui número sozinho
            let number_found = element.match(re_number);
            if (number_found) {
                let number = parseInt(element);
                if (index == com_args.length-1)
                    if (number >= current_time.getUTCFullYear())
                        tempo.setUTCFullYear(number);
                    else
                        tempo.setDate(number);

                switch(com_args[index+1]) {
                    case "segundos":
                        tempo.setUTCSeconds(tempo.getUTCSeconds() + number);
                        break;
                    case "minutos":
                        tempo.setUTCMinutes(tempo.getUTCMinutes() + number);
                        break;
                    case "horas":
                        tempo.setUTCHours(tempo.getUTCHours() + number);
                        break;
                    case "dias":
                        tempo.setUTCDate(tempo.getUTCDate() + number);
                        break;
                    case "semanas":
                        tempo.setUTCDate(tempo.getUTCDate() + 7*number);
                        break;
                    case "meses":
                        tempo.setUTCDate(tempo.getUTCDate() + 30*number);
                        break;
                }
            } 
            
            // Daqui meia
            else if (element == "meia") {
                if (index < com_args.length-1 && com_args[index+1] == "hora")
                    tempo.setUTCMinutes(tempo.getUTCMinutes() + 30);
            }
        }


        // Setando datas ---------------
        let element_handlers = []

        // Formato de hora
        element_handlers.push((element) => {
            let hours_found = element.match(re_hours);
            if (hours_found) {
                tempo.setUTCHours(parseInt(hours_found[1])+3);
                if (hours_found[3] != null)
                    tempo.setUTCMinutes(parseInt(hours_found[3]));
                else
                    tempo.setUTCMinutes(0);
                return true;
            }
        });

        // Amanhã
        element_handlers.push((element) => {
            if (element == "amanhã" || element == "amanha") {
                tempo.setUTCDate(tempo.getUTCDate() + 1);
                return true;
            }
        });

        let set_weekday = (dia) => {
            tempo.setUTCDate(tempo.getUTCDate() + ((7 + dia - tempo.getUTCDay()) % 7));
            if (tempo.getTime() < current_time.getTime())
            tempo.setUTCDate(tempo.getUTCDate() + 7);
        }

        // Nome do dia
        element_handlers.push((element) => {
            if (dias.includes(element.toLowerCase())) {
                set_weekday(dias.indexOf(element.toLowerCase()));
                return true;
            }
            else if (element.endsWith("-feira") && dias.includes(element.substring(0, element.length-6).toLowerCase())) {
                set_weekday(dias.indexOf(element.substring(0, element.length-6).toLowerCase()));
                return true;
            }
        });

        // Formato de data
        element_handlers.push((element) => {
            let date_found = element.match(re_date);
            if (date_found) {
                tempo.setUTCDate(parseInt(date_found[1]));
                tempo.setUTCMonth(parseInt(date_found[2])-1);
                return true;
            }
        });

        // Nome do mês
        element_handlers.push((element) => {
            if (meses.includes(element.toLowerCase())) {
                tempo.setMonth(meses.indexOf(element.toLowerCase()));
                return true;
            }
        });

        // Número sozinho
        element_handlers.push((element, index) => {
            let number_found = element.match(re_number);
            if (!number_found)
                return false;
            let number = parseInt(element);
            // Set year
            if (number >= current_time.getUTCFullYear())
                tempo.setUTCFullYear(number);
            else {
                // Set hour
                if (index > 0 && (com_args[index-1] == "às" || com_args[index-1] == "as")) {
                    tempo.setUTCHours(number + 3);
                    tempo.setUTCMinutes(0);
                }
                // Set day
                else
                    tempo.setDate(number);
            }

            return true;
        });

        // Testar cada handler para cada index
        element_handlers.forEach(handler => {
            for (let index = 0; index < daqui_index; index += 1) {
                handler(com_args[index], index);
            }
        });

        // Correções para o próximo ano
        if (tempo.getUTCFullYear() < current_time.getUTCFullYear())
            tempo.setUTCFullYear(current_time.getUTCFullYear());
        
        // Correções para o próximo mês
        if (tempo.getUTCFullYear() == current_time.getUTCFullYear() && tempo.getUTCMonth() < current_time.getUTCMonth())
            tempo.setUTCMonth(current_time.getUTCMonth());
        
        if (tempo.getUTCMonth() == current_time.getUTCMonth() && tempo.getUTCDate() < current_time.getUTCDate())
            tempo.setUTCMonth(current_time.getUTCMonth() + 1);

        requestConfirmation(nome_evento, tempo, msg);
    },

    reaction: async (reaction, user) => {
        let msg = reaction.message;
        if (saved_messages.get_message(msg.content + "lembrete")) {
            if (user != saved_messages.get_message(msg.content + "lembrete")[0][2].author)
                return;

            if (reaction.emoji.toString() === "✅") {
                insertLembrete(...saved_messages.get_message(msg.content + "lembrete")[0]);
                msg.edit("Marcado!");
            } else
                msg.edit("Lembrete cancelado...");
            
            saved_messages.remove_message(msg.content + "lembrete");
            msg.reactions.removeAll();
        }
    },
    permission: (msg) => true
};
