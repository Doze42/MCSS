const sql = require('mssql');
const fs = require('fs');
module.exports = {addServer};
const defaults = JSON.parse(fs.readFileSync("./assets/defaults.json")); //loads default values from disk

async function addServer(id){
	return new Promise(async(resolve, reject) => {
		try{
			await new sql.Request(global.pool).query("INSERT INTO SERVERS (SERVER_ID, EMBEDS, CONFIG, SERVERS, LIVE) VALUES ('" + id + "', N'" + JSON.stringify(defaults.embeds) + "', N'" + JSON.stringify(defaults.config) + "', N'" + JSON.stringify(defaults.servers) + "', N'" + JSON.stringify(defaults.live) + "')")
			resolve ('Server ' + id + ' added to database.')
		}
		catch(err){
			global.toConsole.error('Failed to add new server to database: ' + err);
			reject(err)
		}
	})
}
