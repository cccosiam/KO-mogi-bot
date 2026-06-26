/**
 * MogiBot
 * 
 * @author 255MP
 * 
 */

const Discord = require('discord.js');
const fs = require('fs')
const path = require('path');
const config = require('./config.json');
const { GatewayIntentBits, Collection } = Discord;
const client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	]
});
client.slashCommands = new Collection();
client.config = config

const slashCommandFiles = fs.readdirSync(path.join(__dirname, 'slashCommands')).filter(file => file.endsWith('.js'));
const slashCommandDefinitions = [];

for (const file of slashCommandFiles) {
	const command = require(path.join(__dirname, 'slashCommands', file));
	client.slashCommands.set(command.data.name, command);
	slashCommandDefinitions.push(command.data.toJSON());
}

const roomSizeHalf = Math.floor(config.room_size / 2);

const mogichannel = new Map();
const boottime = timestamp();

var BrowserConsole = function ()
{
}

BrowserConsole.out = function(message)
{
	console.log("[" + new Date().toUTCString() + "] " + message);
};

function Mogi()
{
	this.isCollecting = false,
	this.isRoomHalfFullSet = false,
	this.isRoomAlmostFullSet = false,
	this.isRoomFullSet = false,
	this.dateFull = null,
	this.startTime = null,
	this.hasPingedHere = false,
	this.players = new Discord.Collection(),
	this.notification = new Discord.Collection();
}

function Notification()
{
	this.id = 0,
	this.sent = 0;
}

function Player()
{
	this.id = 0,
	this.nickname = null,
	this.username = null,
	this.joinDate = null,
	this.lastMessageDate = null;
}

function nickname(message)
{
	if (message.member === null || message.member.nickname === null)
	{
		return message.author.username.replace(/`/g, '');
	}
	else
	{
		return message.member.nickname.replace(/`/g, '');
	}
}

function moginickname(nickname, username)
{
	if (nickname === null)
	{
		return username.replace(/`/g, '');
	}
	else
	{
		return nickname.replace(/`/g, '');
	}
}

function trim(name)
{
	return name.replace(/`/g, '').replace(/ /g, '');
}

function hasRole(message)
{
	return hasRoleName(message, 'MogiBot') ||
			hasRoleName(message, 'Updater') ||
			hasRoleName(message, 'Updaters') ||
			hasRoleName(message, 'Bronze Arbitrator') ||
			hasRoleName(message, 'Gold Arbitrator') ||
			hasRoleName(message, 'Diamond Arbitrator') ||
			hasRoleName(message, 'Lower Tier Arbitrator') ||
			hasRoleName(message, 'Higher Tier Arbitrator') ||
			hasRoleName(message, 'Arbitrator') ||
			hasRoleName(message, 'Arbitrator') ||
			hasRoleName(message, 'Arbitrators') ||
			hasRoleName(message, 'Boss') ||
			hasRoleName(message, 'Admin') ||
			hasRoleName(message, 'Administrator') ||
			hasRoleName(message, 'Administrators');
}

function hasRoleName(message, name)
{
	var mogirole = message.guild && message.guild.roles && message.guild.roles.cache
		? message.guild.roles.cache.find(role => role.name === name)
		: null;
	if (mogirole != null && message.member != null)
	{
		return message.member.roles.cache.has(mogirole.id);
	}
}

function timestamp()
{
	return new Date().getTime();
}

async function sendWithAutoDelete(channel, content, deleteAfter)
{
	const message = await channel.send(content);
	if (deleteAfter > 0)
	{
		setTimeout(() => {
			message.delete().catch(error => { BrowserConsole.out(error); });
		}, deleteAfter);
	}

	return message;
}

client.once('clientReady', async () => {
	BrowserConsole.out(`Logged in as ${client.user.tag}!`);
	try
	{
		const registeredGuilds = [];

		await client.application.commands.set([]);

		for (const guild of client.guilds.cache.values())
		{
			await guild.commands.set(slashCommandDefinitions);
			registeredGuilds.push(guild.name || guild.id);
		}

		BrowserConsole.out(`Registered ${slashCommandDefinitions.length} slash command(s) in ${registeredGuilds.length} guild(s)`);
	}
	catch (error)
	{
		BrowserConsole.out(`Failed to register slash commands: ${error.message}`);
	}
});

client.on('reconnecting', () => {
	BrowserConsole.out(`Reconnecting as ${client.user.tag}!`);
});

client.on('error', error => {
	BrowserConsole.out("There was an error" + error.message);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.slashCommands.get(interaction.commandName);
	if (!command) return;

	try
	{
		await command.execute(interaction, {
			client,
			BrowserConsole,
			getMogi: channel => {
				if (!mogichannel.has(channel))
				{
					mogichannel.set(channel, new Mogi());
				}

				return mogichannel.get(channel);
			},
			mogichannel,
			Mogi,
			timestamp,
			Player,
			roomSizeHalf,
			sendWithAutoDelete,
			moginickname
		});
	}
	catch (error)
	{
		console.error(error);
		if (interaction.replied || interaction.deferred)
		{
			await interaction.followUp({ content: 'there was an error trying to execute that command!', ephemeral: true });
		}
		else
		{
			await interaction.reply({ content: 'there was an error trying to execute that command!', ephemeral: true });
		}
	}
});

process.on('unhandledRejection', error => { BrowserConsole.out(error); });

client.login(config.token);

// mogi room clean up
function cleanMogi()
{
	var now = timestamp();
	var hasMogi = false;
	mogichannel.forEach((mogi, channel, map) => 
	{
		if (mogi.isCollecting && mogi.players.size > 0)
		{
			hasMogi = true;
		}
	});

	var uptime = now - boottime;
	if (!hasMogi && uptime >= config.minimum_uptime)
	{
		uptime = uptime / 60000;
		BrowserConsole.out("Rebooting because there are no active mogi with an uptime of " + uptime + " minutes");
		process.exit();
		return;
	}

	mogichannel.forEach((mogi, channel, map) => 
	{
		if (mogi.isCollecting && mogi.players.size > 0 && mogi.players.size < config.room_size)
		{
			var playerslist = Array.from(mogi.players.keys());
			for (var i = 0; i < playerslist.length; i++)
			{
				var player = mogi.players.get(playerslist[i]);
				var timelapse = now - player.lastMessageDate;

				if (timelapse >= config.inactive_message_after && timelapse <= config.remove_from_mogi_after)
				{
					if (!mogi.notification.has(player.id))
					{
						var notice = new Notification();
						notice.id = player.id;
						notice.sent = 0;

						mogi.notification.set(player.id, notice);
					}
				}

				if (timelapse > config.remove_from_mogi_after)
				{
					if (mogi.notification.has(player.id))
					{
						var notice = mogi.notification.get(player.id);
						mogi.notification.delete(player.id);
						mogi.players.delete(player.id);

						sendWithAutoDelete(channel, moginickname(player.nickname, player.username) + " has been removed due to inactivity", config.normal_message_delete_rate).catch(error => { BrowserConsole.out(error); });
					}
				}
			}

			var found = false;
			var notification = '';
			var notificationlist = Array.from(mogi.notification.keys());
			for (var j = 0; j <notificationlist.length; j++)
			{
				var notice = mogi.notification.get(notificationlist[j]);
				if (notice.sent == 0)
				{
					notification += '<@' +notice.id + '> '
					notice.sent = 1;
					found = true;
				}
			}

			if (found)
			{
				notification += ' please type something in the chat within 5 minutes to keep your spot in the mogi';
				sendWithAutoDelete(channel, notification, config.inactive_message_delete_rate).catch(error => { BrowserConsole.out(error); });
			}
		}
	});
}

setInterval(function() { cleanMogi() }, config.inactive_check_rate);
