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

const assert = require("assert");
const dJSON = require("../dirty-json");
const fs = require("fs");


function compareResults(json, done) {
    let result = jeq(dJSON.parse(json, {"fallback": false}), JSON.parse(json));
    done(result);
}

function compareResultsToValid(invalid, valid, done, config) {
    // confirm that the invalid json is invalid
    let testConfig = { "fallback": false };
    if (config) {
        testConfig = {...testConfig, ...config};
    }
    
    try {
	var j = JSON.parse(invalid);
	// it didn't fail!
	done("json was valid!");
    } catch (e) {
	let result = jeq(dJSON.parse(invalid, testConfig),
                         JSON.parse(valid));
        done(result);
    }


}

function jeq(obj1, obj2) {
    assert.equal(JSON.stringify(obj1), JSON.stringify(obj2));
}

describe("parser", function () {
    describe("parse() on valid JSON", function (done) {
	it('should handle an empty object', function (done) {
	    compareResults("{}", done);
	});

	
	it('should handle an empty list', function (done) {
	    compareResults("[]", done);
	});

	it('should handle an single-item list', function (done) {
	    compareResults("[4]", done);
	});

	it('should handle an single-item object', function (done) {
	    compareResults("{ \"test\": 4 }", done);
	});

	it('should handle a list of numbers', function (done) {
	    compareResults("[3, 4, -2, 5.5, 0.5, 0.32]", done);
	});

	it('should handle a list of numbers and strings', function (done) {
	    compareResults("[3, 4, -2, \"5.5\", 0.5, 0.32]", done);
	});

	it('should handle a list of numbers, strings, and booleans', function (done) {
	    compareResults("[3, 4, -2, \"5.5\", 0.5, false]", done);
	});

	it('should handle a list of numbers, strings, and booleans', function (done) {
	    compareResults("[3, 4, -2, \"5.5\", 0.5, false, true, false]", done);
	});

	it('should handle a list of numbers, strings, and booleans', function (done) {
	    compareResults('["some text", 4, "some more text", "text"]', done);
	});

	it('should handle a list of numbers, strings, and booleans', function (done) {
	    compareResults('["[],4,5", "false", ","]', done);
	});

	it('should handle an object with mixed values', function (done) {
	    compareResults('{ "test": 56, "test2": "hello!", "test3": false }', done);
	});

	it('should handle an object with list values', function (done) {
	    compareResults('{ "test": [3, "str", false, 0.5], "test2": [1, 2, "str2"] }', done);
	});

	it('should handle embedded objects', function (done) {
	    compareResults('{ "test": { "test": [1, 2, 3] } }', done);
	});

	it('should handle embedded lists', function (done) {
	    compareResults('[1, 2, [3, 4], 5]', done);
	});

	it('should handle embedded lists when the first item is a list', function (done) {
	    compareResults('[[1, false], 2, [3, 4], 5]', done);
	});

        it('should handle a nested list', function(done) {
            compareResults('{ "rows": [["this", "is", "failing"]] }', done);
        });

        it('should handle a nested list', function(done) {
            compareResults('{ "rows": [[], ["this", "is", "failing"]] }', done);
        });

        it('should handle a nested list', function(done) {
            compareResults('{ "rows": [["this", "is", "failing"], []] }', done);
        });


	it('should handle objects embedded in lists', function (done) {
	    compareResults('[2, {"test": "str"}]', done);
	});

	it('should handle objects embedded in lists', function (done) {
	    compareResults('[{"test": "str"}, 2, [3, {"test2": "str2"}], 5]', done);
	});


	it('should handle a complex JSON structure', function (done) {
	    compareResults('[{"test": "str"}, [2, false, 0.4], [3, {"test2": ["str2", 6]}], 5]', done);
	});

	it('should handle a complex JSON structure', function (done) {
	    compareResults('[{"test": "str"}, [2, false, ",", 0.4, "[val]"], [3, {"test2": ["str2", 6]}], 5]', done);
	});

	it('should handle nulls in lists', function (done) {
	    compareResults("[null]", done);
	});

	it('should handle nulls in objects', function (done) {
	    compareResults("{ \"test\": null}", done);
	});

	it('should handle nulls in objects and lists', function (done) {
	    compareResults("{ \"test\": null, \"test2\": [4, null] }", done);
	});

	it('should handle arbitrary whitespace', function (done) {
	    compareResults("{      \"test\": null,      \"test2\": [4,      null] }", done);
	});

        it('should handle a list key with a single object value', function (done) {
            compareResults('{"key": [{"a":"b"}]}', done);
        });

        it('should handle multiple list keys with a single object value', function (done) {
            compareResults('{"key": [{"a":"b"}], "key2": [{"a": "b"}]}', done);
        });

        it('should handle a list key with a single object value', function (done) {
            compareResults('{"key": [{"a":2}]}', done);
        });

        it('should handle multiple list keys with a single object value', function (done) {
            compareResults('{"key": [{"a":2}], "key2": [{"a": 5.0}]}', done);
        });

        it('should handle a string key with a single object value', function (done) {
            compareResults('{"key": ["test"]}', done);
        });

        it('should handle escaped double-quotes', function (done) {
            compareResults('["this\\"is", "a test"]', done);
        });

        it('should handle curly braces in a quoted string', function (done) {
            compareResults('{"action": "with curly \\"${blahblah}\\""}', done);
        });

        it('should handle raw string values', function (done) {
	    compareResults('"test"', done);
	});

        it('should differentiate strings and special values', function (done) {
	    compareResults('["false", false, "true", true, "null", null]', done);
	});


        describe("should pass the NST / Minefield test cases", function() {
            fs.readdirSync("test/nst").forEach(f => {
                if (!f.endsWith(".json"))
                    return;
                
                it(`should parse ${f} correctly`, function(done) {
                    const str = fs.readFileSync("test/nst/" + f,
                                                {"options":
                                                 {"encoding": "utf8" }
                                                });
                    compareResults(str, done);
                });
            });
        });

    });

    describe("parse() on invalid JSON", function () {
	it('should handle non-quoted object keys', function(done) {
	    compareResultsToValid('{test: 5}', '{"test": 5}', done);
	});

	it('should handle single-quoted object keys', function(done) {
	    compareResultsToValid('{\'test\': 5}', '{"test": 5}', done);
	});


	it('should handle single-quoted object values', function(done) {
	    compareResultsToValid('{\'test\': \'5\'}', '{"test": "5"}', done);
	});

	it('should handle quotes-in-quotes (list)', function(done) {
	    compareResultsToValid('["some "quoted" text"]', '["some \\"quoted\\" text"]', done);
	});

	it('should handle quotes-in-quotes (list)', function(done) {
	    compareResultsToValid('[3, "some "quoted" text", 2]', '[3, "some \\"quoted\\" text", 2]', done);
	});

	it('should handle quotes-in-quotes (object)', function(done) {
	    compareResultsToValid('{"test": "some "quoted" text"}', '{"test": "some \\"quoted\\" text"}', done);
	});

	it('should handle quotes-in-quotes (object)', function(done) {
	    compareResultsToValid('{"test0": false, "test": "some "quoted" text", "test1": 5}', '{"test0": false, "test": "some \\"quoted\\" text", "test1": 5}', done);
	});
	
        it('should handle non-quoted string values', function(done) {
	    compareResultsToValid('{"this": that}', '{"this": "that"}', done);
	});

	it('should handle non-quoted string values', function(done) {
	    compareResultsToValid('{"this": that, "another": "maybe"}', '{"this": "that", "another": "maybe"}', done);
	});

	it('should handle non-quoted string values', function(done) {
	    compareResultsToValid('{"this": "that", "another": maybe}', '{"this": "that", "another": "maybe"}', done);
	});

	it('should handle non-quoted string values', function(done) {
	    compareResultsToValid('{"this": that, "another": maybe}', '{"this": "that", "another": "maybe"}', done);
	});
	
	
	it('should handle non-quoted string values in lists', function(done) {
	    compareResultsToValid('["this", that]', '["this", "that"]', done);
	});

        it('should handle non-quoted string values in lists', function(done) {
	    compareResultsToValid('[this, that]', '["this", "that"]', done);
	});

        it('should handle non-quoted string values in lists with trailing comma', function(done) {
	    compareResultsToValid('[this, that,]', '["this", "that"]', done);
	});


        it('should handle non-quoted string values in lists', function(done) {
	    compareResultsToValid('[a, b]', '["a", "b"]', done);
	});

        
        it('should handle non-quoted string values in lists with trailing comma', function(done) {
	    compareResultsToValid('[a,b,c,]', '["a", "b", "c"]', done);
	});


        it('should handle non-quoted string values in nested lists with trailing comma', function(done) {
	    compareResultsToValid('[a,[b,d,],[c,],]', '["a", ["b", "d"], ["c"]]', done);
	});

        it('should handle non-quoted singletons in nested lists with trailing comma', function(done) {
	    compareResultsToValid('[a,[b,],[c,],]', '["a", ["b"], ["c"]]', done);
	});

        it('should handle  object singletons in lists with trailing comma', function(done) {
	    compareResultsToValid('[{"a": 1},]','[{"a": 1}]', done);
	});

        it('should handle string singletons in lists with trailing comma', function(done) {
	    compareResultsToValid('["a",]','["a"]', done);
	});

        it('should handle integer singletons in lists with trailing comma', function(done) {
	    compareResultsToValid('[5,]','[5]', done);
	});

        it('should handle float singletons in lists with trailing comma', function(done) {
	    compareResultsToValid('[0.05,]','[0.05]', done);
	});


	it('should handle non-quoted string values in lists', function(done) {
	    compareResultsToValid('["this", that, "another", maybe]', '["this", "that", "another", "maybe"]', done);
	});

        it('should handle raw strings before values in a map', function(done) {
            compareResultsToValid('{"this": h"that"}',
                                  '{"this": "hthat"}',
                                  done);
        });

        it('should handle raw strings before values in a list', function (done) {
            compareResultsToValid('[1, "this", hex"test"]',
                                  '[1, "this", "hextest"]',
                                  done);
            
        });

        it('should handle raw strings before values in a map', function(done) {
            compareResultsToValid('{"this": hex3}',
                                  '{"this": "hex3"}',
                                  done);
        });

        it('should handle raw strings before values in a list', function (done) {
            compareResultsToValid('[1, "this", hex3]',
                                  '[1, "this", "hex3"]',
                                  done);
            
        });
	
	it('should handle mixed quotes/single quotes with curly braces', function(done) {
            compareResultsToValid('{"action": \'this has ${} in it\'}',
                                  '{"action": "this has ${} in it"}',
                                  done);
        });

        it('should handle a decimal with no trailing digits', function(done) {
            compareResultsToValid('{ "test": 5. }', '{"test": 5.0 }', done);
        });

        it('should handle a decimal with no trailing digits', function(done) {
            compareResultsToValid('["test", 5.]', '["test", 5.0 ]', done);
        });

        it('should handle a decimal with no leading digits', function(done) {
            compareResultsToValid('{ "test": .5 }', '{"test": 0.5 }', done);
        });

        it('should handle multiple commas', function(done) {
            compareResultsToValid(
                '{"ss":[["Thu","7:00","Final",,"BAL","19","ATL","20",,,"56808",,"PRE4","2015"],["Thu","7:00","Final",,"NO","10","GB","38",,,"56809",,"PRE4","2015"]]}',
                '{"ss":[["Thu","7:00","Final","BAL","19","ATL","20","56808","PRE4","2015"],["Thu","7:00","Final","NO","10","GB","38","56809","PRE4","2015"]]}',
                done);
        });

        it('should handle multiple commas', function(done) {
            compareResultsToValid(
                '{"test": [1,,,,,,,,,2]}',
                '{"test": [1,2]}',
                done
            );
        });

        it('should handle dashes in unquoted strings', function(done) {
            compareResultsToValid(
                '{"test": cool-cat}',
                '{"test": "cool-cat"}',
                done
            );
        });

        describe("with special characters", function () {
            it('should handle all kinds of escaped characters', function(done) {
                const r = dJSON.parse('" \\\\ \\"\\0!"');
                assert.equal(r[0], ' ');
                assert.equal(r[1], '\\');
                assert.equal(r[2], ' ');
                assert.equal(r[3], '"');
                assert.equal(r[4], '\0');
                assert.equal(r[5], '!');
                done();
            });

            it("should handle strange symbols", function(done) {
                compareResultsToValid(
                    '{te!st: ug&*sd}',
                    '{"te!st": "ug&*sd"}',
                    done
                );
            });
            
            it("should handle strange symbols", function(done) {
                compareResultsToValid(
                    '{te!st: [ug&*s,d]}',
                    '{"te!st": ["ug&*s", "d"]}',
                    done
                );
            });

            it("should handle strange symbols", function(done) {
                compareResultsToValid(
                    '{te!st: [ug&*s,d,",,,"]}',
                    '{"te!st": ["ug&*s", "d", ",,,"]}',
                    done
                );
            });

            it("should handle strange symbols", function(done) {
                compareResultsToValid(
                    '{te!st: [ug&*s,d,",,,", {test: aga()in}]}',
                    '{"te!st": ["ug&*s", "d", ",,,", {"test": "aga()in"}]}',
                    done
                );
            });

            it("should handle strange symbols mixed with numerics", function(done) {
                compareResultsToValid(
                    '{te!st: [1,ug&*s,d,",,,", {test: aga()in}]}',
                    '{"te!st": [1, "ug&*s", "d", ",,,", {"test": "aga()in"}]}',
                    done
                );
            });

            it("should handle strange symbols mixed with numerics", function(done) {
                compareResultsToValid(
                    '{te!st: [1,.5,",",true,ug&*s,d,",,,", {test: aga()in}]}',
                    '{"te!st": [1, 0.5, ",", true, "ug&*s", "d", ",,,", {"test": "aga()in"}]}',
                    done
                );
            });
        });
	
	describe("with new lines", function() {
	    it ('should handle a newline in a string in object', function(done) {
		const r = dJSON.parse('{ "test0": "a '+"\n"+'string" }');
		assert.equal(r.test0, 'a '+"\n"+'string');
                done();
	    });

	    it ('should handle a newline in a string in a list', function(done) {
		const r = dJSON.parse('["a '+"\n"+'string"]');
		assert.equal(r[0], 'a '+"\n"+'string');
                done();
	    });

	    it('should handle newline in misquoted string in object', function(done) {
		const str = 'this\n"quote"\ntext';
		const r = dJSON.parse('{ "test0": "' + str + '"}');
		assert.equal(r.test0, str);
                done();
	    });

	    it('should handle newline in misquoted string in object', function(done) {
		const str = 'this\n"quote"\ntext';
                const r = dJSON.parse('{ "test1": false, "test0": "' + str + '", test2: 5.5}');
		assert.equal(r.test0, str);
		assert.equal(r.test1, false);
		assert.equal(r.test2, 5.5);
                done();
	    });

	    it('should handle newline in misquoted string in list', function(done) {
		const str = 'this\n"quote"\ntext';
		const r = dJSON.parse('["' + str + '"]');
		assert.equal(r[0], str);
                done();
	    });


	    it('should handle newline in misquoted string in list', function(done) {
		const str = 'this\n"quote"\ntext';
		const r = dJSON.parse('[5, 6, "' + str + '", "test"]');
		assert.equal(r[2], str);
		assert.equal(r[0], 5);
		assert.equal(r[1], 6);
		assert.equal(r[3], "test");
                done();
	    });
	});


	describe("with embedded HTML", function() {
	    it('should handle an embedded DIV tag', function(done) {
		const r = dJSON.parse('["<div class="class">some text</div>"]');
		assert.equal(r[0], '<div class="class">some text</div>');
		assert.equal(r.length, 1);
                done();
	    });

	    it('should handle an embedded span tag', function(done) {
		const r = dJSON.parse('["<span class="class">some text</span>"]');
		assert.equal(r[0], '<span class="class">some text</span>');
		assert.equal(r.length, 1);
                done();
	    });


	    it('should handle an embedded span tag in a div tag', function(done) {
		const r = dJSON.parse('["<div class="divclass"><span class="class">some text</span></div>"]');
		assert.equal(r[0], '<div class="divclass"><span class="class">some text</span></div>');
		assert.equal(r.length, 1);
                done();
	    });
	});
	
        it('should handle plain strings', done => {
            const r = dJSON.parse("this is a test");
            assert.equal("this is a test", r);
            done();
        });
	
    });

    describe("tickets", () => {
        it("should handle ticket #10", done => {
            compareResultsToValid('{\n   "some": [a,b,c,],\n   "b": a\n}', '{"some": ["a", "b", "c"], "b": "a"}', done);
            
        });

        it("should handle ticket #14", done => {
            compareResultsToValid(
                '{ "key": "<div class="cool-css">some text</div>" }',
                '{ "key": "<div class=\\"cool-css\\">some text</div>"}',
                done
            );
        });

        it("should handle ticket #16", done => {
            compareResultsToValid(
                ' { "key": "<div class="coolCSS>text</div>" }',
                ' { "key": "<div class=\\"coolCSS>text</div>\\" }" }',
                done
            );
        });

        it("should handle ticket #16", done => {
            compareResultsToValid(
                ' { "key": "test"',
                ' { "key": "test" } ',
                done
            );
        });

        it("should handle ticket #16", done => {
            compareResultsToValid(
                ' { "key": test',
                ' { "key": "test" } ',
                done
            );
        });

        it("should handle ticket #16", done => {
            compareResultsToValid(
                ' [ "key", test',
                ' ["key", "test"]',
                done
            );
        });

        it("should handle ticket #15 (keep whitespace in quotes)", done => {
            compareResultsToValid(
                '{"claim": ""this is a test" of whitespace"}',
                '{"claim": "\\"this is a test\\" of whitespace"}',
                done
            );
        });

        it("should handle ticket #17 (unmatched single quotes, i.e. contractions)", done => {
            compareResultsToValid(
                '{"key": "this "isn\'t valid"",\n "other": true}',
                '{ "key": "this \'isn\'t valid\\"", "other": true }',
                done
            );
        });

        it("should handle ticket #19 (option for duplicate keys)", done => {
            compareResultsToValid(
                '{"key": 1, "key": 2, \'key\': [1, 2, 3]}',
                '{ "key": { "value": { "value": 1, "next": 2 }, "next": [ 1, 2, 3 ] } }',
                done, {"duplicateKeys": true}
            );
        });

        describe("should handle ticket #21 (trailing comma)", () => {
            it("in objects", done => {
                compareResultsToValid(
                    '{"key": 1, "test": 2,}',
                    '{"key": 1, "test": 2 }',
                    done
                );
            });

            it("in objects with newlines", done => {
                compareResultsToValid(
                    '{"key": 1,\n"test": 2,\n}',
                    '{"key": 1, "test": 2 }',
                    done
                );
            });

            it("in lists", done => {
                compareResultsToValid(
                    '["val1", 1,]',
                    '["val1", 1]',
                    done
                );
            });
        });

        it("should handle issue #27 (extra whitespace)", done => {
            compareResultsToValid(
                'id: \"test\"\nlang: \"en\"\nresult {\n  source: \"agent\"\n}',
                '{"id":"test","lang":"en","result": { "source":"agent"}}',
                done
            );
        });

        it("should handle issue #28 (non-quoted key and value)", done => {
            compareResultsToValid(
                "{type: String, value: 'something'}",
                '{"type": "String", "value": "something"}',
                done
            );
        });

        describe("should handle issue #30 (missing values)", () => {
            it("as the last key of an object", done => {
                compareResultsToValid(
                    '{"key": }',
                    '{"key": null}',
                    done
                );
            });

            it("as an internal key of an object", done => {
                compareResultsToValid(
                    '{"key1": "test", "key": , "key2": "test"}',
                    '{"key1": "test", "key": null, "key2": "test"}',
                    done
                );
            });

        });

    });

    describe("should throw exceptions for JSON that is too malformed to deal with", () => {
	it('should throw on }}', done => {
	    try {
                dJSON.parse('\n\n\n\n\n   }}');
		done(new Error("Should have thrown exception"));
	    } catch (e) {
		done();
	    }
	    
	});

	it('should throw on ]:"test"', done => {
	    try {
                dJSON.parse(']:"test"');
		done(new Error("Should have thrown exception"));
	    } catch (e) {
		done();
	    }
	});
	
    });



});
