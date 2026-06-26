const { SlashCommandBuilder } = require('discord.js');

function parseScore(messageContent) {
    if (!messageContent || typeof messageContent !== 'string') {
        return 0;
    }
    const normalized = messageContent.trim().toLowerCase();
    const scoreMatch = normalized.match(/^([1-9][0-9]?)(?:st|nd|rd|th)?$/);
    if (!scoreMatch) {
        return 0;
    }
    const score = Number(scoreMatch[1]);
    return Number.isNaN(score) ? 0 : score;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scoreboard')
        .setDescription('Show the display names and reported final positions of all players in the current thread'),

    execute: async (interaction) => {
        const channel = interaction.channel;

        if (!channel || !channel.isThread()) {
            return interaction.reply({
                content: 'This command must be used inside a thread.',
                flags: 64, 
            });
        }

        await interaction.deferReply();

        const messages = await channel.messages.fetch({ limit: 100 });

        if (!messages.size) {
            return interaction.editReply({ content: 'No messages found in this thread.' });
        }

        const firstMessage = messages.reduce((oldest, msg) =>
            msg.createdTimestamp < oldest.createdTimestamp ? msg : oldest
        );

        // Extract mentioned user IDs from the first message
        const mentionedUserIds = [...firstMessage.mentions.users.keys()];

        if (!mentionedUserIds.length) {
            return interaction.editReply({
                content: 'Too many messages in thread. Cannot build player list.',
            });
        }

        const reportedScores = new Map();
        for (const message of messages.values()) {
            if (!message.author || message.author.bot) continue;
            const score = parseScore(message.content);
            if (score > 0) {
                // Keep the most recent score if a player reports multiple times
                if (!reportedScores.has(message.author.id)) {
                    reportedScores.set(message.author.id, score);
                }
            }
        }

        const scoreboardEntries = [];

        for (const userId of mentionedUserIds) {
            let displayName = userId;

            try {
                const guildMember = await interaction.guild.members.fetch(userId);
                displayName = guildMember.nickname || guildMember.displayName || guildMember.user.username;
            } catch {
                const cachedUser = firstMessage.mentions.users.get(userId);
                if (cachedUser) {
                    displayName = cachedUser.username;
                }
            }

            const score = reportedScores.get(userId) || 0;
            scoreboardEntries.push({
                name: String(displayName).replace(/`/g, ''),
                score,
            });
        }

        scoreboardEntries.sort((a, b) => {
            if (a.score === 0 && b.score === 0) return a.name.localeCompare(b.name);
            if (a.score === 0) return 1;
            if (b.score === 0) return -1;
            return a.score - b.score || a.name.localeCompare(b.name);
        });

        const scoreboard = scoreboardEntries
            .map(entry => `${entry.name} ${entry.score}`)
            .join('\n');

        return interaction.editReply({ content: `/table\n${scoreboard}` });
    },
};