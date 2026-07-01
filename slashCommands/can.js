const { ChannelType, SlashCommandBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const { getDisplayName, getMogi, getPlayerDisplayName, resetRoomFlags } = require('../lib/slashHelpers');
const esn = require('./esn.js'); 

module.exports = {
	data: new SlashCommandBuilder()
		.setName('c')
		.setDescription('Join the current mogi'),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);

		if (!mogi.isCollecting)
		{
			return interaction.reply({ content: `${displayName} cannot join because a mogi has not been started -- type /start to start a mogi` });
		}

		if (mogi.players.has(interaction.user.id))
		{
			return interaction.reply({ content: `${displayName} is already in the mogi -- ${mogi.players.size} players` });
		}

		if (mogi.players.size >= context.client.config.max_room_size)
		{
			return interaction.reply({ content: `${displayName} cannot join because the mogi is full` });
		}

		const player = new context.Player();
		player.id = interaction.user.id;
		player.username = interaction.user.username;
		player.nickname = interaction.member && interaction.member.nickname ? interaction.member.nickname : null;
		player.joinDate = context.timestamp();
		player.lastMessageDate = player.joinDate;
		mogi.players.set(interaction.user.id, player);

		const isRoomNowFull = mogi.players.size === context.client.config.room_size;
		let shouldCreateThread = false;

		if (isRoomNowFull && !mogi.isRoomFullSet)
		{
			mogi.isRoomFullSet = true;
			mogi.dateFull = player.joinDate;
			shouldCreateThread = true;
			mogi.startTime = context.timestamp();
			mogi.hasPingedHere = false;

			mogi.threadPlayerSnapshot = new Map(mogi.players);
		}

		await interaction.reply({ content: `${displayName} has joined the mogi -- ${mogi.players.size} players` });

		const tagsRole = interaction.guild.roles.cache.get(context.client.config.tags_role_id);
		const tagsMention = tagsRole ? `<@&${tagsRole.id}>` : '@Tags';	
		// if (!isRoomNowFull && !mogi.hasPingedHere && mogi.startTime && context.timestamp() - mogi.startTime >= context.client.config.ping_here_after)
		// {
		// 	mogi.hasPingedHere = true;
		// 	await interaction.channel.send(`@here +${context.client.config.room_size - mogi.players.size}`);
		// }

		// if (!mogi.isRoomHalfFullSet && mogi.players.size === context.roomSizeHalf)
		// {
		// 	await interaction.channel.send(`@Tags +${context.client.config.room_size - context.roomSizeHalf}`);
		// 	mogi.isRoomHalfFullSet = true;
		// }
		// else if (!mogi.isRoomAlmostFullSet && mogi.players.size === (context.client.config.room_size - 1))
		// {
		// 	await interaction.channel.send('@Tags +1');
		// 	mogi.isRoomAlmostFullSet = true;
		// }
		if (!mogi.isRoomHalfFullSet && mogi.players.size === context.roomSizeHalf)
		{
    		await interaction.channel.send({
				content: `${tagsMention} +${context.client.config.room_size - context.roomSizeHalf}`,
				allowedMentions: { roles: [context.client.config.tags_role_id] }
			});
			mogi.isRoomHalfFullSet = true;
		}
		else if (!mogi.isRoomAlmostFullSet && mogi.players.size === (context.client.config.room_size - 1))
		{
			await interaction.channel.send({
				content: `${tagsMention} +1`,
				allowedMentions: { roles: [context.client.config.tags_role_id] }
			});
			mogi.isRoomAlmostFullSet = true;
}
		if (shouldCreateThread)
		{
			mogi.notification.clear();
			await interaction.channel.send(`There are ${context.client.config.room_size} players in the mogi`);
			const playerIds = Array.from(mogi.threadPlayerSnapshot.keys());
			const playerNames = playerIds.map(playerId => getPlayerDisplayName(interaction.guild, mogi.players.get(playerId)));
			const notification = playerIds.map(playerId => `<@${playerId}>`).join(' ') + 
            ` mogi has ${context.client.config.room_size} players\n` + 
            `\nTable command:\n\`\`\`/table\n${playerNames.map(player => `${player}`).join(' 0\n')} 0\`\`\`` +
            `\nReplace the \`0\`s with each players' placement at the end of the rally. **Top 4** makes table.` + 
            `\nAnyone may host the room. Players have 3 minutes to join the room. Force start at 6 minutes. Only **1** rally per event.\nPlease use \`/ping_staff\` if you need help. Good luck!\n`;
			const now = new Date();
			const ts = `${String(now.getUTCMonth() + 1)}/${String(now.getUTCDate())}, ${String(now.getUTCHours())}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
			const thread = await interaction.channel.threads.create({
				name: `${interaction.channel.name || interaction.channel.id} mogi - ${ts}`,
				type: ChannelType.PrivateThread,
				invitable: false,
				autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
				reason: 'Mogi room reached full capacity'
			});

			await thread.send(notification);

			await interaction.channel.send(`Room thread has been created.`); //\nType /l to get a list of the players\nType /esn to end the mogi and start a new one

			// Automatically end the mogi and start a new one now that the thread exists.
			try {
				const endResult = esn.endMogi(mogi, context, 'MogiBot', { skipChecks: true });
				if (endResult && endResult.message)
				{
					await interaction.channel.send(endResult.message);
				}
			} catch (err) {
				// don't let auto-end crash the command
				console.error('auto esn failed', err);
			}
		}

		return undefined;
	}
};