declare namespace dJSON {
  interface IParseConfig {
    /**
     * if `fallback` is `true`, when `dirtyJSON.parse` fails, it will try to use `JSON.parse`
     * @default false
     */
    fallback?: boolean
    /**
     * `dirty-json` can handle duplicate keys differently from standard JSON.
     * @example
     const dJSON = require('dirty-json');
     const r = dJSON.parse('{"key": 1, "key": 2, \'key\': [1, 2, 3]}');
     console.log(JSON.stringify(r));
     // output: {"key": [1, 2, 3]}

     const r = dJSON.parse('{"key": 1, "key": 2, \'key\': [1, 2, 3]}', {"duplicateKeys": true});
     console.log(JSON.stringify(r));
     // output: { key: { value: { value: 1, next: 2 }, next: [ 1, 2, 3 ] } }
     * @default: false
     */
    duplicateKeys?: boolean
  }

  export function parse(text: string, config?: IParseConfig): any
}

export = dJSON
