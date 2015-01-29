"use strict";

module.provider('$dataRouter', function $dataRouterProvider($$dataRouterMatchMap, $dataRouterRegistryProvider, $dataRouterLoaderProvider) {
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
     * Api prefix variable. Do not modify directly, use accessor function.
     *
     * @type {string}
     * @protected
     */
    provider.$apiPrefix = $dataRouterLoaderProvider.$$normalizeUrl('');

    /**
     * Configures prefix for default view to resource mapping.
     *
     * @param prefix {String} Relative URL prefix, relative to base href.
     * @return {String} API URL prefix. It's absolute URL, includes base href.
     */
    provider.apiPrefix = function apiPrefix(prefix) {
        if (arguments.length > 0) {
            provider.$apiPrefix = $dataRouterLoaderProvider.$$normalizeUrl(prefix);
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
        url = $dataRouterLoaderProvider.$$normalizeUrl(url);

        if (url && url.indexOf(provider.$apiPrefix) === 0) {
            return url.substring(provider.$apiPrefix.length);
        }

        // Unable to map
        return null;
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

    this.$get = function $dataRouterFactory($log, $location, $rootScope, $q, $exceptionHandler, $dataRouterRegistry, $dataRouterLoader) {
        $log.debug("Using api prefix " + provider.$apiPrefix);

        var $dataRouter = {
            /**
             * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
             * just subtype.
             *
             * @param mimeType {String} Media type to match.
             * @returns {String} Normalized media type.
             */
            normalizeMediaType: $dataRouterRegistry.normalizeMediaType,

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
             * Returns true  if the type matches a registered view, false if we don't know how to view it.
             *
             * @param mediaType {String} Matched content type.
             * @returns {boolean} true if type is ahs registered view, false otherwise.
             */
            isKnownType: function isKnownType(mediaType) {
                return $dataRouterRegistry.isKnownType(mediaType);
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
                    return $dataRouter.mapViewToApi($location.path());
                }

                // Setter
                var path = $dataRouter.mapApiToView(url);

                if (path) {
                    $location.path(path);
                    return url;
                }
            },

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
                var next = $dataRouter.next = {};

                // Home redirect
                if ((redirectTo = provider.$redirects.match(path))) {
                    $log.debug("Redirecting to " + redirectTo);
                    $location.path(redirectTo).replace();
                    return;
                }

                // Load resource
                url = $dataRouter.mapViewToApi($location.path());
                $log.debug("Loading resource " + url);

                // Load data and view
                $dataRouterLoader.prepareView(url, $dataRouter.current, forceReload)
                    .then(showView, routeChangeFailed);

                // Promise resolutions
                function showView(response) {
                    if ($dataRouter.next === next) {
                        // Remove marker
                        $dataRouter.next = undefined;

                        // Update view data
                        if (response.$routeDataUpdate && $dataRouter.current) {
                            $log.debug("Replacing current data");

                            // Update current
                            angular.extend($dataRouter.current, response);

                            // Fire event on the response (only safe way for both main view and fragments)
                            $dataRouter.current.$$broadcast('$routeUpdate', [response], $exceptionHandler);
                        } else {
                            $log.debug("Setting view to " + response.mediaType);

                            // Set current
                            $dataRouter.current = response;

                            // Emit event
                            $rootScope.$broadcast('$routeChangeSuccess', response);
                        }
                    }
                }

                function routeChangeFailed(response) {
                    // Error handler
                    if ($dataRouter.next === next) {
                        // Remove next, but don't update current
                        $dataRouter.next = undefined;

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
