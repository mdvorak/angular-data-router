angular-data-router
==================

AngularJS routing engine that drive views by media types. It loads data itself, and by response Content-Type header
it displays configured view. From there, its very similar to original angular router.

Configuration
=============

Both HTML 5 mode and hashbang are supported, use $locationProvider for configuration.

Use $dataRouterProvider to configure register media types. Each type can be registered only once.
It supports wildcards like text/* and function matchers as well, which are evaluated in order of registration
(first wins), but exact match takes always precedence. Wildcard and function matchers are also much slower, since they
are evaluated until one is found.

If the media type is not supported, error view is shown. It is strongly recommended to configure error view, otherwise
only $routeChangeFailed event is fired and nothing else happens.

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

Controller
==========

There are several special locals provided to your controllers, that represent current data.

* $data - Currently loaded data for your view.
* $dataType - Media type of the payload.
* $dataUrl - URL used to retrieve the data. Useful when you need to PUT/POST/DELETE the resource. Note that if you want
to refresh the data, it is better to use $dataRouter.reload(false) method instead of reloading it yourself.
* $dataResponse - Full response object, which contains extensions like view property, containing current view configuration. Do not modify!


