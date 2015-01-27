"use strict";

module.directive('dataview', function dataviewFactory($dataRouter, $anchorScroll, $animate) {
    return {
        restrict: 'ECA',
        terminal: true,
        priority: 400,
        transclude: 'element',
        link: function (scope, $element, attr, ctrl, $transclude) {
            var currentScope,
                currentElement,
                previousLeaveAnimation,
                autoScrollExp = attr.autoscroll,
                onloadExp = attr.onload || '';

            scope.$on('$routeChangeSuccess', update);
            update();

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
                    previousLeaveAnimation.then(function () {
                        previousLeaveAnimation = null;
                    });
                    currentElement = null;
                }
            }

            function update() {
                var locals = $dataRouter.current && $dataRouter.current.locals,
                    template = locals && locals.$template;

                if (angular.isDefined(template)) {
                    var newScope = scope.$new();
                    var current = $dataRouter.current;

                    // Note: This will also link all children of ng-view that were contained in the original
                    // html. If that content contains controllers, ... they could pollute/change the scope.
                    // However, using ng-view on an element with additional content does not make sense...
                    // Note: We can't remove them in the cloneAttchFn of $transclude as that
                    // function is called before linking the content, which would apply child
                    // directives to non existing elements.
                    currentElement = $transclude(newScope, function (clone) {
                        $animate.enter(clone, null, currentElement || $element).then(function onNgViewEnter() {
                            if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                                $anchorScroll();
                            }
                        });
                        cleanupLastView();
                    });

                    currentScope = current.scope = newScope;
                    currentScope.$emit('$viewContentLoaded');
                    currentScope.$eval(onloadExp);
                } else {
                    cleanupLastView();
                }
            }
        }
    };
});

module.directive('dataview', function dataviewFillContentFactory($compile, $controller, $dataRouter) {
    // This directive is called during the $transclude call of the first `ngView` directive.
    // It will replace and compile the content of the element with the loaded template.
    // We need this directive so that the element content is already filled when
    // the link function of another directive on the same element as ngView
    // is called.
    return {
        restrict: 'ECA',
        priority: -400,
        link: function (scope, $element) {
            var current = $dataRouter.current;
            var view = current ? current.view : undefined;
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
                $dataRouter.onRouteDataUpdated(function routeDataUpdated(data) {
                    scope[view.dataAs] = data;
                }, scope);
            }

            link(scope);
        }
    };
});
