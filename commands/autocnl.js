//automsg command

const richEmbeds = require('../funcs/embeds'); //embed generation
module.exports = {run}
const sql = require('mariadb')
const queryServer = require('../funcs/queryServer.js');
const Discord = require('discord.js') //discord.js for embed object
const strings = require('../funcs/strings'); //public string manipulation functions
const dns = require('node:dns');
async function run(client, interaction, stringJSON){
try{
var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).slice(0, -1)[0];
global.toConsole.log('/autcnl run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
global.shardInfo.commandsRun++
var serverIP = interaction.options.getString('address');
var serverPort = interaction.options.getInteger('port');
var serverAlias = interaction.options.getString('server');
var onlineText = interaction.options.getString('online_text');
var offlineText = interaction.options.getString('offline_text');
var channel = interaction.options.getChannel('channel');
if(!channel.permissionsFor(interaction.client.user.id).has(["MANAGE_CHANNELS"])){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.manageChannel, 'error', stringJSON)], ephemeral: true})}
if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
var liveArr = JSON.parse(dbData.LIVE)
if(JSON.parse(dbData.LIVE).length >= JSON.parse(dbData.CONFIG).limits.liveElements){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.maxElements, 'error', stringJSON)], ephemeral: true})} //checks live element limitsif (!serverIP && !serverAlias && !guildServers.servers.length){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.automsg.noServer, 'error', stringJSON)], ephemeral: true})}
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
	await dns.resolveSrv('_minecraft._tcp.' + serverIP, (error, record) => {if (record){serverPort = record[0].port;}}); //SRV record compatability
await interaction.deferReply({ephemeral: true});


try {var pingResults = await queryServer(serverIP, parseInt(serverPort))
var channelName = strings.truncate(strings.insertData(onlineText, pingResults), 100, true)
var stateInfo = {
	online: true,
	version: pingResults.version,
	motd: pingResults.motd,
	max: pingResults.players.max,
	now: pingResults.players.now,
	list: pingResults.players.list.slice(0, 10).map(player => player.name).sort()}
}
catch(err){ //server offline
	
var stateInfo = {online: false}
}
channel.edit({name: channelName}, stringJSON.autocnl.editReason)

if (serverPort){serverIP = serverIP += (':' + serverPort)}
dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).slice(0, -1)[0]; //refreshes data to avoid conflict
var liveArr = JSON.parse(dbData.LIVE)
liveArr.push({
	"type": "channel",
	"ip": serverIP,
	"lastPing": new Date().getTime(),
	"failureCount": 0,
	"channelID": channel.id,
	"onlineText": onlineText,
	"offlineText": offlineText,
	"lastState": {"serverState": stateInfo, "displayState": channelName}
})
await new sql.Request(global.pool).query("UPDATE SERVERS SET LIVE = N'" + JSON.stringify(liveArr).replace(/'/g, "''") + "' WHERE SERVER_ID = " + interaction.guildId)
return interaction.editReply({embeds:[richEmbeds.makeReply(stringJSON.automsg.success, 'notif', stringJSON)]})
}

catch(err){
console.log('Error!')
console.log({command: 'automsg',
error: err})
}	
}