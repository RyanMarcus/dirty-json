
assets/bundle.js: dirty-json.js parser.js lexer.js
	browserify dirty-json.js -r ./dirty-json -o assets/bundle.js

.phony: clean
clean:
	rm assets/bundle.js
