var parser = require('./parser');

module.exports.parse = parse;
function parse(text) {
	return parser.parse(text);
}

/*parse('{ "this": that, "another": "maybe" }').then(function (res) {
 	console.log(res);
});*/
