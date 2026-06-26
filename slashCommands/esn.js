const { SlashCommandBuilder } = require('discord.js');
const { getDisplayName, getMogi, hasRole, resetRoomFlags } = require('../lib/slashHelpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('esn')
		.setDescription('End the current mogi and start a new one'),
	execute: async (interaction, context) => {
		const mogi = getMogi(interaction.channel, context.mogichannel, context.Mogi);
		const displayName = getDisplayName(interaction);
		const result = module.exports.endMogi(mogi, context, displayName);
		if (!result.success)
		{
			return interaction.reply({ content: result.message });
		}

		return interaction.reply({ content: result.message });
	}
};

// Reusable helper to end/start a mogi programmatically.
module.exports.endMogi = function(mogi, context, displayName = 'MogiBot', options = {})
{
    const now = context.timestamp();

    if (!options.skipChecks)
    {
        // if (mogi.isCollecting && (mogi.players.size < context.client.config.room_size || (mogi.players.size >= context.client.config.room_size && mogi.isRoomFullSet && (now - mogi.dateFull < context.client.config.minimum_time_to_end_after_full))))
        // {
            return { success: false, message: `Mogi cannot be ended at this time. Please wait until the room is full or the minimum time has passed.` };
        // }
    }

    mogi.isCollecting = false;
    resetRoomFlags(mogi);
    mogi.players.clear();
    mogi.notification.clear();
    mogi.isCollecting = true;

    return { success: true, message: `${displayName} has ended the mogi and started a new one -- type /c, /d, or /l` };
};