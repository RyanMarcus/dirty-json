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

var assert = require("assert");
var lexer = require("../lexer");

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


describe("lexer", function () {
    describe("getAllTokens()", function () {
        it('should handle an empty string', function (done) {
            const res = lexer.getAllTokens("");
            assert.equal(res.length, 0);
            done();
        });

        it('should handle quoted strings', function (done) {
            const res = lexer.getAllTokens('"this is a test"');
            assert.equal(res.length, 1);
            assert.equal(res[0].value, "this is a test");
            done();
        });

        it('should handle integers', function (done) {
            const res = lexer.getAllTokens('5600');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_INT);
            assert.equal(res[0].value, 5600);
            done();
        });

        it('should handle negative integers', function (done) {
            const res = lexer.getAllTokens('-5600');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_INT);
            assert.equal(res[0].value, -5600);
            done();
        });

        it('should handle floats', function (done) {
            const res = lexer.getAllTokens('5600.5');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_FLOAT);
            assert.equal(res[0].value, 5600.5);
            done();
        });

        it('should handle negative floats', function (done) {
            const res = lexer.getAllTokens('-5600.5');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_FLOAT);
            assert.equal(res[0].value, -5600.5);
            done();
        });


        it('should handle floats without leading digits', function (done) {
            const res = lexer.getAllTokens('.5');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_FLOAT);
            assert.equal(res[0].value, 0.5);
            done();
        });

        it('should handle negative floats without leading digits', function (done) {
            const res = lexer.getAllTokens('-.5');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_FLOAT);
            assert.equal(res[0].value, -0.5);
            done();
        });

        it('should handle special characters', function (done) {
            const res = lexer.getAllTokens('{}[],:');
            assert.equal(res.length, 6);
            assert.equal(res[0].type, LEX_LCB);
            assert.equal(res[1].type, LEX_RCB);
            assert.equal(res[2].type, LEX_LB);
            assert.equal(res[3].type, LEX_RB);
            assert.equal(res[4].type, LEX_COMMA);
            assert.equal(res[5].type, LEX_COLON);
            done();
        });

        it('should handle quoted special characters', function (done) {
            const res = lexer.getAllTokens('{}[],:"{}[],:"');
            assert.equal(res.length, 7);
            assert.equal(res[0].type, LEX_LCB);
            assert.equal(res[1].type, LEX_RCB);
            assert.equal(res[2].type, LEX_LB);
            assert.equal(res[3].type, LEX_RB);
            assert.equal(res[4].type, LEX_COMMA);
            assert.equal(res[5].type, LEX_COLON);
            assert.equal(res[6].type, LEX_QUOTE);
            assert.equal(res[6].value, "{}[],:");
            done();
        });

        it('should handle quoted numbers', function (done) {
            const res = lexer.getAllTokens('"576 450.5"');
            assert.equal(res.length, 1);
            assert.equal(res[0].type, LEX_QUOTE);
            assert.equal(res[0].value, "576 450.5");
            done();
        });

        it('should handle unmatched quotes on the right', function (done) {
            const res = lexer.getAllTokens('"test" again"');
            assert.equal(res.length, 7);
            assert.equal(res[0].type, LEX_QUOTE);
            assert.equal(res[0].value, "test");
            
            assert.equal(res[1].type, LEX_TOKEN);
            assert.equal(res[1].value, "a");
            
            assert.equal(res[2].type, LEX_TOKEN);
            assert.equal(res[2].value, "g");
            
            assert.equal(res[3].type, LEX_TOKEN);
            assert.equal(res[3].value, "a");
            
            assert.equal(res[4].type, LEX_TOKEN);
            assert.equal(res[4].value, "i");
            
            assert.equal(res[5].type, LEX_TOKEN);
            assert.equal(res[5].value, "n");
            
            assert.equal(res[6].type, LEX_QUOTE);
            assert.equal(res[6].value, "");
            done();
        });
        
        it('should handle unmatched quotes on the left', function (done) {
            const res = lexer.getAllTokens('"test" "again');
            assert.equal(res.length, 2);
            assert.equal(res[0].type, LEX_QUOTE);
            assert.equal(res[0].value, "test");
            
            assert.equal(res[1].type, LEX_QUOTE);
            assert.equal(res[1].value, "again");
            done();
        });
    });

    it('should handle totally unmatched quotes on the left', function (done) {
        const res = lexer.getAllTokens('"test again');
        assert.equal(res.length, 1);
        assert.equal(res[0].type, LEX_QUOTE);
        assert.equal(res[0].value, "test again");
        done();
    });

    it('should handle totally unmatched quotes on the right', function (done) {
        const res = lexer.getAllTokens('t"');
        assert.equal(res.length, 2);
        assert.equal(res[0].type, LEX_TOKEN);
        assert.equal(res[0].value, "t");
        
        assert.equal(res[1].type, LEX_QUOTE);
        assert.equal(res[1].value, "");
        done();
    });

    it('should handle single quoted strings', function (done) {
        const res = lexer.getAllTokens("'this'    'is'");
        assert.equal(res.length, 2);
        assert.equal(res[0].type, LEX_QUOTE);
        assert.equal(res[0].value, "this");
        
        assert.equal(res[1].type, LEX_QUOTE);
        assert.equal(res[1].value, "is");
        done();
    });

    it('should handle embedded quotes', function (done) { 
        const res = lexer.getAllTokens('"this is "a" test"');
        assert.equal(res.length, 3);
        assert.equal(res[0].type, LEX_QUOTE);
        assert.equal(res[0].value, "this is ");
        
        assert.equal(res[1].type, LEX_TOKEN);
        assert.equal(res[1].value, "a");
        
        assert.equal(res[2].type, LEX_QUOTE);
        assert.equal(res[2].value, " test");
        done();
    });

    it('should parse integers as integers', function (done) {
        const res = lexer.getAllTokens('[4]');
        assert.equal(res.length, 3);
        assert.equal(res[0].type, LEX_LB);
        assert.equal(res[1].type, LEX_INT);
        assert.equal(res[1].value, 4);
        assert.equal(res[2].type, LEX_RB);
        done();
    });

    it('should parse floats as floats', function (done) {
        const res = lexer.getAllTokens('[4.0]');
        assert.equal(res.length, 3);
        assert.equal(res[0].type, LEX_LB);
        assert.equal(res[1].type, LEX_FLOAT);
        assert.equal(res[1].value, 4.0);
        assert.equal(res[2].type, LEX_RB);
        done();
    });

    it('should handle newlines in quotes', done => {
        const res = lexer.getAllTokens('{ "test0": "a '+"\n"+'string" }');
        assert.equal(res.length, 5);
        assert.equal(res[0].type, LEX_LCB);
        assert.equal(res[1].type, LEX_QUOTE);
        assert.equal(res[1].value, "test0");
        assert.equal(res[2].type, LEX_COLON);
        assert.equal(res[3].type, LEX_QUOTE);
        assert.equal(res[3].value, "a \nstring");
        assert.equal(res[4].type, LEX_RCB);
        done();
    });

    it('should handle escaped double quotes', done => {
        const res = lexer.getAllTokens('"this is\\" a test"');
        assert.equal(res.length, 1);
        assert.equal(res[0].type, LEX_QUOTE);
        assert.equal(res[0].value, 'this is\" a test');
        done();
    });

    it('should handle escaped single quotes', done => {
        const res = lexer.getAllTokens("'this is\\' a test");
        assert.equal(res.length, 1);
        assert.equal(res[0].type, LEX_QUOTE);
        assert.equal(res[0].value, 'this is\' a test');
        done();
    });
});


