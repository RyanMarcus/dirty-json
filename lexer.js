// Copyright 2015, 2014 Ryan Marcus
// This file is part of dirty-json.
// 
// dirty-json is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// dirty-json is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with dirty-json.  If not, see <http://www.gnu.org/licenses/>.


var Q = require("q");

// terminals
const LEX_KV = 0;
const LEX_KVLIST = 1;
const LEX_VLIST = 2;
const LEX_BOOLEAN = 3;
const LEX_COVALUE = 4;
const LEX_CVALUE = 5;
const LEX_FLOAT = 6;
const LEX_INT = 7;
const LEX_KEY = 8;
const LEX_LIST = 9;
const LEX_OBJ = 10;
const LEX_QUOTE = 11;
const LEX_RB = 12;
const LEX_RCB = 13;
const LEX_TOKEN = 14;
const LEX_VALUE = 15;

// non-terminals
const LEX_COLON = -1;
const LEX_COMMA = -2;
const LEX_LCB = -3;
const LEX_LB = -4;
const LEX_DOT = -5;


var lexMap = {
	":": {type: LEX_COLON},
	",": {type: LEX_COMMA},
	"{": {type: LEX_LCB},
	"}": {type: LEX_RCB},
	"[": {type: LEX_LB},
	"]": {type: LEX_RB},
	".": {type: LEX_DOT} // TODO: remove?
};

function lex(nextFunc, peekFunc, emit) {
	
	var sym;
	while ((sym = nextFunc())) {
		var curr = [];
		
		if (sym == '"') {
			// chomp until we hit another quote
			while (true) {
				sym = nextFunc();
				if (sym == '"' || !sym) {
					emit({type: LEX_QUOTE, value: curr.join("")});
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
				if (sym == "'" || !sym) {
					emit({type: LEX_QUOTE, value: curr.join("")});
					curr = [];
					break;
				}

				curr.push(sym);
			}
			continue;
		}

		if (sym.match("[\\-0-9\\.]")) {
			// chomp until we get a non-integer
			curr.push(sym);
			while (true) {
				if (peekFunc() && 
				    (peekFunc().match("[0-9]") || peekFunc() == ".")) {
					curr.push(nextFunc());
					continue;
				}
				break;
			}

			if (curr.indexOf(".") != -1) {
				emit({type: LEX_FLOAT, value: parseFloat(curr.join(""))});
			} else {
				emit({type: LEX_INT, value: parseInt(curr.join(""))});
			}

			curr = [];
			continue;
		}

		// skip whitespace
		if (sym.match("\\s"))
			continue;

		if (sym in lexMap) {
			emit(lexMap[sym]);
			continue;
		}

		emit({type: LEX_TOKEN, value: sym});
	}
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

module.exports.getAllTokens = getAllTokens;
function getAllTokens(str) {
	var toR = Q.defer();

	var arr = [];
	var emit = function (i) {
		arr.push(i);
	};

	lexString(str, emit);

	toR.resolve(arr);
	return toR.promise;
}




//getAllTokens('5600').then(function(res) {
// 	console.log(res);
//});
