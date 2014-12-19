dirty-json.js: lexer.js parser.js
	wget https://raw.githubusercontent.com/RyanMarcus/dirty-json/master/dirty-json.js

lexer.js: 
	wget https://raw.githubusercontent.com/RyanMarcus/dirty-json/master/lexer.js

parser.js:
	https://raw.githubusercontent.com/RyanMarcus/dirty-json/master/parser.js


assets/bundle.js: dirty-json.js parser.js lexer.js
	browserify dirty-json.js -r ./dirty-json -o assets/bundle.js

.phony: clean
clean:
	rm assets/bundle.js
