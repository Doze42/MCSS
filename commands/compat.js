//embeds command

module.exports = {run}
const richEmbeds = require('../funcs/embeds'); //embed generation
const { EmbedBuilder, Embed } = require('discord.js'); //discord.js for embed object
const sql = require('mssql') //sql

async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	try{
		if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
		var subCommand = interaction.options.getSubcommand()
		//{let conn = await global.pool.getConnection();
		//let dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + interaction.guildId + " LIMIT 1"))[0];
		var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset[0] //mssql
		var compatData = JSON.parse(dbData.COMPAT);
		var compatLimit = JSON.parse(dbData.CONFIG).limits.compatibilityTriggers
		//conn.release();}
		if (subCommand == 'add'){
			global.toConsole.log('/compat add run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
			if(!client.guilds.cache.has(interaction.guildId)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.botScope, 'error', stringJSON)], ephemeral: true})} //bot scope
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			if (compatData.length >= compatLimit){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.maxTriggers, 'error', stringJSON)], ephemeral: true})}
			var hostname = interaction.options.getString('hostname')
			var trigger = interaction.options.getString('trigger')
			if (hostname.length > 253 || hostname.length < 5){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.ipLength, 'error', stringJSON)], ephemeral: true})};
			if (trigger.length > 50){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.triggerLength, 'error', stringJSON)], ephemeral: true})};			
			compatData.push({
				"trigger": trigger,
				"domain": hostname,
				"default": false
			});
			//{let conn = await global.pool.getConnection();
			//await conn.query(("UPDATE SERVERS SET EMBEDS = N'" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n")) //writes embed data to database
			//conn.release();}
			await new sql.Request(global.pool).query(`UPDATE SERVERS SET COMPAT = '${JSON.stringify(compatData).replace(/'/g, "''")}' WHERE SERVER_ID = ${interaction.guildId}`) //mssql
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.triggerAdded, 'notif', stringJSON)], ephemeral: false});
			}
		else if (subCommand == 'remove') {
			global.toConsole.log(`/compat remove run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			if (!compatData.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.noSaved, 'error', stringJSON)], ephemeral: true})};
			var removeIndex = interaction.options.getInteger('index')
			if (removeIndex < 0 || removeIndex > (compatData.length - 1)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.badIndex, 'error', stringJSON)]});}
			if (!compatData.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.noSaved, 'notif', stringJSON)]})} //no entries
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.triggerRemoved, 'notif', stringJSON)]});
			compatData.splice(removeIndex, 1);
			//{let conn = await global.pool.getConnection();
			//conn.query((`UPDATE SERVERS SET COMPAT = '${JSON.stringify(compatData).replace(/'/g, "''")}' WHERE SERVER_ID = ${interaction.guildId}`).replace(/\\n/g, "\\\\n")) //writes automsg data to database	
			//conn.release();}	
			await new sql.Request(global.pool).query(`UPDATE SERVERS SET COMPAT = '${JSON.stringify(compatData).replace(/'/g, "''")}' WHERE SERVER_ID = ${interaction.guildId}`)
		}	
		else if (subCommand == 'list'){
			global.toConsole.log(`/compat list run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			if (!compatData.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.compatCommand.noSaved, 'error', stringJSON)], ephemeral: true})};
			var compatText = []
			for (let i = 0; i < compatData.length; i++){
				let sectionHeader = `${stringJSON.compatCommand.entry} ${i}`
				if (compatData[i].standard){sectionHeader = `:robot: ${sectionHeader}`}
				compatText.push(`**${sectionHeader}** \n Domain: ${compatData[i].domain} \n Trigger: ${compatData[i].trigger}`)
			}
			interaction.reply({
				embeds:[new EmbedBuilder({
					"description": compatText.join('\n'),
					"title": stringJSON.compatCommand.listHeading + interaction.guild.name
				}).data
			]})
		}	
	}
	catch(err){
	console.log('Error!')
	console.log({command: 'compat',
	error: err})
	}	
}