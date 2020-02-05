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
    [/\s*:\s*/, LEX_COLON],
    [/\s*,\s*/, LEX_COMMA],
    [/\s*{\s*/, LEX_LCB],
    [/\s*}\s*/, LEX_RCB],
    [/\s*\[\s*/, LEX_LB],
    [/\s*\]\s*/, LEX_RB],
    [/\s*\.\s*/, LEX_DOT] // TODO: remove?
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
    
    lexer.addRule(/"((?:\\.|[^"])*?)($|")/, (lexeme, txt) => {
        col += lexeme.length;
        return {type: LEX_QUOTE, value: parseString(txt), row, col, single: false};
    });

    lexer.addRule(/'((?:\\.|[^'])*?)($|'|(",?[ \t]*\n))/, (lexeme, txt) => {
        col += lexeme.length;
        return {type: LEX_QUOTE, value: parseString(txt), row, col, single: true};
    });

    // floats with a dot
    lexer.addRule(/[\-0-9]*\.[0-9]*([eE][\+\-]?)?[0-9]*(?:\s*)/, lexeme => {
        col += lexeme.length;
        return {type: LEX_FLOAT, value: parseFloat(lexeme), row, col};
    });

    // floats without a dot but with e notation
    lexer.addRule(/\-?[0-9]+([eE][\+\-]?)[0-9]*(?:\s*)/, lexeme => {
        col += lexeme.length;
        return {type: LEX_FLOAT, value: parseFloat(lexeme), row, col};
    });
    
    lexer.addRule(/\-?[0-9]+(?:\s*)/, lexeme => {
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

    
    lexer.addRule(/\S[ \t]*/, lexeme => {
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



