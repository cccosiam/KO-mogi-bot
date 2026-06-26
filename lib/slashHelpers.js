const roleNames = [
	'MogiBot',
	'Updater',
	'Updaters',
	'Reporter',
	'Reporters',
	'Bronze Arbitrator',
	'Gold Arbitrator',
	'Diamond Arbitrator',
	'Lower Tier Arbitrator',
	'Higher Tier Arbitrator',
	'Arbitrator',
	'Arbitrators',
	'Boss',
	'Admin',
	'Administrator',
	'Administrators'
];

function getDisplayName(interaction)
{
	if (interaction.member && interaction.member.displayName)
	{
		return interaction.member.displayName.replace(/`/g, '');
	}

	return interaction.user.globalName
		? interaction.user.globalName.replace(/`/g, '')
		: interaction.user.username.replace(/`/g, '');
}

function getPlayerDisplayName(guild, player)
{
	const member = guild?.members?.cache?.get(player.id);
	if (member && member.displayName)
	{
		return member.displayName.replace(/`/g, '');
	}

	if (player.nickname)
	{
		return player.nickname.replace(/`/g, '');
	}

	if (player.username)
	{
		return player.username.replace(/`/g, '');
	}

	return player.id;
}

function getMogi(channel, mogichannel, Mogi)
{
	if (!mogichannel.has(channel))
	{
		mogichannel.set(channel, new Mogi());
	}

	return mogichannel.get(channel);
}

function hasRole(interaction)
{
	if (!interaction.member || !interaction.member.roles || !interaction.member.roles.cache)
	{
		return false;
	}

	return roleNames.some(roleName => interaction.member.roles.cache.some(role => role.name === roleName));
}

function orderedPlayers(mogi)
{
	return Array.from(mogi.players.values()).sort((left, right) => left.joinDate - right.joinDate);
}

function resetRoomFlags(mogi)
{
	mogi.isRoomHalfFullSet = false;
	mogi.isRoomAlmostFullSet = false;
	mogi.isRoomFullSet = false;
	mogi.dateFull = null;
	mogi.startTime = null;
	mogi.hasPingedHere = false;
}

function refreshLastMessageDates(mogi, now)
{
	for (const player of mogi.players.values())
	{
		player.lastMessageDate = now;
	}
}

function trim(name)
{
	return name.replace(/`/g, '').replace(/ /g, '');
}

module.exports = {
	getDisplayName,
	getPlayerDisplayName,
	getMogi,
	hasRole,
	orderedPlayers,
	refreshLastMessageDates,
	resetRoomFlags,
	trim
};