//botstats command

const si = require('systeminformation')
const strings = require('../funcs/strings')
const { EmbedBuilder, AttachmentBuilder } = require('discord.js'); //discord.js for embed object
const richEmbeds = require('../funcs/embeds'); //embed generation

module.exports = {run}

async function run(client, interaction, stringJSON){
	try{
		global.shardInfo.commandsRun++
		global.toConsole.log(`/botstats run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
		let os = await si.osInfo().then(data => data.platform)
		let cpu = {"manufacturer": "Unknown", "brand": "Unknown", "speed": "NaN", "currentLoad": "NaN"} //Workaround for Windows
		if (os == "linux"){cpu = await si.cpu()}	
		let mem = await si.mem()
		let shardID = client.shard.id;
		if (interaction.options.getInteger('shard') !== null){
			shardID = interaction.options.getInteger('shard');
			if (shardID < 0 || shardID > (global.botConfig.shardCount - 1)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.botstats.badID, 'error', stringJSON)]});}
		}
		let shardSizes = await client.shard.broadcastEval(client => client.guilds.cache.size);
		let guildCount = 0;
		for (var i = 0; i < shardSizes.length; i++) {guildCount += shardSizes[i];}
		await interaction.reply({
			files: [new AttachmentBuilder(Buffer.from(staticImages.botstats_icon, 'base64'), {name: 'botstats.png'})],
			embeds: [
			new EmbedBuilder({
				"thumbnail": {url: "attachment://botstats.png"},
				"color": 3447003,
				"footer": {text:stringJSON.embeds.footerText},
				"timestamp": new Date().toISOString(),
				"fields":[		
					{
						name: stringJSON.botstats.info.header,
						value: `${stringJSON.botstats.info.servers}${guildCount}\n${stringJSON.botstats.info.shards}${global.botConfig.shardCount}\n${stringJSON.botstats.info.version}${global.botConfig.botver}\n${stringJSON.botstats.info.uptime}${strings.elapsedTime(global.botStartTime).clean}\n${stringJSON.botstats.info.crashCount}${global.shardCrashCount}`
					},
					{
						name: stringJSON.botstats.serverPerf.header,
						value: `${stringJSON.botstats.serverPerf.server}${await si.osInfo().then(data => data.hostname)}\n${stringJSON.botstats.serverPerf.cpu}${cpu.manufacturer} ${cpu.brand} @${cpu.speed}GHz (${await si.currentLoad().then(data => Math.round(data.currentLoad))}% load) \n${stringJSON.botstats.serverPerf.ram}${Math.round(mem.total / 1073741824)}GB (${Math.round((mem.available / mem.total) * 100)}% free)`
					},
					{
						name: stringJSON.botstats.shardInfo.header,
						value: `${stringJSON.botstats.shardInfo.id}${shardID}\n${stringJSON.botstats.shardInfo.guilds}${(await client.shard.broadcastEval(client => client.guilds.cache.size))[shardID]}\n${stringJSON.botstats.shardInfo.uptime}${strings.elapsedTime((await client.shard.broadcastEval(`(async => {return global.shardInfo.spawnTime})()`))[shardID]).clean}\n${stringJSON.botstats.shardInfo.commands}${(await client.shard.broadcastEval(`(async => {return global.shardInfo.commandsRun})()`))[shardID]}\n${stringJSON.botstats.shardInfo.liveTime}${(await client.shard.broadcastEval(`(async => {return global.shardInfo.liveStatusTime})()`))[shardID] / 1000}`
					},
					{
						name: stringJSON.botstats.modules.header,
						value: `${stringJSON.botstats.modules.concurrentPing}${stateEmoji(global.botConfig.concurrentPing.enable)}\n${stringJSON.botstats.modules.panelEdit}${stateEmoji(global.botConfig.enableMessageEdit)}`
					}
				
				]
			}).data
		]
		})
	}
	catch(err){
		global.toConsole.error(`Command: botstats Error: ${err}`)
	}
}
function stateEmoji(bool){
	switch(bool){
		case true:
			return ":white_check_mark:";
			break;
		default:
			return ":no_entry:"
	}
}