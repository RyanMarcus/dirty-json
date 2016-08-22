assets/bundle.js: DemoCtrl.js dirty-json.js parser.js lexer.js
	browserify DemoCtrl.js -o assets/bundle.js


.phony: clean
clean:
	rm -f assets/bundle.js

