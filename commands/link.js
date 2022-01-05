const axios = require('axios');
const compareTwoStrings = require('string-similarity').compareTwoStrings;

// Exports
module.exports = {
    name: "link", 
    verb: "linkar",
    category: "Geral",
    description: "Linka um jogo da Maritaca Gamedev.", 
    examples: [`abra, link ThaumOS: linka o jogo ThaumOS`, 
    `abra, linkar "Iporanga Space Station": linka o jogo Iporanga Space Station`],
    details: ["Caso o nome do jogo tenha várias palavras, recomenda-se o uso de aspas."],
    min: 2, max: 2,
    execute: async (com_args, msg) => {
        let best_match = "";
        let best_score = 0;

        axios.get('https://itch.io/api/1/bGgpzTQx8JLb0vV0zjjDkVYrqR9h1cADuBR91ppV/my-games').then( response => {
            com_args.forEach(arg => {
                let lower_arg = arg.toLowerCase();
                response.data.games.forEach(element => {
                    let lower_title = element.title.toLowerCase();
                    let score = compareTwoStrings(lower_arg, lower_title);
                    if (score > best_score) {                
                        best_match = element.url;
                        best_score = score;
                    }
                });
            });

            console.log(best_score);
            if (best_score > 0.5)
                msg.reply(`Aqui está: ${best_match}`);
            else
                msg.reply(`Acho que é esse, mas não tenho certeza...\n${best_match}`);
        });



    }, 
    permission: (msg) => true
};
