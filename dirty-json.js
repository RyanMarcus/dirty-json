var parser = require('./parser');

module.exports.parse = parse;
function parse(text) {
	return parser.parse(text);
}
