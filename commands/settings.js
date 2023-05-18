//settings command

module.exports = {run}

const richEmbeds = require('../funcs/embeds'); //embed generation
const sql = require('mssql') //mssql

async function run(client, interaction, stringJSON){
	global.shardInfo.commandsRun++
	try{
		if(!interaction.inGuild()){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.noDM, 'error', stringJSON)], ephemeral: true})}
		var subCommand = interaction.options.getSubcommand()
        let guildData = JSON.parse((await new sql.Request(global.pool).query(`SELECT TOP 1 * from SERVERS WHERE SERVER_ID = ${interaction.guildId}`)).recordset[0].CONFIG)
        if (subCommand == 'lang'){
            const getLang = require('../funcs/getLang.js').getLang
            global.toConsole.log(`/compat add run by ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`)
            if (interaction.user.PermissionLevel == 0 && !interaction.member.permissions.has("ADMINISTRATOR")){return interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.permissions.restricted, 'error', stringJSON)], ephemeral: true})}
            var lang = interaction.options.getString('language')
            guildData.lang = lang
            stringJSON = getLang(lang).strings
            await new sql.Request(global.pool).query(`UPDATE SERVERS SET CONFIG = N'${JSON.stringify(guildData)}' WHERE SERVER_ID = ${interaction.guildId}`)
            interaction.reply({embeds:[richEmbeds.makeReply(stringJSON.settings.lang, 'notif', stringJSON)], ephemeral: false});
        }

    }
    catch(err){
        global.toConsole.error(`Command: settings Error: ${err}`)
    }
}