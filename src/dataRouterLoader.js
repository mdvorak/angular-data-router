"use strict";

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
     * @param {Object} config Configuration object. Currently only `"resolve"` key is supported.
     * @returns {Object} Reference to the provider.
     */
    provider.global = function global(config) {
        if (!config) return provider;

        if (angular.isObject(config.resolve)) {
            provider.$globalResolve = angular.extend(provider.$globalResolve || {}, config.resolve);
        }

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

    /**
     * @ngdoc service
     * @name mdvorakDataRouter.$dataRouterLoader
     *
     * @description
     * Abstraction of data loading and view preparation. It uses views registered in
     * {@link mdvorakDataRouter.$dataRouterRegistry $dataRouterRegistry}.
     */
    this.$get = function $dataRouterLoaderFactory($log, $sce, $http, $templateCache, $q, $injector, $rootScope, $dataRouterRegistry, $$dataRouterEventSupport) {
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
                    response.mediaType = '$error_' + response.status;
                    response.view = $dataRouterRegistry.match(response.mediaType);

                    if (!response.view) {
                        response.mediaType = '$error';
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
                    return current && next && current.url === next.url && current.mediaType === next.mediaType;
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
                return $http({url: url, method: 'GET', dataRouter: true}).then(function dataLoaded(response) {
                    // Match existing resource
                    var mediaType = $dataRouterRegistry.normalizeMediaType(provider.extractType(response)) || 'application/octet-stream';
                    var view = $dataRouterRegistry.match(mediaType);

                    // Unknown media type
                    if (!view) {
                        return $q.reject(asResponse({
                            url: response.config.url,
                            status: 999,
                            statusText: "Application Error",
                            data: "Unknown content type " + mediaType,
                            config: response.config,
                            headers: response.headers
                        }));
                    }

                    // Success
                    var result = {
                        url: response.config.url,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        config: response.config,
                        mediaType: mediaType,
                        data: response.data,
                        view: view
                    };

                    if (view.transformResponse) {
                        return asResponse(view.transformResponse(result));
                    } else {
                        return asResponse(result);
                    }
                }, function dataFailed(response) {
                    response.url = response.config.url;

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
                                url: response.config.url,
                                status: 999,
                                statusText: "Application Error",
                                data: "Failed to resolve view " + response.mediaType,
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

        return $dataRouterLoader;

        // Converter function
        function asResponse(response) {
            return angular.extend($$dataRouterEventSupport.$new(), response);
        }
    };
});
