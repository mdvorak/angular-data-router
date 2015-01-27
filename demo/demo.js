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
            $dataRouterProvider.when('application/json', {
                template: '<pre>{{json|json}}</pre><a api-href="api/sample.txt">Text</a> <a api-href="api/sample.error">Error</a>',
                dataAs: 'json'
            });

            $dataRouterProvider.when('text/plain', {
                template: '<pre>{{text}}</pre><a api-href="api/sample.json">JSON</a>',
                dataAs: 'text'
            });
        });
})();