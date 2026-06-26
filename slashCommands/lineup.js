const { SlashCommandBuilder } = require('discord.js');
const { getMogi, getPlayerDisplayName, orderedPlayers } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('l')
		.setDescription('List the mogi players'),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);

		if (mogi.isCollecting || mogi.players.size > 0)
		{
			if (mogi.players.size === 0)
			{
				return interaction.reply({ content: 'There are no players in the mogi' });
			}

			const players = orderedPlayers(mogi);
			let list = '`Mogi List`\n';
			let rng = '';

			for (let index = 0; index < players.length; index += 1)
			{
				const player = players[index];
				const displayName = getPlayerDisplayName(interaction.guild, player);
				list += '`' + (index + 1) + '.` ' + displayName + '\n';
				if (index < 12)
				{
					rng += ' ' + displayName.replace(/ /g, '');
				}
			}

			// list += '\n\n';
			// list += 'RandomBot command: `/teams  # ' + rng + '`';
			return interaction.reply({ content: list });
		}

		return interaction.reply({ content: 'Mogi is not started -- type `/start` to start a mogi' });
	}
};