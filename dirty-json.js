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

let parser = require('./parser');

module.exports.parse = parse;
function parse(text, config) {
    let fallback = true;
    let duplicateKeys = false;

    if (config) {
        if (("fallback" in config) && config[fallback] === false) {
            fallback = false;
        }

        duplicateKeys = "duplicateKeys" in config && config["duplicateKeys"] === true;
    }

    try {
        return parser.parse(text, duplicateKeys);
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
