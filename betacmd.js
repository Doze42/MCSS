const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

const servers = new SlashCommandBuilder()
	servers.setName('servers')
	servers.setDescription('Modifies the saved servers for this guild')
	servers.addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Adds a saved server')
			.addStringOption(option => option.setName('address').setDescription('The IP address of the server to add').setRequired(true))
			.addStringOption(option => option.setName('alias').setDescription('Set an alias for this server').setRequired(false))
			.addIntegerOption(option => option.setName('port').setDescription('The port number of the server to add').setRequired(false))
			.addBooleanOption(option => option.setName('default').setDescription('Sets this server as the default').setRequired(false)))
	servers.addSubcommand(subcommand =>
		subcommand
			.setName('remove')
			.setDescription('Removes a saved server')
			.addStringOption(option => option.setName('alias').setDescription('The alias of the server to remove').setRequired(true)))
	servers.addSubcommand(subcommand =>
		subcommand
			.setName('list')
			.setDescription('Lists the saved servers for this guild'))
			
const embeds = new SlashCommandBuilder()
	embeds.setName('embeds')
	embeds.setDescription('Modifies the saved embeds for this guild')
	embeds.addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Adds an embed template')
			.addStringOption(option => option.setName('alias').setDescription('Sets an alias for this template').setRequired(false))
			.addStringOption(option => option.setName('online-header').setDescription('Sets the online embed header text').setRequired(false))
			.addStringOption(option => option.setName('online-footer').setDescription('Sets the online embed footer text').setRequired(false))
			.addStringOption(option => option.setName('online-body').setDescription('Sets the online embed body text').setRequired(false))
			.addStringOption(option => option.setName('online-color').setDescription('Sets the online embed color').setRequired(false).addChoices({name:'Green', value:'33CC66'}, {name:'Red', value:'E74C3C'}, {name:'Blue', value:'3498DB'}, {name:'Yellow', value:'FFFF54'}, {name:'Pink', value:'E874D9'}, {name:'Purple', value:'3F208A'}, {name:'Orange', value:'C75300'}))
			.addStringOption(option => option.setName('online-color-hex').setDescription('Allows a custom online embed color').setRequired(false))
			.addBooleanOption(option => option.setName('online-display-timestamp').setDescription('Enables/Disables the online embed timestamp').setRequired(false))
			.addBooleanOption(option => option.setName('display-thumbnail').setDescription('Enables/Disables the online embed thmbnail').setRequired(false))
			.addBooleanOption(option => option.setName('online-display-list').setDescription('Enables/Disables the online embed player list').setRequired(false))
			.addBooleanOption(option => option.setName('online-display-header').setDescription('Enables/Disables the offline embed header').setRequired(false))
			.addBooleanOption(option => option.setName('online-display-footer').setDescription('Enables/Disables the offline embed footer').setRequired(false))
			.addStringOption(option => option.setName('offline-header').setDescription('Sets the offline embed header color').setRequired(false))
			.addStringOption(option => option.setName('offline-footer').setDescription('Sets the offline embed footer text').setRequired(false))
			.addStringOption(option => option.setName('offline-body').setDescription('Sets this server as the default').setRequired(false))
			.addStringOption(option => option.setName('offline-color').setDescription('Sets this server as the default').setRequired(false).addChoices({name:'Green', value:'33CC66'}, {name:'Red', value:'E74C3C'}, {name:'Blue', value:'3498DB'}, {name:'Yellow', value:'FFFF54'}, {name:'Pink', value:'E874D9'}, {name:'Purple', value:'3F208A'}, {name:'Orange', value:'C75300'}))
			.addStringOption(option => option.setName('offline-color-hex').setDescription('Sets this server as the default').setRequired(false))
			.addBooleanOption(option => option.setName('offline-display-timestamp').setDescription('Sets this server as the default').setRequired(false))
			.addBooleanOption(option => option.setName('offline-display-header').setDescription('Enables/Disables the offline embed header').setRequired(false))
			.addBooleanOption(option => option.setName('offline-display-footer').setDescription('Enables/Disables the offline embed footer').setRequired(false)))
	embeds.addSubcommand(subcommand =>
		subcommand
			.setName('remove')
			.setDescription('Removes an embed template')
			.addStringOption(option => option.setName('alias').setDescription('The alias of the template to remove').setRequired(true)))
	embeds.addSubcommand(subcommand =>
		subcommand
			.setName('list')
			.setDescription('Lists the embed templates for this guild'))
	embeds.addSubcommand(subcommand =>
		subcommand
			.setName('preview')
			.setDescription('Previews a saved embed template')
			.addStringOption(option => option.setName('alias').setDescription('The alias of the template to preview').setRequired(true)))


const status = new SlashCommandBuilder()
	status.setName('status')
	status.setDescription('Checks the status of a Minecraft server')
	status.addStringOption(option =>
		option.setName('address')
			.setDescription('The IP address of the server to check')
			.setRequired(false));
	status.addStringOption(option =>
		option.setName('server')
			.setDescription('Saved server to use')
			.setRequired(false));
	status.addIntegerOption(option =>
		option.setName('port')
			.setDescription('The port number of the server')
			.setRequired(false));
			
const automsg = new SlashCommandBuilder()
	automsg.setName('automsg')
	automsg.setDescription('Creates a Message Edit Live Status panel')
	automsg.addStringOption(option =>
		option.setName('address')
			.setDescription('The IP address of the server')
			.setRequired(false));
	automsg.addIntegerOption(option =>
		option.setName('port')
			.setDescription('The port number of the server')
			.setRequired(false));
	automsg.addStringOption(option =>
		option.setName('server')
			.setDescription("Saved server to use")
			.setRequired(false));
	automsg.addStringOption(option =>
		option.setName('embeds')
			.setDescription('Saved embed template to use')
			.setRequired(false));
/* const autopnl = new SlashCommandBuilder()
	autopnl.setName('autocnl')
	autopnl.setDescription('Confugures a voice channel for Channel Edit Live Status')
	autopnl.addChannelOption(option =>
		option.setName('channel')
		.setDescription('The voice channel to use')
		.setRequired(true)
		.addChannelType(2))
	autopnl.addStringOption(option =>
		option.setName('online_text')
		.setDescription('Channel display name when server is online')
		.setRequired(true))
	autopnl.addStringOption(option =>
		option.setName('offline_text')
		.setDescription('Channel display name when server is offline')
		.setRequired(true))
	autopnl.addStringOption(option =>
		option.setName('address')
			.setDescription('The IP address of the server')
			.setRequired(false));
	autopnl.addIntegerOption(option =>
		option.setName('port')
			.setDescription('The port number of the server')
			.setRequired(false));
	autopnl.addStringOption(option =>
		option.setName('server')
			.setDescription("Saved server to use")
			.setRequired(false)); */
const commands = [
automsg,
status,
embeds,
//autopnl,
servers,
//{
//	name: 'test',
//	description: 'Debug command'
//},
{
	name: 'botstats',
	description: 'Provides statistics about the bot'
},
{
	name: 'invite',
	description: 'Provides links to add the bot or join the support server'
}
]; 

const rest = new REST({ version: '10' }).setToken('NzkwMDc1Nzk2MDQyOTQwNDQ4.GzGw5V.W6IjHK9pGcabnIXzN_AqOkg0XaDvLMz9CLnr7w');

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');


   // await rest.put(
   //   Routes.applicationGuildCommands('681355073179090965', '690081112164139040'),
  //    { body: commands },
  //  );
	
	await rest.put(Routes.applicationCommands('790075796042940448'),{ body: commands },);


    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();