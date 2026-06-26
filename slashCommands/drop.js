const { SlashCommandBuilder } = require('discord.js');
const { getDisplayName, getMogi, refreshLastMessageDates, resetRoomFlags } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('d')
		.setDescription('Leave the current mogi'),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);

		if (!mogi.isCollecting)
		{
			return interaction.reply({ content: `${displayName} cannot be dropped because a mogi has not been started` });
		}

		if (!mogi.players.has(interaction.user.id))
		{
			return interaction.reply({ content: `${displayName} is not in the mogi` });
		}

		mogi.players.delete(interaction.user.id);
		mogi.notification.delete(interaction.user.id);

		await interaction.reply({ content: `${displayName} has dropped from the mogi -- ${mogi.players.size} players` });

		if (mogi.players.size === context.client.config.room_size - 1)
		{
			refreshLastMessageDates(mogi, context.timestamp());
		}
		else if (mogi.players.size <= 1)
		{
			resetRoomFlags(mogi);
		}

		return undefined;
	}
};