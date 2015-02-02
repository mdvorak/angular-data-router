"use strict";

/**
 * @ngdoc service
 * @name mdvorakDataRouter.$dataRouterProvider
 */
module.provider('$dataRouter', function $dataRouterProvider($$dataRouterMatchMap, $dataRouterRegistryProvider, $dataRouterLoaderProvider, $dataApiProvider) {
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
     * @param {String} prefix Relative URL prefix, relative to base href.
     * @return {String} API URL prefix. It's absolute URL, includes base href.
     */
    provider.apiPrefix = function apiPrefix(prefix) {
        return $dataApiProvider.prefix(prefix);
    };

    /**
     * Configures view for given content type.
     * <p>
     * Note: Wildcard or function matchers are much slower then exact match. The are iterated one by one, in order of registration.
     * Exact string matchers takes always precedence over function matchers.
     *
     * @param {String|Function} mediaType Content type to match. When there is no / in the string, it is considered
     *                                    subtype of `application/` type. You should not include suffixes
     *                                    like `+json`, it is ignored by the matcher. Wildcards are supported.
     *                                    <p>
     *                                    It can be function with signature [Boolean] function([String]) as well.
     * @param {Object} config Configuration object, similar to ngRoute one. Allowed keys are:
     *                        `template, templateUrl, controller, controllerAs, dataAs, resolve`,
     *                        where either `template` or `templateUrl` must be specified.
     *                        `template` has precedence over `templateUrl`.
     *                        `controller` is optional. Can be either String reference or declaration
     *                        according to $injector rules. `resolve` is map of resolvables, that are
     *                        resolved before controller is created, and are injected into controller. Same behavior
     *                        as in ngRoute.
     * @returns {Object} Returns the provider.
     */
    provider.when = function when(mediaType, config) {
        $dataRouterRegistryProvider.when(mediaType, config);
        return provider;
    };

    /**
     * Configures view for error page. Displayed when resource or view template cannot be loaded.
     *
     * @param {Object} config Configuration object, as in #when().
     * @returns {Object} Returns the provider.
     */
    provider.error = function error(config) {
        $dataRouterRegistryProvider.error(angular.copy(config));
        return provider;
    };

    /**
     * Forces redirect from one view to another.
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
     * _Note: This is just shortcut for {@link mdvorakDataRouter.$dataRouterLoaderProvider#methods_global $dataRouterLoaderProvider.global(config)},
     * see its documentation for details._
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

    this.$get = function $dataRouterFactory($log, $location, $rootScope, $q, $dataRouterRegistry, $dataRouterLoader, $dataApi, $$dataRouterEventSupport) {
        var $dataRouter = {
            /**
             * @ngdoc property
             * @name api
             *
             * @description
             * Reference to the {@link mdvorakDataRouter.$dataApi} instance. Its here to make your life easier.
             */
            api: $dataApi,

            /**
             * @ngdoc property
             * @name registry
             *
             * @description
             * Reference to the {@link mdvorakDataRouter.$dataRouterRegistry} instance. Its here to make your life easier.
             */
            registry: $dataRouterRegistry,

            /**
             * Reloads data at current location. If content type remains same, only data are refreshed,
             * and $routeUpdate event is invoked on $dataResponse object. If content type differs,
             * full view refresh is performed (that is, controller is destroyed and recreated).
             * <p>
             * If you refresh data, you must listen to the $routeUpdate event on $dataResponse object to be notified of the change.
             *
             * @param {boolean=} forceReload If true, page is always refreshed (controller recreated). Otherwise only
             *                               when needed.
             */
            $$reload: function reload(forceReload) {
                var path = $location.path() || '/';
                var redirectTo;
                var url;
                var next = $dataRouter.$$next = {};

                // Forced redirect
                if ((redirectTo = provider.$redirects.match(path))) {
                    $log.debug("Redirecting to " + redirectTo);
                    $location.path(redirectTo).replace();
                    return;
                }

                // Load resource
                url = $dataApi.mapViewToApi($location.path());

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

                            // Add reload implementation
                            response.reload = $dataRouter.$$reload;

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
                $dataRouter.$$reload(true);
            });
        }

        return $dataRouter;
    };
});
