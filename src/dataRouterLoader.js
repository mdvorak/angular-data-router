"use strict";

module.provider('$dataRouterLoader', function dataRouterLoaderProvider() {
    var provider = this;
    // Intentionally using document object instead of $document
    var urlParsingNode = document.createElement("a");

    /**
     * Sets global configuration for all routes.
     *
     * @param config {Object} Configuration object. Currently only "resolve" key is supported.
     * @returns {dataRouterLoaderProvider} Reference to self.
     */
    provider.global = function global(config) {
        if (!config) return;

        if (angular.isObject(config.resolve)) {
            provider.$globalResolve = angular.extend(provider.$globalResolve || {}, config.resolve);
        }

        return provider;
    };

    this.$get = function $dataRouterLoaderFactory($log, $sce, $http, $templateCache, $q, $injector, $dataRouterRegistry) {
        var $dataRouterLoader = {
            /**
             * RouteData class.
             */
            RouteData: RouteData,

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
             * @param current {Object?} Current response data. If provided and forceReload is false, $routeDataUpdate flag
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
                        $log.debug("Replacing current data");

                        // Update data
                        response.$routeDataUpdate = true;
                        return asRouteData(response);
                    }

                    // Load view
                    return $dataRouterLoader.$$loadView(response).then(asRouteData);
                }

                function loadError(response) {
                    // Load error view
                    response.mediaType = '$error';
                    response.view = $dataRouterRegistry.match('$error');
                    response.$routeError = true;

                    if (response.view) {
                        return $dataRouterLoader.$$loadView(response).then(asRouteData);
                    } else {
                        return $q.reject(asRouteData(response));
                    }
                }

                function isSameView(current, next) {
                    return current && next && current.url === next.url && current.mediaType === next.mediaType;
                }

                function asRouteData(response) {
                    return new RouteData(response);
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
                        data: response.data,
                        view: view
                    };

                    if (view.transformResponse) {
                        result.originalData = response.data;
                        return view.transformResponse(result);
                    } else {
                        return result;
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

    // RouteData class
    // TODO this should be in standalone file probably
    function RouteData(data) {
        angular.extend(this, data);

        this.$$nextUid = 1;
        this.$$routeUpdateListeners = {};
    }

    RouteData.prototype = {
        constructor: RouteData,

        on: function on(name, listener, scope) {
            if (listener) {
                if (name === "$routeUpdate") {
                    // Register listener
                    return addListener(this.$$routeUpdateListeners, this.$$nextUid++, listener, scope);
                }

                // Ignore everything else
            }

            return angular.noop;
        },

        $$broadcast: function $$broadcast(name, args, $exceptionHandler) {
            if (name === "$routeUpdate") {
                var event = {
                    name: name,
                    preventDefault: function preventDefault() {
                        event.defaultPrevented = true;
                    },
                    defaultPrevented: false
                };

                // Prepend event
                args = [event].concat(args);

                // Fire
                angular.forEach(this.$$routeUpdateListeners, function routeUpdateBroadcast(listener) {
                    try {
                        listener.apply(null, args);
                    } catch (e) {
                        $exceptionHandler(e);
                    }
                });
            }
        }
    };

    function addListener(map, uid, listener, scope) {
        map[uid] = listener;

        // Remove function
        function listenerRemover() {
            delete map[uid];
        }

        // If there is scope, register for destroy
        if (scope) {
            var destroyRemove = scope.$on('$destroy', listenerRemover);

            return function combinedRemover() {
                listenerRemover();
                destroyRemove();
            };
        } else {
            // Return remover
            return listenerRemover;
        }
    }
});
