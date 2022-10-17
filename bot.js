//Minecraft Server Status Discord Bot 
//© 2019-2022 Alex Reiter @ 123computer.net

const fs = require('fs')

global.botConfig = JSON.parse(fs.readFileSync("./assets/config.json")); //Settings and configuration FileUpload

const sql = require('mssql')
global.pool = new sql.ConnectionPool(botConfig.configs[botConfig.release].dbConfig);
global.pool.connect();

global.statusCache = new Map();
var statusQueue = [];

const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const DBL = require('dblapi.js');
const isEqual = require('lodash.isequal');
const {BaseCluster} = require('kurasuta');
const dbl = new DBL('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MjcyNjEwNzUzNTMxMDg1OSIsImJvdCI6dHJ1ZSwiaWF0IjoxNTk0MTQwMjc1fQ.2raWpbfemxhiLKdDC805KttOMm6FQ5oR_KM5VJ7voOg', client);

//modules
const strings = require('./funcs/strings'); //public string manipulation functions
const compat = require('./funcs/compat'); //hard coded exception checks
const richEmbeds = require('./funcs/embeds'); //embed generation
const liveNotifier = require('./funcs/liveNotifier.js');
const channelEdit = require('./funcs/channelEdit.js')
const panelEdit = require('./funcs/panelEdit.js')
const loadDefaults = require('./funcs/loadDefaults.js')

global.staticImages = JSON.parse(fs.readFileSync("./assets/static_images.json")); //Base64 encoded images
//Loads JSON string files from disk into memory
var lang_en = JSON.parse(fs.readFileSync("./lang/lang_en.json")); //English
var lang_jp = JSON.parse(fs.readFileSync("./lang/lang_jp.json")); //Japanese 
var lang_it = JSON.parse(fs.readFileSync("./lang/lang_it.json")); //Italian

var stringJSON = lang_en //default value remove later

//Commands
const commands = {
invite: require('./commands/invite'),
status: require('./commands/status'),
botstats: require('./commands/botstats'),
servers: require('./commands/servers'),
automsg: require('./commands/automsg'),
autocnl: require('./commands/autocnl'),
admin: require('./commands/admin'),
help: require('./commands/help')
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
console.info('Spawning Shard...')

sql.on('error', err => {
    console.log('SQL Error: ' + err, 'error');
})

process.on('unhandledRejection', err => {
	global.toConsole.error('Reloading Shard: ' + err);
	client.shard.restart(client.shard.id);
});

client.on('rateLimit', (info) => {
  global.toConsole.error(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout: 'Unknown timeout '}`)
})

client.on("ready", async function(){
	global.toConsole.info('Successfully logged in using Token ' + botConfig.release + ' at ' + new Date())
	if(global.botConfig.enableMessageEdit || global.botConfig.enableChannelEdit || global.botConfig.enableNotifer){liveStatus()} //starts live update loop
	client.user.setActivity(global.botConfig.configs[global.botConfig.release].activity.text, {type: global.botConfig.configs[global.botConfig.release].activity.type});
})

client.on('interactionCreate', async function (interaction){
try {
	if(!interaction.isCommand()) return; //exits if not command
	if(interaction.inGuild()){
		if(!(await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset.length){ //Adds new servers to database
		try{await loadDefaults.addServer(interaction.guildId)}
		catch(err){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.cmdHandler.databaseAddFailed, 'error', stringJSON)], ephemeral: true})}}
	}
	var userData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from USERS WHERE ID = ' + interaction.user.id)).recordset[0]
	if (userData){
		if (userData.BLACKLIST){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.blacklisted + userData.BLACKLIST_REASON, 'error', stringJSON)], ephemeral: true})}
		interaction.user.PermissionLevel = userData.PLEVEL}
	else {interaction.user.PermissionLevel = 0;}
	if (interaction.commandName == 'invite'){commands.invite.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'status'){commands.status.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'botstats'){commands.botstats.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'servers'){commands.servers.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'automsg'){commands.automsg.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'help'){commands.help.run(client, interaction, stringJSON);}
	//else if (interaction.commandName == 'autocnl'){commands.autocnl.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'test'){
	console.log(!client.guilds.cache.has(interaction.guildId))
	}
}
catch (err){global.toConsole.error("Interaction Failed: " + err)}
})

async function liveStatus(){
	global.toConsole.debug('Starting Live Status update..')
	var refreshStart = new Date().getTime();
	var dbData = await new sql.Request(global.pool).query("SELECT * FROM LIVE");
	var i = 0;
	var elements = new Map();
	for (var i = 0; i < dbData.recordset.length; i++){if(client.guilds.cache.has(dbData.recordset[i].serverID)){elements.set(dbData.recordset[i].guid, dbData.recordset[i])}}
	for await (const [key, value] of elements){
		try{
			var data = JSON.parse(value.data);
			if (data.type == 'panel'){				
				var res = await panelEdit.check(data, stringJSON)
			}
		}
		catch(err){} //handle this error right
				if (res.update){
					toConsole.debug('Adding panel ' + data.messageID + ' to queue...')
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
					var panelData = JSON.parse((await new sql.Request(global.pool).query("SELECT * FROM LIVE WHERE guid = '" + element.guid +"'")).recordset[0].data)
					try{
						await panelEdit.update(element, client, stringJSON)					
						panelData.lastPing = element.timestamp;
						panelData.lastState = element.embed;
						panelData.failureCount = 0;
					}
					catch(err){ //Panel failed, log
						if (panelData.failureCount >= global.botConfig.configs[global.botConfig.release].liveElementMaxFails || err == 'remove'){
						await new sql.Request(global.pool).query("DELETE FROM LIVE WHERE guid = '" + element.guid +"'")
						toConsole.log('Panel with ID ' + element.messageID + ' has been removed due to failure count or channel issues.')}
						else{panelData.failureCount++
						toConsole.log('Panel with ID ' + element.messageID + ' failed to update: ' + err)}
					} 				
					resolve('Finished Updating')
					await new sql.Request(global.pool).query("UPDATE LIVE SET data = N'" + JSON.stringify(panelData).replace(/'/g, "''") + "' WHERE guid = '" + element.guid + "'")
				}
				//other status types will be added here
			
		} catch(err){reject(err)}
		}), new Promise((resolve, reject) => {setTimeout(() => {resolve('Panel Timed Out')}, global.botConfig.configs[global.botConfig.release].liveElementTimeout)})]))
	}, global.botConfig.configs[global.botConfig.release].liveQueuePause)})	
	toConsole.debug(await Promise.any(promises))
}
}			
}