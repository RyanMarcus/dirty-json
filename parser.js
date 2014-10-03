var fs = require('fs');
var Stream = require('stream');
var lexer = require("./lexer");


Array.prototype.peek = function() {
	return this[this.length - 1];
};

Array.prototype.last = function(i) {
	return this[this.length - (1 + i)];
};


function is(obj, prop) {
	return (obj && obj.hasOwnProperty("type") && obj.type == prop);
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

var stack = [];
function parse(text) {
	var tokens = [];
	var emit = function(t) {
		tokens.push(t);
	};

	lexer.lexString(text, emit);


	for (var i = 0; i < tokens.length; i++) {
		console.log("Shifting " + tokens[i]);
		stack.push(tokens[i]);
		console.log(stack);
		console.log("Reducing...");
		while (reduce()) {
			console.log(stack);
			console.log("Reducing...");
		}

	}
}

function reduce() {
	var next = stack.pop();

	if (is(next, "key") && next.value == "true") {
		console.log("Rule 5");
		stack.push({'type': "boolean", 'value': "true"});
		return true;
	}


	if (is(stack.peek(), "key") && stack.peek().value == "false") {
		console.log("Rule 6");
		stack.pop();
		stack.push({'type': "boolean", 'value': "false"});
		return true;
	}


	if (is(next, "token") && is(stack.peek(), "key")) {
		console.log("Rule 11a");
		stack.peek().value += next.value;
		return true;
	}

	if (is(next, "int") && is(stack.peek(), "key")) {
		console.log("Rule 11b");
		stack.peek().value += next.value.join("");
		return true;
	}

	if (is(next, "token")) {
		console.log("Rule 11c");
		stack.push({type: 'key', value: [ next.value ] });
		return true;
	}

	if (is(next, "quote")) {
		console.log("Rule 11d");
		next.type = "value";
		next.value = next.value.join("");
		stack.push(next);
		return true;
	}

	if (is(next, "boolean")) {
		console.log("Rule 11e");
		next.type = "value";
		next.value = next.value.join("");

		if (next.value == "true") {
			next.value = true;
		} else {
			next.value = false;
		}

		stack.push(next);
		return true;
	}

	if(is(next, "int")) {
		console.log("Rule 11f");
		next.type = "value";
		next.value = parseInt(next.value.join(""));
		stack.push(next);
		return true;
	}
	
	if (is(next, "float")) {
		console.log("Rule 11g");
		next.type = "value";
		next.value = parseFloat(next.value.join(""));
		stack.push(next);
		return true;
	}


	if (is(next, "value") && is(stack.peek(), "comma")) {
		console.log("Rule 12");
		next.type = "cvalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "value") && is(stack.peek(), "colon")) {
		console.log("Rule 13");
		next.type = "covalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "list") && is(stack.peek(), "colon")) {
		console.log("Rule 13a");
		next.type = "covalue";
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "obj") && is(stack.peek(), "colon")) {
		console.log("Rule 13b");
		next.type = "covalue";
		stack.pop();
		stack.push(next);
		return true;
	}
	
	if (is(next, "cvalue") && is(stack.peek(), "VList")) {
		console.log("Rule 14");
		stack.peek().value.push(next.value);
		return true;
	}

	if (is(next, "cvalue")) {
		console.log("Rule 15");
		stack.push({'type': 'VList', 'value': [next.value]});
		return true;
	}

	if (is(next, "VList") && is(stack.peek(), "value")) {
		console.log("Rule 15a");
		next.value.unshift(stack.peek().value);
		stack.pop();
		stack.push(next);
		return true;
	}

	if (is(next, "covalue") && is(stack.peek(), "key")) {
		console.log("Rule 16");
		var key = stack.pop();
		stack.push({'type': 'KV', 'key': key.value, 'value': next.value});
		return true;
	}

	if (is(next, "KV") && is(stack.last(0), "comma") && is(stack.last(1), "KVList")) {
		console.log("Rule 17");
		stack.last(1).value.push(next);
		stack.pop();
		return true;
	}

	if (is(next, "KV")) {
		console.log("Rule 18");
		stack.push({'type': "KVList", 'value': [next]});
		return true;
	}

	if (is(next, "rb") && is(stack.peek(), "VList") && is(stack.last(1), "lb")) {
		console.log("Rule 19");
		var l = stack.pop();
		stack.pop();
		stack.push({'type': "list", 'value': l.value});
		return true;
	}


	if (is(next, "rcb") && is(stack.peek(), "KVList") && (stack.last(1), "lcb")) {
		console.log("Rule 20");
		var l = stack.pop();
		stack.pop();
		stack.push({'type': 'obj', 'value': l.value});
		return true;
	}

	stack.push(next);
	return false;
}

parse("{ test: [2, \"str\"], hello: 3 }");
console.log("Final\n\n");
console.log(compileOST(stack[0]));


/*

obj = '{', KVList, '}'
list = '[' VList ']'

KVList = KVList ',' KV
       | KV

KV = key covalue

key = key token
    | key int
    | token

covalue = colon value
        | colon list
        | colon obj

VList = value VList
      | VList cvalue
      | cvalue

cvalue = comma value

value = quote
      | boolean
      | int
      | float

boolean = true
        | false



*/


function compileOST(tree) {
	var rawTypes = ["boolean", "number", "string"];
	if (rawTypes.indexOf((typeof tree)) != -1)
		return tree;

	if (is(tree, "obj")) {
		var toR = {};
		tree.value.forEach(function (i) {
			toR[i.key] = compileOST(i.value);
		});
		return toR;
	}

	console.error("Uncaught type in compile: " + JSON.stringify(tree));
}
