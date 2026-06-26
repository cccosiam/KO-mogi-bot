const { SlashCommandBuilder } = require('discord.js');
const { getDisplayName, getMogi, hasRole } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('t')
		.setDescription('Tag the mogi players and send a message')
		.addStringOption(option =>
			option
				.setName('message')
				.setDescription('Message to send after tagging players')
				.setRequired(true)
		),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);

		if (!(mogi.isCollecting || mogi.players.size > 0))
		{
			return interaction.reply({ content: 'Mogi is not started -- type `/start` to start a mogi' });
		}

		if (!hasRole(interaction))
		{
			return interaction.reply({ content: `${displayName} does not have permission to tag/notify -- ask an updater to tag the room` });
		}

		const notification = Array.from(mogi.players.keys()).slice(0, 12).map(playerId => `<@${playerId}>`).join(' ') + ' ' + interaction.options.getString('message', true);
		return interaction.reply({ content: notification });
	}
};