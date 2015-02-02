"use strict";

module.directive('dataview', function dataViewFactory($animate, $log, $dataRouterLoader, $dataRouter) {
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
                onloadExp = attr.onload || '';

            // Store context
            var context;

            if (attr.hasOwnProperty('src')) {
                // Custom context
                context = {};

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
                    previousLeaveAnimation.then(function animLeave() {
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
                        $animate.enter(clone, null, currentElement || $element);
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
                        if (response.routeDataUpdate && context.current) {
                            $log.debug("Replacing view data of ", $element[0]);

                            // Update current (preserve listeners)
                            var $$listeners = context.current.$$listeners;
                            angular.extend(context.current, response);
                            context.current.$$listeners = $$listeners;

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
            delete context.$$dataRouterCtx;

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
            }

            link(scope);
        }
    };
});
