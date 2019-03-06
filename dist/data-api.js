/**
 * @license angular-data-router v0.3.10
 * (c) 2019 Michal Dvorak https://github.com/mdvorak/angular-data-router
 * License: MIT
 */
(function dataApiModule(angular) {
    "use strict";
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
