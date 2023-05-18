//Help Command
const { EmbedBuilder } = require('discord.js'); //discord.js for embed object

module.exports = {run}

async function run(client, interaction, stringJSON){
try{
	global.toConsole.log('/help run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
	global.shardInfo.commandsRun++
	await interaction.reply({		
		embeds:[ 
			new EmbedBuilder({
				"color": 3447003,
				"title": stringJSON.help.embedTitle,
				"url": stringJSON.help.docsLink,
				"footer": {text: stringJSON.embeds.footerText},
				"timestamp": new Date().toISOString(),
				"description": stringJSON.help.embedBody
			}).data 
		]
	})
}
catch(err){
console.log('Error!')
console.log({command: 'help',
error: err})
}	
}