// Copyright 2016, 2015, 2014 Ryan Marcus
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

"use strict";

var assert = require("assert");
var dJSON = require("../dirty-json");


function compareResults(json, done) {
    dJSON.parse(json).then(function (res) {
	jeq(res, JSON.parse(json));
    }).then(done, done);
}

function compareResultsToValid(invalid, valid, done) {
    // confirm that the invalid json is invalid
    try {
	var j = JSON.parse(invalid);
	// it didn't fail!
	done("json was valid!");
    } catch (e) {
	dJSON.parse(invalid).then(function (res) {
	    jeq(res, JSON.parse(valid));
	}).then(done, done);
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
	
	
	
	
	describe("with new lines", function() {
	    it ('should handle a newline in a string in object', function(done) {
		
		dJSON.parse('{ "test0": "a '+"\n"+'string" }').then(function (r) {
		    assert.equal(r.test0, 'a '+"\n"+'string');
		}).then(done, done);
	    });

	    it ('should handle a newline in a string in a list', function(done) {
		
		dJSON.parse('["a '+"\n"+'string"]').then(function (r) {
		    assert.equal(r[0], 'a '+"\n"+'string');
		}).then(done, done);
	    });

	    it('should handle newline in misquoted string in object', function(done) {
		var str = 'this\n"quote"\ntext';
		dJSON.parse('{ "test0": "' + str + '"}').then(function (r) {
		    assert.equal(r.test0, str);
		}).then(done, done);
	    });

	    it('should handle newline in misquoted string in object', function(done) {
		var str = 'this\n"quote"\ntext';
		dJSON.parse('{ "test1": false, "test0": "' + str + '", test2: 5.5}').then(function (r) {
		    assert.equal(r.test0, str);
		    assert.equal(r.test1, false);
		    assert.equal(r.test2, 5.5);
		}).then(done, done);
	    });

	    it('should handle newline in misquoted string in list', function(done) {
		var str = 'this\n"quote"\ntext';
		dJSON.parse('["' + str + '"]').then(function (r) {
		    assert.equal(r[0], str);
		}).then(done, done);
	    });


	    it('should handle newline in misquoted string in list', function(done) {
		var str = 'this\n"quote"\ntext';
		dJSON.parse('[5, 6, "' + str + '", "test"]').then(function (r) {
		    assert.equal(r[2], str);
		    assert.equal(r[0], 5);
		    assert.equal(r[1], 6);
		    assert.equal(r[3], "test");
		}).then(done, done);
	    });
	});


	describe("with embedded HTML", function() {
	    it('should handle an embedded DIV tag', function(done) {
		dJSON.parse('["<div class="class">some text</div>"]').then(function (r) {
		    assert.equal(r[0], '<div class="class">some text</div>');
		    assert.equal(r.length, 1);
		}).then(done, done);
	    });

	    it('should handle an embedded span tag', function(done) {
		dJSON.parse('["<span class="class">some text</span>"]').then(function (r) {
		    assert.equal(r[0], '<span class="class">some text</span>');
		    assert.equal(r.length, 1);
		}).then(done, done);
	    });


	    it('should handle an embedded span tag in a div tag', function(done) {
		dJSON.parse('["<div class="divclass"><span class="class">some text</span></div>"]').then(function (r) {
		    assert.equal(r[0], '<div class="divclass"><span class="class">some text</span></div>');
		    assert.equal(r.length, 1);
		}).then(done, done);
	    });
	});
	

	
    });

    describe("should throw exceptions for JSON that is too malformed to deal with", () => {
	it('should throw on }}', done => {
	    dJSON.parse('}}').then(r => {
		done(new Error("Should have thrown exception"));
	    }).catch(e => {
		done();
	    });
	    
	});

	it('should throw on ]:"test"', done => {
	    dJSON.parse(']:"test"').then(r => {
		done(new Error("Should have thrown exception"));
	    }).catch(e => {
		done();
	    });
	});

	it('should throw on "test"', done => {
	    dJSON.parse('"test"').then(r => {
		done(new Error("Should have thrown exception"));
	    }).catch(e => {
		done();
	    });
	});
	
    });
});
