var assert = require("assert");
var lexer = require("../lexer");

describe("lexer", function () {
	describe("getAllTokens()", function () {
		it('should handle an empty string', function (done) {
			lexer.getAllTokens("").then(function (res) {
				assert.equal(res.length, 0);
			}).then(done, done);
		});

		it('should handle quoted strings', function (done) {
			lexer.getAllTokens('"this is a test"').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].value, "this is a test");
			}).then(done);

		});

		it('should handle integers', function (done) {
			lexer.getAllTokens('5600').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "int");
				assert.equal(res[0].value, 5600);
			}).then(done, done);
		});

		it('should handle negative integers', function (done) {
			lexer.getAllTokens('-5600').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "int");
				assert.equal(res[0].value, -5600);
			}).then(done, done);
		});

		it('should handle floats', function (done) {
			lexer.getAllTokens('5600.5').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "float");
				assert.equal(res[0].value, 5600.5);
			}).then(done, done);
		});

		it('should handle negative floats', function (done) {
			lexer.getAllTokens('-5600.5').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "float");
				assert.equal(res[0].value, -5600.5);
			}).then(done, done);
		});


		it('should handle floats without leading digits', function (done) {
			lexer.getAllTokens('.5').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "float");
				assert.equal(res[0].value, .5);
			}).then(done, done);
		});

		it('should handle negative floats without leading digits', function (done) {
			lexer.getAllTokens('-.5').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "float");
				assert.equal(res[0].value, -.5);
			}).then(done, done);
		});

		it('should handle special characters', function (done) {
			lexer.getAllTokens('{}[],:').then(function(res) {
				assert.equal(res.length, 6);
				assert.equal(res[0].type, "lcb");
				assert.equal(res[1].type, "rcb");
				assert.equal(res[2].type, "lb");
				assert.equal(res[3].type, "rb");
				assert.equal(res[4].type, "comma");
				assert.equal(res[5].type, "colon");
			}).then(done, done);
		});

		it('should handle quoted special characters', function (done) {
			lexer.getAllTokens('{}[],:"{}[],:"').then(function(res) {
				assert.equal(res.length, 7);
				assert.equal(res[0].type, "lcb");
				assert.equal(res[1].type, "rcb");
				assert.equal(res[2].type, "lb");
				assert.equal(res[3].type, "rb");
				assert.equal(res[4].type, "comma");
				assert.equal(res[5].type, "colon");
				assert.equal(res[6].type, "quote");
				assert.equal(res[6].value, "{}[],:");
			}).then(done, done);
		});

		it('should handle quoted numbers', function (done) {
			lexer.getAllTokens('"576 450.5"').then(function(res) {
				assert.equal(res.length, 1);
				assert.equal(res[0].type, "quote");
				assert.equal(res[0].value, "576 450.5");
			}).then(done, done);
		});

		it('should handle unmatched quotes on the right', function (done) {
			lexer.getAllTokens('"test" again"').then(function(res) {
				assert.equal(res.length, 7);
				assert.equal(res[0].type, "quote");
				assert.equal(res[0].value, "test");

				assert.equal(res[1].type, "token");
				assert.equal(res[1].value, "a");

				assert.equal(res[2].type, "token");
				assert.equal(res[2].value, "g");

				assert.equal(res[3].type, "token");
				assert.equal(res[3].value, "a");

				assert.equal(res[4].type, "token");
				assert.equal(res[4].value, "i");

				assert.equal(res[5].type, "token");
				assert.equal(res[5].value, "n");

				assert.equal(res[6].type, "quote");
				assert.equal(res[6].value, "");
			}).then(done, done);
		});

	it('should handle unmatched quotes on the left', function (done) {
			lexer.getAllTokens('"test" "again').then(function(res) {
				assert.equal(res.length, 2);
				assert.equal(res[0].type, "quote");
				assert.equal(res[0].value, "test");

				assert.equal(res[1].type, "quote");
				assert.equal(res[1].value, "again");
				
			}).then(done, done);
		});
	});

	it('should handle totally unmatched quotes on the left', function (done) {
		lexer.getAllTokens('"test again').then(function(res) {
			assert.equal(res.length, 1);
			assert.equal(res[0].type, "quote");
			assert.equal(res[0].value, "test again");
		}).then(done, done);
	});

	it('should handle totally unmatched quotes on the right', function (done) {
		lexer.getAllTokens('t"').then(function(res) {
			assert.equal(res.length, 2);
			assert.equal(res[0].type, "token");
			assert.equal(res[0].value, "t");
			
			assert.equal(res[1].type, "quote");
			assert.equal(res[1].value, "");
		}).then(done, done);
	});

	it('should handle single quoted strings', function (done) {
		lexer.getAllTokens("'this'    'is'").then(function(res) {
			assert.equal(res.length, 2);
			assert.equal(res[0].type, "quote");
			assert.equal(res[0].value, "this");
			
			assert.equal(res[1].type, "quote");
			assert.equal(res[1].value, "is");
		}).then(done, done);
	});

	it('should handle embedded quotes', function (done) { 
		lexer.getAllTokens('"this is "a" test"').then(function(res) {
			assert.equal(res.length, 3);
			assert.equal(res[0].type, "quote");
			assert.equal(res[0].value, "this is ");

			assert.equal(res[1].type, "token");
			assert.equal(res[1].value, "a");
			
			assert.equal(res[2].type, "quote");
			assert.equal(res[2].value, " test");
		}).then(done, done);
	});
});

