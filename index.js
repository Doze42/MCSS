const { ShardingManager } = require('kurasuta');
const { join } = require('path');
const { Client, Intents } = require('discord.js');
const chalk = require ('chalk')

global.shardCrashCount = 0;

setInterval(function(){global.shardCrashCount = 0}, 86400000) //resets shard reconnect count daily

const sharder = new ShardingManager(join(__dirname, 'bot'), {
	clusterCount: 1,
	shardCount: 1,
	timeout: 30000,
	clientOptions: {partials: ['MESSAGE'], intents: [Intents.FLAGS.GUILDS]},
	ipcSocket: 9999
});

sharder.spawn();

sharder.on('error', (err) => {
	global.shardCrashCount++;
	if (global.shardCrashCount > 500){process.exit(1)} //Kills process to avoid shard reconnection ratelimit
	console.log('Sharder Error: ' + err)
});
