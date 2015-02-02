"use strict";

/**
 * @ngdoc service
 * @name mdvorakDataRouter.$dataRouterProvider
 *
 * @description
 * Allows simple configuration of all parts of the data router in one place.
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
     * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
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
     * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
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
     * @param {Object} config Configuration object, as in
     * {@link mdvorakDataRouter.$dataRouterRegistryProvider#methods_when when(config)}.
     */
    provider.error = function error(config) {
        $dataRouterRegistryProvider.error(angular.copy(config));
        return provider;
    };

    /**
     * @ngdoc method
     * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
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
    this.$get = function $dataRouterFactory($log, $location, $rootScope, $q, $dataRouterRegistry, $dataRouterLoader, $dataApi, $$dataRouterEventSupport) {
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
             *
             * @description
             * Reference to the {@link mdvorakDataApi.$dataApi $dataApi} instance. Its here to make your life easier.
             */
            api: $dataApi,

            /**
             * @ngdoc property
             * @propertyOf mdvorakDataRouter.$dataRouter
             * @name registry
             *
             * @description
             * Reference to the {@link mdvorakDataRouter.$dataRouterRegistry $dataRouterRegistry} instance.
             * Its here to make your life easier.
             */
            registry: $dataRouterRegistry,

            /**
             * @ngdoc property
             * @propertyOf mdvorakDataRouter.$dataRouter
             * @name current
             *
             * @description
             * Currently loaded response for the main view is available here.
             *
             * Note that you should in most cases use `$dataResponse` object in the controller to work with the
             * data instead of this reference.
             */
            current: undefined,

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
