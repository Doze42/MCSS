const { ShardingManager } = require('kurasuta');
const { join } = require('path');
const { Client, Intents } = require('discord.js');
const sharder = new ShardingManager(join(__dirname, 'bot'), {
	clusterCount: 2,
	shardCount: 2,
	timeout: 30000,
	clientOptions: {partials: ['MESSAGE'], intents: [Intents.FLAGS.GUILDS]},
	ipcSocket: 9999
});

try{
sharder.spawn();
}
catch(err){console.log(err)}
