"use strict";

/**
 * @ngdoc directive
 * @name mdvorakDataRouter.entryPointHref
 * @kind directive
 * @restrict AC
 * @priority 90
 * @element A
 *
 * @decription
 * Generates link to the application entry-point, that is root of the API. It produces same behavior as
 * calling `$location.path('/')`.
 *
 * Do not use in conjuction with `api-href` or `ng-href`.
 */
module.directive('entryPointHref', function entryPointHrefFactory($browser) {
    var baseHref = $browser.baseHref();

    return {
        restrict: 'AC',
        priority: 90,
        link: function entryPointHrefLink(scope, element, attrs) {
            attrs.$set('href', baseHref);
        }
    };
});