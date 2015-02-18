(function () {
    "use strict";

    angular.module('demo', ['mdvorakDataRouter'])
        .config(function demoConfig($locationProvider, $dataRouterProvider) {
            // HTML 5 mode (works both, try it out)
            $locationProvider.html5Mode(false);

            // URL prefixes
            $dataRouterProvider.apiPrefix('api/');

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
                template: '<pre>{{text}}</pre><button ng-click="textCtrl.reload()">Soft Reload</button><button ng-click="textCtrl.reload(true)">Force Reload</button><a api-href="api/sample.json">JSON</a>',
                dataAs: 'text',
                controller: 'textCtrl',
                controllerAs: 'textCtrl'
            });
        })
        .controller('textCtrl', function ($dataResponse) {
            this.reload = function reload(force) {
                $dataResponse.reload(force);
            };
        });
})();
