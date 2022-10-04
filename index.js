const { ShardingManager } = require('kurasuta');
const { join } = require('path');
const { Client, Intents } = require('discord.js');
const sharder = new ShardingManager(join(__dirname, 'bot'), {
	clusterCount: 1,
	shardCount: 1,
	timeout: 30000,
	clientOptions: {partials: ['MESSAGE'], intents: [Intents.FLAGS.GUILDS]},
	ipcSocket: 9999
});

sharder.spawn();

sharder.on('error', (err) => {console.log('Sharder Error: ' + err)});
