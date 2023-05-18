//Panel Edit Live Status

const queryServer = require('../funcs/queryServer.js'); //ping library
const richEmbeds = require('../funcs/embeds'); //embed generation
const isEqual = require('lodash.isequal');
const Discord = require('discord.js') //discord.js for embed object
const compat = require ('../funcs/compat.js');
const sql = require ('mssql');

async function check(element, stringJSON){
return new Promise(async(resolve, reject) => {
	try{
		if (!global.statusCache.has(element.ip)){		
			try {
				var pingResults = await queryServer(element.ip)
				//{let conn = await global.pool.getConnection();
				//var dbData = (await conn.query("SELECT * from SERVERS WHERE SERVER_ID = " + element.guildID + " LIMIT 1"))[0].COMPAT
				//conn.release();}
				var dbData = (await new sql.Request(global.pool).query('SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ' + element.guildID)).recordset[0].COMPAT
				if (await compat.check(pingResults, JSON.parse(dbData))){throw stringJSON.status.compatOffline;};
				global.statusCache.set(element.ip, {online: true, data: pingResults})}
			catch(err){
			global.statusCache.set(element.ip, {online: false, data: err})}
		}

		if ((new Date().getTime() - element.lastPing) >= 1209600000){
				//todo: make the disable time configurable
			var disable = true;
			var statEmbed = richEmbeds.makeReply(stringJSON.automsg.disabled.deadPanel, 'error', stringJSON);
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
			if(!isEqual(JSON.stringify({title: statEmbed.title, description: statEmbed.description, fields: statEmbed.fields, footer: statEmbed.footer}),
			JSON.stringify({title: element.lastState.title, description: element.lastState.description, fields: element.lastState.fields, footer: element.lastState.footer})))
			{resolve ({update: true, data: statEmbed, disable: disable})}
			else {resolve ({update: false, disable: disable});}
	}
	catch(err){
		global.toConsole.error('Failed at panelEdit.check with panel ID ' + element.messageID + ' : ' + err);
		reject(err)
	}
})
}

function update(data, client, stringJSON){
	return new Promise(async(resolve, reject) => {
		try{
			try{				
				//add perm check for channel read messages
				var channel = await client.channels.cache.get(data.channelID);
				var message = await channel.messages.fetch(data.messageID);
				if (channel.type !== 'GUILD_TEXT'){
					data.embed = richEmbeds.makeReply(stringJSON.automsg.disabled.channelType, 'error', stringJSON);
					await message.removeAttachments(); //removes the favicon so it doesn't look weird
					await message.edit({embeds: [data.embed]});
					reject('remove');
				}
				if (data.disable){
					await message.removeAttachments(); //removes the favicon so it doesn't look weird
					await message.edit({embeds: [data.embed]});
					reject('remove');
				}
				await message.edit({embeds: [data.embed]})
				resolve('Updated Sucessfully');
			}
			catch(err){reject(err)}
		}
		catch(err){
			global.toConsole.error('Failed at panelEdit.update with panel ID ');
			reject(err);
		}
	})
}
module.exports = {check, update}