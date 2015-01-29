"use strict";

angular.module('mdvorakApiRoute', []).provider('$apiRoute', function $apiRouteProvider() {
    var provider = this;
    // Intentionally using document object instead of $document
    var urlParsingNode = document.createElement("A");

    /**
     * Api prefix variable. Do not modify directly, use accessor function.
     *
     * @type {string}
     * @protected
     */
    provider.$apiPrefix = provider.normalizeUrl('');

    /**
     * Configures prefix for default view to resource mapping.
     *
     * @param prefix {String} Relative URL prefix, relative to base href.
     * @return {String} API URL prefix. It's absolute URL, includes base href.
     */
    provider.prefix = function apiPrefix(prefix) {
        if (arguments.length > 0) {
            provider.$apiPrefix = provider.normalizeUrl(prefix);
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
        url = provider.normalizeUrl(url);

        if (url && url.indexOf(provider.$apiPrefix) === 0) {
            return url.substring(provider.$apiPrefix.length);
        }

        // Unable to map
        return null;
    };

    /**
     * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
     *
     * @param href {String} URL to be normalized. Can be absolute, server-relative or context relative.
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


    this.$get = function $apiRouteFactory($log, $location) {
        $log.debug("Using API prefix " + provider.$apiPrefix);

        var $apiRoute = {
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
             * Gets or sets current view resource url.
             *
             * @param url {String?} New resource url. Performs location change.
             * @returns {String} Resource url that is being currently viewed.
             */
            url: function urlFn(url) {
                // Getter
                if (arguments.length < 1) {
                    return $apiRoute.mapViewToApi($location.path());
                }

                // Setter
                var path = $apiRoute.mapApiToView(url);

                if (path) {
                    $location.path(path);
                    return url;
                }
            },

            /**
             * Normalizes the URL for current page. It takes into account base tag etc. It is browser dependent.
             *
             * @param href {String} URL to be normalized. Can be absolute, server-relative or context relative.
             * @returns {String} Normalized URL, including full hostname.
             */
            normalizeUrl: function normalizeUrl(href) {
                return provider.normalizeUrl(href);
            }
        };

        return $apiRoute;
    };
});
