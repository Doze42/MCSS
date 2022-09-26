//Minecraft Server Status Discord Bot 
//© 2019-2022 Alex Reiter @ 123computer.net

const fs = require('fs')

global.botConfig = JSON.parse(fs.readFileSync("./assets/config.json")); //Settings and configuration FileUpload

const chalk = require ('chalk')
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
const queryServer = require('./funcs/dummyAPI.js');
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
autocnl: require('./commands/autocnl')
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

client.on('rateLimit', (info) => {
  console.log(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout: 'Unknown timeout '}`)
})

client.on("ready", async function(){
global.toConsole = {
	log: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgBlue('[log]') + ' ' + msg)},
	info: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgGreen('[info]') + ' ' + msg)},
	error: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgRed('[error]') + ' ' + msg)},
	debug: function(msg){console.log(chalk.magenta('[Shard ' + client.shard.id + '] ') + chalk.bgRed('[debug]') + ' ' + msg)}
}
global.toConsole.info('Successfully logged in using Token ' + botConfig.release + ' at ' + new Date())
})

client.on('interactionCreate', async function (interaction){
try {
	if(!interaction.isCommand()) return; //exits if not command
	if(!(await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + interaction.guildId)).recordset.length){ //Adds new servers to database
		try{await loadDefaults.addServer(interaction.guildId)}
		catch(err){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.cmdHandler.databaseAddFailed, 'error', stringJSON)], ephemeral: true})}}
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
	//else if (interaction.commandName == 'autocnl'){commands.autocnl.run(client, interaction, stringJSON);}
	else if (interaction.commandName == 'test'){
	liveStatus()
	return interaction.reply('done')
	}
}
catch (err){global.toConsole.error("Interaction Failed: " + err)}
})

async function liveStatus(){
	toConsole.debug('Starting Live Status update..')
	var refreshStart = new Date().getTime();
	var dbData = await new sql.Request(global.pool).query("SELECT * FROM SERVERS");
	var i = 0;
	var guilds = new Map();
	for (; i < dbData.recordset.length; i++){if(client.guilds.cache.has(dbData.recordset[i].SERVER_ID)){guilds.set(dbData.recordset[i].SERVER_ID, dbData.recordset[i])}}
	for await (const [key, value] of guilds){
		var liveArray = JSON.parse(value.LIVE)
		if (liveArray.length){
		await Promise.all(liveArray.map(async (element) => {
			if (element.type == 'panel'){				
				var res = await panelEdit.check(element, stringJSON)
				if (res.update){
					toConsole.debug('Adding panel ' + element.messageID + ' to queue...')
					statusQueue.push({
						type: 'panel',
						disable: res.disable,
						embed: res.data,
						serverID: key,
						messageID: element.messageID,
						channelID: element.channelID,
						timestamp: new Date().getTime()
					})
				}
			}
			//Following section will be used after the addition of other status types
			//else if (element.type == 'channel') {channelEdit.check(element)}
			//else if (element.type == 'notifier') {liveNotifier.check(element)}
		}))
	}
	}
	statusCache.clear();
	console.log(statusQueue.length)
	if(statusQueue.length){await processQueue();}
	global.liveStatusTime = new Date().getTime() - refreshStart;
	if (global.liveStatusTime > 45000) {liveStatus()}
	if (global.liveStatusTime <= 45000) {setTimeout(() => {liveStatus()}, 45000)}
}

async function processQueue(){
	var promises = [] //array of promises
	await new Promise(async(resolve, reject) => {
	var queueLoop = setInterval(async function(){
		toConsole.debug('Processing Queue: ' + statusQueue.length + ' items remaining')
		if(!statusQueue.length){
			clearInterval(queueLoop);
			return resolve();}
		promises.push(new Promise(async(resolve, reject) => {
			var element = statusQueue.shift();
			if (element.type == 'panel'){
				var automsgData = JSON.parse((await new sql.Request(global.pool).query("SELECT * FROM SERVERS WHERE SERVER_ID = " + element.serverID)).recordset[0].LIVE)
				var panelData = automsgData[automsgData.findIndex((obj) => obj.messageID == element.messageID)]
				try{
					await panelEdit.update(element, client)
					panelData.lastPing = element.timestamp;
					panelData.lastState = element.embed;				
				}
				catch(err){
					panelData.failureCount++
					toConsole.log('Panel with ID ' + element.messageID + ' failed to update: ' + err)
				} //Panel failed, log
				automsgData.splice(automsgData[automsgData.findIndex((obj) => obj.messageID == element.messageID)], 1, panelData)
				await new sql.Request(global.pool).query("UPDATE SERVERS SET LIVE = N'" + JSON.stringify(automsgData).replace(/'/g, "''") + "' WHERE SERVER_ID = " + element.serverID)
			}
		resolve('Finished Updating')
		}))
	}, global.botConfig.configs[global.botConfig.release].liveQueuePause)})
	
	var test = await Promise.allSettled(promises)
	console.log(test)
	
}

}			
}