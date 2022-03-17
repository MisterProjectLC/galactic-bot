const Discord = require('discord.js');
const {isValid} = require('../systems/autoDeleter');

// Exports
module.exports = {
    name: "manual",
    category: "Geral",
    description: "Explica os sistemas, mecânicas e regras de combate.", 
    min: 0, max: 0, cooldown: 5,
    execute: async (com_args, msg) => {
        let embed = new Discord.MessageEmbed()
        .setColor(0x1d51cc)
        .setTitle("Manual de combate")
        .addField("Atacando e defendendo", `Batalhas ocorrem em turnos, com o Lado A sempre indo primeiro. Batalhas podem durar até 9 turnos - se o Turno 9 for alcançado, o Lado B vence imediatamente.
        Jogadores apenas podem atacar um inimigo quando o inimigo anterior for derrotado. Inimigos, por outro lado, acertam todos os jogadores de uma vez com cada ataque.`, false)
        .addField("Escolhendo seu arsenal", `Antes de entrar em combate, jogadores precisam escolher duas armas e duas armaduras de seu arsenal.`+
        `Para ajudar com essa decisão, os inimigos que você vai lutar sempre são mostrados antes do combate. Examine seus oponentes cuidadosamente e escolha sua estratégia!`, false)
        .addField("Atributos de ataque", "Toda arma tem dois atributos principais: dano e taxa de ataque. Dano aumenta com o nível da arma - quanto maior o nível, " +
        "maior o dano. A taxa de ataque, por outro lado, é fixa. Se a taxa for menor que 1, a arma precisa 'carregar' antes de " +
        "atacar, e por isso pode não atacar até sua carga acumular até 1.", false)
        .addField("Atributos de defesa", "Existem 5 atributos de defesa no jogo: ", false)
        .addField("Vida", "Se isto bater 0, o jogador sai do combate. Vida aumenta em 4 todo nível.", true)
        .addField("Escudos", "Vida adicional que não pode ser curada. Escudos são maiores, porém mais vulneráveis contra certos tipos de ataque.", true)
        .addField("Placa", "Reduz o dano recebido de cada ataque. Também reduz consideravelmente a chance de Choque (explicado depois).", true)
        .addField("Regen", "Cura a Vida (não os Escudos) do jogador todo turno.", true)
        .addField("Evasão", "Chance de evitar um ataque completamente. Evasão é acumulada todo turno, mas divide pela metade toda vez que o jogador se esquivar de um ataque.", true)
        .addField("Efeitos", "Algumas armas possuem efeitos elementais adicionais com propriedades especiais: ", false)
        .addField("Fogo", "Metade do dano deste ataque ignora Escudos e Placa.", true)
        .addField("Plasma", "Causa dano dobrado contra Escudos.", true)
        .addField("Ácido", "A Placa do defensor é reduzida em 1/8 do dano deste ataque.", true)
        .addField("Gelo", "A evasão do defensor é reduzida em 1/4 do dano deste ataque.", true)
        .addField("Shock", "O dano deste ataque divido pela Placa do defensor é igual a chance de atordoar o defensor, fazendo com que ele perca seus ataques (chance max. 30%). Combatentes atordoados ainda podem esquivar e carregar armas não-carregadas.", true)
        .addField("Bio", "Metade do dano deste ataque recupera a vida do atacante.", true)
        .addField("Vazio", "Todo dano causado por este ataque não pode ser curado.", true);


        msg.reply({embeds: [embed]});
    }, 
    permission: async (msg) => true
};
