const { SlashCommandBuilder } = require('discord.js');
const { getMogi, hasRole } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('m')
		.setDescription('Show active mogi across channels'),
	execute: async (interaction, context) => {
		if (!hasRole(interaction))
		{
			return interaction.reply({ content: `${interaction.user.username.replace(/`/g, '')} does not have permission to view info` });
		}

		let collecting = 0;
		let full = 0;
		let list = '';

		for (const [channel, mogi] of context.mogichannel.entries())
		{
			if (mogi.isCollecting && mogi.players.size > 0)
			{
				collecting += 1;
				if (mogi.players.size >= context.client.config.room_size)
				{
					full += 1;
				}

				list += channel + ' - ' + mogi.players.size + '/' + context.client.config.room_size + '\n';
			}
		}

		return interaction.reply({ content: `There are ${collecting} active mogi and ${full} full mogi\n\n${list}` });
	}
};