//Status Command

const fs = require('fs')
const queryServer = require('../funcs/queryServer.js');
const richEmbeds = require('../funcs/embeds') //embed generation
const compat = require ('../funcs/compat.js');
const sql = require('mssql')
const strings = require('../funcs/strings.js') //string manipulation
const Discord = require('discord.js') //discord.js for embed object
const dns = require('node:dns');
module.exports = {run}

async function run(client, interaction, stringJSON){
	try{
		global.shardInfo.commandsRun++
		global.toConsole.log('/status run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
		var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset[0]
		var serverIP = interaction.options.getString('address')
		var serverPort = interaction.options.getInteger('port')
		var serverAlias = interaction.options.getString('server');
		var guildServers = JSON.parse(dbData.SERVERS)
		if (!serverIP && !serverAlias && !guildServers.servers.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.status.noServer, 'error', stringJSON)], ephemeral: true})}
		if (!serverIP && !serverAlias){serverAlias = guildServers.servers[guildServers.default].alias}
		if (serverAlias){ //loads saved server data
			var aliasData = guildServers.servers.filter((obj) => obj.alias == serverAlias)
			if (!aliasData.length) {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.status.aliasNotFound, 'error', stringJSON)], ephemeral: true})}
			var serverIP = aliasData[0].serverIP
		}
			if (serverIP.includes(':')){
			var splitIP =  serverIP.split(':', 2)
			serverIP = splitIP[0]
			serverPort = splitIP[1].trim()
		}
		await dns.resolveSrv('_minecraft._tcp.' + serverIP, (error, record) => {if (record){serverPort = record[0].port;}});	
		serverIP = serverIP.trim(); //removes any whitespace from ip
		if (serverIP){if (serverIP.length > 253 || serverIP.length < 5){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.status.ipLength, 'error', stringJSON)], ephemeral: true})}};
		if (serverPort){
			if ((serverPort < 1 || serverPort > 65535) || strings.checkChars(serverPort, 57, 48)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.status.badPort, 'error', stringJSON)], ephemeral: true})};
		}
		await interaction.deferReply({ephemeral: JSON.parse(dbData.CONFIG).ephemeral.statusPanel}); //add configurable
		var embedData = JSON.parse(dbData.EMBEDS).templates[JSON.parse(dbData.EMBEDS).default]
		try {
			var bufferSource = global.staticImages.pack;
			var pingResults = await queryServer(serverIP, parseInt(serverPort))
			if (await compat.check(pingResults, JSON.parse(dbData.COMPAT))){throw stringJSON.status.compatOffline;};
			if (pingResults.favicon){bufferSource = pingResults.favicon.split(';base64,').pop();}
			var statEmbed = richEmbeds.statusEmbed({
				online: true,
				favicon: 'favicon.png',
				data: pingResults,
				format: embedData
			}, stringJSON)

			if (embedData.thumbnailEnable){await interaction.editReply({embeds:[statEmbed], files: [new Discord.MessageAttachment(Buffer.from(bufferSource, 'base64'), 'favicon.png')]})}
		}
		catch(err){ //Server Offline
			var statEmbed = richEmbeds.statusEmbed({
				online: false,
				favicon: 'favicon.png',
				data: {error: err, hostname: serverIP},
				format: embedData
		}, stringJSON);
		if (embedData.thumbnailEnable){await interaction.editReply({embeds:[statEmbed], files: [new Discord.MessageAttachment(Buffer.from(global.staticImages.pack_greyscale, 'base64'), 'favicon.png')]})}
		}
	}
	catch(err){
		console.log('Error!')
		console.log({command: 'status',
		error: err})
	}	
}