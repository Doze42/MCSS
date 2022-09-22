const fs = require('fs') //filesystem access
const Discord = require('discord.js') //discord.js for embed object
const strings = require('./strings') //string manipulation
module.exports = {statusEmbed, makeReply}

function statusEmbed(args, stringJSON){
	const statusEmbed = new Discord.MessageEmbed()
	if (args.online === false){
		args.format = JSON.parse(strings.insertData(JSON.stringify (args.format), args.data))
		if(args.format.offline.header.display){statusEmbed.setTitle(strings.truncate(args.format.offline.header.text, 50, true))}
		statusEmbed.setColor(args.format.offline.embedColor)
		if(args.format.offline.footer.display){statusEmbed.setFooter({text: strings.truncate(args.format.offline.footer.text, 50, true)})}
		if(args.format.offline.timestampEnable){statusEmbed.setTimestamp()}
		if(args.format.thumbnailEnable){statusEmbed.setThumbnail('attachment://' + args.favicon)}
		if(args.format.offline.body.display){statusEmbed.setDescription(args.format.offline.body.text)}
	}
	else if (args.online === true){
		args.format = JSON.parse(strings.insertData(JSON.stringify (args.format), args.data))
		if(args.format.online.header.display){statusEmbed.setTitle(strings.truncate(args.format.online.header.text, 50, true))}
		statusEmbed.setColor(args.format.online.embedColor)
		if(args.format.online.footer.display){statusEmbed.setFooter({text: strings.truncate(args.format.online.footer.text, 50, true)})}	
		if(args.format.online.timestampEnable){statusEmbed.setTimestamp()}
		if(args.format.thumbnailEnable){statusEmbed.setThumbnail('attachment://' + args.favicon)}
		if(args.format.online.body.display){statusEmbed.setDescription(args.format.online.body.text)}
		if(args.format.online.playersList.display && args.data.players.list && args.data.players.list.length){statusEmbed.addField(args.format.online.playersList.header, args.data.players.list.slice(0, 10).map(player => player.name).sort().join('\n'), true)}
	}
	return statusEmbed
} //end of makeEmbed

function makeReply(msg, type, stringJSON) { //generates error and reply messages
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
	const replyEmbed = new Discord.MessageEmbed() 
		.setTitle(embedTitle)
		.setColor(embedColor)
		.setDescription(embedMessage)
		.setFooter({text: stringJSON.embeds.footerText})
		.setTimestamp()
	return replyEmbed}
	catch(err){console.log(err)}
}