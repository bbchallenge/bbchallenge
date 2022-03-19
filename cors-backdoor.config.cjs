module.exports = {
	// Custom Headers
	headers: {
		// Set CORS headers
		'Access-Control-Allow-Origin': function (req, res) {
			return req.headers.origin;
		},
		'Access-Control-Allow-Credentials': true
	},

	// Logger Options
	debug: {
		name: 'cors-backdoor',
		level: 'error',
		prettyPrint: true
	}
};
