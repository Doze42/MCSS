const richEmbeds = require('../funcs/embeds'); //embed generation

async function run(client, interaction, stringJSON){
	try{
		var subCommand = interaction.options.getSubcommand()
		global.toConsole.log('/admin run by ' + interaction.user.username + '#' + interaction.user.discriminator + ' (' + interaction.user.id + ')')
		if (interaction.user.PermissionLevel < 2) {return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
		if (subCommand == 'respawn'){
			var id = interaction.options.getString('id');
			(!id) {id = client.shard.id}
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.admin.respawnOne, 'notif', stringJSON)], ephemeral: true})
			client.shard.restart(id);
		}
		else if (subCommand == 'respawnall'){
			interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.admin.respawnAll, 'notif', stringJSON)], ephemeral: true})
			client.shard.restartAll();
		}
	}
	catch(err){
		console.log('Error!')
		console.log({command: 'invite',
		error: err})
	}	
}	