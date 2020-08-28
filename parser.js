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

function extendArray(arr) {
    if (arr.peek == null) {
        Object.defineProperty(arr, 'peek', {
            enumerable: false,
            value: function() {
                return this[this.length - 1];
            }
        });
    }
    if (arr.last == null) {
        Object.defineProperty(arr, 'last', {
            enumerable: false,
            value: function(i) {
                return this[this.length - (1 + i)];
            }
        });
    }
}

function is(obj, prop) {
    return (obj && obj.hasOwnProperty("type") && obj.type == prop);
}

function log(str) {
    //console.log(str);
}


module.exports.parse = parse;
function parse(text, dupKeys) {
    let stack = [];

    let tokens = [];

    extendArray(stack);
    extendArray(tokens);

    let emit = function(t) {
        tokens.push(t);
    };

    lexer.lexString(text, emit);

    // ensure that if we started with a LB or LCB, we end with a
    // RB or RCB.
    if (tokens[0].type == LEX_LB && tokens.last(0).type != LEX_RB) {
        tokens.push({ type: LEX_RB, value: "]", row: -1, col: -1});
    }

    if (tokens[0].type == LEX_LCB && tokens.last(0).type != LEX_RCB) {
        tokens.push({ type: LEX_RCB, value: "}", row: -1, col: -1});
    }

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

    // if everything parsed into a KV list, assume it was an object missing the starting
    // "{" and ending "}"
    if (stack.length == 1 && stack[0].type == LEX_KVLIST) {
        log("Pre-compile error fix 1");
        stack = [{type: LEX_OBJ, value: stack[0].value}];
    }

    return compileOST(stack[0], dupKeys);

}

function reduce(stack) {
    let next = stack.pop();

    switch(next.type) {
    case LEX_KEY:
        if (next.value.trim() == "true") {
            log("Rule 5");
            stack.push({'type': LEX_BOOLEAN, 'value': "true"});
            return true;
        }


        if (next.value.trim() == "false") {
            log("Rule 6");
            stack.push({'type': LEX_BOOLEAN, 'value': "false"});
            return true;
        }

        if (next.value.trim() == "null") {
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
            const qChar = next.single ? "'" : '"';
            
            oldLastVal.value +=  qChar + middleVal.value + qChar;
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

        if (is(stack.peek(), LEX_KEY)) {
            log("Error rule 9");
            let key = stack.pop();
            stack.push({'type': LEX_KV, 'key': key.value.trim(), 'value': next});
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
            log("Error rule 4a");
            let l = stack.pop();
            stack.push({type: LEX_VALUE, 'value': l.value});
            log("Start subreduce... (" + l.value + ")");
            while(reduce(stack));
            log("End subreduce");
            stack.push({type: LEX_RCB});
            return true;
        }

        if (is(stack.peek(), LEX_COLON)) {
            log("Error rule 4b");
            stack.push({type: LEX_VALUE, value: null});

            log("Starting subreduce...");
            while (reduce(stack));
            log("End subreduce.");
            
            stack.push({type: LEX_RCB});
            return true;
        }

        if (is(stack.peek(), LEX_COMMA)) {
            log("Error rule 10a");
            stack.pop();
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

        if (is(stack.peek(), LEX_KEY)) {
            log("Comma error rule 2");
            const key = stack.pop();
            stack.push({type: LEX_VALUE, value: key.value});
            
            log("Starting subreduce...");
            while (reduce(stack));
            log ("End subreduce.");
            
            stack.push(next);
            return true;
        }

        if (is(stack.peek(), LEX_COLON)) {
            log("Comma error rule 3");
            stack.push({type: LEX_VALUE, value: null});
            
            log("Starting subreduce...");
            while (reduce(stack));
            log ("End subreduce.");
            
            stack.push(next);
            return true;
        }

    }


    stack.push(next);
    return false;
}



function compileOST(tree, dupKeys) {
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
            const key = i.key;
            const val = compileOST(i.value);

            if (dupKeys && key in toR) {
                toR[key] = {
                    "value": toR[key],
                    "next": val
                };
            } else {
                toR[key] = val;
            }
        });
        return toR;
    }

    if (is(tree, LEX_LIST)) {
        return compileOST(tree.value);
    }

    // it must be a value
    return tree.value;
}

