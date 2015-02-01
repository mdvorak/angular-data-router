/*
 The MIT License

 Copyright (c) 2015 Michal Dvorak <michal@mdvorak.org>, https://github.com/mdvorak/angular-data-router

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

(function dataRouterModule(angular) {
    "use strict";

    var module = angular.module("mdvorakDataRouter", ['mdvorakApiMap']);

    module.provider('$dataRouterRegistry', ["$$dataRouterMatchMap", function $dataRouterRegistryProvider($$dataRouterMatchMap) {
        var provider = this;
        var views = provider.$$views = $$dataRouterMatchMap.create();

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
        provider.when = function when(mediaType, config) {
            // Make our copy
            config = angular.copy(config);

            if (angular.isFunction(mediaType)) {
                // Matcher function
                views.addMatcher(mediaType, config);
            } else {
                // Normalize mimeType
                mediaType = provider.normalizeMediaType(mediaType);
                // Register
                views.addMatcher(mediaType, config);
            }

            return provider;
        };

        /**
         * Configures view for error page. Displayed when resource or view template cannot be loaded.
         *
         * @param config {Object} Configuration object, as in #when().
         */
        provider.error = function error(config) {
            views.addMatcher('$error', angular.copy(config));
            return provider;
        };

        /**
         * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
         * just subtype.
         *
         * @param mimeType {String} Media type to match.
         * @returns {String} Normalized media type.
         */
        provider.normalizeMediaType = function normalizeMediaType(mimeType) {
            if (!mimeType) return null;

            // Get rid of + end everything after
            mimeType = mimeType.replace(/\s*[\+;].*$/, '');

            // Prepend application/ if here is only subtype
            if (mimeType.indexOf('/') < 0) {
                mimeType = 'application/' + mimeType;
            }

            return mimeType;
        };

        // Factory
        this.$get = function $dataRouterRegistryFactory() {
            return {
                /**
                 * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
                 * just subtype.
                 *
                 * @param mimeType {String} Media type to match.
                 * @returns {String} Normalized media type.
                 */
                normalizeMediaType: provider.normalizeMediaType,

                /**
                 * Matches the media type against registered media types. If found, view configuration is return.
                 *
                 * @param mediaType {String} Media type to be matched. It *MUST* be normalized, it is compared as is.
                 * @returns {Object} Matched view or undefined. Note that original configuration object will be returned,
                 *                   so don't modify it!
                 */
                match: function match(mediaType) {
                    return views.match(mediaType);
                },

                /**
                 * Returns true  if the type matches a registered view, false if we don't know how to view it.
                 *
                 * @param mediaType {String} Matched content type. Doesn't have to be normalized.
                 * @returns {boolean} true if type is ahs registered view, false otherwise.
                 */
                isKnownType: function isKnownType(mediaType) {
                    return mediaType && !!this.match(provider.normalizeMediaType(mediaType));
                }
            };
        };
    }]);

    module.provider('$dataRouterLoader', function dataRouterLoaderProvider() {
        var provider = this;

        /**
         * Sets global configuration for all routes.
         *
         * @param config {Object} Configuration object. Currently only "resolve" key is supported.
         * @returns {Object} Reference to the provider.
         */
        provider.global = function global(config) {
            if (!config) return provider;

            if (angular.isObject(config.resolve)) {
                provider.$globalResolve = angular.extend(provider.$globalResolve || {}, config.resolve);
            }

            return provider;
        };

        this.$get = ["$log", "$sce", "$http", "$templateCache", "$q", "$injector", "$rootScope", "$dataRouterRegistry", "$$dataRouterEventSupport", function $dataRouterLoaderFactory($log, $sce, $http, $templateCache, $q, $injector, $rootScope, $dataRouterRegistry, $$dataRouterEventSupport) {
            var $dataRouterLoader = {
                /**
                 * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
                 * just subtype.
                 *
                 * @param mimeType {String} Media type to match.
                 * @returns {String} Normalized media type.
                 */
                normalizeMediaType: $dataRouterRegistry.normalizeMediaType,

                /**
                 * Eagerly fetches the template for the given media type. If media type is unknown, nothing happens.
                 * This method returns immediately, no promise is returned.
                 *
                 * @param mediaType {String} Media type for which we want to prefetch the template.
                 */
                prefetchTemplate: function prefetchTemplate(mediaType) {
                    var view = $dataRouterRegistry.match(mediaType);

                    if (view) {
                        $log.debug("Pre-fetching template for " + mediaType);
                        $dataRouterLoader.$$loadTemplate(view, mediaType);
                    } else {
                        $log.debug("Cannot prefetch template for " + mediaType + ", type is not registered");
                    }
                },

                /**
                 * Prepares the view to be displayed. Loads data from given URL, resolves view by its content type,
                 * and then finally resolves template and all other resolvables.
                 *
                 * @param url {String} URL of the data to be fetched. They are always loaded using GET method.
                 * @param current {Object?} Current response data. If provided and forceReload is false, routeDataUpdate flag
                 *                          of the response may be set, indicating that view doesn't have to be reloaded.
                 * @param forceReload {boolean?} When false, it allows just data update. Without current parameter does nothing.
                 * @returns {Object} Promise of completely initialized response, including template and locals.
                 */
                prepareView: function prepareView(url, current, forceReload) {
                    // Load data and view
                    return $dataRouterLoader.$$loadData(url)
                        .then(loadDataSuccess)
                        .then(null, loadError); // This must be in the chain after loadDataSuccess

                    // Note: We are not chaining promises directly, instead we are returning them,
                    // which works in the end the same. However, the chain is shorter in case of failure.

                    function loadDataSuccess(response) {
                        // It is worth continuing?
                        // Check whether whole view needs to be refreshed
                        if (!forceReload && isSameView(current, response)) {
                            // Update data
                            response.routeDataUpdate = true;
                            return response;
                        }

                        // Load view
                        return $dataRouterLoader.$$loadView(response);
                    }

                    function loadError(response) {
                        // Load error view
                        response.mediaType = '$error';
                        response.view = $dataRouterRegistry.match('$error');
                        response.routeError = true;

                        if (response.view) {
                            return $dataRouterLoader.$$loadView(response);
                        } else {
                            return $q.reject(response);
                        }
                    }

                    function isSameView(current, next) {
                        return current && next && current.url === next.url && current.mediaType === next.mediaType;
                    }
                },

                /**
                 * Loads view data from given URL.
                 * Tries to automatically match the view by the data Content-Type header.
                 * If the view is found, and transformResponse key is set, response is automatically resolved.
                 *
                 * @param url {String} URL to load data from. They are always loaded using GET method.
                 * @returns {Object} Promise of the response.
                 */
                $$loadData: function $$loadData(url) {
                    $log.debug("Loading resource " + url);

                    // Fetch data and return promise
                    return $http.get(url).then(function dataLoaded(response) {
                        // Match existing resource
                        var mediaType = $dataRouterRegistry.normalizeMediaType(response.headers('Content-Type')) || 'text/plain';
                        var view = $dataRouterRegistry.match(mediaType);

                        // Unknown media type
                        if (!view) {
                            return $q.reject(asResponse({
                                status: 999,
                                statusText: "Application Error",
                                data: "Unknown content type " + mediaType,
                                config: response.config,
                                headers: angular.noop
                            }));
                        }

                        // Success
                        var result = {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                            config: response.config,
                            mediaType: mediaType,
                            data: response.data,
                            view: view
                        };

                        if (view.transformResponse) {
                            result.originalData = response.data;
                            return asResponse(view.transformResponse(result));
                        } else {
                            return asResponse(result);
                        }
                    });
                },

                /**
                 * Loads view template and initializes resolves.
                 *
                 * @param response {Object} Loaded data response. Can be promise.
                 * @returns {Object} Promise of loaded view. Promise is rejected if any of locals or template fails to resolve.
                 */
                $$loadView: function $$loadView(response) {
                    return $q.when(response).then(function responseReady(response) {
                        // Resolve view
                        if (response.view) {
                            // Prepare locals
                            var locals = angular.extend({}, provider.$globalResolve, response.view.resolve);
                            var template;

                            // Built-in locals
                            var builtInLocals = {
                                $data: response.data,
                                $dataType: response.mediaType,
                                $dataUrl: response.config.url,
                                $dataResponse: response
                            };

                            // Resolve locals
                            if (locals) {
                                angular.forEach(locals, function resolveLocal(value, key) {
                                    locals[key] = angular.isString(value) ?
                                        $injector.get(value) : $injector.invoke(value, '$dataRouterLoader', builtInLocals);
                                });
                            } else {
                                locals = {};
                            }

                            // Load template
                            template = $dataRouterLoader.$$loadTemplate(response.view, response.mediaType);

                            if (angular.isDefined(template)) {
                                locals['$template'] = template;
                            }

                            return $q.all(locals).then(function localsLoaded(locals) {
                                // Built-in locals
                                angular.extend(locals, builtInLocals);

                                // Store locals and continue
                                response.locals = locals;
                                return response;
                            }, function localsError() {
                                // Failure
                                return $q.reject(asResponse({
                                    status: 999,
                                    statusText: "Application Error",
                                    data: "Failed to resolve view " + response.mediaType,
                                    config: response.config,
                                    headers: angular.noop
                                }));
                            });
                        }

                        // Return original object
                        return response;
                    });
                },

                $$loadTemplate: function $$loadTemplate(view, mediaType) {
                    // Ripped from ngRoute
                    var template, templateUrl;

                    if (angular.isDefined(template = view.template)) {
                        if (angular.isFunction(template)) {
                            template = template(mediaType);
                        }
                    } else if (angular.isDefined(templateUrl = view.templateUrl)) {
                        if (angular.isFunction(templateUrl)) {
                            templateUrl = templateUrl(mediaType);
                        }

                        templateUrl = view.loadedTemplateUrl || $sce.getTrustedResourceUrl(templateUrl);

                        if (angular.isDefined(templateUrl)) {
                            view.loadedTemplateUrl = templateUrl;

                            template = $http.get(templateUrl, {
                                cache: $templateCache
                            }).then(function templateLoaded(response) {
                                return response.data;
                            });
                        }
                    }

                    return template;
                }
            };

            return $dataRouterLoader;

            // Converter function
            function asResponse(response) {
                return angular.extend($$dataRouterEventSupport.$new(), response);
            }
        }];
    });

    module.provider('$dataRouter', ["$$dataRouterMatchMap", "$dataRouterRegistryProvider", "$dataRouterLoaderProvider", "$apiMapProvider", function $dataRouterProvider($$dataRouterMatchMap, $dataRouterRegistryProvider, $dataRouterLoaderProvider, $apiMapProvider) {
        var provider = this;

        /**
         * Enables the router. May be used to disable the router event handling. Cannot be changed after config phase.
         * @type {boolean}
         */
        provider.$enabled = true;

        /**
         * Map of redirects. Do not modify directly, use redirect function.
         * @type {Object}
         */
        provider.$redirects = $$dataRouterMatchMap.create();

        /**
         * Configures prefix for default view to resource mapping.
         *
         * @param prefix {String} Relative URL prefix, relative to base href.
         * @return {String} API URL prefix. It's absolute URL, includes base href.
         */
        provider.apiPrefix = function apiPrefix(prefix) {
            return $apiMapProvider.prefix(prefix);
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
         * @returns {Object} Returns provider.
         */
        provider.when = function when(mediaType, config) {
            $dataRouterRegistryProvider.when(mediaType, config);
            return provider;
        };

        /**
         * Configures view for error page. Displayed when resource or view template cannot be loaded.
         *
         * @param config {Object} Configuration object, as in #when().
         * @returns {Object} Returns provider.
         */
        provider.error = function error(config) {
            $dataRouterRegistryProvider.error(angular.copy(config));
            return provider;
        };

        /**
         * Forces redirect from one view to another.
         *
         * @param path {String} View to force redirect on. Supports wildcards. Parameters are not supported
         * @param redirectTo {String} View path which should be redirected to.
         * @returns {Object} Returns provider.
         */
        provider.redirect = function redirect(path, redirectTo) {
            if (redirectTo) {
                provider.$redirects.addMatcher(path, redirectTo);
            }

            return provider;
        };

        /**
         * Sets global router configuration, applicable for all routes.<br>
         * Currently only resolve is supported.
         *
         * @param config {Object} Configuration object. Only resolve key is currently supported.
         * @returns {Object} Returns provider.
         */
        provider.global = function global(config) {
            $dataRouterLoaderProvider.global(config);
            return provider;
        };

        /**
         * Enables  or disables the router. May be used to disable the router event handling.
         * Cannot be changed after config phase.
         *
         * This method is intended mostly for unit tests.
         *
         * Enabled by default.
         *
         * @param enabled {boolean} false to disable the router.
         * @returns {Object} Returns provider.
         */
        provider.enabled = function enabledFn(enabled) {
            provider.$enabled = !!enabled;
            return provider;
        };

        this.$get = ["$log", "$location", "$rootScope", "$q", "$dataRouterRegistry", "$dataRouterLoader", "$apiMap", function $dataRouterFactory($log, $location, $rootScope, $q, $dataRouterRegistry, $dataRouterLoader, $apiMap) {
            var $dataRouter = {
                /**
                 * Reference to the $apiMap object.
                 */
                api: $apiMap,

                /**
                 * Reference to the $dataRouterRegistry object.
                 */
                registry: $dataRouterRegistry,

                /**
                 * Reloads data at current location. If content type remains same, only data are refreshed,
                 * and $routeUpdate event is invoked on $dataResponse object. If content type differs,
                 * full view refresh is performed (that is, controller is destroyed and recreated).
                 * <p>
                 * If you refresh data, you must listen to the $routeUpdate event on $dataResponse object to be notified of the change.
                 *
                 * @param forceReload {boolean?} If true, page is always refreshed (controller recreated). Otherwise only
                 *                               when needed.
                 */
                reload: function reload(forceReload) {
                    var path = $location.path() || '/';
                    var redirectTo;
                    var url;
                    var next = $dataRouter.$$next = {};

                    // Home redirect
                    if ((redirectTo = provider.$redirects.match(path))) {
                        $log.debug("Redirecting to " + redirectTo);
                        $location.path(redirectTo).replace();
                        return;
                    }

                    // Load resource
                    url = $apiMap.mapViewToApi($location.path());

                    // Load data and view
                    $log.debug("Loading main view");
                    $dataRouterLoader.prepareView(url, $dataRouter.current, forceReload)
                        .then(showView, routeChangeFailed);

                    // Promise resolutions
                    function showView(response) {
                        if ($dataRouter.$$next === next) {
                            // Remove marker
                            $dataRouter.$$next = undefined;

                            // Update view data
                            if (response.routeDataUpdate && $dataRouter.current) {
                                $log.debug("Replacing current data");

                                // Update current (preserve listeners)
                                var $$listeners = $dataRouter.current.$$listeners;
                                angular.extend($dataRouter.current, response);
                                $dataRouter.current.$$listeners = $$listeners;

                                // Fire event on the response (only safe way for both main view and fragments)
                                $dataRouter.current.$broadcast('$routeUpdate', $dataRouter.current);
                            } else {
                                $log.debug("Setting view to " + response.mediaType);

                                // Add reload implementation
                                response.reload = $dataRouter.reload;

                                // Set current
                                $dataRouter.current = response;

                                // Emit event
                                $rootScope.$broadcast('$routeChangeSuccess', response);
                            }
                        }
                    }

                    function routeChangeFailed(response) {
                        // Error handler
                        if ($dataRouter.$$next === next) {
                            // Remove next, but don't update current
                            $dataRouter.$$next = undefined;

                            // Show error view
                            $log.error("Failed to load view or data and no error view defined", response);
                            $rootScope.$broadcast('$routeChangeError', response);
                        }
                    }
                }
            };

            if (provider.$enabled) {
                // Broadcast $routeChangeStart and cancel location change if it is prevented
                $rootScope.$on('$locationChangeStart', function locationChangeStart($locationEvent) {
                    if ($rootScope.$broadcast('$routeChangeStart').defaultPrevented) {
                        if ($locationEvent) {
                            $locationEvent.preventDefault();
                        }
                    }
                });

                // Reload view on location change
                $rootScope.$on('$locationChangeSuccess', function locationChangeSuccess() {
                    $dataRouter.reload(true);
                });
            }

            return $dataRouter;
        }];
    }]);

    // Note: It is constant so it can be used during config phase
    module.constant('$$dataRouterMatchMap', {
        create: function create() {
            return new DataRouterMatchMap();
        }
    });

    /**
     * Collection of matchers, both exact and matcher functions.
     * @constructor
     */
    function DataRouterMatchMap() {
        this.$exact = {};
        this.$matchers = [];

        this.addMatcher = function addMatcher(pattern, data) {
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

        this.match = function match(s) {
            // Exact match
            var data = this.$exact[s],
                i, matchers;
            if (data) return data;

            // Iterate matcher functions
            for (matchers = this.$matchers, i = 0; i < matchers.length; i++) {
                if (matchers[i].m(s)) {
                    return matchers[i].d;
                }
            }
        };

        // Helper functions
        function wildcardMatcherFactory(wildcard) {
            var pattern = new RegExp('^' + wildcardToRegex(wildcard) + '$');

            // Register matcher
            return function wildcardMatcher(s) {
                return pattern.test(s);
            };
        }

        function wildcardToRegex(s) {
            return s.replace(/([-()\[\]{}+?.$\^|,:#<!\\])/g, '\\$1')
                .replace(/\x08/g, '\\x08')
                .replace(/[*]+/, '.*');
        }
    }

    module.factory('$$dataRouterEventSupport', ["$exceptionHandler", function dataRouterEventSupportFactory($exceptionHandler) {
        var slice = [].slice;

        // This code is ripped of Scope class
        function EventSupport() {}

        EventSupport.$new = function() {
            return new EventSupport();
        };

        EventSupport.prototype = {
            constructor: EventSupport,

            $on: function(name, listener, scope) {
                if (!this.$$listeners) this.$$listeners = {};

                var namedListeners = this.$$listeners[name];
                if (!namedListeners) {
                    namedListeners = this.$$listeners[name] = [listener];
                } else {
                    namedListeners.push(listener);
                }

                // Remove function
                var remove = function removeFn() {
                    var indexOfListener = namedListeners.indexOf(listener);
                    if (indexOfListener !== -1) {
                        namedListeners[indexOfListener] = null;
                    }
                };

                if (scope) {
                    var removeDestroy = scope.$on('$destroy', remove);

                    return function combinedRemove() {
                        remove();
                        removeDestroy();
                    };
                } else {
                    return remove;
                }
            },

            $broadcast: function(name, args) {
                var event = {
                    name: name,
                    preventDefault: function() {
                        event.defaultPrevented = true;
                    },
                    defaultPrevented: false
                };

                var listeners = (this.$$listeners && this.$$listeners[name]) || [];
                var i, length;

                // Prepare arguments
                args = [event].concat(slice.call(arguments, 1));

                for (i = 0, length = listeners.length; i < length; i++) {
                    // if listeners were deregistered, defragment the array
                    if (!listeners[i]) {
                        listeners.splice(i, 1);
                        i--;
                        length--;
                        continue;
                    }

                    try {
                        listeners[i].apply(null, args);
                    } catch (e) {
                        $exceptionHandler(e);
                    }
                }

                return event;
            }
        };

        return EventSupport;
    }]);
    /**
     * @ngdoc directive
     * @module mdvorakDataRouter
     * @name apiHref
     * @restrict AC
     * @priority 90
     * @element A
     *
     * @param {template} apiHref Any URL. Behavior changes whether this URL is inside API base or not.
     * @param {template} type Optional. Media type of target resource. If the type is supported, navigation is performed, if not,
     *                         browser performs full redirect.
     * @param {template} target Optional. Target of the link according to HTML specification. If it is specified, full redirect
     *                           is always performed. To force full reload instead of navigation, set this to `_self`.
     *
     * @description
     * Translates API URL into view URL and sets it as href. It is replacement for ngHref directive.
     * It supports HTML 5 mode as well hasbang mode.
     *
     * Following code sets href to `#/users/12347` or `users/12347` for html5Mode respectively.
     * ```html
     *     <a api-href="api/users/12347">User Detail</a>
     * ```
     *
     * @example
     * This example shows behavior of the directive in different scenarios.
     *
     * * Back button navigates to parent, since its maps to configured API. The template for the given type is
     * prefetched. This link would behave same even without type attribute, but template would not be prefetched.
     * * External performs full navigation, since URL cannot be mapped to API. Type attribute is ignored in this case.
     * * Image link shows image full screen or triggers download (depends on the server), since the type is not supported.
     * If the type would not be set, data would be downloaded and error page would be shown afterwards.
     * * New Window opens the link in new window, regardless where it points, since it has target specified.
     * <example module="sample">
     * <file name="index.html">
     * <div ng-controller="sampleCtrl">
     *     <!-- href: api/some/parent type: application/x.example -->
     *     <a api-href="{{links.parent.href}}" type="{{links.parent.type}}">Back</a>
     *     <!-- href: external/url type: application/x.example -->
     *     <a api-href="{{links.external.href}}" type="{{links.external.type}}">Website</a>
     *     <!-- href: api/my/photo type: image/png -->
     *     <a api-href="{{links.image.href}}" type="{{links.image.type}}">Image</a>
     *     <!-- href: external/url type: application/x.example -->
     *     <a api-href="{{links.external.href}}" target="_blank">New Window</a>
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
     *             image: {href: "api/my/photo", type: "image/png"}
     *         };
     *     });
     * </file>
     * </example>
     */
    module.directive('apiHref', ["$apiMap", "$dataRouterRegistry", "$dataRouterLoader", "$location", "$browser", function apiHrefFactory($apiMap, $dataRouterRegistry, $dataRouterLoader, $location, $browser) {
        return {
            restrict: 'AC',
            priority: 90,
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
                    if (attrs.type && !$dataRouterRegistry.isKnownType(attrs.type)) {
                        // If not, do not modify the URL
                        setHref(attrs.apiHref, '_self');
                        return;
                    }

                    // Map URL
                    var href = $apiMap.mapApiToView(attrs.apiHref);

                    if (angular.isString(href)) {
                        // Hashbang mode
                        if (!$location.$$html5) {
                            href = '#/' + href;
                        } else if (href === '') {
                            // HTML 5 mode and we are going to the base, so force it
                            // (it is special case, since href="" obviously does not work)
                            // In normal cases, browser handles relative URLs on its own
                            href = $browser.baseHref();
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
    }]);

    module.directive('datafragment', ["$dataRouterLoader", "$animate", "$log", function datafragmentFactory($dataRouterLoader, $animate, $log) {
        return {
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            link: function datafragmentLink(scope, $element, attr, ctrl, $transclude) {
                var hrefExp = attr.datafragment || attr.src,
                    currentHref,
                    currentScope,
                    currentElement,
                    previousLeaveAnimation,
                    onloadExp = attr.onload || '';

                // Store context
                var context = scope.$$dataRouterCtx = {};

                // Watch for href changes
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
                    currentHref = href;
                    reload(true);
                }

                function reload(forceReload) {
                    var next = attr.next = {};

                    if (currentHref) {
                        // Load data
                        $log.debug("Loading fragment view for ", $element[0]);
                        $dataRouterLoader.prepareView(currentHref, context.current, forceReload).then(update, update);
                    } else {
                        // Reset
                        update();
                    }

                    function update(response) {
                        if (next === attr.next) {
                            // Update view data
                            if (response.routeDataUpdate && context.current) {
                                $log.debug("Replacing fragments data");

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

                                // Show view
                                var locals = response && response.locals,
                                    template = locals && locals.$template;

                                if (angular.isDefined(template)) {
                                    $log.debug("Setting fragment view to " + response.mediaType);

                                    // Add reload implementation
                                    response.reload = reload;

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
            }
        };
    }]);

    module.directive('datafragment', ["$compile", "$controller", function datafragmentFillContentFactory($compile, $controller) {
        // This directive is called during the $transclude call of the first `ngView` directive.
        // It will replace and compile the content of the element with the loaded template.
        // We need this directive so that the element content is already filled when
        // the link function of another directive on the same element as ngView
        // is called.
        return {
            restrict: 'ECA',
            priority: -400,
            link: function datafragmentFillContentLink(scope, $element) {
                var context = scope.$$dataRouterCtx; // Get context
                var current = context.current;
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

                    current.$on('$routeUpdate', function routeDataUpdated(e, response) {
                        scope[view.dataAs] = response.data;
                    }, scope);
                }

                link(scope);
            }
        };
    }]);

    module.directive('dataview', ["$dataRouter", "$anchorScroll", "$animate", function dataviewFactory($dataRouter, $anchorScroll, $animate) {
        return {
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            link: function dataviewLink(scope, $element, attr, ctrl, $transclude) {
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
                        previousLeaveAnimation.then(function animLeave() {
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
                        currentElement = $transclude(newScope, function cloneLinkingFn(clone) {
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
    }]);

    module.directive('dataview', ["$compile", "$controller", "$dataRouter", function dataviewFillContentFactory($compile, $controller, $dataRouter) {
        // This directive is called during the $transclude call of the first `ngView` directive.
        // It will replace and compile the content of the element with the loaded template.
        // We need this directive so that the element content is already filled when
        // the link function of another directive on the same element as ngView
        // is called.
        return {
            restrict: 'ECA',
            priority: -400,
            link: function dataviewFillContentLink(scope, $element) {
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
                    current.$on('$routeUpdate', function routeDataUpdated(e, response) {
                        scope[view.dataAs] = response.data;
                    }, scope);
                }

                link(scope);
            }
        };
    }]);

    angular.module('mdvorakApiMap', []).provider('$apiMap', function $apiMapProvider() {
        var provider = this;
        // Intentionally using document object instead of $document
        var urlParsingNode = document.createElement("A");

        /**
         * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
         *
         * @param href {String} URL to be normalized. Can be absolute, server-relative or context relative.
         * @returns {String} Normalized URL, including full hostname.
         */
        provider.normalizeUrl = function normalizeUrl(href) {
            if (href === '') {
                // Special case - browser interprets empty string as current URL, while we need
                // what it considers a base if no base href is given.
                // Add /X to the path and then remove it.
                urlParsingNode.setAttribute("href", 'X');
                return urlParsingNode.href.replace(/X$/, '');
            } else if (href) {
                // Normalize thru href property
                urlParsingNode.setAttribute("href", href);
                return urlParsingNode.href;
            }

            // Empty
            return null;
        };

        /**
         * Api prefix variable. Do not modify directly, use accessor function.
         *
         * @type {string}
         * @protected
         */
        provider.$apiPrefix = provider.normalizeUrl('');

        /**
         * Configures prefix for default view to resource mapping.
         *
         * @param prefix {String} Relative URL prefix, relative to base href.
         * @return {String} API URL prefix. It's absolute URL, includes base href.
         */
        provider.prefix = function prefixFn(prefix) {
            if (arguments.length > 0) {
                provider.$apiPrefix = provider.normalizeUrl(prefix);
            }

            return provider.$apiPrefix;
        };

        /**
         * Maps view path to resource URL. Can be overridden during configuration.
         * By default it maps path to API one to one.
         * <p>
         * Counterpart to #mapApiToView(). If you override one, override the other as well.
         *
         * @param path {String} View path, as in $location.path().
         * @returns {String} Resource url, for e.g. HTTP requests.
         */
        provider.mapViewToApi = function mapViewToApi(path) {
            // Path should always begin with slash, remove it
            if (path && path[0] === '/') {
                path = path.substring(1);
            }

            // Join
            // Note: API prefix MUST end with a slash, otherwise it will work as configured, which is most likely wrong.
            return provider.$apiPrefix + path;
        };

        /**
         * Maps resource URL to view path. Can be overridden during configuration.
         * By default it maps APU url to view paths one to one.
         * <p>
         * Counterpart to #mapViewToApi(). If you override one, override the other as well.
         *
         * @param url {String} Resource url. Unless provider is configured otherwise, it must be inside API namespace.
         * @returns {String} View path.
         */
        provider.mapApiToView = function mapApiToView(url) {
            // Normalize
            url = provider.normalizeUrl(url);

            if (url && url.indexOf(provider.$apiPrefix) === 0) {
                return url.substring(provider.$apiPrefix.length);
            }

            // Unable to map
            return null;
        };

        this.$get = ["$log", "$location", function $apiMapFactory($log, $location) {
            $log.debug("Using API prefix " + provider.$apiPrefix);

            var $apiMap = {
                /**
                 * Returns configured API prefix.
                 *
                 * @return {String} API URL prefix. It's absolute URL, includes base href.
                 */
                apiPrefix: function apiPrefix() {
                    return provider.apiPrefix();
                },

                /**
                 * Maps view path to resource URL. Can be overridden during configuration.
                 * By default it maps path to API one to one.
                 * <p>
                 * Counterpart to #mapApiToView(). If you override one, override the other as well.
                 *
                 * @param path {String} View path, as in $location.path().
                 * @returns {String} Resource url, for e.g. HTTP requests.
                 */
                mapViewToApi: function mapViewToApi(path) {
                    return provider.mapViewToApi(path);
                },


                /**
                 * Maps resource URL to view path. Can be overridden during configuration.
                 * By default it maps APU url to view paths one to one.
                 * <p>
                 * Counterpart to #mapViewToApi(). If you override one, override the other as well.
                 *
                 * @param url {String} Resource url. Unless provider is configured otherwise, it must be inside API namespace.
                 * @returns {String} View path.
                 */
                mapApiToView: function mapApiToView(url) {
                    return provider.mapApiToView(url);
                },

                /**
                 * Gets or sets current view resource url.
                 *
                 * @param url {String?} New resource url. Performs location change.
                 * @returns {String} Resource url that is being currently viewed.
                 */
                url: function urlFn(url) {
                    // Getter
                    if (arguments.length < 1) {
                        return $apiMap.mapViewToApi($location.path());
                    }

                    // Setter
                    var path = $apiMap.mapApiToView(url);

                    if (path) {
                        $location.path(path);
                        return url;
                    }
                },

                /**
                 * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
                 *
                 * @param href {String} URL to be normalized. Can be absolute, server-relative or context relative.
                 * @returns {String} Normalized URL, including full hostname.
                 */
                normalizeUrl: function normalizeUrl(href) {
                    return provider.normalizeUrl(href);
                }
            };

            return $apiMap;
        }];
    });

})(angular);
