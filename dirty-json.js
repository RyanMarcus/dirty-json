// < begin copyright > 
// Copyright Ryan Marcus 2018
//
// This file is part of dirty-json.
// 
// dirty-json is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// dirty-json is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with dirty-json.  If not, see <http://www.gnu.org/licenses/>.
// 
// < end copyright > 


"use strict";

let parser = require('./parser');

module.exports.parse = parse;
function parse(text, fallback) {
    try {
        return parser.parse(text);
    } catch (e) {
        // our parser threw an error! see if the JSON was valid...
        /* istanbul ignore next */
        if (fallback === false) {
            throw e;
        }
        
        try {
            let json = JSON.parse(text);
            // if we didn't throw, it was valid JSON!
            /* istanbul ignore next */
            console.warn("dirty-json got valid JSON that failed with the custom parser. We're returning the valid JSON, but please file a bug report here: https://github.com/RyanMarcus/dirty-json/issues  -- the JSON that caused the failure was: " + text);

            /* istanbul ignore next */
            return json;
        } catch (json_error) {
            throw e;
        }

    }
}
