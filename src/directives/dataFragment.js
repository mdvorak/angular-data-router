"use strict";

module.directive('datafragment', function datafragmentFactory($dataRouterLoader, $animate, $log) {
    return {
        restrict: 'ECA',
        terminal: true,
        priority: 400,
        transclude: 'element',
        link: function datafragmentLink(scope, $element, attr, ctrl, $transclude) {
            var hrefExp = attr.datafragment || attr.src,
                currentScope,
                currentElement,
                previousLeaveAnimation,
                onloadExp = attr.onload || '';

            scope.$watch(hrefExp, updateHref);

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

            function updateHref(href) {
                var forceReload = attr.reload ? scope.$eval(attr.reload) : true;

                var next = attr.next = {};

                if (href) {
                    // Load data
                    $dataRouterLoader.prepareView(href, scope.$dataCurrent, forceReload).then(update, update);
                } else {
                    // Reset
                    update();
                }

                function update(response) {
                    if (next === attr.next) {
                        // Update current
                        scope.$dataCurrent = response;
                        attr.next = undefined;

                        // TODO support soft data reload

                        // Show view
                        var locals = response && response.locals,
                            template = locals && locals.$template;

                        if (angular.isDefined(template)) {
                            $log.debug("Setting fragment view to " + response.mediaType);

                            var newScope = scope.$new();

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

                            currentScope = response.scope = newScope;
                            currentScope.$eval(onloadExp);
                        } else {
                            $log.debug("Resetting fragment view, got no response");
                            cleanupLastView();
                        }
                    }
                }
            }
        }
    };
});

module.directive('datafragment', function datafragmentFillContentFactory($compile, $controller) {
    // This directive is called during the $transclude call of the first `ngView` directive.
    // It will replace and compile the content of the element with the loaded template.
    // We need this directive so that the element content is already filled when
    // the link function of another directive on the same element as ngView
    // is called.
    return {
        restrict: 'ECA',
        priority: -400,
        link: function datafragmentFillContentLink(scope, $element) {
            var current = scope.$dataCurrent;
            var view = current.view;
            var locals = current.locals;

            $element.html(locals.$template);

            var link = $compile($element.contents());

            if (view && view.controller) {
                locals.$scope = scope;
                var controller = $controller(view.controller, locals);

                if (view.controllerAs) {
                    scope[view.controllerAs] = controller;
                }

                $element.data('$ngControllerController', controller);
                $element.children().data('$ngControllerController', controller);
            }

            if (view && view.dataAs) {
                locals.$scope = scope;
                scope[view.dataAs] = current.data;

                // Listen for changes
                // TODO We need to create better abstraction for $routeData, which will be specific
                // TODO for given view, no matter whether main route or fragment, and usable by views controller.
                // TODO Methods like reload and url should be available there.
                // TODO Also consider, whether we want to support this, since it would create something like
                // TODO iframe. All links etc would be content relative.. It gets quite complex from there.
                // TODO But data update NEEDS to be supported.
                //$dataRouter.onRouteDataUpdated(function routeDataUpdated(data) {
                //    scope[view.dataAs] = data;
                //}, scope);
            }

            link(scope);
        }
    };
});
