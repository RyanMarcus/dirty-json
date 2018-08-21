

assets/bundle.min.js: DemoCtrl.js node_modules
	node_modules/browserify/bin/cmd.js DemoCtrl.js -o assets/bundle.js
	node_modules/uglify-es/bin/uglifyjs -cm < assets/bundle.js > assets/bundle.min.js


node_modules: package.json
	npm i


.phony: clean
clean:
	rm -f assets/bundle.js
	rm -rf node_modules

