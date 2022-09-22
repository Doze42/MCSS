//Panel Edit Live Status

const queryServer = require('../funcs/queryServer.js'); //ping library
const richEmbeds = require('../funcs/embeds'); //embed generation
const isEqual = require('lodash.isequal');
const Discord = require('discord.js') //discord.js for embed object
const sql = require('mssql')

async function check(element, stringJSON){
try{
	if (!global.statusCache.has(element.ip)){
		try {global.statusCache.set(element.ip, {online: true, data: await queryServer(element.ip)})}
		catch(err){
		global.statusCache.set(element.ip, {online: false, data: err})}
	}

	if ((new Date().getTime() - element.lastPing) >= 1209600000){
			//todo: make the disable time configurable
			
		var disable = true;
		var statEmbed = new Discord.MessageEmbed() 
			.setTitle(stringJSON.automsg.disabled.header)
			.setColor('E74C3C')
			.setDescription(stringJSON.automsg.disabled.body)
			.setFooter({text: stringJSON.embeds.footerText})
			.setTimestamp()
		if(element.embedTemplate.thumbnailEnable){statEmbed.setThumbnail('attachment://favicon.png')}
	}
	else {
		if (global.statusCache.get(element.ip).online){
			var statEmbed = richEmbeds.statusEmbed({
			online: true,
			favicon: 'favicon.png',
			data: global.statusCache.get(element.ip).data,
			format: element.embedTemplate
			}, stringJSON);
		}
		else {
			var statEmbed = richEmbeds.statusEmbed({
			online: false,
			favicon: 'favicon.png',
			data: {error: global.statusCache.get(element.ip).data, hostname: element.ip},
			format: element.embedTemplate
			}, stringJSON);
		}
	}
		if(!isEqual({title: statEmbed.title, description: statEmbed.description, fields: statEmbed.fields, footer: statEmbed.footer.text},
		{title: element.lastState.title, description: element.lastState.description, fields: element.lastState.fields, footer: element.lastState.footer.text}))
		{return {update: true, data: statEmbed, disable: disable}}
		else {return {update: false, disable: disable};}
}
catch(err){
	global.toConsole.error('Failed at panelEdit.check with panel ID ' + element.messageID);
	console.log(err)
}
}

function update(data, client){
	return new Promise(async(resolve, reject) => {
		try{
			try{
				//add perm check for channel read messages
				var channel = await client.channels.cache.get(data.channelID);
				//add checking for news channel
				var message = await channel.messages.fetch(data.messageID);
				await message.edit({embeds: [data.embed]})
				resolve('Updated Sucessfully');
			}
			catch(err){}
		}
		catch(err){
			global.toConsole.error('Failed at panelEdit.update with panel ID ');
			reject(err);
		}
	})
}
module.exports = {check, update}