angular-data-router
==================

AngularJS routing engine that drives views by media types.

_Note: This is unstable not well-tested version, use at your own risk. It seems to work thou._

Configuration
=====

    angular.module('example', ['mdvorakDataRouter'])
        .config(function configRouter($dataRouterProvider) {
            // URL prefixes
            $dataRouterProvider.apiPrefix('api/');

            // Error route
            $dataRouterProvider.error({
                templateUrl: 'error.html',
                dataAs: 'error'
            });

            // Routes
            $dataRouterProvider.when('application/x.example', {
                templateUrl: 'example.html',
                controller: 'ExampleCtrl'
            });
        });


TODO
====

* New directive datafragment
* Create simple demo app with nodejs server
* Create unit tests
* Usage in controllers and html
