/*
 @license (The MIT License)

 Copyright (c) 2014 Michal Dvorak <michal@mdvorak.org>

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 'Software'), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (angular) {
    "use strict";

    var module = angular.module('mdvorak.dataRouter', []);

    module.factory('$routeData', function routeDataFactory($rootScope) {
        var routeData = $rootScope.$new(true);

        // Auto-detachable listeners
        routeData.$on = function (name, listener, scope) {
            var remover = $rootScope.$on.call(routeData, name, listener);

            // Automatically detach listener
            if (scope) scope.$on('$destroy', remover);
            return remover;
        };

        /**
         * Attaches given scope to the service, causing event $routeDataUpdated to be propagated to it.
         *
         * @param scope {Scope} Scope that should be attached.
         */
        routeData.$attachScope = function (scope) {
            if (!scope) throw new Error("scope is required");

            return routeData.$on('$routeDataUpdated', function (e, data) {
                scope.$broadcast('$routeDataUpdated', data);
            }, scope);
        };

        return routeData;
    });

    module.provider('$dataRouterRegistry', function dataRouterRegistryProvider($logProvider, $$dataRouterMatchMap) {
        var provider = this;
        var views = provider.$$views = $$dataRouterMatchMap.create();
        var consoleLog = angular.bind(window.console, (window.console || {}).log || angular.noop); // Primitive safe logging

        /**
         * Configures view for given content type.
         * <p>
         * Note: Wildcard or function matchers are much slower then exact match. The are iterated one by one, in order of registration.
         * Exact string matchers takes always precedence over function matchers.
         *
         * @param mediaType {String|Function} Content type to match. When there is no / in the string, it is considered
         *                                   subtype of <code>application/</code> type. You should not include suffixes
         *                                   like <code>+json</code>, it is ignored by the matcher. Wildcards are supported.
         *                                   <p>
         *                                   It can be function with signature [Boolean] function([String]) as well.
         * @param config {Object} Configuration object, similar to ngRoute one. Allowed keys are:
         *                        <code>template, templateUrl, controller, controllerAs, dataAs, resolve</code>,
         *                        where either <code>template</code> or <code>templateUrl</code> must be specified.
         *                        <code>template</code> has precedence over <code>templateUrl</code>.
         *                        <code>controller</code> is optional. Can be either String reference or declaration
         *                        according to $injector rules. <code>resolve</code> is map of resolvables, that are
         *                        resolved before controller is created, and are injected into controller. Same behavior
         *                        as in ngRoute.
         */
        provider.when = function (mediaType, config) {
            // Make our copy
            config = angular.copy(config);

            if (angular.isFunction(mediaType)) {
                // Matcher function
                views.addMatcher(mediaType, config);

                if ($logProvider.debugEnabled()) {
                    consoleLog("Registered media type matcher " + mediaType.name, config);
                }
            } else {
                // Normalize mimeType
                mediaType = normalizeMediaType(mediaType);
                // Register
                views.addMatcher(mediaType, config);

                if ($logProvider.debugEnabled()) {
                    consoleLog("Registered media type " + mediaType, config);
                }
            }

            return provider;
        };

        /**
         * Configures view for error page. Displayed when resource or view template cannot be loaded.
         *
         * @param config {Object} Configuration object, as in #when().
         */
        provider.error = function (config) {
            views.addMatcher('$error', angular.copy(config));
            return provider;
        };

        // Factory
        this.$get = function () {
            return {
                RouteError: RouteError,
                normalizeMediaType: normalizeMediaType,

                match: function (mediaType) {
                    return views.match(mediaType);
                }
            };
        };
    });

    module.factory('$dataRouterLoader', function dataRouterLoaderProvider($sce, $http, $templateCache, $q, $injector, $dataRouterRegistry) {
        var dataRouterLoader = {
            RouteError: RouteError,
            normalizeMediaType: normalizeMediaType,

            loadData: function loadData(url) {
                // Fetch data and return promise
                return $http.get(url).then(function (response) {
                    // Match existing resource
                    var mediaType = normalizeMediaType(response.headers('Content-Type')) || 'text/plain';
                    var view = $dataRouterRegistry.match(mediaType);

                    // Unknown media type
                    if (!view) {
                        return $q.reject({
                            status: 999,
                            data: "Unknown content type " + mediaType,
                            config: response.config,
                            headers: angular.noop
                        });
                    }

                    // Success
                    return {
                        status: response.status,
                        headers: response.headers,
                        config: response.config,
                        mediaType: mediaType,
                        data: response.data,
                        view: view
                    };
                });
            },

            loadView: function loadView(response) {
                return $q.when(response).then(function (response) {
                    // Resolve view
                    if (response.view) {
                        // Prepare locals
                        var locals = angular.copy(response.view.resolve);
                        var template;

                        // Resolve locals
                        if (locals) {
                            angular.forEach(locals, function (value, key) {
                                locals[key] = angular.isString(value) ?
                                    $injector.get(value) : $injector.invoke(value);
                            });
                        } else {
                            locals = {};
                        }

                        // Load template
                        template = dataRouterLoader.$$loadTemplate(response.view);

                        if (angular.isDefined(template)) {
                            locals['$template'] = template;
                        }

                        return $q.all(locals).then(function (locals) {
                            // Built-in locals
                            locals.$data = response.data;
                            locals.$dataType = response.mediaType;
                            locals.$dataUrl = response.url;
                            locals.$dataResponse = response;

                            // Store locals and continue
                            response.locals = locals;
                            return response;
                        }, function () {
                            // Failure
                            return $q.reject({
                                status: 999,
                                data: "Failed to resolve view " + response.mediaType,
                                config: response.config,
                                headers: angular.noop
                            });
                        });
                    }

                    // Return original object
                    return response;
                });
            },

            $$loadTemplate: function loadTemplate(view) {
                // Ripped from ngRoute
                var template, templateUrl;

                if (angular.isDefined(template = view.template)) {
                    if (angular.isFunction(template)) {
                        template = template(view.params);
                    }
                } else if (angular.isDefined(templateUrl = view.templateUrl)) {
                    if (angular.isFunction(templateUrl)) {
                        templateUrl = templateUrl(view.params);
                    }

                    templateUrl = view.loadedTemplateUrl || $sce.getTrustedResourceUrl(templateUrl);

                    if (angular.isDefined(templateUrl)) {
                        view.loadedTemplateUrl = templateUrl;

                        template = $http.get(templateUrl, {cache: $templateCache}).
                            then(function (response) {
                                return response.data;
                            });
                    }
                }

                return template;
            }
        };

        return dataRouterLoader;
    });

    module.provider('$dataRouter', function dataRouterProvider($$dataRouterMatchMap, $dataRouterRegistryProvider) {
        var provider = this;
        var redirects = $$dataRouterMatchMap.create();

        /**
         * Api prefix variable. Do not modify directly, use accessor function.
         *
         * @type {string} Api prefix, relative to website base.
         * @protected
         */
        this.$apiPrefix = 'api/';

        /**
         * Configures prefix for default view to resource mapping.
         * Default is 'api/'.
         *
         * @param prefix {String} API url prefix, relative to website base.
         */
        this.apiPrefix = function (prefix) {
            // Always end with /
            if (prefix[prefix.length - 1] !== '/') {
                prefix += '/';
            }

            // Never start with /
            if (prefix[0] === '/') {
                prefix = prefix.substring(1);
            }

            provider.$apiPrefix = prefix;
        };

        /**
         * Maps view path to resource URL. Can be overriden during configuration.
         * By default it maps path to API one to one.
         * <p>
         * Opposite of #mapApiUrl().
         *
         * @param baseHref {String} Website base URL.
         * @param path {String} View path, as in $location.path().
         * @returns {String} Resource url, for e.g. HTTP requests.
         */
        this.mapViewPath = function mapPath(baseHref, path) {
            return joinUrl(baseHref, provider.$apiPrefix, path);
        };

        /**
         * Maps resource URL to view path. Can be overriden during configuration.
         * By default it maps APU url to view paths one to one.
         * <p>
         * Opposite of #mapViewPath().
         *
         * @param baseHref {String} Website base URL.
         * @param url {String} Resource url. Unless provider is configured otherwise, it must be inside API namespace.
         * @returns {String} View path.
         */
        this.mapApiUrl = function (baseHref, url) {
            if (baseHref[baseHref.length - 1] !== '/') {
                baseHref += '/';
            }

            if (url.indexOf(baseHref) === 0) {
                url = url.substring(baseHref.length);
            }

            // Always contains trailing /
            if (url.indexOf(provider.$apiPrefix) === 0) {
                return url.substring(3);
            }
        };

        /**
         * Configures view for given content type.
         * <p>
         * Note: Wildcard or function matchers are much slower then exact match. The are iterated one by one, in order of registration.
         * Exact string matchers takes always precedence over function matchers.
         *
         * @param mediaType {String|Function} Content type to match. When there is no / in the string, it is considered
         *                                   subtype of <code>application/</code> type. You should not include suffixes
         *                                   like <code>+json</code>, it is ignored by the matcher. Wildcards are supported.
         *                                   <p>
         *                                   It can be function with signature [Boolean] function([String]) as well.
         * @param config {Object} Configuration object, similar to ngRoute one. Allowed keys are:
         *                        <code>template, templateUrl, controller, controllerAs, dataAs, resolve</code>,
         *                        where either <code>template</code> or <code>templateUrl</code> must be specified.
         *                        <code>template</code> has precedence over <code>templateUrl</code>.
         *                        <code>controller</code> is optional. Can be either String reference or declaration
         *                        according to $injector rules. <code>resolve</code> is map of resolvables, that are
         *                        resolved before controller is created, and are injected into controller. Same behavior
         *                        as in ngRoute.
         */
        this.when = function (mediaType, config) {
            $dataRouterRegistryProvider.when(mediaType, config);
            return this;
        };

        /**
         * Configures view for error page. Displayed when resource or view template cannot be loaded.
         *
         * @param config {Object} Configuration object, as in #when().
         */
        this.error = function (config) {
            $dataRouterRegistryProvider.error(angular.copy(config));
            return this;
        };

        /**
         * Forces redirect from one view to another.
         *
         * @param path {String} View to force redirect on. Supports wildcards. Parameters are not supported
         * @param redirectTo {String} View path which should be redirected to.
         */
        this.redirect = function (path, redirectTo) {
            if (redirectTo) {
                redirects.addMatcher(path, redirectTo);
            }

            return this;
        };

        this.$get = function dataRouteFactory($log, $location, $rootScope, $q, $browser, $routeData, $dataRouterRegistry, $dataRouterLoader) {
            var baseHref = $browser.baseHref();

            var dataRoute = {
                normalizeMediaType: normalizeMediaType,

                /**
                 * Routing error.
                 *
                 * @param msg {String} Error message.
                 * @param status {Number} Response status code.
                 * @constructor
                 */
                RouteError: RouteError,

                /**
                 * Maps view path to resource URL.
                 * <p>
                 * Opposite of #mapApiUrl().
                 *
                 * @param path {String} View path, as in $location.path().
                 * @returns {String} Resource url, for e.g. HTTP requests.
                 */
                mapViewPath: function (path) {
                    return provider.mapViewPath(baseHref, path);
                },

                /**
                 * Maps resource URL to view path.
                 * <p>
                 * Opposite of #mapViewPath().
                 *
                 * @param url {String} Resource url. Unless provider is configured otherwise, it must be inside API namespace.
                 * @returns {String} View path.
                 */
                mapApiUrl: function (url) {
                    return provider.mapApiUrl(baseHref, url);
                },

                /**
                 * Returns true  if the type matches a registered view, false if we don't know how to view it.
                 *
                 * @param type {String} Matched content type.
                 * @returns {boolean} true if type is ahs registered view, false otherwise.
                 */
                isKnownType: function (type) {
                    return type && !!$dataRouterRegistry.match(normalizeMediaType(type));
                },

                /**
                 * Gets or sets current view resource url.
                 *
                 * @param url {String?} New resource url. Performs location change.
                 * @returns {String} Resource url that is being currently viewed.
                 */
                url: function (url) {
                    // Getter
                    if (arguments.length < 1) {
                        return dataRoute.mapViewPath($location.path());
                    }

                    // Setter
                    var path = dataRoute.mapApiUrl(url);

                    if (path) {
                        $location.path(path);
                        return url;
                    }
                },

                /**
                 * Reloads data at current location. If content type remains same, only data are refreshed,
                 * and $routeDataUpdated event is invoked on routeData object. If content type differs,
                 * full view refresh is performed (that is, controller is destroyed and recreated).
                 * <p>
                 * If you refresh only data, it is recommended to use routeData object instead of $data injector,
                 * and you must listen to $routeDataUpdated event to catch the change.
                 *
                 * @param forceReload {boolean} If true, page is always refreshed (controller recreated). Otherwise only
                 *                              when needed.
                 */
                reload: function reload(forceReload) {
                    var path = $location.path() || '/';
                    var redirectTo;
                    var url;
                    var next = dataRoute.next = {};

                    // Home redirect
                    if ((redirectTo = redirects.match(path))) {
                        $log.debug("Redirecting to " + redirectTo);
                        $location.path(redirectTo).replace();
                        return;
                    }

                    // Load resource
                    url = dataRoute.mapViewPath($location.path());
                    $log.debug("Loading resource " + url);

                    // Load data and view
                    $dataRouterLoader.loadData(url).then(function loadDataSuccess(response) {
                        // It is worth continuing?
                        if (dataRoute.next === next) {
                            // Check whether whole view needs to be refreshed
                            if (!forceReload && isSameView(dataRoute.current, response)) {
                                $log.debug("Replacing current data");

                                // Update current
                                dataRoute.next = undefined;
                                dataRoute.current = response;

                                // Update data
                                dataRoute.$$updateView(response);
                                $routeData.$emit('$routeDataUpdated', response.data);
                                return;
                            }

                            // Load view
                            return $dataRouterLoader.loadView(response);
                        }
                    }).then(showView, function loadError(response) {
                        // Error handler
                        if (dataRoute.next === next) {
                            // Load error view
                            response.mediaType = '$error';
                            return $dataRouterLoader.loadView(response);
                        }
                    }).then(showView, function noErrorView(response) {
                        // Error handler
                        if (dataRoute.next === next) {
                            // Show error view
                            $log.error("Failed to load view or data and no error view defined", response);
                            $rootScope.$emit('$routeChangeFailed');
                        }
                    });

                    function showView(response) {
                        if (dataRoute.next === next) {
                            // Update current
                            dataRoute.next = undefined;
                            dataRoute.current = response;

                            // Show view
                            dataRoute.$$setView(response);
                        }
                    }

                    function isSameView(current, next) {
                        return current && next && current.url === next.url && current.mediaType === next.mediaType;
                    }
                },

                $$updateView: function $$updateView(response) {
                    $routeData.data = response.data;
                    $routeData.type = response.mediaType;
                    $routeData.url = response.url;
                    $routeData.headers = response.headers;
                },

                /**
                 * Performs the view reload.
                 *
                 * @param response {Object} Next view config.
                 */
                $$setView: function $$setView(response) {
                    $log.debug("Setting view to " + response.mediaType);

                    // Update view data
                    dataRoute.$$updateView(response);

                    // Emit event
                    $rootScope.$emit('$routeChangeSuccess');
                }
            };

            $rootScope.$on('$locationChangeSuccess', function () {
                dataRoute.reload(true);
            });

            return dataRoute;
        };
    });

    module.directive('dataview', function dataviewFactory($dataRouter, $anchorScroll, $animate) {
        return {
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            link: function (scope, $element, attr, ctrl, $transclude) {
                var currentScope,
                    currentElement,
                    previousElement,
                    autoScrollExp = attr.autoscroll,
                    onloadExp = attr.onload || '';

                scope.$on('$routeChangeSuccess', update);
                update();

                function cleanupLastView() {
                    if (previousElement) {
                        previousElement.remove();
                        previousElement = null;
                    }
                    if (currentScope) {
                        currentScope.$destroy();
                        currentScope = null;
                    }
                    if (currentElement) {
                        $animate.leave(currentElement, function () {
                            previousElement = null;
                        });
                        previousElement = currentElement;
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
                            $animate.enter(clone, null, currentElement || $element, function onNgViewEnter() {
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
                }

                link(scope);
            }
        };
    });

    /**
     * Collection of matchers, both exact and matcher functions.
     * @constructor
     */
    function DataRouterMatchMap() {
        this.$exact = {};
        this.$matchers = [];

        this.addMatcher = function (pattern, data) {
            if (angular.isFunction(pattern)) {
                this.$matchers.push({
                    m: pattern,
                    d: data
                });
            } else if (pattern.indexOf('*') > -1) {
                // Register matcher
                this.$matchers.push({
                    m: wildcardMatcherFactory(pattern),
                    d: data
                });
            } else {
                // Exact match
                this.$exact[pattern] = data;
            }
        };

        this.match = function (s) {
            // Exact match
            var data = this.$exact[s], i, matchers;
            if (data) return data;

            // Iterate matcher functions
            for (matchers = this.$matchers, i = 0; i < matchers.length; i++) {
                if (matchers[i].m(s)) {
                    return matchers[i].d;
                }
            }
        };
    }

    module.constant('$$dataRouterMatchMap', {
        create: function create() {
            return new DataRouterMatchMap();
        }
    });

    // RouteError exception
    function RouteError(msg, status) {
        this.message = msg;
        this.status = status;
        this.stack = new Error().stack; // Includes ctor as well, byt better then nothing
    }

    RouteError.prototype = Object.create(Error.prototype);
    RouteError.prototype.name = 'RouteError';
    RouteError.prototype.constructor = RouteError;

    // Helper functions
    function joinUrl() {
        return Array.prototype.join.call(arguments, '/').replace(/\/+/g, '/');
    }

    function wildcardMatcherFactory(wildcard) {
        var pattern = new RegExp('^' + wildcardToRegex(wildcard) + '$');

        // Register matcher
        return function wildcardMatcher(s) {
            return pattern.test(s);
        };
    }

    function wildcardToRegex(s) {
        return s.replace(/([-()\[\]{}+?.$\^|,:#<!\\])/g, '\\$1').
            replace(/\x08/g, '\\x08').
            replace(/[*]+/, '.*');
    }

    function normalizeMediaType(mimeType) {
        if (!mimeType) return undefined;

        // Get rid of + end everything after
        mimeType = mimeType.replace(/\s*[\+;].*$/, '');

        // Prepend application/ if here is only subtype
        if (mimeType.indexOf('/') < 0) {
            mimeType = 'application/' + mimeType;
        }

        return mimeType;
    }
})(window.angular);
