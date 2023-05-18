//embeds command

module.exports = {run}
const richEmbeds = require('../funcs/embeds'); //embed generation
const { EmbedBuilder, AttachmentBuilder } = require('discord.js'); //discord.js for embed object
const sql = require('mssql'); //mssql

async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	try{
		if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
		var subCommand = interaction.options.getSubcommand()
		//{let conn = await global.pool.getConnection();
		//let dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + interaction.guildId + " LIMIT 1"))[0];
		var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset[0] //mssql
		var embedData = JSON.parse(dbData.EMBEDS);
		var embedLimit = JSON.parse(dbData.CONFIG).limits.savedEmbedTemplates
		//conn.release();}
		if (subCommand == 'add'){
			global.toConsole.log(`/embeds add run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			if(!client.guilds.cache.has(interaction.guildId)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.botScope, 'error', stringJSON)], ephemeral: true})} //bot scope
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			if (embedData.templates.length >= embedLimit){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.maxTemplates, 'error', stringJSON)], ephemeral: true})}
			var options = {
				alias: interaction.options.getString('alias'),
				onlineHeader: interaction.options.getString('online-header'),
				onlineFooter: interaction.options.getString('online-footer'),
				onlineBody: interaction.options.getString('online-body'),
				onlineColor: interaction.options.getString('online-color') ?? '33CC66',
				onlineColorHex: interaction.options.getString('online-color-hex'),
				offlineHeader: interaction.options.getString('offline-header'),
				offlineFooter: interaction.options.getString('offline-footer'),
				offlineBody: interaction.options.getString('offline-body'),
				offlineColor: interaction.options.getString('offline-color') ?? 'E74C3C',
				offlineColorHex: interaction.options.getString('offline-color-hex'),
				playersSubheading: interaction.options.getString('online-list-subheading') ?? stringJSON.embedsCommand.defaultPlayerHeading,
				onlineTimestamp: interaction.options.getBoolean('online-display-timestamp') ?? true,
				offlineTimestamp: interaction.options.getBoolean('offline-display-timestamp') ?? true,
				displayThumbnail: interaction.options.getBoolean('display-thumbnail') ?? true,
				onlineDisplayList: interaction.options.getBoolean('online-display-list') ?? true,
				def: interaction.options.getBoolean('default') ?? false
			}
			let validHex = /^#[0-9A-F]{6}$/i //Credit to Royi Namir @ stackoverflow
			if (options.onlineColorHex){if (!validHex.test(options.onlineColorHex)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.invalidHexCode, 'error', stringJSON)], ephemeral: true})}}
			if (options.offlineColorHex){if (!validHex.test(options.offlineColorHex)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.invalidHexCode, 'error', stringJSON)], ephemeral: true})}}
			if (options.alias){if (options.alias.length > 50){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasLength, 'error', stringJSON)], ephemeral: true})};}
			if (!options.alias){
				let i = embedData.templates.length
				options.alias = `${stringJSON.embedsCommand.embed} ${i + 1}`;
				while (!((embedData.templates.findIndex((obj) => obj.alias === options.alias)) === -1)){ //Avoids duplication of default alias
					i++
					options.alias = `${stringJSON.embedsCommand.embed} ${i + 1}`;
				}
			}
			if (!((embedData.templates.findIndex((obj) => obj.alias === options.alias)) === -1)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasTaken, 'error', stringJSON)], ephemeral: true})};
			if (options.def){embedData.default = embedData.templates.length;}
			if(!options.onlineBody || !options.offlineBody){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.noBlank, 'error', stringJSON)], ephemeral: true})};
			embedData.templates.push({
				alias: options.alias,
				default: options.def,
				thumbnailEnable: options.displayThumbnail,
				online: {
					header: options.onlineHeader,
					footer: options.onlineFooter,
					body: options.onlineBody,
					playersList: {
						header: options.playersSubheading,
						display: options.onlineDisplayList
					},
					timestampEnable: options.onlineTimestamp,
					embedColor: options.onlineColorHex || options.onlineColor
				},
				offline: {
					header: options.offlineHeader,
					footer: options.offlineFooter,
					body: options.offlineBody,
					timestampEnable: options.offlineTimestamp,
					embedColor: options.offlineColorHex || options.offlineColor
				}
			});
			//{let conn = await global.pool.getConnection();
			//await conn.query(("UPDATE SERVERS SET EMBEDS = N'" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n")) //writes embed data to database
			//conn.release();}
			await new sql.Request(global.pool).query("UPDATE SERVERS SET EMBEDS = N'" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId) //mssql
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.templateAdded, 'notif', stringJSON)], ephemeral: false});
			}
		else if (subCommand == 'remove') {
			global.toConsole.log(`/embeds remove run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
			var alias = interaction.options.getString('alias')
			var removeIndex = embedData.templates.findIndex((obj) => obj.alias === alias)
			if (removeIndex === -1){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasNotFound, 'error', stringJSON)], ephemeral: true})};
			if (removeIndex <= 1) {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.removeDefault, 'error', stringJSON)], ephemeral: true})};			
			if (removeIndex === embedData.default) {embedData.default = 0;}
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.templateRemoved + embedData.templates[removeIndex].alias, 'notif', stringJSON)]});
			embedData.templates.splice(removeIndex, 1);
			//{let conn = await global.pool.getConnection();
			//conn.query(("UPDATE SERVERS SET EMBEDS= '" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId).replace(/\\n/g, "\\\\n"))
			//conn.release();}
			new sql.Request(global.pool).query("UPDATE SERVERS SET EMBEDS = N'" + JSON.stringify(embedData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId)			
		}
		else if (subCommand == 'list'){
			global.toConsole.log(`/embeds list run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			if (!embedData.templates.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.noSaved, 'error', stringJSON)], ephemeral: true})};
			var embedText = []
			for (let i = 0; i < embedData.templates.length; i++){
			if (i == embedData.default) {var embedName = embedData.templates[i].alias + stringJSON.embedsCommand.listDefault}
			else {var embedName = embedData.templates[i].alias}
			embedText.push(embedName)
			}
			interaction.reply({embeds:[
				new EmbedBuilder({
					"description": embedText.join('\n'),
					"title": stringJSON.embedsCommand.listHeading + interaction.guild.name
				}).data
			]})
		}
		else if (subCommand == 'preview'){
			global.toConsole.log(`/embeds preview run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
			let alias = interaction.options.getString('alias')
			let previewIndex = embedData.default
			if (alias) {previewIndex = embedData.templates.findIndex((obj) => obj.alias === alias)}
			if (previewIndex === -1){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.embedsCommand.aliasNotFound, 'error', stringJSON)], ephemeral: true})};
			let onlineEmbed = richEmbeds.statusEmbed({
				online: true,
				favicon: 'favicon.png',
				data: stringJSON.embedsCommand.previewOnlineSampleData,
				format: embedData.templates[previewIndex]
			}, stringJSON)
			let offlineEmbed = richEmbeds.statusEmbed({
				online: false,
				favicon: 'favicon.png',
				data: stringJSON.embedsCommand.previewOfflineSampleData,
				format: embedData.templates[previewIndex]
			}, stringJSON);
			if (embedData.templates[previewIndex].thumbnailEnable){interaction.reply({embeds:[onlineEmbed, offlineEmbed], files: [new AttachmentBuilder(Buffer.from(global.staticImages.pack, 'base64'), {name: 'favicon.png'})]})}
			else {await interaction.reply({embeds:[onlineEmbed, offlineEmbed]})}
		}
	}
	catch(err){
	console.log('Error!')
	console.log({command: 'embeds',
	error: err})
	}	
}