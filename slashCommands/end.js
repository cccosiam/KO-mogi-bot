const { SlashCommandBuilder } = require('discord.js');
const { getDisplayName, getMogi, hasRole } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('end')
		.setDescription('End the current mogi'),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);
		const now = context.timestamp();

		if (!mogi.isCollecting)
		{
			return interaction.reply({ content: 'Mogi has already ended' });
		}

		if (!hasRole(interaction) && (mogi.players.size < context.client.config.room_size || (mogi.players.size >= context.client.config.room_size && mogi.isRoomFullSet && (now - mogi.dateFull < context.client.config.minimum_time_to_end_after_full))))
		{
			return interaction.reply({ content: `${displayName} does not have permission to end the mogi` });
		}

		mogi.isCollecting = false;
		return interaction.reply({ content: `${displayName} has ended the mogi` });
	}
};