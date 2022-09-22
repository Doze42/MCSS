const fs = require('fs')
const strings = require('./strings') //string manipulation
const offlineExceptions = JSON.parse(fs.readFileSync("./assets/offlineExceptions.json"));
function check(ip, motd, version){ //Will be depreciated in 2.2.2
//hard coded exceptions for free hosts which tend to return bizarre data that messes with bot
if(ip.includes('aternos.me') & motd.includes('This server is offline.')){return true}
if(ip.includes('aternos.me') & motd == 'Server not found.'){return true}
if(ip.includes('aternos.me') & motd == 'Server' & version == '0.0.0'){return true}
if(ip.includes('minefort.com') & motd == 'Start your server at www.minefort.com'){return true}}

function java(pingResults){
if (pingResults.version == undefined | pingResults.description == undefined | pingResults.players == undefined){
return {online: false, err: 'Invalid Data'}}
if (check(pingResults.ip, strings.cleanmotd(pingResults.description), strings.cleanString(pingResults.version.name))){return{online: false, err: 'Server Offline (Compatablilty)'}}
return {online: true, err: 'Server OK'}	
}

function java(pingResults){
if (pingResults.version == undefined | pingResults.description == undefined | pingResults.players == undefined){
return {online: false, err: 'Invalid Data'}}
if (check(pingResults.ip, strings.cleanmotd(pingResults.description), strings.cleanString(pingResults.version.name))){return{online: false, err: 'Server Offline (Compatablilty)'}}
return {online: true, err: 'Server OK'}	
}

function checkStatic(ip, motd){
	for (let i = 0; i < offlineExceptions.length; i++) {
	
	if (ip == offlineExceptions[i].domain & motd == offlineExceptions[i].motd){return true}
	}
return false	
}
module.exports = {check, java}