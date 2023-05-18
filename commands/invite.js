//Invite Command
const fs = require('fs');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js'); //discord.js for embed object
const staticImages = JSON.parse(fs.readFileSync("./assets/static_images.json")); //Base64 encoded images

module.exports = {run}

async function run(client, interaction, stringJSON){
try{
global.toConsole.log('/invite run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
global.shardInfo.commandsRun++
await interaction.reply({
	files: [new AttachmentBuilder(Buffer.from(staticImages.mcss_logo, 'base64'), {name: 'logo.png'})],
	embeds:[ 
		new EmbedBuilder({
			"color": 3447003,
			"footer": {text: stringJSON.embeds.footerText},
			"timestamp": new Date().toISOString(),
			"description": stringJSON.invite.embedBody,
			"thumbnail": {"url": "attachment://logo.png"}
		}).data
	]
	})
}
catch(err){
console.log('Error!')
console.log({command: 'invite',
error: err})
}	
}