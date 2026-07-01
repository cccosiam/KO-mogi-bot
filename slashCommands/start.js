const { SlashCommandBuilder } = require('discord.js');
const { getDisplayName, getMogi, resetRoomFlags, hasRole } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start a mogi in the current channel'),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);

		// if (!hasRole(interaction))
		// {
		// 	return interaction.reply({ content: `${displayName} does not have permission to start the mogi` });
		// }
		if (mogi.isCollecting)
		{
			return interaction.reply({ content: `Mogi has ${mogi.players.size} players -- type /c, /d, /l` });
		}

		await interaction.reply({ content: `${displayName} has started a mogi -- type /c, /d, or /l` });
		mogi.isCollecting = true;
		resetRoomFlags(mogi);
		mogi.startTime = context.timestamp();
		mogi.players.clear();
		mogi.notification.clear();
	}
};