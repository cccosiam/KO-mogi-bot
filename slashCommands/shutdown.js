const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('x')
		.setDescription('Shut the bot down'),
	execute: async (interaction, context) => {
		if (context.client.config.owner !== interaction.user.id)
		{
			return interaction.reply({ content: 'You do not have permission to shut the bot down' });
		}

		await interaction.reply({ content: 'Shutting down' });
		setTimeout(() => process.exit(), 1000);
	}
};