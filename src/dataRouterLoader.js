"use strict";

module.provider('$dataRouterLoader', function dataRouterLoaderProvider() {
    var provider = this;
    // Intentionally using document object instead of $document
    var urlParsingNode = document.createElement("a");

    provider.global = function global(config) {
        if (!config) return;

        if (angular.isObject(config.resolve)) {
            provider.$globalResolve = angular.extend(provider.$globalResolve || {}, config.resolve);
        }

        return provider;
    };

    provider.$$normalizeUrl = function $$normalizeUrl(href) {
        if (href === '') {
            // Special case - browser interprets empty string as current URL, while we need
            // what it considers a base if no base href is given.
            // Add /X to the path and then remove it.
            urlParsingNode.setAttribute("href", 'X');
            return urlParsingNode.href.replace(/\/X$/, '');
        } else if (href) {
            // Normalize thru href property
            urlParsingNode.setAttribute("href", href);
            return urlParsingNode.href;
        }

        // Empty
        return null;
    };

    this.$get = function $dataRouterLoaderFactory($log, $sce, $http, $templateCache, $q, $injector, $dataRouterRegistry) {
        var $dataRouterLoader = {
            normalizeMediaType: $dataRouterRegistry.normalizeMediaType,

            prefetchTemplate: function prefetchTemplate(mediaType) {
                var view = $dataRouterRegistry.match(mediaType);

                if (view) {
                    $log.debug("Prefetching template for " + mediaType);
                    $dataRouterLoader.$$loadTemplate(view, mediaType);
                } else {
                    $log.debug("Cannot prefetch template for " + mediaType + ", type is not registered");
                }
            },

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
                        $log.debug("Replacing current data");

                        // Update data
                        response.$routeDataUpdate = true;
                        return response;
                    }

                    // Load view
                    return $dataRouterLoader.$$loadView(response);
                }

                function loadError(response) {
                    // Load error view
                    response.mediaType = '$error';
                    response.view = $dataRouterRegistry.match('$error');
                    response.$routeError = true;

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
                // Fetch data and return promise
                return $http.get(url).then(function dataLoaded(response) {
                    // Match existing resource
                    var mediaType = $dataRouterRegistry.normalizeMediaType(response.headers('Content-Type')) || 'text/plain';
                    var view = $dataRouterRegistry.match(mediaType);

                    // Unknown media type
                    if (!view) {
                        return $q.reject({
                            status: 999,
                            statusText: "Application Error",
                            data: "Unknown content type " + mediaType,
                            config: response.config,
                            headers: angular.noop
                        });
                    }

                    // Success
                    var result = {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        config: response.config,
                        mediaType: mediaType,
                        originalData: response.data,
                        data: response.data,
                        view: view
                    };

                    if (view.transformResponse) {
                        return view.transformResponse(result);
                    } else {
                        return result;
                    }
                });
            },

            /**
             * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
             *
             * @param href {String} URL to be normalized. Can be absolute, server-relative or context relative.
             * @returns {String} Normalized URL, including full hostname.
             */
            normalizeUrl: function normalizeUrl(href) {
                return provider.$$normalizeUrl(href);
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
                            return $q.reject({
                                status: 999,
                                statusText: "Application Error",
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
    };
});
