"use strict";

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
    };
});
