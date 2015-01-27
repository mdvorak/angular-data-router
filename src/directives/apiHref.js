"use strict";

module.directive('apiHref', function apiHrefFactory($dataRouter, $dataRouterLoader, $location) {
    return {
        restrict: 'AC',
        link: function apiHrefLink(scope, element, attrs) {
            var hasTarget = 'target' in attrs;

            function setHref(href, target) {
                attrs.$set('href', href);

                if (!hasTarget) {
                    attrs.$set('target', href ? target : null);
                }
            }

            function updateHref() {
                // Do we have a type? And it is supported?
                if (attrs.type && !$dataRouter.isKnownType(attrs.type)) {
                    // If not, do not modify the URL
                    setHref(attrs.apiHref, '_self');
                    return;
                }

                // Map URL
                var href = $dataRouter.mapApiToView(attrs.apiHref);

                if (href) {
                    // Hashbang mode
                    if (!$location.$$html5) {
                        href = '#' + href;
                    }

                    setHref(href, null);
                } else {
                    // Use URL on its own
                    setHref(attrs.apiHref, '_self');
                }
            }

            // Update href accordingly
            attrs.$observe('apiHref', updateHref);

            // Don't watch for type if it is not defined at all
            if ('type' in attrs) {
                attrs.$observe('type', updateHref);

                element.on('click', function clickHandler() {
                    // Invoke apply only if needed
                    if (attrs.type) {
                        scope.$applyAsync(function applyCallback() {
                            // Race condition
                            if (attrs.type) {
                                $dataRouterLoader.prefetchTemplate(attrs.type);
                            }
                        });
                    }
                });
            }
        }
    };
});
