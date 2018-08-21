(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var dJSON = require('dirty-json');


angular.module('djson', []).controller('DemoCtrl', ['$scope', function($scope) {
    $scope.valid = false;

    $scope.examples = [   
        {"name": "Invalid JSON: embedded HTML", "content": '{ "key": "<div class="coolCSS">some text</div>" }'},
        {"name": "Valid JSON: Simple", "content": '{ "key": "value" }'},
        {"name": "Invalid JSON: Simple", "content": "{ key: 'value' }"},
        {"name": "Valid JSON: Complex Object", "content": '{ "key": ["value", 0.5, \n\t{ "test": 56, \n\t"test2": [true, null] }\n\t]\n}'},
        {"name": "Invalid JSON: Complex Object", "content": '{ key: ["value", .5, \n\t{ "test": 56, \n\t\'test2\': [true, null] }\n\t]\n}'},
        {"name": "Invalid JSON: With newlines", "content": '{ "key": "a string\nwith a newline" }'},
        {"name": "Invalid JSON: Floats", "content": '{ "no leading zero": .13452 }'},
        {"name": "Invalid JSON: Non-quoted keys", "content": '{ "test": here, "another": test }'}
    ];
    


    $scope.selectedExample = $scope.examples[0];

    $scope.input = $scope.selectedExample.content;

    $scope.doParse = function() {
        var res = dJSON.parse($scope.input);
        $scope.output = JSON.stringify(res, null, 4);
        try {
            JSON.parse($scope.input);
            $scope.valid = true;
        } catch (e) {
            $scope.valid = false;
        }
    };

    
    $scope.doSelection = function () {
        $scope.input = $scope.selectedExample.content;
        $scope.doParse();
    };

    $scope.doParse();
}]);

},{"dirty-json":2}],2:[function(require,module,exports){
// < begin copyright > 
// Copyright Ryan Marcus 2018
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 
// < end copyright > 
 


"use strict";

let parser = require('./parser');

module.exports.parse = parse;
function parse(text, fallback) {
    try {
        return parser.parse(text);
    } catch (e) {
        // our parser threw an error! see if the JSON was valid...
        /* istanbul ignore next */
        if (fallback === false) {
            throw e;
        }
        
        try {
            let json = JSON.parse(text);
            // if we didn't throw, it was valid JSON!
            /* istanbul ignore next */
            console.warn("dirty-json got valid JSON that failed with the custom parser. We're returning the valid JSON, but please file a bug report here: https://github.com/RyanMarcus/dirty-json/issues  -- the JSON that caused the failure was: " + text);

            /* istanbul ignore next */
            return json;
        } catch (json_error) {
            throw e;
        }

    }
}

},{"./parser":4}],3:[function(require,module,exports){
// < begin copyright > 
// Copyright Ryan Marcus 2018
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 
// < end copyright > 
 
"use strict";

const Lexer = require("lex");
const unescapeJs = require("unescape-js");
const utf8 = require("utf8");

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


const lexMap = {
    ":": {type: LEX_COLON},
    ",": {type: LEX_COMMA},
    "{": {type: LEX_LCB},
    "}": {type: LEX_RCB},
    "[": {type: LEX_LB},
    "]": {type: LEX_RB},
    ".": {type: LEX_DOT} // TODO: remove?
};

const lexSpc = [
    [/:/, LEX_COLON],
    [/,/, LEX_COMMA],
    [/{/, LEX_LCB],
    [/}/, LEX_RCB],
    [/\[/, LEX_LB],
    [/\]/, LEX_RB],
    [/\./, LEX_DOT] // TODO: remove?
];

function parseString(str) {
    // unescape-js doesn't cover the \/ case, but we will here.
    str = str.replace(/\\\//, '/');
    return unescapeJs(str);
}


function getLexer(string) {
    let lexer = new Lexer();

    let col = 0;
    let row = 0;
    
    lexer.addRule(/"((?:\\.|[^"])*)($|")/, (lexeme, txt) => {
        col += lexeme.length;
        return {type: LEX_QUOTE, value: parseString(txt), row, col};
    });

    lexer.addRule(/'((?:\\.|[^'])*)($|')/, (lexeme, txt) => {
        col += lexeme.length;
        return {type: LEX_QUOTE, value: parseString(txt), row, col};
    });

    // floats with a dot
    lexer.addRule(/[\-0-9]*\.[0-9]*([eE][\+\-]?)?[0-9]*/, lexeme => {
        col += lexeme.length;
        return {type: LEX_FLOAT, value: parseFloat(lexeme), row, col};
    });

    // floats without a dot but with e notation
    lexer.addRule(/\-?[0-9]+([eE][\+\-]?)[0-9]*/, lexeme => {
        col += lexeme.length;
        return {type: LEX_FLOAT, value: parseFloat(lexeme), row, col};
    });
    
    lexer.addRule(/\-?[0-9]+/, lexeme => {
        col += lexeme.length;
        return {type: LEX_INT, value: parseInt(lexeme), row, col};
    });

    lexSpc.forEach(item => {
        lexer.addRule(item[0], lexeme => {
            col += lexeme.length;
            return {type: item[1], value: lexeme, row, col};
        });
    });

    lexer.addRule(/\s/, lexeme => {
        // chomp whitespace...
        if (lexeme == "\n") {
            col = 0;
            row++;
        } else {
            col += lexeme.length;
        }
    });

    lexer.addRule(/./, lexeme => {
        col += lexeme.length;
        
        let lt = LEX_TOKEN;
        let val = lexeme;

        return {type: lt, value: val, row, col};
    });

    lexer.setInput(string);

    return lexer;
}



module.exports.lexString = lexString;
function lexString(str, emit) {
    let lex = getLexer(str);

    let token = "";
    while ((token = lex.lex())) {
        emit(token);
    }
    
}

module.exports.getAllTokens = getAllTokens;
function getAllTokens(str) {
    let arr = [];
    let emit = function (i) {
        arr.push(i);
    };

    lexString(str, emit);

    return arr;
}




},{"lex":5,"unescape-js":7,"utf8":8}],4:[function(require,module,exports){
// < begin copyright > 
// Copyright Ryan Marcus 2018
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// 
// < end copyright > 
 
"use strict";

let lexer = require("./lexer");

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



module.exports.parse = parse;
function parse(text) {
    let stack = [];

    let tokens = [];
    let emit = function(t) {
        tokens.push(t);
    };


    lexer.lexString(text, emit);


    for (let i = 0; i < tokens.length; i++) {
        log("Shifting " + tokens[i].type);
        stack.push(tokens[i]);
        log(stack);
        log("Reducing...");
        while (reduce(stack)) {
            log(stack);
            log("Reducing...");
        }
        
    }

    return compileOST(stack[0]);

}

function reduce(stack) {
    let next = stack.pop();

    switch(next.type) {
    case LEX_KEY:
        if (next.value == "true") {
            log("Rule 5");
            stack.push({'type': LEX_BOOLEAN, 'value': "true"});
            return true;
        }


        if (next.value == "false") {
            log("Rule 6");
            stack.push({'type': LEX_BOOLEAN, 'value': "false"});
            return true;
        }

        if (next.value == "null") {
            log("Rule 7");
            stack.push({'type': LEX_VALUE, 'value': null});
            return true;
        }
        break;

    case LEX_TOKEN:
        if (is(stack.peek(), LEX_KEY)) {
            log("Rule 11a");
            stack.peek().value += next.value;
            return true;
        }

        log("Rule 11c");
        stack.push({type: LEX_KEY, value: next.value });
        return true;


    case LEX_INT:
        if (is(next, LEX_INT) && is(stack.peek(), LEX_KEY)) {
            log("Rule 11b");
            stack.peek().value += next.value;
            return true;
        }

        log("Rule 11f");
        next.type = LEX_VALUE;
        stack.push(next);
        return true;


    case LEX_QUOTE:
        log("Rule 11d");
        next.type = LEX_VALUE;
        next.value = next.value;
        stack.push(next);
        return true;


    case LEX_BOOLEAN:
        log("Rule 11e");
        next.type = LEX_VALUE;

        if (next.value == "true") {
            next.value = true;
        } else {
            next.value = false;
        }

        stack.push(next);
        return true;


    case LEX_FLOAT:
        log("Rule 11g");
        next.type = LEX_VALUE;
        stack.push(next);
        return true;

    case LEX_VALUE:
        if (is(stack.peek(), LEX_COMMA)) {
            log("Rule 12");
            next.type = LEX_CVALUE;
            stack.pop();
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_COLON)) {
            log("Rule 13");
            next.type = LEX_COVALUE;
            stack.pop();
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_VALUE)) {
            log("Error rule 1");
            let middleVal = stack.pop();
            stack.peek().value += '"' + middleVal.value + '"';
            stack.peek().value += next.value;
            return true;
        }

        if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_VLIST)) {
            log("Error rule 2");
            let middleVal = stack.pop();
            let oldLastVal = stack.peek().value.pop();
            oldLastVal +=  '"' + middleVal.value + '"';
            oldLastVal += next.value;
            
            stack.peek().value.push(oldLastVal);
            
            return true;
        }

        if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_KVLIST)) {
            log("Error rule 3");
            let middleVal = stack.pop();
            let oldLastVal = stack.peek().value.pop();
            oldLastVal.value +=  '"' + middleVal.value + '"';
            oldLastVal.value += next.value;
            
            stack.peek().value.push(oldLastVal);
            
            return true;
        }

        if (is(stack.peek(), LEX_KEY)) {
            log("Error rule 4");
            let keyValue = stack.pop().value;
            next.value = keyValue + next.value;
            stack.push(next);
            return true;
        }

        break;

    case LEX_LIST:
        if (is(next, LEX_LIST) && is(stack.peek(), LEX_COMMA)) {
            log("Rule 12a");
            next.type = LEX_CVALUE;
            stack.pop();
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_COLON)) {
            log("Rule 13a");
            next.type = LEX_COVALUE;
            stack.pop();
            stack.push(next);
            return true;
        }
        break;

    case LEX_OBJ:
        if (is(stack.peek(), LEX_COMMA)) {
            log("Rule 12b");
            let toPush = {'type': LEX_CVALUE, 'value': next};
            stack.pop();
            stack.push(toPush);
            return true;
        }

        if (is(stack.peek(), LEX_COLON)) {
            log("Rule 13b");
            let toPush = {'type': LEX_COVALUE, 'value': next};
            stack.pop();
            stack.push(toPush);
            return true;
        }
        break;

    case LEX_CVALUE:
        if (is(stack.peek(), LEX_VLIST)) {
            log("Rule 14");
            stack.peek().value.push(next.value);
            return true;
        }


        log("Rule 15");
        stack.push({'type': LEX_VLIST, 'value': [next.value]});
        return true;

    case LEX_VLIST:
        if (is(stack.peek(), LEX_VALUE)) {
            log("Rule 15a");
            next.value.unshift(stack.peek().value);
            stack.pop();
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_LIST)) {
            log("Rule 15b");
            next.value.unshift(stack.peek().value);
            stack.pop();
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_OBJ)) {
            log("Rule 15c");
            next.value.unshift(stack.peek());
            stack.pop();
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_KEY) && (stack.last(1), LEX_COMMA)) {
            log("Error rule 7");
            let l = stack.pop();
            stack.push({type: LEX_VALUE, 'value': l.value});
            log("Start subreduce... (" + l.value + ")");
            while(reduce(stack));
            log("End subreduce");
            stack.push(next);

            return true;
        }

        if (is(stack.peek(), LEX_VLIST)) {
            log("Error rule 8");
            stack.peek().value.push(next.value[0]);
            return true;
        }
        break;

    case LEX_COVALUE:

        if (is(stack.peek(), LEX_KEY) || is(stack.peek(), LEX_VALUE) || is(stack.peek(), LEX_VLIST)) {
            log("Rule 16");
            let key = stack.pop();
            stack.push({'type': LEX_KV, 'key': key.value, 'value': next.value});
            return true;
        }


        throw new Error("Got a :value that can't be handled at line " +
                       next.row + ":" + next.col);

    case LEX_KV:
        if (is(stack.last(0), LEX_COMMA) && is(stack.last(1), LEX_KVLIST)) {
            log("Rule 17");
            stack.last(1).value.push(next);
            stack.pop();
            return true;
        }




        log("Rule 18");
        stack.push({'type': LEX_KVLIST, 'value': [next]});
        return true;


    case LEX_KVLIST:
        if (is(stack.peek(), LEX_KVLIST)) {
            log("Rule 17a");
            next.value.forEach(function (i) {
                stack.peek().value.push(i);
            });
            
            return true;
        }


        break;

    case LEX_RB:
        if (is(stack.peek(), LEX_VLIST) && is(stack.last(1), LEX_LB)) {
            log("Rule 19");
            let l = stack.pop();
            stack.pop();
            stack.push({'type': LEX_LIST, 'value': l.value});
            return true;
        }

        if (is(stack.peek(), LEX_LIST) && is(stack.last(1), LEX_LB)) {
            log("Rule 19b");
            let l = stack.pop();
            stack.pop();
            stack.push({'type': LEX_LIST, 'value': [l.value]});
            return true;
        }

        if (is(stack.peek(), LEX_LB)) {
            log("Rule 22");
            stack.pop();
            stack.push({type: LEX_LIST, 'value': []});
            return true;
        }

        if (is(stack.peek(), LEX_VALUE) && is(stack.last(1), LEX_LB)) {
            log("Rule 23");
            let val = stack.pop().value;
            stack.pop();
            stack.push({type: LEX_LIST, 'value': [val]});
            return true;
        }

        if (is(stack.peek(), LEX_OBJ) && is(stack.last(1), LEX_LB)) {
            log("Rule 23b");
            let val = stack.pop();
            stack.pop();
            stack.push({type: LEX_LIST, 'value': [val]});
            return true;
        }

        if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_COMMA)) {
            log("Error rule 5");
            let l = stack.pop();
            stack.push({type: LEX_VALUE, 'value': l.value});
            log("Start subreduce... (" + l.value + ")");
            while(reduce(stack));
            log("End subreduce");
            stack.push({type: LEX_RB});
            return true;
        }

        
        if (is(stack.peek(), LEX_COMMA) && (
            is(stack.last(1), LEX_KEY)
                || is(stack.last(1), LEX_OBJ)
                || is(stack.last(1), LEX_VALUE))
           ) {
            log("Error rule 5a");
            stack.pop();
            //let l = stack.pop();
            //stack.push({type: LEX_VALUE, 'value': l.value});
            stack.push({type: LEX_RB, 'value': ']'});
            log("Start subreduce...");
            log("Content: " + JSON.stringify(stack));
            while(reduce(stack));
            log("End subreduce");

            return true;
        }

        if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_LB)) {
            log("Error rule 5b");
            let v = stack.pop();
            stack.pop();
            stack.push({type: LEX_LIST, value: [v.value]});
            return true;
        }

        if (is(stack.peek(), LEX_COMMA) && is(stack.last(1), LEX_VLIST)) {
            log("Error rule 5c");
            stack.pop();
            stack.push({type: LEX_RB});
            log("Start subreduce...");
            log("Content: " + JSON.stringify(stack));
            while(reduce(stack));
            log("End subreduce");

            return true;
        }

        break;

    case LEX_RCB:
        if (is(stack.peek(), LEX_KVLIST) && is(stack.last(1), LEX_LCB)) {
            log("Rule 20");
            let l = stack.pop();
            stack.pop();
            stack.push({'type': LEX_OBJ, 'value': l.value});
            return true;
        }

        if (is(stack.peek(), LEX_LCB)) {
            log("Rule 21");
            stack.pop();
            stack.push({type: LEX_OBJ, 'value': null});
            return true;
        }

        if (is(stack.peek(), LEX_KEY) && is(stack.last(1), LEX_COLON)) {
            log("Error rule 4");
            let l = stack.pop();
            //stack.pop();
            stack.push({type: LEX_VALUE, 'value': l.value});
            log("Start subreduce... (" + l.value + ")");
            while(reduce(stack));
            log("End subreduce");
            stack.push({type: LEX_RCB});
            return true;
        }

        throw new Error("Found } that I can't handle at line " +
                        next.row + ":" + next.col);

        
    case LEX_COMMA:
        if (is(stack.peek(), LEX_COMMA)) {
            log("Comma error rule 1");
            // do nothing -- so don't push the extra comma onto the stack
            return true;
        }
    }


    stack.push(next);
    return false;
}



function compileOST(tree) {
    let rawTypes = ["boolean", "number", "string"];

    if (rawTypes.indexOf((typeof tree)) != -1)
        return tree;

    if (tree === null)
        return null;

    if (Array.isArray(tree)) {
        let toR = [];
        while (tree.length > 0)
            toR.unshift(compileOST(tree.pop()));
        return toR;
    }
    

    if (is(tree, LEX_OBJ)) {
        let toR = {};
        if (tree.value === null)
            return {};
        tree.value.forEach(function (i) {
            toR[i.key] = compileOST(i.value);
        });
        return toR;
    }

    if (is(tree, LEX_LIST)) {
        return compileOST(tree.value);
    }

    // it must be a value
    return tree.value;
}


},{"./lexer":3}],5:[function(require,module,exports){
if (typeof module === "object" && typeof module.exports === "object") module.exports = Lexer;

Lexer.defunct = function (chr) {
    throw new Error("Unexpected character at index " + (this.index - 1) + ": " + chr);
};

function Lexer(defunct) {
    if (typeof defunct !== "function") defunct = Lexer.defunct;

    var tokens = [];
    var rules = [];
    var remove = 0;
    this.state = 0;
    this.index = 0;
    this.input = "";

    this.addRule = function (pattern, action, start) {
        var global = pattern.global;

        if (!global) {
            var flags = "g";
            if (pattern.multiline) flags += "m";
            if (pattern.ignoreCase) flags += "i";
            pattern = new RegExp(pattern.source, flags);
        }

        if (Object.prototype.toString.call(start) !== "[object Array]") start = [0];

        rules.push({
            pattern: pattern,
            global: global,
            action: action,
            start: start
        });

        return this;
    };

    this.setInput = function (input) {
        remove = 0;
        this.state = 0;
        this.index = 0;
        tokens.length = 0;
        this.input = input;
        return this;
    };

    this.lex = function () {
        if (tokens.length) return tokens.shift();

        this.reject = true;

        while (this.index <= this.input.length) {
            var matches = scan.call(this).splice(remove);
            var index = this.index;

            while (matches.length) {
                if (this.reject) {
                    var match = matches.shift();
                    var result = match.result;
                    var length = match.length;
                    this.index += length;
                    this.reject = false;
                    remove++;

                    var token = match.action.apply(this, result);
                    if (this.reject) this.index = result.index;
                    else if (typeof token !== "undefined") {
                        switch (Object.prototype.toString.call(token)) {
                        case "[object Array]":
                            tokens = token.slice(1);
                            token = token[0];
                        default:
                            if (length) remove = 0;
                            return token;
                        }
                    }
                } else break;
            }

            var input = this.input;

            if (index < input.length) {
                if (this.reject) {
                    remove = 0;
                    var token = defunct.call(this, input.charAt(this.index++));
                    if (typeof token !== "undefined") {
                        if (Object.prototype.toString.call(token) === "[object Array]") {
                            tokens = token.slice(1);
                            return token[0];
                        } else return token;
                    }
                } else {
                    if (this.index !== index) remove = 0;
                    this.reject = true;
                }
            } else if (matches.length)
                this.reject = true;
            else break;
        }
    };

    function scan() {
        var matches = [];
        var index = 0;

        var state = this.state;
        var lastIndex = this.index;
        var input = this.input;

        for (var i = 0, length = rules.length; i < length; i++) {
            var rule = rules[i];
            var start = rule.start;
            var states = start.length;

            if ((!states || start.indexOf(state) >= 0) ||
                (state % 2 && states === 1 && !start[0])) {
                var pattern = rule.pattern;
                pattern.lastIndex = lastIndex;
                var result = pattern.exec(input);

                if (result && result.index === lastIndex) {
                    var j = matches.push({
                        result: result,
                        action: rule.action,
                        length: result[0].length
                    });

                    if (rule.global) index = j;

                    while (--j > index) {
                        var k = j - 1;

                        if (matches[j].length > matches[k].length) {
                            var temple = matches[j];
                            matches[j] = matches[k];
                            matches[k] = temple;
                        }
                    }
                }
            }
        }

        return matches;
    }
}

},{}],6:[function(require,module,exports){
/*! http://mths.be/fromcodepoint v0.2.1 by @mathias */
if (!String.fromCodePoint) {
	(function() {
		var defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			try {
				var object = {};
				var $defineProperty = Object.defineProperty;
				var result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {}
			return result;
		}());
		var stringFromCharCode = String.fromCharCode;
		var floor = Math.floor;
		var fromCodePoint = function(_) {
			var MAX_SIZE = 0x4000;
			var codeUnits = [];
			var highSurrogate;
			var lowSurrogate;
			var index = -1;
			var length = arguments.length;
			if (!length) {
				return '';
			}
			var result = '';
			while (++index < length) {
				var codePoint = Number(arguments[index]);
				if (
					!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
					codePoint < 0 || // not a valid Unicode code point
					codePoint > 0x10FFFF || // not a valid Unicode code point
					floor(codePoint) != codePoint // not an integer
				) {
					throw RangeError('Invalid code point: ' + codePoint);
				}
				if (codePoint <= 0xFFFF) { // BMP code point
					codeUnits.push(codePoint);
				} else { // Astral code point; split in surrogate halves
					// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					codePoint -= 0x10000;
					highSurrogate = (codePoint >> 10) + 0xD800;
					lowSurrogate = (codePoint % 0x400) + 0xDC00;
					codeUnits.push(highSurrogate, lowSurrogate);
				}
				if (index + 1 == length || codeUnits.length > MAX_SIZE) {
					result += stringFromCharCode.apply(null, codeUnits);
					codeUnits.length = 0;
				}
			}
			return result;
		};
		if (defineProperty) {
			defineProperty(String, 'fromCodePoint', {
				'value': fromCodePoint,
				'configurable': true,
				'writable': true
			});
		} else {
			String.fromCodePoint = fromCodePoint;
		}
	}());
}

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

require('string.fromcodepoint');

/**
 * \\ - matches the backslash which indicates the beginning of an escape sequence
 * (
 *   u\{([0-9A-Fa-f]+)\} - first alternative; matches the variable-length hexadecimal escape sequence (\u{ABCD0})
 * |
 *   u([0-9A-Fa-f]{4}) - second alternative; matches the 4-digit hexadecimal escape sequence (\uABCD)
 * |
 *   x([0-9A-Fa-f]{2}) - third alternative; matches the 2-digit hexadecimal escape sequence (\xA5)
 * |
 *   ([1-7][0-7]{0,2}|[0-7]{2,3}) - fourth alternative; matches the up-to-3-digit octal escape sequence (\5 or \512)
 * |
 *   (['"tbrnfv0\\]) - fifth alternative; matches the special escape characters (\t, \n and so on)
 * |
 *   \U([0-9A-Fa-f]+) - sixth alternative; matches the 8-digit hexadecimal escape sequence used by python (\U0001F3B5)
 * )
 */
var jsEscapeRegex = /\\(u\{([0-9A-Fa-f]+)\}|u([0-9A-Fa-f]{4})|x([0-9A-Fa-f]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|(['"tbrnfv0\\]))|\\U([0-9A-Fa-f]{8})/g;

var usualEscapeSequences = {
    '0': '\0',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'v': '\v',
    '\'': '\'',
    '"': '"',
    '\\': '\\'
};

var fromHex = function fromHex(str) {
    return String.fromCodePoint(parseInt(str, 16));
};
var fromOct = function fromOct(str) {
    return String.fromCodePoint(parseInt(str, 8));
};

exports.default = function (string) {
    return string.replace(jsEscapeRegex, function (_, __, varHex, longHex, shortHex, octal, specialCharacter, python) {
        if (varHex !== undefined) {
            return fromHex(varHex);
        } else if (longHex !== undefined) {
            return fromHex(longHex);
        } else if (shortHex !== undefined) {
            return fromHex(shortHex);
        } else if (octal !== undefined) {
            return fromOct(octal);
        } else if (python !== undefined) {
            return fromHex(python);
        } else {
            return usualEscapeSequences[specialCharacter];
        }
    });
};

module.exports = exports['default'];
},{"string.fromcodepoint":6}],8:[function(require,module,exports){
(function (global){
/*! https://mths.be/utf8js v2.1.2 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			checkScalarValue(codePoint);
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.1.2',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
