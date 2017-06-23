

assets/bundle.js: DemoCtrl.js node_modules
	browserify DemoCtrl.js -g babelify -g uglifyify -o assets/bundle.js


node_modules: package.json
	npm i


.phony: clean
clean:
	rm -f assets/bundle.js
	rm -rf node_modules

