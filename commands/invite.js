//Invite Command
const fs = require('fs');
const Discord = require('discord.js') //discord.js for embed object
const staticImages = JSON.parse(fs.readFileSync("./assets/static_images.json")); //Base64 encoded images

module.exports = {run}

async function run(client, interaction, stringJSON){
try{
global.toConsole.log('/invite run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
global.shardInfo.commandsRun++
await interaction.reply({
	files: [new Discord.MessageAttachment(Buffer.from(staticImages.mcss_logo, 'base64'), 'logo.png')],
	embeds:[ 
	new Discord.MessageEmbed() //create embed for suggestion
		.setColor(3447003)
		.setFooter({text: stringJSON.embeds.footerText})
		.setTimestamp()
		.setDescription(stringJSON.invite.embedBody)
		.setThumbnail('attachment://logo.png')]
	})
}
catch(err){
console.log('Error!')
console.log({command: 'invite',
error: err})
}	
}