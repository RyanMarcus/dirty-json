angular.module('djson', []).controller('DemoCtrl', ['$scope', function($scope) {
	$scope.valid = false;
	


	$scope.examples = [			   
		{"name": "Invalid JSON: embedded HTML", "content": '{ "key": "<div class="coolCSS">some text</div>" }'},
		{"name": "Valid JSON: Simple", "content": '{ "key": "value" }'},
		{"name": "Invalid JSON: Simple", "content": "{ key: 'value' }"},
		{"name": "Valid JSON: Complex Object", "content": '{ "key": ["value", 0.5, \n\t{ "test": 56, \n\t"test2": [true, null] }\n\t]\n}'},
		{"name": "Invalid JSON: Complex Object", "content": '{ key: ["value", .5, \n\t{ "test": 56, \n\t\'test2\': [true, null] }\n\t]\n}'},
		{"name": "Invalid JSON: With newlines", "content": '{ "key": "a string\nwith a newline" }'},
		{"name": "Invalid JSON: Floats", "content": '{ "no leading zero": .13452 }'},
		{"name": "Invalid JSON: Non-quoted keys", "content": '{ "test": here, "another": test }'}
	];
	


	$scope.selectedExample = $scope.examples[0];

	$scope.input = $scope.selectedExample.content;

	$scope.doParse = function() {
		var dJSON = require('./dirty-json');
		dJSON.parse($scope.input).then(function (res) {
			$scope.output = JSON.stringify(res, null, 4);
			try {
				JSON.parse($scope.input);
				$scope.valid = true;
			} catch (e) {
				$scope.valid = false;
			}

			$scope.$apply();
		}).catch(function (e) {
			alert("Error: " + e);
		});
	};

	
	$scope.doSelection = function () {
		$scope.input = $scope.selectedExample.content;
		$scope.doParse();
	};

	$scope.doParse();
}]);
