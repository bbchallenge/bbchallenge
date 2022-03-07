export function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function addToHistory(machineIDorb64) {
	console.log('History add', machineIDorb64);
	const local = localStorage;
	if (typeof localStorage !== 'undefined') {
		if (localStorage.getItem('bbchallenge') == null) {
			local.setItem('bbchallenge', JSON.stringify({ history: [] }));
		}

		const current_state = JSON.parse(local.getItem('bbchallenge'));

		current_state['history'].push(machineIDorb64);

		// flushing history every so often
		if (current_state['history'].length > 1000) {
			current_state['history'] = current_state['history'].slice(900, 1001);
		}

		local.setItem('bbchallenge', JSON.stringify(current_state));
	}
}

export function getHistory() {
	if (typeof localStorage !== 'undefined') {
		return JSON.parse(localStorage.getItem('bbchallenge'))['history'].reverse();
	} else {
		return [];
	}
}
