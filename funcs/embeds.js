const { EmbedBuilder } = require('discord.js'); //discord.js for embed object
const strings = require('./strings') //string manipulation
module.exports = {statusEmbed, makeReply}

function statusEmbed(args, stringJSON){
	const statusEmbed = new EmbedBuilder()
	if (args.online){
		args.format = JSON.parse(strings.insertData(JSON.stringify (args.format), args.data))
		if(args.format.online.header){statusEmbed.setTitle(strings.truncate(args.format.online.header, 50, true))}
		statusEmbed.setColor(args.format.online.embedColor)
		if(args.format.online.footer){statusEmbed.setFooter({text: strings.truncate(args.format.online.footer, 50, true)})}	
		if(args.format.online.timestampEnable){statusEmbed.setTimestamp()}
		if(args.format.thumbnailEnable){statusEmbed.setThumbnail('attachment://' + args.favicon)}
		if(args.format.online.body){statusEmbed.setDescription(args.format.online.body)}
		if(args.format.online.playersList.display && args.data.players.list && args.data.players.list.length){statusEmbed.addFields({
		"name": args.format.online.playersList.header,
		"value": args.data.players.list.slice(0, 10).map(player => player.name).sort().join('\n'), 
		"inline": true})}
	}
	else{
		args.format = JSON.parse(strings.insertData(JSON.stringify (args.format), args.data))
		if(args.format.offline.header){statusEmbed.setTitle(strings.truncate(args.format.offline.header, 50, true))}
		statusEmbed.setColor(args.format.offline.embedColor)
		if(args.format.offline.footer){statusEmbed.setFooter({text: strings.truncate(args.format.offline.footer, 50, true)})}
		if(args.format.offline.timestampEnable){statusEmbed.setTimestamp()}
		if(args.format.thumbnailEnable){statusEmbed.setThumbnail('attachment://' + args.favicon)}
		if(args.format.offline.body){statusEmbed.setDescription(args.format.offline.body)}
	}
	
	return statusEmbed.data
} 

function makeReply(msg = 'Error message failed to load', type, stringJSON) { //generates error and reply messages
	try{
		var embedTitle
		var embedColor
		var embedMessage
		if (type == 'error') {
			embedTitle = stringJSON.reply.error
			embedColor = 'E74C3C'
			embedMessage = 	(msg)}
		else if (type == 'notif') {
			embedTitle = stringJSON.reply.notif
			embedColor = '3498DB'
			embedMessage = msg }
		return new EmbedBuilder({
			"title": embedTitle,
			"color": embedColor,
			"description": embedMessage,
			"footer": {text: stringJSON.embeds.footerText},
			"timestamp": new Date().toISOString()
		}).data
	}
	catch(err){console.log(err)}
}