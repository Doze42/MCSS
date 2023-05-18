//Minecraft Server Status Discord Bot 
//© 2019-2023 Alex Reiter @ 123computer.net

const fs = require('fs')

global.botConfig = JSON.parse(fs.readFileSync("./assets/config.json")); //Settings and configuration FileUpload

//Code for MariaDB support is still present in the bot but has been commented out for the time being. Following files need to be uncommented:
//loadDefaults.js
//paneledit.js
//automsg.js
//status.js
//servers.js
//compat.js(command)
//embeds.js(command)
//settings.js
//npm remove mssql and uuid when done

//const sql = require('mariadb')
//global.pool = new sql.createPool(global.botConfig.configs[global.botConfig.release].dbConfig);

//mssql
const sql = require('mssql')
global.pool = new sql.ConnectionPool(botConfig.configs[botConfig.release].mssql);
global.pool.connect();

global.statusCache = new Map();
var statusQueue = [];

const chalk = require ('chalk')
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: 513 });
//const DBL = require('dblapi.js');
const isEqual = require('lodash.isequal');
const {BaseCluster} = require('kurasuta');
//const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MjcyNjEwNzUzNTMxMDg1OSIsImJvdCI6dHJ1ZSwiaWF0IjoxNTk0MTQwMjc1fQ.2raWpbfemxhiLKdDC805KttOMm6FQ5oR_KM5VJ7voOg', client);

//modules
const strings = require('./funcs/strings'); //public string manipulation functions
const compat = require('./funcs/compat'); //hard coded exception checks
const richEmbeds = require('./funcs/embeds'); //embed generation
const liveNotifier = require('./funcs/liveNotifier.js');
const channelEdit = require('./funcs/channelEdit.js')
const panelEdit = require('./funcs/panelEdit.js')
const loadDefaults = require('./funcs/loadDefaults.js')
const getLang = require('./funcs/getLang.js').getLang
const queryServer = require('./funcs/queryServer.js'); //ping library
const dbAudit = require('./funcs/dbAudit.js');
const { globalAgent } = require('http');

global.staticImages = JSON.parse(fs.readFileSync("./assets/static_images.json")); //Base64 encoded images

var stringJSON = getLang('en') //remove this later !!

//Commands
const commands = {
invite: require('./commands/invite'),
status: require('./commands/status'),
botstats: require('./commands/botstats'),
servers: require('./commands/servers'),
automsg: require('./commands/automsg'),
autocnl: require('./commands/autocnl'),
admin: require('./commands/admin'),
help: require('./commands/help'),
embeds: require('./commands/embeds'),
compat: require('./commands/compat'),
settings: require('./commands/settings')
}

global.shardInfo = {
	spawnTime: new Date(), //logs time at which shard spawned
	commandsRun: 0,
	liveStatusTime: 0
}

module.exports = class extends BaseCluster {
launch() {
this.client.login(global.botConfig.configs[global.botConfig.release].token);
var client = this.client

global.toConsole = { //Categorized Console Logging
	log: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgBlue('[log]') + ' ' + msg)},
	info: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgGreen('[info]') + ' ' + msg)},
	error: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgRed('[error]') + ' ' + msg)},
	debug: function(msg){
		if(global.botConfig.debugMode){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgRed('[debug]') + ' ' + msg)}
	}
}

global.toConsole.log('Spawning Shard...')

/* sql.on('error', err => {
    global.toConsole.error('SQL Error: ' + err, 'error');
})

global.pool.on('error', err => {
    global.toConsole.error('Pool Error: ' + err, 'error');
}) */


process.on('unhandledRejection', err => { //Logs error and restarts shard on unhandledRejection
	global.toConsole.error('Reloading Shard: ' + err);
	try{fs.writeFileSync('./logs/shardCrash/' + new Date().getTime() + '.log', err.toString())}
	catch(err){global.toConsole.error('Failed to write error log')}
	client.shard.restart(client.shard.id);
});

client.on('rateLimit', (info) => {
  global.toConsole.error('Rate limit hit')
  console.log(info)
})


setInterval(() => {
	if(client.isReady){global.toConsole.debug('Client Ready @ ' + new Date().getTime())}
	else (global.toConsole.debug('Client Not Ready @ ' + new Date().getTime()))
}, (20 * 60000))

client.on("ready", async function(){
	global.toConsole.info('Successfully logged in using Token ' + botConfig.release + ' at ' + new Date())
	if(global.botConfig.enableMessageEdit || global.botConfig.enableChannelEdit || global.botConfig.enableNotifer){liveStatus()} //starts live update loop
	client.user.setActivity(global.botConfig.configs[global.botConfig.release].activity.text, {type: global.botConfig.configs[global.botConfig.release].activity.type});
	
})

client.on('guildDelete', (guild) => {dbAudit.guildDelete(guild.id)});
client.on('channelDelete', (channel) => {dbAudit.channelDelete(channel)});
client.on('messageDelete', (message) => {dbAudit.messageDelete([message])});
client.on('messageDeleteBulk', (messages) => {
	let messageArray = []
	messages.forEach((message) => {messageArray.push(message)})
	dbAudit.messageDelete(messageArray)
});

client.on('interactionCreate', async function (interaction){
try {
	if(!interaction.isCommand()) return; //exits if not command
	if(interaction.inGuild()){
		//{let conn = await global.pool.getConnection();
		//var guildData = await conn.query('SELECT * FROM SERVERS WHERE SERVER_ID = ' + interaction.guildId + ' LIMIT 1')
		var guildData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset[0]
		//if (!guildData.length){ //Adds new servers to database //mariadb
		if (!guildData){ //mssql	
			var lang = getLang(interaction.guild.preferredLocale.slice(0, 2))
			try{await loadDefaults.addServer(interaction.guildId, lang.defaults)}
			catch(err){return interaction.reply({embeds:[richEmbeds.makeReply(lang.strings.cmdHandler.databaseAddFailed, 'error', lang.strings)], ephemeral: true})}
		}
		//else{var lang = getLang((JSON.parse(guildData[0].CONFIG)).lang)} //mariadb
		else{var lang = getLang((JSON.parse(guildData.CONFIG)).lang)} //mssql
		//conn.release()}
	}
	else{var lang = getLang('en')} //defaults to english for direct messages
	//{let conn = await global.pool.getConnection();
	//var userData = (await conn.query('SELECT * FROM USERS WHERE ID = ' + interaction.user.id + ' LIMIT 1')).slice(0, -1)[0]
	//conn.release();}
	var userData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from USERS WHERE ID = ' + interaction.user.id)).recordset[0] //mssql
	if (userData){
		if (userData.BLACKLIST){return interaction.reply({embeds:[richEmbeds.makeReply(lang.strings.permissions.blacklisted + userData.BLACKLIST_REASON, 'error', lang.strings)], ephemeral: true})}
		interaction.user.PermissionLevel = userData.PLEVEL}
	else {interaction.user.PermissionLevel = 0;}
	if (interaction.commandName == 'invite'){commands.invite.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'status'){commands.status.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'botstats'){commands.botstats.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'servers'){commands.servers.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'automsg'){commands.automsg.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'help'){commands.help.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'embeds'){commands.embeds.run(client, interaction, lang.strings);}
	//else if (interaction.commandName == 'autocnl'){commands.autocnl.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'compat'){commands.compat.run(client, interaction, lang.strings);}
	else if (interaction.commandName == 'settings'){commands.settings.run(client, interaction, lang.strings);}
}
catch (err){global.toConsole.error("Interaction Failed: " + err)}
})

async function liveStatus(){
	global.toConsole.debug('Starting Live Status update..')
	var refreshStart = new Date().getTime();
	//{let conn = await global.pool.getConnection();
	//var dbData = await conn.query("SELECT * FROM LIVE")
	//conn.release();}
	var dbData = await new sql.Request(global.pool).query("SELECT * FROM LIVE"); //mssql
	var i = 0;
	var elements = new Map();
	//for (var i = 0; i < dbData.length; i++){if(client.guilds.cache.has(dbData[i].serverID)){elements.set(dbData[i].guid, dbData[i])}} //mariadb
	for (var i = 0; i < dbData.recordset.length; i++){if(client.guilds.cache.has(dbData.recordset[i].serverID)){elements.set(dbData.recordset[i].guid, dbData.recordset[i])}} //mssql
	var servers = new Set();
	if(global.botConfig.concurrentPing.enable){ //Concurrent ping
		for await (const [key, value] of elements){servers.add(JSON.parse(value.data).ip)}
		var pingQueue = Array.from(servers)
		while(pingQueue.length){
			let pingSet = pingQueue.splice(0, global.botConfig.concurrentPing.pings)
			let pingPromises = []
			await pingSet.forEach((ip) => {
				pingPromises.push(new Promise(async(resolve, reject) => {
					try {
						toConsole.debug('Concurrent Ping: ' + ip)
						var pingResults = await queryServer(ip)
						global.statusCache.set(ip, {online: true, data: pingResults})
						resolve()
					}
					catch(err){
					global.statusCache.set(ip, {online: false, data: err})
					resolve()
					}
				}))
			})
			await Promise.all(pingPromises)
		}
	}
	for await (const [key, value] of elements){
		try{
			var data = JSON.parse(value.data);
			if (data.type == 'panel'){				
				var res = await panelEdit.check(data, stringJSON.strings)
			}
		}
		catch(err){continue;} //handle this error right
				if (res.update){
					toConsole.debug('Adding panel ' + key + ' to queue...')
					statusQueue.push({
						type: 'panel',
						guid: value.guid,
						disable: res.disable,
						embed: res.data,
						serverID: data.guildID,
						messageID: data.messageID,
						channelID: data.channelID,
						timestamp: new Date().getTime()
					})
				}
			}
			//Following section will be used after the addition of other status types
			//else if (element.type == 'channel') {channelEdit.check(element)}
			//else if (element.type == 'notifier') {liveNotifier.check(element)}
			
	toConsole.debug('Clearing StatusCache')
	statusCache.clear(); //clears cached server status data
	global.toConsole.debug(statusQueue.length + ' elements in queue')
	if(statusQueue.length){await processQueue();}
	global.shardInfo.liveStatusTime = new Date().getTime() - refreshStart;
	if (global.shardInfo.liveStatusTime > 45000) {liveStatus()}
	if (global.shardInfo.liveStatusTime <= 45000) {setTimeout(() => {liveStatus()}, 45000)}
}

async function processQueue(){ //todo: add try/catch
	var promises = [] //array of promises
	await new Promise(async(resolve, reject) => {
	var queueLoop = setInterval(async function(){
		toConsole.debug('Processing Queue: ' + statusQueue.length + ' items remaining')
		if(!statusQueue.length){
			clearInterval(queueLoop);
			return resolve();}
		promises.push(Promise.race([new Promise(async(resolve, reject) => {
			try{
				var element = statusQueue.shift();	
				if (element.type == 'panel'){
					//{let conn = await global.pool.getConnection();
					//var panelData = JSON.parse((await conn.query("SELECT * FROM LIVE WHERE guid = '" + element.guid + "'"))[0].data)
					//conn.release();}
					var panelData = JSON.parse((await new sql.Request(global.pool).query("SELECT * FROM LIVE WHERE guid = '" + element.guid +"'")).recordset[0].data) //mssql
					try{
						await panelEdit.update(element, client, stringJSON.strings)					
						panelData.lastPing = element.timestamp;
						panelData.lastState = element.embed;
						panelData.failureCount = 0;
					}
					catch(err){ //Panel failed, log
						if (panelData.failureCount >= global.botConfig.configs[global.botConfig.release].liveElementMaxFails || err == 'remove'){
						//{let conn = await global.pool.getConnection();
						//await conn.query("DELETE FROM LIVE WHERE guid = '" + element.guid + "'")
						//conn.release();}
						await new sql.Request(global.pool).query("DELETE FROM LIVE WHERE guid = '" + element.guid +"'") //mssql
						toConsole.log('Panel with ID ' + element.messageID + ' has been removed due to failure count or channel issues.')}
						else{panelData.failureCount++
						toConsole.log('Panel with ID ' + element.messageID + ' failed to update: ' + err)}
					} 				
					resolve('Finished Updating')
					//{let conn = await global.pool.getConnection();
					//await conn.query(("UPDATE LIVE SET data = N'" + JSON.stringify(panelData).replace(/'/g, "''") + "' WHERE guid = '" + element.guid + "' LIMIT 1").replace(/\\n/g, "\\\\n"))
					//conn.release();}
					await new sql.Request(global.pool).query(("UPDATE LIVE SET data = N'" + JSON.stringify(panelData).replace(/'/g, "''") + "' WHERE guid = '" + element.guid + "'")) //mssql
				}
				//other status types will be added here
			
		} catch(err){reject(err)}
		}), new Promise((resolve, reject) => {setTimeout(() => {resolve('Panel Timed Out')}, global.botConfig.configs[global.botConfig.release].liveElementTimeout)})]))
	}, global.botConfig.configs[global.botConfig.release].liveQueuePause)})	
	toConsole.debug(await Promise.any(promises))
}
}			
}