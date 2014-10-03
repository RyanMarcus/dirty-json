


function lex(nextFunc, peekFunc, emit) {
	
	var sym;
	while ((sym = nextFunc())) {
		var curr = [];
		
		if (sym == '"') {
			// chomp until we hit another quote
			while (true) {
				sym = nextFunc();
				if (sym == '"') {
					emit({type: 'quote', value: curr});
					curr = [];
					break;
				}

				curr.push(sym);
			}
			continue;
		}

		if (sym == "'") {
			// chomp until we hit another quote
			while (true) {
				sym = nextFunc();
				if (sym == "'") {
					emit({type: 'quote', value: curr});
					curr = [];
					break;
				}

				curr.push(sym);
			}
			continue;
		}

		if (sym.match("[0-9\\.]")) {
			// chomp until we get a non-integer
			curr.push(sym);
			while (true) {
				if (peekFunc().match("[0-9]") || peekFunc() == ".") {
					curr.push(nextFunc());
					continue;
				}
				break;
			}

			if (curr.indexOf(".") != -1) {
				emit({type: 'float', value: curr});
			} else {
				emit({type: 'int', value: curr});
			}

			curr = [];
			continue;
		}

		// skip whitespace
		if (sym.match("\\s"))
			continue;

		// TODO should probably use a map here...
		if (sym == ":") {
			emit({type: 'colon'});
			continue;
		}

		if (sym == ",") {
			emit({type: 'comma'});
			continue;
		}
	
		if (sym == "{") {
			emit({type: 'lcb'});
			continue;
		}

		if (sym == "}") {
			emit({type: 'rcb'});
			continue;
		}

		if (sym == "[") {
			emit({type: 'lb'});
			continue;
		}

		if (sym == "]") {
			emit({type: 'rb'});
			continue;
		}

		if (sym == ".") {
			emit({type: 'dot'});
			continue;
		}

		emit({type: 'token', value: sym});
	}
}

function printEmit(token) {
	console.log(token);
}

module.exports.lexString = lexString;
function lexString(str, emit) {
	var s = str;


	var next = function() {
		if (s.length == 0)
			return false;

		var toR = s.charAt(0);
		s = s.substring(1);
		return toR;
	};

	var peek = function() {
		if (s.length == 0)
			return false;


		return s.charAt(0);
	};

	lex(next, peek, emit);
	
}




//lexString("{ test: [568.9, 68, .8] }", printEmit);
