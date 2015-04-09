"use strict";

/**
 * @ngdoc directive
 * @name mdvorakDataRouter.dataview
 * @restrict EAC
 *
 * @description
 * Renders the view for the given data. This directive works in two modes.
 *
 * * **Main view** - It displays current data, specified by browser location, and mapped to the resource by
 * {@link mdvorakDataApi.$dataApi#methods_mapViewToApi $dataApi.mapViewToApi()} method.
 * * **Custom view** - When `src` attribute is set, the data are loaded by this directive itself and displayed
 * according to the configured view.
 *
 * @param {expression=} src API URL to be displayed. If not set, main view is shown.
 * @param {expression=} autoscroll Whether dataview should call `$anchorScroll` to scroll the viewport after the view
 *                                 is updated. Applies only to the main view, that is, without the `src` attribute.
 * @param {expression=} onload Onload handler.
 * @param {expression=} name Name of the context, under which it will be published to the current scope. Works similar
 *                           to the name of the `form` directive.
 */
module.directive('dataview', function dataViewFactory($animate, $anchorScroll, $log, $parse, $dataRouterLoader, $dataRouter, $$dataRouterEventSupport) {
    return {
        restrict: 'EAC',
        terminal: true,
        priority: 400,
        transclude: 'element',
        link: function dataViewLink(scope, $element, attr, ctrl, $transclude) {
            var hrefExp = attr.src,
                currentHref,
                currentScope,
                currentElement,
                previousLeaveAnimation,
                autoScrollExp = attr.autoscroll,
                onloadExp = attr.onload || '';

            // Store context
            var context;

            if (attr.hasOwnProperty('src')) {
                // Custom context
                context = {
                    reload: reload
                };

                // Custom view - watch for href changes
                scope.$watch(hrefExp, function hrefWatch(href) {
                    currentHref = href;
                    reload(true);
                });
            }
            else {
                // Main view - use $dataRouter as context
                context = $dataRouter;

                // Show view on route change
                scope.$on('$routeChangeSuccess', showView);
            }

            // Publish
            if (attr.name) {
                $parse(attr.name).assign(scope, context);
            }

            // Implementation
            function cleanupLastView() {
                if (previousLeaveAnimation) {
                    $animate.cancel(previousLeaveAnimation);
                    previousLeaveAnimation = null;
                }

                if (currentScope) {
                    currentScope.$destroy();
                    currentScope = null;
                }
                if (currentElement) {
                    previousLeaveAnimation = $animate.leave(currentElement);
                    previousLeaveAnimation.then(function onDataviewLeave() {
                        previousLeaveAnimation = null;
                    });
                    currentElement = null;
                }
            }

            function showView() {
                // Show view
                var locals = context.current && context.current.locals,
                    template = locals && locals.$template;

                if (angular.isDefined(template)) {
                    $log.debug("Setting view ", $element[0], " to ", context.current.mediaType);

                    var newScope = scope.$new();
                    newScope.$$dataRouterCtx = context;

                    // Note: This will also link all children of ng-view that were contained in the original
                    // html. If that content contains controllers, ... they could pollute/change the scope.
                    // However, using ng-view on an element with additional content does not make sense...
                    // Note: We can't remove them in the cloneAttchFn of $transclude as that
                    // function is called before linking the content, which would apply child
                    // directives to non existing elements.
                    currentElement = $transclude(newScope, function cloneLinkingFn(clone) {
                        $animate.enter(clone, null, currentElement || $element).then(function onDataviewEnter() {
                            if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                                $anchorScroll();
                            }
                        });
                        cleanupLastView();
                    });

                    currentScope = context.current.scope = newScope;
                    currentScope.$eval(onloadExp);
                } else {
                    $log.debug("Resetting view ", $element[0], ", got no response");
                    cleanupLastView();
                }
            }

            /**
             * Loads the data from currentHref and shows the view.
             * Used when this directive shows custom URL and not the main view.
             *
             * @param forceReload {boolean=} Specifies whether view needs to be refreshed or just $routeUpdate event will be fired.
             */
            function reload(forceReload) {
                var next = attr.next = {};

                if (currentHref) {
                    // Load data
                    $log.debug("Loading view data of ", $element[0]);
                    $dataRouterLoader.prepareView(currentHref, context.current, forceReload).then(update, update);
                } else {
                    // Reset
                    update();
                }

                function update(response) {
                    if (next === attr.next) {
                        // Update view data
                        if (response && response.routeDataUpdate && context.current) {
                            $log.debug("Replacing view data of ", $element[0]);

                            // Update current (preserve listeners)
                            $$dataRouterEventSupport.$$extend(context.current, response);

                            // Fire event on the response (only safe way for both main view and fragments)
                            context.current.$broadcast('$routeUpdate', context.current);
                        } else {
                            // Update current
                            context.current = response;
                            attr.next = undefined;

                            // Add reload implementation
                            if (response) {
                                response.reload = reload;
                            }

                            // Show view
                            showView();
                        }
                    }
                }
            }
        }
    };
});

module.directive('dataview', function dataViewFillContentFactory($compile, $controller) {
    // This directive is called during the $transclude call of the first `dataView` directive.
    // It will replace and compile the content of the element with the loaded template.
    // We need this directive so that the element content is already filled when
    // the link function of another directive on the same element as dataView
    // is called.
    return {
        restrict: 'EAC',
        priority: -400,
        link: function dataViewFillContentLink(scope, $element) {
            var context = scope.$$dataRouterCtx; // Get context
            var current = context.current;
            var view = current.view;
            var locals = current.locals;

            // delete context from the scope
            delete scope.$$dataRouterCtx;

            // Compile
            $element.html(locals.$template);

            var link = $compile($element.contents());

            if (view) {
                $element.data('$dataResponse', current);

                if (view.controller) {
                    locals.$scope = scope;
                    var controller = $controller(view.controller, locals);

                    if (view.controllerAs) {
                        scope[view.controllerAs] = controller;
                    }

                    $element.data('$ngControllerController', controller);
                    $element.children().data('$ngControllerController', controller);
                }

                if (view.dataAs) {
                    scope[view.dataAs] = current.data;

                    current.$on('$routeUpdate', function routeDataUpdated(e, response) {
                        scope[view.dataAs] = response.data;
                    }, scope);
                }

                if (view.responseAs) {
                    scope[view.responseAs] = current;
                }
            }

            link(scope);
        }
    };
});
