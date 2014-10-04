var fs = require('fs');
var Stream = require('stream');
var lexer = require("./lexer");
var Q = require('q');


Array.prototype.peek = function() {
	return this[this.length - 1];
};

Array.prototype.last = function(i) {
	return this[this.length - (1 + i)];
};


function is(obj, prop) {
	return (obj && obj.hasOwnProperty("type") && obj.type == prop);
}

function log(str) {
	//console.log(str);
}

function parseStream(stream) {
	var stack = [];

	var procStack = function() {
		
	};

	stream.on('data', function (d) {
		for (var i = 0; i < d.length; i++) {
			stack.push(d.charAt(i));
			procStack();
		}
	});
}


module.exports.parse = parse;
function parse(text) {
	var toR = Q.defer();

	var stack = [];

	var tokens = [];
	var emit = function(t) {
		tokens.push(t);
	};

	lexer.lexString(text, emit);


	for (var i = 0; i < tokens.length; i++) {
		log("Shifting " + tokens[i].type);
		stack.push(tokens[i]);
		log(stack);
		log("Reducing...");
		while (reduce(stack)) {
			log(stack);
			log("Reducing...");
		}

	}

	toR.resolve(compileOST(stack[0]));
	return toR.promise;
}

function reduce(stack) {
	var next = stack.pop();


	if (is(next, "key") && next.value == "true") {
		log("Rule 5");
		stack.push({'type': "boolean", 'value': "true"});
		return true;
	}


	if (is(next, "key") && next.value == "false") {
		log("Rule 6");
		stack.push({'type': "boolean", 'value': "false"});
		return true;
	}


	if (is(next, "token") && is(stack.peek(), "key")) {
		log("Rule 11a");
		stack.peek().value += next.value;
		return true;
	}

	if (is(next, "int") && is(stack.peek(), "key")) {
		log("Rule 11b");
		stack.peek().value += next.value;
		return true;
	}

	if (is(next, "token")) {
		log("Rule 11c");
		stack.push({type: 'key', value: [ next.value ] });
		return true;
	}

	if (is(next, "quote")) {
		log("Rule 11d");
		next.type = "value";
		next.value = next.value;
		stack.push(next);
		return true;
	}

	if (is(next, "boolean")) {
		log("Rule 11e");
		next.type = "value";

		if (next.value == "true") {
			next.value = true;
		} else {
			next.value = false;
		}

		stack.push(next);
		return true;
	}

	if(is(next, "int")) {
		log("Rule 11f");
		next.type = "value";
		stack.push(next);
		return true;
	}
	
	if (is(next, "float")) {
		log("Rule 11g");
		next.type = "value";
		stack.push(next);
		return true;
	}


	if (is(next, "value") && is(stack.peek(), "comma")) {
		log("Rule 12");
		next.type = "cvalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "list") && is(stack.peek(), "comma")) {
		log("Rule 12a");
		next.type = "cvalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "obj") && is(stack.peek(), "comma")) {
		log("Rule 12b");
		var toPush = {'type': 'cvalue', 'value': next};
		stack.pop();
		stack.push(toPush);
		return true;
	}

	if (is(next, "value") && is(stack.peek(), "colon")) {
		log("Rule 13");
		next.type = "covalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "list") && is(stack.peek(), "colon")) {
		log("Rule 13a");
		next.type = "covalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "obj") && is(stack.peek(), "colon")) {
		log("Rule 13b");
		var toPush = {'type': "covalue", 'value': next};
		stack.pop();
		stack.push(toPush);
		return true;
	}
	
	if (is(next, "cvalue") && is(stack.peek(), "VList")) {
		log("Rule 14");
		stack.peek().value.push(next.value);
		return true;
	}

	if (is(next, "cvalue")) {
		log("Rule 15");
		stack.push({'type': 'VList', 'value': [next.value]});
		return true;
	}

	if (is(next, "VList") && is(stack.peek(), "value")) {
		log("Rule 15a");
		next.value.unshift(stack.peek().value);
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "VList") && is(stack.peek(), "list")) {
		log("Rule 15b");
		next.value.unshift(stack.peek().value);
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "VList") && is(stack.peek(), "obj")) {
		log("Rule 15c");
		next.value.unshift(stack.peek());
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "covalue") && is(stack.peek(), "key")) {
		log("Rule 16");
		var key = stack.pop();
		stack.push({'type': 'KV', 'key': key.value, 'value': next.value});
		return true;
	}

	if (is(next, "covalue") && is(stack.peek(), "value")) {
		log("Rule 16a");
		var key = stack.pop();
		stack.push({'type': 'KV', 'key': key.value, 'value': next.value});
		return true;
	}

	if (is(next, "covalue") && is(stack.peek(), "VList")) {
		log("Rule 16b");
		var key = stack.pop();
		key.value.forEach(function (i) {
			stack.push({'type': 'KV', 'key': i, 'value': next.value});
		});
		return true;
	}

	if (is(next, "KV") && is(stack.last(0), "comma") && is(stack.last(1), "KVList")) {
		log("Rule 17");
		stack.last(1).value.push(next);
		stack.pop();
		return true;
	}

	if (is(next, "KVList") && is(stack.peek(), "KVList")) {
		log("Rule 17a");
		next.value.forEach(function (i) {
			stack.peek().value.push(i);
		});

		return true;
	}

	if (is(next, "KV")) {
		log("Rule 18");
		stack.push({'type': "KVList", 'value': [next]});
		return true;
	}

	if (is(next, "rb") && is(stack.peek(), "VList") && is(stack.last(1), "lb")) {
		log("Rule 19");
		var l = stack.pop();
		stack.pop();
		stack.push({'type': "list", 'value': l.value});
		return true;
	}


	if (is(next, "rcb") && is(stack.peek(), "KVList") && (stack.last(1), "lcb")) {
		log("Rule 20");
		var l = stack.pop();
		stack.pop();
		stack.push({'type': 'obj', 'value': l.value});
		return true;
	}

	if (is(next, "rcb") && is(stack.peek(), "lcb")) {
		log("Rule 21");
		stack.pop();
		stack.push({type: 'obj', 'value': null});
		return true;
	}

	if (is(next, "rb") && is(stack.peek(), "lb")) {
		log("Rule 22");
		stack.pop();
		stack.push({type: 'list', 'value': []});
		return true;
	}

	if (is(next, "rb") && is(stack.peek(), "value") && is(stack.last(1), "lb")) {
		log("Rule 23");
		var val = stack.pop().value;
		stack.pop();
		stack.push({type: 'list', 'value': [val]});
		return true;
	}

	// begin ERROR CASES
	if (is(next, "value") && is(stack.peek(), "key") && is(stack.last(1), "value")) {
		log("Error rule 1");
		var middleVal = stack.pop();
		stack.peek().value += '"' + middleVal.value + '"';
		stack.peek().value += next.value;
		return true;
	}

	if (is(next, "value") && is(stack.peek(), "key") && is(stack.last(1), "VList")) {
		log("Error rule 2");
		var middleVal = stack.pop();
		var oldLastVal = stack.peek().value.pop();
		oldLastVal +=  '"' + middleVal.value + '"';
		oldLastVal += next.value;

		stack.peek().value.push(oldLastVal);

		return true;
	}

	if (is(next, "value") && is(stack.peek(), "key") && is(stack.last(1), "KVList")) {
		log("Error rule 3");
		var middleVal = stack.pop();
		var oldLastVal = stack.peek().value.pop();
		oldLastVal.value +=  '"' + middleVal.value + '"';
		oldLastVal.value += next.value;

		stack.peek().value.push(oldLastVal);

		return true;
	}

	stack.push(next);
	return false;
}

parse('{ "test": "embedded "quoted" string", "test2": "another string"}').then(function (res) {
 	log("Final\n\n");
 	log(JSON.stringify(res));
});



/*

obj = '{', KVList, '}'
    | '{' '}'

list = '[' VList ']'
     | '[' ']'
     | '[' value ']'

KVList = KVList ',' KV
       | KV
       | KVList KVList

KV = key covalue
   | value covalue
   | VList covalue

key = key token
    | key int
    | token

covalue = colon value
        | colon list
        | colon obj

VList = value VList
      | VList cvalue
      | cvalue
      | list VList
      | obj VList

cvalue = comma value
       | comma list
       | comma obj

value = quote
      | boolean
      | int
      | float

boolean = true
        | false



SPECIAL ERROR CASES, only do these reductions if no other reductions worked

 -- for the case of ["some "text" here"]
value = value key value

-- for the case of [3, "some "text" here", 4]
VList = VList key value

-- for the case of {"t": "some "text" here"}
KVList = KVList key value

*/



function compileOST(tree) {
	var rawTypes = ["boolean", "number", "string"];

	if (rawTypes.indexOf((typeof tree)) != -1)
		return tree;

	if (Array.isArray(tree)) {
		var toR = [];
		while (tree.length != 0)
			toR.unshift(compileOST(tree.pop()));
		return toR;
	}
	

	if (is(tree, "obj")) {
		var toR = {};
		if (tree.value == null)
			return {};
		tree.value.forEach(function (i) {
			toR[i.key] = compileOST(i.value);
		});
		return toR;
	}

	if (is(tree, "list")) {
		return compileOST(tree.value);
	}

	console.error("Uncaught type in compile: " + JSON.stringify(tree));
	return null;
}

