(function () {
    "use strict";

    angular.module('demo', ['mdvorakDataRouter'])
        .config(function demoConfig($locationProvider, $dataRouterProvider) {
            // HTML 5 mode (works both, try it out)
            $locationProvider.html5Mode(false);

            // URL prefixes
            $dataRouterProvider.apiPrefix('api/');

            // Globals
            $dataRouterProvider.global({
                resolve: {
                    glob: function () {
                        return 'Global Resolved Value';
                    }
                },
                responseAs: '$response',
                someValue: 42
            });

            // Error route
            $dataRouterProvider.error({
                templateUrl: 'error.html',
                dataAs: 'error'
            });

            // Routes
            $dataRouterProvider.when(function (type) {
                return type.lastIndexOf('json') === type.length - 4;
            }, {
                templateUrl: 'json.html',
                dataAs: 'json'
            });

            $dataRouterProvider.when('text/plain', {
                template: '<pre>{{text}}</pre><button ng-click="textCtrl.reload()">Soft Reload</button><button ng-click="textCtrl.reload(true)">Force Reload</button><a api-href="\'api/sample.json\'">JSON</a><div>$viewType = {{$viewType}}</div>',
                dataAs: 'text',
                controller: 'textCtrl as textCtrl'
            });
        })
        .controller('textCtrl', function ($scope, $dataResponse) {
            if ($scope.text !== $dataResponse.data) {
                throw new Error("Bug in dataAs");
            }

            this.reload = function reload(force) {
                $dataResponse.reload(force);
            };
        });
})();
