const fs = require('fs');
module.exports = {getLang};

const en = {
	strings: JSON.parse(fs.readFileSync("./lang/en/strings.json")),
	defaults: JSON.parse(fs.readFileSync("./lang/en/defaults.json"))
}
const fr = {
	strings: JSON.parse(fs.readFileSync("./lang/fr/strings.json")),
	defaults: JSON.parse(fs.readFileSync("./lang/fr/defaults.json"))
}



function getLang(locale){
	switch(locale){
	case 'fr':
		return fr;
		break;
	default:
		return en;
	}
}