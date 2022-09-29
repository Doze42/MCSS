function check(status, json) {
	var res = false
	json.forEach(element => {
		if (status.ip.includes(element.domain)){
			if (JSON.stringify(status).includes(element.trigger)){res = true;};
		}
	});
	return res;
}

module.exports = {check}