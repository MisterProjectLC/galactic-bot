
module.exports.removeReactions = async (msg, userID) => {
    const userReactions = msg.reactions.cache.filter(reaction => reaction.users.cache.has(userID));
    try {
        for (const reaction of userReactions.values()) {
            await reaction.users.remove(userID);
        }
    } catch (error) {
        console.error('Failed to remove reactions.');
    }
}