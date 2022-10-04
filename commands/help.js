//Help Command
const Discord = require('discord.js') //discord.js for embed object

module.exports = {run}

async function run(client, interaction, stringJSON){
try{
global.toConsole.log('/help run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
global.shardInfo.commandsRun++
await interaction.reply({
	embeds:[ 
	new Discord.MessageEmbed() //create embed for suggestion
		.setTitle(stringJSON.help.embedTitle)
		.setColor(3447003)
		.setURL(stringJSON.help.docsLink)
		.setFooter({text: stringJSON.embeds.footerText})
		.setTimestamp()
		.setDescription(stringJSON.help.embedBody)
		]
	})
}
catch(err){
console.log('Error!')
console.log({command: 'help',
error: err})
}	
}