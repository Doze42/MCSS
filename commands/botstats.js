//botstats command
const sys = require('systeminformation');
const Discord = require('discord.js') //discord.js for embed object
const strings = require('../funcs/strings')
module.exports = {run}
if (global.botConfig.enableMessageEdit){var meState = ':white_check_mark: Enabled'}
if (!global.botConfig.enableMessageEdit){var meState = ':no_entry: Disabled'}
if (global.botConfig.enableChannelEdit){var ceState = ':white_check_mark: Enabled'}
if (!global.botConfig.enableChannelEdit){var ceState = ':no_entry: Disabled'}
async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	global.toConsole.log('/botstats run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
	try{
		var shardSizes = await client.shard.broadcastEval((_) => _.guilds.cache.size);
		var guildCount = 0;
		for (var i = 0; i < shardSizes.length; i++) {guildCount += shardSizes[i];}
		await interaction.reply({embeds: [
		new Discord.MessageEmbed()
			.setColor(3447003)
			.setDescription(
			[ //assemble multiline string for embed
			'***Bot Statistics:***',
			"**Servers: **" + guildCount,
			"**Bot Version: **" + global.botConfig.botver
			].join("\n"))
			.addField('***Server Performance***',
			[
			'**Server: **' + await sys.osInfo().then(data => data.hostname),
			'**CPU: **' + await sys.cpu().then(data => data.manufacturer + ' ' + data.brand + ' @'+ data.speed + 'GHz') + await sys.currentLoad().then(data => ' (' + Math.round(data.currentload) + '% load)'),
			'**Memory: **' + await sys.mem().then(data => Math.round(data.total / 1073741824) + 'GB (' + Math.round((data.free / data.total) * 100) + '% free)')
			].join("\n"), false)
			.addField ('***Shard Info***',
			[
			"**Shard ID: **" + client.shard.id,
			'**Guilds Handled: **' + client.guilds.cache.size,
			"**Shard Uptime: **" + strings.elapsedTime(global.shardInfo.spawnTime).clean,
			"**Commands Processed: **" + global.shardInfo.commandsRun,
			"**Live Status Run Time: **" + global.shardInfo.liveStatusTime / 1000
			].join("\n"), false)
			.addField('***Module States***', '**Message Edit Live Status: **' + meState + '\n **Channel Edit Live Status: **' + ceState)
			.setFooter({text:stringJSON.embeds.footerText})
			.setTimestamp()]
		})
	}
	catch(err){
	console.log('Error!')
	console.log({command: 'invite',
	error: err})
	}	
}