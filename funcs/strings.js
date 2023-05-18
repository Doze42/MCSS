function cleanmotd(description){
var stg = ''
var current
if (description.extra !== undefined){
	for (let i = 0; i <= description.extra.length - 1; i++) {
	current = description.extra[i]
stg += current.text}}
else if (description.text !== '' | description.text !== undefined && description.extra == undefined){stg = description.text}
else {stg === 'Unable to Retrieve Name'}
if (typeof description == 'string'){stg = description;}
stg = stg.replace(/§4|§c|§6|§e|§2|§a|§b|§3|§1|§9|§d|§5|§f|§7|§8|§0|§r|§l|§o|§n|§m|§k/g, ""); //removes all formatting characters from motd
return stg;}

function realEscape(str) {
  if (typeof str !== "string")
    throw new Error("Non-string provided");

  return str.replace(/[^a-zA-Z0-9@+_\- ]/g, unsafe => `%${unsafe.charCodeAt(0).toString(16)};`);
}

function insertData(string, data){
	if (data.ip){string = string.replace(/%ip%/g, data.ip);}
	if (data.type){string = string.replace(/%type%/g, data.type);}
	if (data.motd){string = string.replace(/%motd%/g, data.motd);}
	if (data.version){string = string.replace(/%version%/g, data.version);}
	if (data.players){
		string = string.replace(/%now%/g, data.players.online);
		if (data.players.max){string = string.replace(/%max%/g, data.players.max);}
		string = string.replace(/%open%/g, data.players.max - data.players.online);
	}
	if (data.latency){string = string.replace(/%ping%/g, data.latency);}
	if (data.error){string = string.replace(/%error%/g, data.error)}
	//string = string.replace(/%player%/g, put shit here to get random player);
	string = string.replace(/\n/g, "\\n")
	return string;
}
function checkChars(value, upper, lower = 0){ //Checks if a string contains any ASCII character outside the specified range
//Examples:
//Numbers: 48 - 57
//Letters(Uppercase) 65-90
//Letters(Lowercase) 97-122
//All UTF-8 characters 0-127
for (var i = 0; i < value.length; i++)
if (value.charCodeAt(i) > upper | value.charCodeAt(i) < lower) {return true}
return false
}

function truncate(str, max, elipsis = false){
if (str.length > max){
	if (elipsis = true){
		return str.slice(0, (max - 3)) + '...';
	}
	else {return str.slice(0, max);}
}
else{return str;} //if the string is not too long, return the original value
}

function cleanString(str){
var stg = str.replace(/§4|§c|§6|§e|§2|§a|§b|§3|§1|§9|§d|§5|§f|§7|§8|§0|§r|§l|§o|§n|§m|§k/g, ""); //removes all formatting characters from motd
return stg;}

function elapsedTime(timestamp){
	var clean = ''
	var minutes = 0
	var hours = 0
	var days = 0
	var dateSeconds = (Math.round(new Date().getTime() / 1000)) - Math.round(timestamp / 1000)
	while (dateSeconds >= 86400){
	days++;
	dateSeconds -= 86400;}
	while (dateSeconds >= 3600){
	hours++;
	dateSeconds -= 3600;}
	while (dateSeconds >= 60){
	minutes++;
	dateSeconds -= 60;}
	if (days){clean += (days + ' Days, ')}
	if (hours){clean += (hours + ' Hours, ')}
	if (minutes){clean += (minutes + ' Minutes, ')}
	clean += (dateSeconds + ' Seconds')
	return {
		days: days,
		hours: hours,
		minutes: minutes,
		seconds: dateSeconds,
		clean: clean
	}
}

function checkSuggestion(string){
const blockedStrings = ['discord.gg', 'discord.com/invite','discordapp.com/invite', 'invite.gg', 'dsc.gg']
for (var i = 0; i < blockedStrings.length; i++){
	if(string.toLowerCase().includes(blockedStrings[i])){return {"passed": false, "term": blockedStrings[i]}}
}
return {"passed": true};
}

module.exports = {cleanmotd, cleanString, elapsedTime, checkChars, truncate, checkSuggestion, insertData, realEscape}