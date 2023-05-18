//automsg command

const richEmbeds = require('../funcs/embeds'); //embed generation
module.exports = {run}
const queryServer = require('../funcs/queryServer.js');
const { AttachmentBuilder } = require('discord.js'); //discord.js for embed object
const strings = require('../funcs/strings'); //public string manipulation functions
const compat = require('../funcs/compat.js');
const jimp = require('jimp');
const { v4: uuid } = require('uuid'); //mssql
const sql = require('mssql') //mssql

async function run(client, interaction, stringJSON){
try{
	//{let conn = await global.pool.getConnection();
	//var dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + interaction.guildId + " LIMIT 1"))[0];
	//conn.release();}
	var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset[0];
	global.toConsole.log('/automsg run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
	global.shardInfo.commandsRun++
	var serverIP = interaction.options.getString('address');
	var serverPort = interaction.options.getInteger('port');
	var embedTemplate = interaction.options.getString('embeds');
	var serverAlias = interaction.options.getString('server');
	var thumbnail = interaction.options.getAttachment('thumbnail')
	if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})} //disallows DM channels
	if(!client.guilds.cache.has(interaction.guildId)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.botScope, 'error', stringJSON)], ephemeral: true})} //bot scope
	if (interaction.channel.type !== 'GUILD_TEXT') {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.channelType, 'error', stringJSON)], ephemeral: true})} //news or announcement channels
	if (!interaction.channel.permissionsFor(interaction.client.user.id).has(["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "VIEW_CHANNEL"])){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.channelPerms, 'error', stringJSON)], ephemeral: true})}
	if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
	//{let conn = await global.pool.getConnection();
	//if((await conn.query("SELECT * from LIVE WHERE serverID = " + interaction.guildId)).slice(0, -1).length >= JSON.parse(dbData.CONFIG).limits.liveElements){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.maxElements, 'error', stringJSON)], ephemeral: true})} //checks live element limits mariadb
	//conn.release();}
	if((await new sql.Request(global.pool).query("SELECT * from LIVE WHERE serverID = " + interaction.guildId)).recordset.length >= JSON.parse(dbData.CONFIG).limits.liveElements){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.maxElements, 'error', stringJSON)], ephemeral: true})} //checks live element limits mssql
	var guildServers = JSON.parse(dbData.SERVERS)
	if (!serverIP && !serverAlias && !guildServers.servers.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.noServer, 'error', stringJSON)], ephemeral: true})}
	if (!serverIP && !serverAlias){serverAlias = guildServers.servers[guildServers.default].alias}
	if (serverAlias){ //loads saved server data
		var aliasData = guildServers.servers.filter((obj) => obj.alias == serverAlias)
		if (!aliasData.length) {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.aliasNotFound, 'error', stringJSON)], ephemeral: true})}
		var serverIP = aliasData[0].serverIP
	}
	if (serverIP.includes(':')){
		var splitIP =  serverIP.split(':', 2)
		serverIP = splitIP[0]
		serverPort = splitIP[1].trim()
	}
	serverIP = serverIP.trim(); //removes any whitespace from ip
	if (serverIP){if (serverIP.length > 253 || serverIP.length < 5){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.ipLength, 'error', stringJSON)], ephemeral: true})}};
	if (serverPort){
		if ((serverPort < 1 || serverPort > 65535) || strings.checkChars(serverPort, 57, 48)){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.servers.badPort, 'error', stringJSON)], ephemeral: true})};
	}
	if (!embedTemplate){embedTemplate = stringJSON.automsg.defaultTemplateLive;}
	var embedData = JSON.parse(dbData.EMBEDS).templates.filter((obj) => obj.alias == embedTemplate)
	if (!embedData.length) {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.embedNotFound, 'error', stringJSON)], ephemeral: true})}
	await interaction.deferReply({ephemeral: true});
	var bufferSource = global.staticImages.pack;
	if(thumbnail){
			if (!(thumbnail.contentType == 'image/png' || thumbnail.contentType == 'image/jpeg' || thumbnail.contentType == 'image/gif' || thumbnail.contentType == 'image/bmp')){return interaction.editReply({embeds:[richEmbeds.makeReply(stringJSON.automsg.badThumbnail, 'error', stringJSON)], ephemeral: true})}; //Checks for correct format
			if (thumbnail.size > global.botConfig.maxAttachmentSize){return interaction.editReply({embeds:[richEmbeds.makeReply(stringJSON.automsg.badThumbnail, 'error', stringJSON)], ephemeral: true})}; //checks thumbnail size
			await jimp.read(thumbnail.url).then(image => {
			image.resize(64, 64)
			image.getBase64Async(jimp.MIME_PNG).then(b64 => {bufferSource = b64.split(';base64,').pop()})
			})
			var customThumb = true;
		}
	try {
		var pingResults = await queryServer(serverIP, parseInt(serverPort))		
		if (pingResults.favicon && !customThumb){bufferSource = pingResults.favicon.split(';base64,').pop();}
		if (await compat.check(pingResults, JSON.parse(dbData.COMPAT))){throw stringJSON.status.compatOffline;};		
		pingResults.error = "Ping Successful"
		var statEmbed = richEmbeds.statusEmbed({
		online: true,
		favicon: 'favicon.png',
		data: pingResults,
		format: embedData[0]
	}, stringJSON);
	var stateInfo = {
		online: true,
		version: pingResults.version,
		motd: pingResults.motd,
		max: pingResults.players.max,
		now: pingResults.players.now,
		list: pingResults.players.list.slice(0, 10).map(player => player.name).sort()}
	}
	catch(err){ //server offline
		var statEmbed = richEmbeds.statusEmbed({
		online: false,
		favicon: 'favicon.png',
		data: {error: err, hostname: serverIP},
		format: embedData[0]
	}, stringJSON);
	var stateInfo = {online: false}
	}
	if(embedData[0].thumbnailEnable){var message = await interaction.channel.send({files: [new AttachmentBuilder(Buffer.from(bufferSource, 'base64'), {name: 'favicon.png'})], embeds: [statEmbed]})}
	else{var message = await interaction.channel.send({embeds: [statEmbed]})}
	if (serverPort){serverIP = serverIP += (':' + serverPort)}
	//{let conn = await global.pool.getConnection();
	// await conn.query("INSERT INTO LIVE VALUES (uuid(), N'" + JSON.stringify(
	// 	{
	// 		"type": "panel",
	// 		"ip": serverIP,
	// 		"lastPing": new Date().getTime(),
	// 		"failureCount": 0,
	// 		"messageID": message.id,
	// 		"channelID": message.channel.id,
	// 		"guildID": message.guildId,
	// 		"embedTemplate": embedData[0],
	// 		"lastState": statEmbed
	//	}).replace(/\\n/g, "\\\\n").replace(/'/g, "''") + "', " + message.guildId + ")");
	// conn.release();} //mariadb
	await new sql.Request(global.pool).query(`INSERT INTO LIVE VALUES ('${uuid()}', N'${JSON.stringify(
			{
				"type": "panel",
				"ip": serverIP,
				"lastPing": new Date().getTime(),
				"failureCount": 0,
				"messageID": message.id,
				"channelID": message.channel.id,
				"guildID": message.guildId,
				"embedTemplate": embedData[0],
				"lastState": statEmbed
			}).replace(/'/g, "''")}', ${message.guildId}, '${serverIP.replace(/'/g, "''")}')`); //mssql
	return interaction.editReply({embeds:[richEmbeds.makeReply(stringJSON.automsg.success, 'notif', stringJSON)]})
}

catch(err){
	console.log('Error!')
	console.log({command: 'automsg',
	error: err})
}	
}