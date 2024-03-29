/**
 * @license angular-data-router v0.3.11
 * (c) 2023 Michal Dvorak https://github.com/mdvorak/angular-data-router
 * License: MIT
 */
(function dataRouterModule(angular) {
    "use strict";

    /**
     * @ngdoc overview
     * @name mdvorakDataRouter
     * @requires mdvorakDataApi
     *
     * @description
     * Angular Data Router module. You should configure it using
     * {@link mdvorakDataRouter.$dataRouterProvider $dataRouterProvider}.
     */
    var module = angular.module("mdvorakDataRouter", ['mdvorakDataApi']);

    /**
     * @ngdoc service
     * @name mdvorakDataRouter.$dataRouterRegistryProvider
     *
     * @description
     * This is the place where media types are configured to the views.
     */
    module.provider('$dataRouterRegistry', ["$$dataRouterMatchMap", function $dataRouterRegistryProvider($$dataRouterMatchMap) {
        var provider = this;
        var views = provider.$$views = $$dataRouterMatchMap.create();

        // Expression taken from ngController directive
        var CTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;

        // Creates copy of the configuration, preprocesses it and validates it
        provider.$$parseConfig = function $$parseConfig(config, mediaType) {
            // Make our copy
            config = angular.copy(config);

            // Validate
            if (angular.isString(config.controller)) {
                var ctrlMatch = config.controller.match(CTRL_REG);
                if (!ctrlMatch) {
                    throw new Error("Badly formed controller string '" + config.controller + "' for route '" + mediaType + "'.");
                }

                if (ctrlMatch[3] && config.controllerAs) {
                    throw new Error("Defined both controllerAs and 'controller as' expressions for route '" + mediaType + "'.");
                }

                // Reconfigure
                config.controller = ctrlMatch[1];
                if (ctrlMatch[3]) config.controllerAs = ctrlMatch[3];
            }

            return config;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
         * @name when
         *
         * @description
         * Configures view for given content type.
         *
         * _Note: Wildcard or function matchers are much slower then exact match. The are iterated one by one, in order of registration.
         * Exact string matchers also always takes precedence over function matchers._
         *
         * @param {String|Function} mediaType Content type to match. When there is no `/` in the string, it is considered
         * subtype of `application/` type. You should not include suffixes
         * like `+json`, they are ignored by the matcher. Wildcards using `*` are supported.
         *
         * It can be function with signature `[boolean] function([string])` as well.
         *
         * @param {Object} config Configuration object, similar to ngRoute one. Allowed keys are:
         *                        `template`, `templateUrl`, `controller`, `controllerAs`, `dataAs`, `responseAs`,
         *                        `resolve`, `transformResponse`,
         *                        where either `template` or `templateUrl` must be specified.
         *                        `template` has precedence over `templateUrl`.
         *                        `controller` is optional. Can be either String reference or declaration
         *                        according to `$injector` rules. `resolve` is map of resolvables, that are
         *                        resolved before controller is created, and are injected into controller.
         *                        Same behavior as in ngRoute.
         */
        provider.when = function when(mediaType, config) {
            // Parse
            config = provider.$$parseConfig(config, mediaType);

            // Add
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
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
         * @name error
         *
         * @description
         * Configures view for error page. Error page is displayed when resource or view template cannot be loaded or
         * any of the resolvables fails.
         *
         * @param {Number|String=} status HTTP response status code this error view is for.
         *                                It can be both number or string representing numeric value. In string, `'?'` char
         *                                can be used as substitution for any number, allowing to match multiple codes with
         *                                one definition. `'4??'` will match any 4xx error code.
         *                                This is optional argument, you should always have defined generic error view as well.
         * @param {Object} config Configuration object, as in
         * {@link mdvorakDataRouter.$dataRouterRegistryProvider#methods_when when(config)}.
         */
        provider.error = function error(status, config) {
            var name = '$error';

            if (angular.isObject(status)) {
                config = status;
            } else {
                name = '$error_' + status;
            }

            // Parse and add
            views.addMatcher(name, provider.$$parseConfig(config, name));
            return provider;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
         * @name normalizeMediaType
         *
         * @description
         * Normalizes the media type. Removes format suffix (everything after +), and prepends `application/` if there is
         * just subtype provided.
         *
         * @param {String} mimeType Media type to match.
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

        /**
         * @ngdoc service
         * @name mdvorakDataRouter.$dataRouterRegistry
         */
        this.$get = function $dataRouterRegistryFactory() {
            return {
                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataRouter.$dataRouterRegistry
                 * @name normalizeMediaType
                 *
                 * @description
                 * Normalizes the media type. Removes format suffix (everything after +), and prepends `application/` if there is
                 * just subtype provided.
                 *
                 * @param {String} mimeType Media type to match.
                 * @returns {String} Normalized media type.
                 */
                normalizeMediaType: provider.normalizeMediaType,

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataRouter.$dataRouterRegistry
                 * @name match
                 *
                 * @description
                 * Matches the media type against registered media types. If found, view configuration is return.
                 *
                 * @param {String} mediaType Media type to be matched. It *MUST* be normalized, it is compared as is.
                 * @returns {Object} Matched view or undefined. Note that original configuration object will be returned,
                 *                   so don't modify it!
                 */
                match: function match(mediaType) {
                    return views.match(mediaType);
                },

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataRouter.$dataRouterRegistry
                 * @name isKnownType
                 *
                 * @description
                 * Determines whether type matches a registered view.
                 *
                 * @param {String} mediaType Matched content type. Doesn't have to be normalized.
                 * @returns {boolean} `true` if type is has registered view, `false` if no match was found.
                 */
                isKnownType: function isKnownType(mediaType) {
                    return mediaType && !!this.match(provider.normalizeMediaType(mediaType));
                }
            };
        };
    }]);

    /**
     * @ngdoc service
     * @name mdvorakDataRouter.$dataRouterLoaderProvider
     *
     * @description
     * Provider allows configuration of loading and resolving views. Note that media types are registered in
     * {@link mdvorakDataRouter.$dataRouterRegistryProvider $dataRouterRegistryProvider} and not here.
     */
    module.provider('$dataRouterLoader', function dataRouterLoaderProvider() {
        var provider = this;
        var toString = Object.prototype.toString;

        provider.globals = Object.create(null);

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterLoaderProvider
         * @name global
         *
         * @description
         * Sets global configuration for all routes. It is then merged into each view configuration, with view taking precedence.
         *
         * _Note: This method is also available directly on `$dataRouter` to ease configuration._
         *
         * @example
         * This example shows how to load additional data from URL provided in the response. `relatedData` object will be
         * then available in view controllers.
         *
         * ```js
         *     $dataRouterLoader.global({
         *         resolve: {
         *             relatedData: function($http, $data) {
         *                 if ($data._links && $data._links.related) {
         *                     return $http.get($data._links.related.href)
         *                         .then(function(response) {
         *                             return response.data;
         *                         });
         *                 }
         *
         *                 return null;
         *             }
         *         }
         *     });
         * ```
         *
         * @param {Object} config Configuration object. Properties of object type are merged together instead of overwriting.
         * @returns {Object} Reference to the provider.
         */
        provider.global = function global(config) {
            if (!config) return provider;

            provider.globals = $$mergeConfigObjects(provider.globals, config);

            return provider;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterLoaderProvider
         * @name extractType
         *
         * @description
         * Extracts media type from given response. Default implementation returns `Content-Type` header.
         *
         * @example
         * Example of custom implementation.
         * ```js
         *     $dataRouterLoader.extractType = function extractTypeFromJson(response) {
         *         return response.data && response.data._type;
         *     };
         * ```
         *
         * @param {Object} response Response object, see `$http` documentation for details.
         *
         * _Note that while `response` itself is never null, data property can be._
         *
         * @returns {String} Media type of the response. It will be normalized afterwards. If the return value is empty,
         * `application/octet-stream` will be used.
         */
        provider.extractType = function extractTypeFromContentType(response) {
            return response.headers('Content-Type');
        };

        provider.responseExtensions = {
            dataAs: function dataAs(scope, name, listener) {
                var _this = this;
                scope[name] = _this.data;

                this.$on('$routeUpdate', function() {
                    // Update data
                    scope[name] = _this.data;

                    if (angular.isFunction(listener)) {
                        listener(_this.data);
                    }
                }, scope);
            }
        };

        /**
         * @ngdoc service
         * @name mdvorakDataRouter.$dataRouterLoader
         *
         * @description
         * Abstraction of data loading and view preparation. It uses views registered in
         * {@link mdvorakDataRouter.$dataRouterRegistry $dataRouterRegistry}.
         */
        this.$get = ["$log", "$sce", "$http", "$templateCache", "$q", "$injector", "$rootScope", "$dataRouterRegistry", "$$dataRouterEventSupport", function $dataRouterLoaderFactory($log, $sce, $http, $templateCache, $q, $injector, $rootScope, $dataRouterRegistry, $$dataRouterEventSupport) {
            var $dataRouterLoader = {
                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataRouter.$dataRouterLoader
                 * @name normalizeMediaType
                 *
                 * @description
                 * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
                 * just subtype.
                 *
                 * @param {String} mimeType Media type to match.
                 * @returns {String} Normalized media type.
                 */
                normalizeMediaType: $dataRouterRegistry.normalizeMediaType,

                /**
                 * Extracts media type from the response, using configured
                 * {@link mdvorakDataRouter.$dataRouterLoaderProvider#methods_extractType method}.
                 * Unlike on provider, this method returns the type already
                 * {@link mdvorakDataRouter.$dataRouterRegistry#methods_normalizeMediaType normalized}.
                 *
                 * @param response {Object} Response object.
                 * @returns {String} Normalized media type of the response or null if it cannot be determined.
                 */
                extractType: function extractType(response) {
                    return $dataRouterRegistry.normalizeMediaType(provider.extractType(response));
                },

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataRouter.$dataRouterLoader
                 * @name prefetchTemplate
                 *
                 * @description
                 * Eagerly fetches the template for the given media type. If media type is unknown, nothing happens.
                 * This method returns immediately, no promise is returned.
                 *
                 * @param {String} mediaType Media type for which we want to prefetch the template.
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
                 * @ngdoc method
                 * @methodOf mdvorakDataRouter.$dataRouterLoader
                 * @name prepareView
                 *
                 * @description
                 * Prepares the view to be displayed. Loads data from given URL, resolves view by its content type,
                 * and then finally resolves template and all other resolvables.
                 *
                 * @param {String} url URL of the data to be fetched. They are always loaded using GET method.
                 * @param {Object=} current Current response data. If provided and forceReload is false, routeDataUpdate flag
                 *                          of the response may be set, indicating that view doesn't have to be reloaded.
                 * @param {boolean=} forceReload When false, it allows just data update. Without current parameter does nothing.
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
                        response.routeError = true;

                        // Try specific view first, then generic
                        response.type = '$error_' + response.status;
                        response.view = $dataRouterRegistry.match(response.type);

                        if (!response.view) {
                            response.type = '$error';
                            response.view = $dataRouterRegistry.match('$error');
                        }

                        // Load the view
                        if (response.view) {
                            return $dataRouterLoader.$$loadView(response);
                        } else {
                            return $q.reject(response);
                        }
                    }

                    function isSameView(current, next) {
                        return current && next && current.url === next.url && current.type === next.type;
                    }
                },

                /**
                 * @methodOf mdvorakDataRouter.$dataRouterLoader
                 * @name $$loadData
                 * @private
                 *
                 * @description
                 * Loads view data from given URL.
                 * Tries to automatically match the view by the data Content-Type header.
                 * If the view is found, and transformResponse key is set, response is automatically resolved.
                 *
                 * @param {String} url URL to load data from. They are always loaded using GET method.
                 * @returns {Promise} Promise of the response.
                 */
                $$loadData: function $$loadData(url) {
                    $log.debug("Loading resource " + url);

                    // Fetch data and return promise
                    return $http({
                        url: url,
                        method: 'GET',
                        dataRouter: true
                    }).then(function dataLoaded(response) {
                        // Match existing resource
                        var type = $dataRouterRegistry.normalizeMediaType(provider.extractType(response)) || 'application/octet-stream';
                        var view = $dataRouterRegistry.match(type);

                        // Unknown media type
                        if (!view) {
                            return $q.reject(asResponse({
                                url: url,
                                status: 999,
                                statusText: "Application Error",
                                data: "Unknown content type " + type,
                                config: response.config,
                                headers: response.headers,
                                type: type
                            }));
                        }

                        // Merge view
                        // Note: If this could be cached in some way, it would be nice
                        view = $$mergeConfigObjects(Object.create(null), provider.globals, view);

                        // Success
                        var result = {
                            url: url,
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                            config: response.config,
                            type: type,
                            data: response.data,
                            view: view
                        };

                        if (view.transformResponse) {
                            return asResponse(view.transformResponse(result));
                        } else {
                            return asResponse(result);
                        }
                    }, function dataFailed(response) {
                        response.url = url;

                        return $q.reject(asResponse(response));
                    });
                },

                /**
                 * @methodOf mdvorakDataRouter.$dataRouterLoader
                 * @name $$loadView
                 * @private
                 *
                 * @description
                 * Loads view template and initializes resolves.
                 *
                 * @param {Object|Promise} response Loaded data response. Can be promise.
                 * @returns {Promise} Promise of loaded view. Promise is rejected if any of locals or template fails to resolve.
                 */
                $$loadView: function $$loadView(response) {
                    return $q.when(response).then(function responseReady(response) {
                        // Resolve view
                        if (response.view) {
                            // Prepare locals
                            var locals = angular.extend(Object.create(null), provider.globals.resolve, response.view.resolve);
                            var template;

                            // Built-in locals
                            var builtInLocals = {
                                $data: response.data,
                                $dataType: response.type,
                                $dataUrl: response.url,
                                $dataResponse: response
                            };

                            // Resolve locals
                            if (locals) {
                                angular.forEach(locals, function resolveLocal(value, key) {
                                    locals[key] = angular.isString(value) ?
                                        $injector.get(value) : $injector.invoke(value, '$dataRouterLoader', builtInLocals);
                                });
                            } else {
                                locals = Object.create(null);
                            }

                            // Load template
                            template = $dataRouterLoader.$$loadTemplate(response.view, response.type);

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
                                    url: response.url,
                                    status: 999,
                                    statusText: "Application Error",
                                    data: "Failed to resolve view " + response.type,
                                    config: {},
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

            // Converter function
            function asResponse(response) {
                return angular.extend($$dataRouterEventSupport.$new(), response, provider.responseExtensions);
            }

            // Return
            return $dataRouterLoader;
        }];

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterLoaderProvider
         * @name $$mergeConfigObjects
         * @private
         *
         * @description
         * Merges configuration objects. Plain objects are merged, all other properties are overwritten.
         * `undefined` values in `src` are ignored.
         *
         * @param {Object} dst Target object.
         * @return {Object} Returns `dst` object.
         */
        function $$mergeConfigObjects(dst) {
            if (!dst) dst = Object.create(null);

            // Multiple sources
            for (var i = 1; i < arguments.length; i++) {
                var src = arguments[i];

                if (src) {
                    // Manual merge
                    var keys = Object.keys(src);

                    for (var k = 0; k < keys.length; k++) {
                        var key = keys[k];

                        // Skip undefined entries
                        if (angular.isUndefined(src[key])) return;

                        // Current value
                        var val = dst[key];

                        // If both values are plain objects, merge them, otherwise overwrite
                        if (isPlainObject(val) && isPlainObject(src[key])) {
                            // Merge
                            dst[key] = angular.extend(val, src[key]);
                        } else {
                            // Overwrite
                            dst[key] = src[key];
                        }
                    }
                }
            }

            return dst;
        }

        provider.$$mergeConfigObjects = $$mergeConfigObjects;

        /**
         * Checks whether object is plain Object, if it is Date or whatever, it returns true.
         *
         * @param {Object} obj Checked object
         * @returns {boolean} true for POJO, false otherwise.
         */
        function isPlainObject(obj) {
            return angular.isObject(obj) && toString.call(obj) === '[object Object]';
        }
    });

    /**
     * @ngdoc service
     * @name mdvorakDataRouter.$dataRouterProvider
     *
     * @description
     * Allows simple configuration of all parts of the data router in one place.
     *
     * @example
     * ```javascript
     *     angular.module('example', ['mdvorakDataRouter'])
     *         .config(function configRouter($dataRouterProvider) {
     *             // URL prefixes
     *             $dataRouterProvider.apiPrefix('api/');
     *
     *             // Error route
     *             $dataRouterProvider.error({
     *                 templateUrl: 'error.html',
     *                 dataAs: 'error'
     *             });
     *
     *             // Routes
     *             $dataRouterProvider.when('application/x.example', {
     *                 templateUrl: 'example.html',
     *                 controller: 'ExampleCtrl'
     *             });
     *         });
     * ```
     */
    module.provider('$dataRouter', ["$$dataRouterMatchMap", "$dataRouterRegistryProvider", "$dataRouterLoaderProvider", "$dataApiProvider", function $dataRouterProvider($$dataRouterMatchMap, $dataRouterRegistryProvider, $dataRouterLoaderProvider, $dataApiProvider) {
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
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterProvider
         * @name apiPrefix
         *
         * @description
         * Configures prefix for default view to resource mapping.
         *
         * This is just an alias for {@link mdvorakDataApi.$dataApiProvider#methods_prefix $dataApiProvider.prefix(prefix)}
         * method, see its documentation for details.
         *
         * @param {String} prefix Relative URL prefix, relative to base href.
         * @return {String} API URL prefix. It's always normalized absolute URL, includes base href.
         */
        provider.apiPrefix = function apiPrefix(prefix) {
            return $dataApiProvider.prefix(prefix);
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterProvider
         * @name when
         *
         * @description
         * Configures view for given content type.
         *
         * This is just an alias for
         * {@link mdvorakDataRouter.$dataRouterRegistryProvider#methods_when $dataRouterRegistryProvider.when(mediaType,config)}
         * method, see its documentation for details.
         *
         * @param {String|Function} mediaType Content type to match.
         * @param {Object} config Configuration object.
         */
        provider.when = function when(mediaType, config) {
            $dataRouterRegistryProvider.when(mediaType, config);
            return provider;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterProvider
         * @name error
         *
         * @description
         * Configures view for error page. Error page is displayed when resource or view template cannot be loaded or
         * any of the resolvables fails.
         *
         * This is just an alias for
         * {@link mdvorakDataRouter.$dataRouterRegistryProvider#methods_error $dataRouterRegistryProvider.error(config)}
         * method, see its documentation for details.
         *
         * @param {Number=} status HTTP response status code this error view is for. This is optional argument, you should
         * always have defined generic error view as well.
         * @param {Object} config Configuration object, as in
         * {@link mdvorakDataRouter.$dataRouterRegistryProvider#methods_when when(config)}.
         */
        provider.error = function error(status, config) {
            $dataRouterRegistryProvider.error(status, config);
            return provider;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterProvider
         * @name redirect
         *
         * @description
         * Forces redirect from one location to another.
         *
         * @param {String} path View to force redirect on. Supports wildcards. Parameters are not supported
         * @param {String} redirectTo View path which should be redirected to.
         * @returns {Object} Returns the provider.
         */
        provider.redirect = function redirect(path, redirectTo) {
            if (redirectTo) {
                provider.$redirects.addMatcher(path, redirectTo);
            }

            return provider;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterProvider
         * @name global
         *
         * @description
         * Sets global configuration for all routes. It is then merged into each view configuration, with view taking precedence.
         *
         * This is just an alias for
         * {@link mdvorakDataRouter.$dataRouterLoaderProvider#methods_global $dataRouterLoaderProvider.global(config)},
         * see its documentation for details.
         *
         * @param {Object} config Configuration object. Currently only `"resolve"` key is supported.
         * @returns {Object} Reference to the provider.
         */
        provider.global = function global(config) {
            $dataRouterLoaderProvider.global(config);
            return provider;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataRouter.$dataRouterProvider
         * @name enabled
         *
         * @description
         * Enables  or disables the router. May be used to disable the router event handling.
         * Cannot be changed after config phase.
         *
         * This method is intended mostly for unit tests.
         *
         * Enabled by default.
         *
         * @param {boolean} enabled Set to `false` to disable the router.
         * @returns {Object} Returns provider.
         */
        provider.enabled = function enabledFn(enabled) {
            provider.$enabled = !!enabled;
            return provider;
        };

        /**
         * @ngdoc service
         * @name mdvorakDataRouter.$dataRouter
         *
         * @description
         * Centerpiece of the data router. It tracks the `$location` and loads the main view data.
         */
        this.$get = ["$log", "$location", "$rootScope", "$q", "$dataRouterRegistry", "$dataRouterLoader", "$dataApi", "$$dataRouterEventSupport", function $dataRouterFactory($log, $location, $rootScope, $q, $dataRouterRegistry, $dataRouterLoader, $dataApi, $$dataRouterEventSupport) {
            /**
             * @ngdoc event
             * @eventOf mdvorakDataRouter.$dataRouter
             * @name $routeChangeStart
             * @eventType broadcast on root scope
             *
             * @description
             * This event is broadcasted whenever main view is about to change. The change can be averted
             * by setting preventDefault on the vent.
             */

            /**
             * @ngdoc event
             * @eventOf mdvorakDataRouter.$dataRouter
             * @name $routeChangeSuccess
             * @eventType broadcast on root scope
             *
             * @description
             * This event is broadcasted whenever main view has changed and the data are loaded.
             * View is ready to be displayed.
             */

            /**
             * @ngdoc event
             * @eventOf mdvorakDataRouter.$dataRouter
             * @name $routeChangeError
             * @eventType broadcast on root scope
             *
             * @description
             * This event is broadcasted when the view or data failed to load and there is no error view configured
             * (or error view failed to load). There is not much you can do at this point, it probably means you have
             * configuration error in your application.
             */

            var $dataRouter = {
                /**
                 * @ngdoc property
                 * @propertyOf mdvorakDataRouter.$dataRouter
                 * @name api
                 * @returns {Object} Reference to the {@link mdvorakDataApi.$dataApi $dataApi} instance.
                 *
                 * @description
                 * Its here to make your life easier.
                 */
                api: $dataApi,

                /**
                 * @ngdoc property
                 * @propertyOf mdvorakDataRouter.$dataRouter
                 * @name registry
                 * @returns {Object} Reference to the {@link mdvorakDataRouter.$dataRouterRegistry $dataRouterRegistry} instance.
                 *
                 * @description
                 * Its here to make your life easier.
                 */
                registry: $dataRouterRegistry,

                /**
                 * @ngdoc property
                 * @propertyOf mdvorakDataRouter.$dataRouter
                 * @name current
                 * @returns {Object} Currently loaded response for the main view is available here.
                 * See {@link locals.$dataResponse $dataResponse} for its signature.
                 *
                 * @description
                 * Note that you should in most cases use {@link locals.$dataResponse $dataResponse} object in the
                 * controller to work with the data instead of this reference.
                 */
                current: undefined,

                /**
                 * @ngdoc method
                 * @propertyOf mdvorakDataRouter.$dataRouter
                 * @name url

                 * @description
                 * Gets or sets current view resource URL using {@link mdvorakDataApi.$dataApi.url $dataApi.url()}.
                 *
                 * If the `url` is not in the configured API namespace, error is logged and nothing happens.
                 *
                 * @param {String=} url New resource URL. Performs location change.
                 * @param {Boolean=} reload If `true`, data are reloaded even if `url` did not change. Default is `false`.
                 * @returns {String} Resource URL that is being currently viewed.
                 */
                url: function urlFn(url, reload) {
                    // Getter
                    if (arguments.length < 1) {
                        return $dataApi.url();
                    }

                    // Setter
                    if (reload && $dataApi.url() == url) {
                        // Same URL, reload instead
                        $dataRouter.reload(true);
                    } else {
                        // Change URL
                        $dataApi.url(url);
                    }

                    return url;
                },

                /**
                 * @ngdoc method
                 * @propertyOf mdvorakDataRouter.$dataRouter
                 * @name navigate

                 * @description
                 * Navigates to resource URL. See {@link mdvorakDataRouter.$dataRouter.url $dataRouter.url()} for more details.
                 *
                 * @param {String=} url New resource URL.
                 * @param {Boolean=} reload If `true`, data are reloaded even if `url` did not change. Default is `true`.
                 */
                navigate: function navigate(url, reload) {
                    $dataRouter.url(url, reload !== false);
                },

                /**
                 * @ngdoc method
                 * @propertyOf mdvorakDataRouter.$dataRouter
                 * @name reload

                 * @description
                 * Reloads data at current location. If content type remains same, only data are refreshed,
                 * and $routeUpdate event is invoked on $dataResponse object. If content type differs,
                 * full view refresh is performed (that is, controller is destroyed and recreated).
                 * <p>
                 * If you refresh data, you must listen to the $routeUpdate event on $dataResponse object to be notified of the change.
                 *
                 * @param {boolean=} forceReload If true, page is always refreshed (controller recreated). Otherwise only
                 *                               when needed.
                 */
                reload: function reload(forceReload) {
                    var redirectTo;

                    // Forced redirect (Note: This matches search params as well)
                    if ((redirectTo = provider.$redirects.match($location.url() || '/'))) {
                        $log.debug("Redirecting to " + redirectTo);
                        $location.url(redirectTo).replace();
                        return;
                    }

                    // Load resource
                    var url = $dataApi.url();
                    var next = $dataRouter.$$next = {};

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
                                $$dataRouterEventSupport.$$extend($dataRouter.current, response);

                                // Fire event on the response (only safe way for both main view and fragments)
                                $dataRouter.current.$broadcast('$routeUpdate', $dataRouter.current);
                            } else {
                                $log.debug("Setting view to " + response.mediaType);

                                // Add reload and navigate implementations
                                response.reload = $dataRouter.reload;
                                response.navigate = $dataRouter.navigate;

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
        this.$exact = Object.create(null);
        this.$matchers = [];

        var wildcardPattern = /[*?]/;

        this.addMatcher = function addMatcher(pattern, data) {
            if (angular.isFunction(pattern)) {
                this.$matchers.push({
                    m: pattern,
                    d: data
                });
            } else if (wildcardPattern.test(pattern)) {
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
            return s.replace(/([-()\[\]{}+.$\^|,:#<!\\])/g, '\\$1')
                .replace(/\x08/g, '\\x08')
                .replace(/[*]+/g, '.*')
                .replace(/[?]/g, '.');
        }
    }

    module.factory('$$dataRouterEventSupport', ["$exceptionHandler", function dataRouterEventSupportFactory($exceptionHandler) {
        var slice = [].slice;

        // This code is ripped of Scope class
        function EventSupport() {}

        EventSupport.$new = function() {
            return new EventSupport();
        };

        EventSupport.$$extend = function(dst, src) {
            // Preserve listeners
            var $$listeners = dst.$$listeners;
            angular.extend(dst, src);
            dst.$$listeners = $$listeners;

            return dst;
        };

        EventSupport.prototype = {
            constructor: EventSupport,

            $on: function(name, listener, scope) {
                if (!this.$$listeners) this.$$listeners = Object.create(null);

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
     * @name mdvorakDataRouter.apiHref
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
     *
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
     *
     * When `apiHref` resolves to the configured api prefix, it redirects to the base href of the application.
     * <example module="apiPrefix">
     * <file name="apiPrefix.html">
     *     <a api-href="'api/'">Api Prefix</a>
     * </file>
     * <file name="apiPrefix.js">
     * angular.module('apiPrefix', ['mdvorakDataRouter'])
     *     .config(function ($dataApiProvider) {
     *         $dataApiProvider.prefix('api/');
     *     });
     * </file>
     * </example>
     */
    module.directive('apiHref', ["$dataApi", "$dataRouterRegistry", "$dataRouterLoader", "$location", "$browser", "$parse", function apiHrefFactory($dataApi, $dataRouterRegistry, $dataRouterLoader, $location, $browser, $parse) {
        return {
            restrict: 'AC',
            priority: 90,
            compile: function entryPointHrefCompile(element, attrs) {
                // #18 This will force angular-material to think, this really is an anchor
                attrs.href = null;

                // Return post-link function
                return apiHrefLink;
            }
        };

        function apiHrefLink(scope, element, attrs) {
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
                scope.$watch(attrs.apiType, function(type) {
                    attrs.$set('type', type);
                });
            }

            // Watch for type attribute
            attrs.$observe('type', updateHref);

            // Click handler that pre-fetches templates
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
    }]);

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
     * @param {String=} type Type parameter, that is passed to child view on its scope under key `$viewType`.
     *                       If not set, value `default` is used.
     */
    module.directive('dataview', ["$animate", "$anchorScroll", "$log", "$parse", "$dataRouterLoader", "$dataRouter", "$$dataRouterEventSupport", function dataViewFactory($animate, $anchorScroll, $log, $parse, $dataRouterLoader, $dataRouter, $$dataRouterEventSupport) {
        return {
            restrict: 'EAC',
            terminal: true,
            priority: 400,
            transclude: 'element',
            link: function dataViewLink(scope, $element, attr, ctrl, $transclude) {
                var currentHref,
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
                        reload: reloadImpl,
                        navigate: function navigateLocal(url, reload) {
                            if (currentHref == url) {
                                // true is default
                                if (reload !== false) {
                                    // Reload
                                    reloadImpl(true);
                                }
                            } else {
                                // Navigate, but don't change src attribute itself
                                currentHref = url;
                                reloadImpl(true);
                            }
                        }
                    };

                    // Custom view - watch for href changes
                    scope.$watch(attr.src, function hrefWatch(href) {
                        currentHref = href;
                        reloadImpl(true);
                    });
                } else {
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
                        $log.debug("Setting view ", $element[0], " to ", context.current.type);

                        var newScope = scope.$new();
                        newScope.$$dataRouterCtx = context;
                        newScope.$viewType = attr.type || 'default';

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
                function reloadImpl(forceReload) {
                    var next = attr.next = Object.create(null);

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

                                // Add reload and navigate implementations
                                if (response) {
                                    response.reload = reloadImpl;
                                    response.navigate = function navigateDelegate() {
                                        context.navigate.apply(context, arguments);
                                    };
                                }

                                // Show view
                                showView();
                            }
                        }
                    }
                }
            }
        };
    }]);

    module.directive('dataview', ["$compile", "$controller", function dataViewFillContentFactory($compile, $controller) {
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

                    if (view.dataAs) {
                        scope[view.dataAs] = current.data;

                        current.$on('$routeUpdate', function routeDataUpdated(e, response) {
                            scope[view.dataAs] = response.data;
                        }, scope);
                    }

                    if (view.responseAs) {
                        scope[view.responseAs] = current;
                    }

                    if (view.controller) {
                        locals.$scope = scope;
                        locals.$viewType = scope.$viewType;

                        var controller = $controller(view.controller, locals);

                        if (view.controllerAs) {
                            scope[view.controllerAs] = controller;
                        }

                        $element.data('$ngControllerController', controller);
                        $element.children().data('$ngControllerController', controller);
                    }
                }

                link(scope);
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name mdvorakDataRouter.emptyHref
     * @restrict AC
     * @priority 0
     * @element A
     *
     * @param {String} emptyHref Must be either `hide` or `disable`. Any other value is ignored and warning is logged.
     *
     * @description
     * Defines behavior when link has empty href attribute. It is complementary to {@link mdvorakDataRouter.apiHref apiHref}
     * or `ngHref` directives.
     *
     * @example
     * Usage
     * ```html
     *     <a api-href="links.example.href" empty-href="hide">Hide when no link is given</a>
     *     <a api-href="links.example.href" empty-href="disable">Disabled when no link is given</a>
     *     <a api-href="links.example.href" empty-href="disabled">Same as disable</a>
     *     <a api-href="links.example.href" empty-href="anything">Always visible and active, since attr is invalid</a>
     * ```
     */
    module.directive('emptyHref', ["$log", function emptyHrefFactory($log) {
        return {
            restrict: 'AC',
            priority: 0,
            link: function emptyHrefLink(scope, element, attrs) {
                var observer;
                var emptyHrefAttr = attrs['emptyHref'] ? attrs['emptyHref'].toLowerCase() : attrs['emptyHref'];

                // Modes
                switch (emptyHrefAttr) {
                    case 'hide':
                        observer = function hrefHideObserver(href) {
                            element.toggleClass('ng-hide', !href && href !== '');
                        };
                        break;

                    case 'disable':
                    case 'disabled':
                        observer = function hrefDisableObserver(href, oldHref) {
                            // Handle empty string correctly
                            if (href === '') href = true;
                            if (oldHref === '') oldHref = true;

                            // Boolean value has changed
                            if (href && !oldHref) {
                                // From disabled to enabled
                                element.removeClass('disabled').off('click', disabledHandler);
                            } else if (!href && oldHref) {
                                // From enabled to disabled
                                element.addClass('disabled').on('click', disabledHandler);
                            }
                        };

                        // Fix init in disabled state
                        if (!attrs.href && attrs.href !== '') {
                            // Handler modifies the object only when change occur.
                            // But during init, oldHref is undefined, and link is not properly disabled.
                            element.addClass('disabled').on('click', disabledHandler);
                        }
                        break;

                    default:
                        $log.warn("Unsupported empty-href value: " + attrs['emptyHref']);
                        return;
                }

                // Watch for href
                attrs.$observe('href', observer);

                // Disabled handler
                function disabledHandler(e) {
                    e.preventDefault();
                }
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name mdvorakDataRouter.entryPointHref
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
    module.directive('entryPointHref', ["$browser", "$location", function entryPointHrefFactory($browser, $location) {
        // For hashbang mode, all we need is #/, otherwise use base href
        var baseHref = $location.$$html5 ? $browser.baseHref() : '#/';

        return {
            restrict: 'AC',
            priority: 90,
            compile: function entryPointHrefCompile(element, attrs) {
                // #18 This will force angular-material to think, this really is an anchor
                attrs.href = null;

                // Return post-link function
                return function entryPointHrefLink(scope, element, attrs) {
                    attrs.$set('href', baseHref);
                };
            }
        };
    }]);

    /**
     * @ngdoc overview
     * @name mdvorakDataApi
     *
     * @description
     * This is standalone module that allows two-way mapping of view and API URLs.
     * See {@link mdvorakDataApi.$dataApiProvider $dataApiProvider} provider for more details.
     */

    /**
     * @ngdoc service
     * @name mdvorakDataApi.$dataApiProvider
     *
     * @description
     * Provider allows you to configure API {@link mdvorakDataApi.$dataApiProvider#methods_prefix prefix}.
     */
    angular.module('mdvorakDataApi', []).provider('$dataApi', function $dataApiProvider() {
        var provider = this;
        // Intentionally using document object instead of $document
        var urlParsingNode = document.createElement("A");

        /**
         * @ngdoc method
         * @methodOf mdvorakDataApi.$dataApiProvider
         * @name normalizeUrl
         *
         * @description
         * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
         *
         * It is browser dependent, and takes into account `<base>` tag or current URL.
         * Note that in HTML5 mode, there should be always specified base tag ending with `/` to get expected behavior.
         *
         * This method is also available on {@link mdvorakDataApi.$dataApi#methods_normalizeUrl $dataApi} object.
         *
         * @param {String} href URL to be normalized. Can be absolute, server-relative or context relative.
         *                      <p>If the href is empty string, base href is returned.</p>
         *                      <p>Otherwise, when it is `null` or `undefined`, `null` is returned.</p>
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
         * @ngdoc method
         * @methodOf mdvorakDataApi.$dataApiProvider
         * @name prefix
         *
         * @description
         * Configures prefix for default view to resource mapping.
         *
         * It behaves just like Anchor href attribute.
         *
         * * It should always end with `/`, otherwise it will behave as configured, which may be weird in some cases.
         * * If it starts with `/`, it is server-relative, and `<base>` tag is ignored.
         *
         * _Note: This method also has shortcut on `$dataRouterProvider` as
         * {@link mdvorakDataRouter.$dataRouterProvider#methods_apiPrefix apiPrefix(prefix)}.
         *
         * @param {String} prefix Relative URL prefix, relative to base href.
         * @return {String} API URL prefix. It's always normalized absolute URL, includes base href.
         */
        provider.prefix = function prefixFn(prefix) {
            if (arguments.length > 0) {
                provider.$apiPrefix = provider.normalizeUrl(prefix);
            }

            return provider.$apiPrefix;
        };

        /**
         * @ngdoc method
         * @methodOf mdvorakDataApi.$dataApiProvider
         * @name mapViewToApi
         *
         * @description
         * Maps view path to resource URL. Can be overridden during configuration.
         * By default it maps path to API one to one.
         *
         * Counterpart to {@link mdvorakDataApi.$dataApiProvider#methods_mapApiToView mapApiToView}.
         *
         * This method is also available on {@link mdvorakDataApi.$dataApi#methods_mapApiToView $dataApi} object.
         *
         * @param {String} path View path, as in `$location.path()`.
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
         * @ngdoc method
         * @methodOf mdvorakDataApi.$dataApiProvider
         * @name mapApiToView
         *
         * @description
         * Maps resource URL to view path. Can be overridden during configuration.
         * By default it maps API url to view paths one to one.
         *
         * Counterpart to {@link mdvorakDataApi.$dataApiProvider#methods_mapViewToApi mapViewToApi}.
         *
         * This method is also available on {@link mdvorakDataApi.$dataApi#methods_mapViewToApi $dataApi} object.
         *
         * @param {String} url Resource url. It must be inside API namespace. If it is not, `null` is returned.
         *                     <p>If the url equals to api prefix, empty string is returned.</p>
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

        /**
         * @ngdoc service
         * @name mdvorakDataApi.$dataApi
         *
         * @description
         * Extension of Angular `$location`. It maps view URLs to API and vice versa.
         * Use {@link mdvorakDataApi.$dataApi#methods_url url()} method to get or set current API location.
         */
        this.$get = ["$log", "$location", function $dataApiFactory($log, $location) {
            $log.debug("Using API prefix " + provider.$apiPrefix);

            return {
                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataApi.$dataApi
                 * @name prefix
                 *
                 * @description
                 * Returns configured API prefix. It cannot be changed at this point.
                 *
                 * @return {String} API URL prefix. It's absolute URL, includes base href.
                 */
                prefix: function apiPrefix() {
                    return provider.prefix();
                },

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataApi.$dataApi
                 * @name mapViewToApi
                 *
                 * @description
                 * Maps view path to resource URL. Can be overridden during configuration.
                 * By default it maps path to API one to one.
                 *
                 * Counterpart to {@link mdvorakDataApi.$dataApi#methods_mapApiToView mapApiToView}.
                 *
                 * @param {String} path View path, as in `$location.path()`.
                 * @returns {String} Resource url, for e.g. HTTP requests.
                 */
                mapViewToApi: function mapViewToApi(path) {
                    return provider.mapViewToApi(path);
                },

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataApi.$dataApi
                 * @name mapApiToView
                 *
                 * @description
                 * Maps resource URL to view path. Can be overridden during configuration.
                 * By default it maps API url to view paths one to one.
                 *
                 * Counterpart to {@link mdvorakDataApi.$dataApi#methods_mapViewToApi mapViewToApi}.
                 *
                 * @param {String} url Resource url. It must be inside API namespace. If it is not, `null` is returned.
                 *                     <p>If the url equals to api prefix, empty string is returned.</p>
                 * @returns {String} View path.
                 */
                mapApiToView: function mapApiToView(url) {
                    return provider.mapApiToView(url);
                },

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataApi.$dataApi
                 * @name url
                 *
                 * @description
                 * Gets or sets current view resource URL (it internally modifies `$location.url()`).
                 *
                 * * If the `url` is not in the configured API namespace, error is logged and nothing happens.
                 * * If the `url` equals to api prefix, it is performed redirect to page base href.
                 *
                 * @param {String=} url New resource URL. Performs location change.
                 * @returns {String} Resource URL that is being currently viewed.
                 */
                url: function urlFn(url) {
                    // Getter
                    if (arguments.length < 1) {
                        // Map view URL to API.
                        return provider.mapViewToApi($location.url());
                    }

                    // Setter
                    var path = provider.mapApiToView(url);

                    if (path) {
                        $location.url(path);
                        return url;
                    } else {
                        $log.warn("Cannot navigate to URL " + url + ", it cannot be mapped to the API");
                    }
                },

                /**
                 * @ngdoc method
                 * @methodOf mdvorakDataApi.$dataApi
                 * @name normalizeUrl
                 *
                 * @description
                 * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
                 *
                 * It is browser dependent, and takes into account `<base>` tag or current URL.
                 * Note that in HTML5 mode, there should be always specified base tag ending with `/` to get expected behavior.
                 *
                 * @param {String} href URL to be normalized. Can be absolute, server-relative or context relative.
                 *                      <p>If the href is empty string, base href is returned.</p>
                 *                      <p>Otherwise, when it is `null` or `undefined`, `null` is returned.</p>
                 * @returns {String} Normalized URL, including full hostname.
                 */
                normalizeUrl: function normalizeUrl(href) {
                    return provider.normalizeUrl(href);
                }
            };
        }];
    });

})(angular);
