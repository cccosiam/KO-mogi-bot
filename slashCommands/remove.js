const { SlashCommandBuilder } = require('discord.js');
const { getDisplayName, getMogi, getPlayerDisplayName, hasRole, orderedPlayers, resetRoomFlags, refreshLastMessageDates } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('r')
		.setDescription('Remove a player from the mogi by position')
		.addIntegerOption(option =>
			option
				.setName('index')
				.setDescription('Player number on the list')
				.setRequired(true)
				.setMinValue(1)
		),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);

		if (!mogi.isCollecting)
		{
			return interaction.reply({ content: 'Mogi is not started -- type `/start` to start a mogi' });
		}

		if (!hasRole(interaction))
		{
			return interaction.reply({ content: `${displayName} does not have permission to remove -- ask staff to remove a player` });
		}

		const index = interaction.options.getInteger('index', true);
		if (mogi.players.size === 0)
		{
			return interaction.reply({ content: 'There are no players in the mogi to remove' });
		}

		if (index < 1 || index > mogi.players.size)
		{
			if (mogi.players.size === 1)
			{
				return interaction.reply({ content: 'You can remove the first player by typing `/r 1`' });
			}

			return interaction.reply({ content: `You can remove the player by typing /r # where # is from 1 to ${mogi.players.size}` });
		}

		const players = orderedPlayers(mogi);
		const player = players[index - 1];
		const playerId = player.id;
		mogi.players.delete(playerId);
		mogi.notification.delete(playerId);

		await interaction.reply({ content: `${getPlayerDisplayName(interaction.guild, player)} has been removed from the mogi` });

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