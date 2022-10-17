const { ShardingManager } = require('kurasuta');
const { join } = require('path');
const { Client, Intents } = require('discord.js');
const chalk = require ('chalk')

global.toConsole = {
	log: function(msg, shardID = 'Unknown'){console.log(chalk.magenta('[Shard ' + shardID + '] ') + chalk.bgBlue('[log]') + ' ' + msg)},
	info: function(msg, shardID = 'Unknown'){console.log(chalk.magenta('[Shard ' + shardID + '] ') + chalk.bgGreen('[info]') + ' ' + msg)},
	error: function(msg, shardID = 'Unknown'){console.log(chalk.magenta('[Shard ' + shardID + '] ') + chalk.bgRed('[error]') + ' ' + msg)},
	debug: function(msg, shardID = 'Unknown'){console.log(chalk.magenta('[Shard ' + shardID + '] ') + chalk.bgRed('[debug]') + ' ' + msg)}
}

const sharder = new ShardingManager(join(__dirname, 'bot'), {
	clusterCount: 1,
	shardCount: 1,
	timeout: 30000,
	clientOptions: {partials: ['MESSAGE'], intents: [Intents.FLAGS.GUILDS]},
	ipcSocket: 9999
});

sharder.spawn();

sharder.on('error', (err) => {console.log('Sharder Error: ' + err)});
