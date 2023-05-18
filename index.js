const { ShardingManager } = require('kurasuta');
const { join } = require('path');
const { Client, Intents } = require('discord.js');
const fs = require ('fs')

const config = JSON.parse(fs.readFileSync("./assets/config.json"))

global.shardCrashCount = 0;
global.botStartTime = new Date();

setInterval(function(){global.shardCrashCount = 0}, 86400000) //resets shard reconnect count daily

const sharder = new ShardingManager(join(__dirname, 'bot'), {
	clusterCount: config.shardCount,
	shardCount: config.shardCount,
	timeout: 30000,
	clientOptions: {partials: ['MESSAGE'], intents: 513},
	ipcSocket: 9999
});

sharder.spawn();

sharder.on('error', (err) => {
	console.log(shardCrashCount)
	global.shardCrashCount++;
	if (global.shardCrashCount > config.crashLimit){
	console.log('Shard crash limit exceeded, exiting process')
	process.exit(1)} //Kills process to avoid shard reconnection ratelimit
	console.log('Sharder Error: ' + err)
});
