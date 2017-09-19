# dirty-json

[ ![Codeship Status for RyanMarcus/dirty-json](https://codeship.com/projects/cbc19870-2e42-0132-d30c-4adef3b19db7/status)](https://www.codeship.io/projects/39346) [![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FRyanMarcus%2Fdirty-json.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FRyanMarcus%2Fdirty-json?ref=badge_shield)
 [![Coverage Status](https://coveralls.io/repos/github/RyanMarcus/dirty-json/badge.svg?branch=master)](https://coveralls.io/github/RyanMarcus/dirty-json?branch=master) ![NPM version](https://badge.fury.io/js/dirty-json.svg)


[ ![AGPL](http://www.gnu.org/graphics/agplv3-155x51.png) ](http://www.gnu.org/licenses/agpl-3.0.en.html)


```
npm install dirty-json
```



A JSON parser that tries to handle non-conforming or otherwise invalid JSON.

I still need to make a lot of the internals of the parser asynchronous.

You can play around with a demo here: [http://rmarcus.info/dirty-json/](http://rmarcus.info/dirty-json)

You might also be interested in [my blog post about the parser](http://rmarcus.info/blog/2014/10/05/dirty-json-parser.html).

Turn this:

    [5, .5, 'single quotes', "quotes in "quotes" in quotes"]

Into this:

    [5,0.5,"single quotes","quotes in \"quotes\" in quotes"]

## Why?
We all love JSON. But sometimes, out in that scary place called "the real world", we see something like this:

    { "user": "<div class="user">Ryan</div>" }

Or even something like this:

    { user: '<div class="user">
	Ryan
	</div>' }

While these are obviously cringe-worthy, we still a way to parse them. `dirty-json` provides a library to do exactly that.

## Examples
`dirty-json` does not require object keys to be quoted, and can handle single-quoted value strings.

    var dJSON = require('dirty-json');
	dJSON.parse("{ test: 'this is a test'}").then(function (r) {
		console.log(JSON.stringify(r));
    });

	// output: {"test":"this is a test"}

`dirty-json` can handle embedded quotes in strings.

    var dJSON = require('dirty-json');
	dJSON.parse('{ "test": "some text "a quote" more text"}').then(function (r) {
		console.log(JSON.stringify(r));
    });

	// output: {"test":"some text \"aquote\" more text"}

`dirty-json` can handle newlines inside of a string.

    var dJSON = require('dirty-json');
	dJSON.parse('{ "test": "each \n on \n new \n line"}').then(function (r) {
		console.log(JSON.stringify(r));
    });

	// output: {"test":"each \n on \n new \n line"}

## But what about THIS ambiguous example?
Since `dirty-json` is handling malformed JSON, it will not always produce the result that you "think" it should. That's why you should only use this when you absolutely need it. Malformed JSON is malformed for a reason.

## How does it work?
Currently `dirty-json` uses a lexer [powered by lex](https://github.com/aaditmshah/lexer) and a hand-written `LR(1)` parser. It shouldn't be used in any environment that requires reliable or fast results.

## License
> Copyright 2016, 2015, 2014 Ryan Marcus
> dirty-json is free software: you can redistribute it and/or modify
> it under the terms of the GNU Affero General Public License as published by
> the Free Software Foundation, either version 3 of the License, or
> (at your option) any later version.
> 
> dirty-json is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
> GNU Affero General Public License for more details.
> 
> You should have received a copy of the GNU Affero General Public License
> along with dirty-json.  If not, see <http://www.gnu.org/licenses/>.


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FRyanMarcus%2Fdirty-json.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FRyanMarcus%2Fdirty-json?ref=badge_large)