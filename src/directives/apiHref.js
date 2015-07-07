"use strict";

/**
 * @ngdoc directive
 * @name mdvorakDataRouter.apiHref
 * @kind directive
 * @restrict AC
 * @priority 90
 * @element A
 *
 * @param {expression} apiHref Any URL. Behavior changes whether this URL is inside API base or not.
 * @param {template=} type Optional. Media type of target resource. If the type is supported, navigation is performed, if not,
 *                         browser performs full redirect.
 *                         It is recommended to use `api-type` attribute, which is expression (same as `api-href` itself).
 * @param {template=} target Optional. Target of the link according to HTML specification. If it is specified, full redirect
 *                           is always performed. To force full reload instead of navigation, set this to `_self`.
 * @param {expression} apiType Wrapper around `type` attribute. It is here to avoid confusion, when `api-href` is expression
 *                             and `type` is template.
 *                             It is recommend way of setting view type.
 *
 * @description
 * Translates API URL into view URL and sets it as href. It is replacement for ngHref directive.
 * It supports HTML 5 mode as well hasbang mode.
 *
 * Following code sets href to `#/users/12347` or `users/12347` for html5Mode respectively.
 * ```html
 *     <a api-href="'api/users/12347;">User Detail</a>
 * ```
 *
 * @example
 * This example shows behavior of the directive in different scenarios.
 *
 * * **Back** navigates to parent, since its maps to configured API. The template for the given type is
 * prefetched. This link would behave same even without type attribute, but template would not be prefetched.
 * * **External** performs full navigation, since URL cannot be mapped to API. Type attribute is ignored in this case.
 * * **Image** link shows image full screen or triggers download (depends on the server), since the type is not supported.
 * If the type would not be set, data would be downloaded and error page would be shown afterwards.
 * * **New Window** opens the link in new window, regardless where it points, since it has target specified.
 * <example module="sample">
 * <file name="index.html">
 * <div ng-controller="sampleCtrl">
 *     <!-- href: api/some/parent type: application/x.example -->
 *     <a api-href="links.parent.href" type="{{links.parent.type}}">Back</a>
 *     <!-- href: external/url type: application/x.example -->
 *     <a api-href="links.external.href" api-type="links.external.type">Website</a>
 *     <!-- href: api/my/photo type: application/image.png -->
 *     <a api-href="links.image.href" api-type="links.image.type">Image</a>
 *     <!-- href: external/url type: application/x.example -->
 *     <a api-href="links.external.href" target="_blank">New Window</a>
 * </div>
 * </file>
 * <file name="controller.js">
 * angular.module('sample', ['mdvorakDataRouter'])
 *     .config(function ($dataRouterProvider) {
 *         $dataRouterProvider.apiPrefix('api/');
 *
 *         // application/x.example
 *         $dataRouterProvider.when('x.example', {
 *             templateUrl: 'example.html'
 *         });
 *     })
 *     .controller('sampleCtrl', function sampleCtrl($scope) {
 *         $scope.links = {
 *             parent: {href: "api/some/parent", type: "application/x.example"},
 *             external: {href: "external/url", type: "application/x.example"},
 *             image: {href: "api/my/photo", type: "application/image.png"}
 *         };
 *     });
 * </file>
 * </example>
 */
module.directive('apiHref', function apiHrefFactory($dataApi, $dataRouterRegistry, $dataRouterLoader, $location, $browser, $parse) {
    return {
        restrict: 'AC',
        priority: 90,
        link: function apiHrefLink(scope, element, attrs) {
            var hasTarget = 'target' in attrs;
            var apiHrefGetter = $parse(attrs.apiHref);

            function setHref(href, target) {
                attrs.$set('href', href);

                if (!hasTarget) {
                    attrs.$set('target', href ? target : null);
                }
            }

            function updateHref() {
                var href = apiHrefGetter(scope);

                // Do we have a type? And it is supported?
                if (attrs.type && !$dataRouterRegistry.isKnownType(attrs.type)) {
                    // If not, do not modify the URL
                    setHref(href, '_self');
                    return;
                }

                if (angular.isString(href)) {
                    // Map URL
                    var mappedHref = $dataApi.mapApiToView(href);

                    // Use URL directly
                    if (!angular.isString(mappedHref)) {
                        setHref(href, '_self');
                        return;
                    }

                    // Hashbang mode
                    if (!$location.$$html5) {
                        mappedHref = '#/' + mappedHref;
                    } else if (mappedHref === '') {
                        // HTML 5 mode and we are going to the base, so force it
                        // (it is special case, since href="" does not work with angular)
                        // In normal cases, browser handles relative URLs on its own
                        mappedHref = $browser.baseHref();
                    }

                    setHref(mappedHref, null);
                } else {
                    // Reset href
                    setHref();
                }
            }

            // Update href accordingly
            var offWatch = scope.$watch(attrs.apiHref, updateHref);
            element.on('$destroy', offWatch); // We don't have own scope, so don't rely on its destruction

            // Expression version of type attribute
            if (attrs.apiType) {
                scope.$watch(attrs.apiType, function (type) {
                    attrs.$set('type', type);
                });
            }

            // Watch for type attribute
            attrs.$observe('type', updateHref);

            // Click handler that prefetches templates
            element.on('click', function clickHandler() {
                // Invoke apply only if needed
                if (attrs.type && attrs.href) {
                    scope.$applyAsync(function applyCallback() {
                        // Race condition
                        if (attrs.type) {
                            $dataRouterLoader.prefetchTemplate(attrs.type);
                        }
                    });
                }
            });
        }
    };
});
