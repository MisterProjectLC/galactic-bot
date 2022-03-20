module.exports.getUserIDFromMention = (mention) => {
	if (!mention) return null;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!') || mention.startsWith('&')) {
			mention = mention.slice(1);
		}
	}

    return mention;
}