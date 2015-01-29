"use strict";

module.provider('$dataRouter', function $dataRouterProvider($$dataRouterMatchMap, $dataRouterRegistryProvider, $dataRouterLoaderProvider, $apiMapProvider) {
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

    this.$get = function $dataRouterFactory($log, $location, $rootScope, $q, $dataRouterRegistry, $dataRouterLoader, $apiMap) {
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

                            // Update current
                            // TODO CANNOT DO THIS WITH SCOPES
                            angular.extend($dataRouter.current, response);

                            // Fire event on the response (only safe way for both main view and fragments)
                            $dataRouter.current.$broadcast('$routeUpdate', response);
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
    };
});
