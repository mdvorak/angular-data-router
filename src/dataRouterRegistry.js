"use strict";

/**
 * @ngdoc service
 * @name mdvorakDataRouter.$dataRouterRegistryProvider
 *
 * @description
 * This is the place where media types are configured to the views.
 */
module.provider('$dataRouterRegistry', function $dataRouterRegistryProvider($$dataRouterMatchMap) {
    var provider = this;
    var views = provider.$$views = $$dataRouterMatchMap.create();

    /**
     * @ngdoc method
     * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
     * @name when
     *
     * @description
     * Configures view for given content type.
     *
     * _Note: Wildcard or function matchers are much slower then exact match. The are iterated one by one, in order of registration.
     * Exact string matchers also always takes precedence over function matchers._
     *
     * @param {String|Function} mediaType Content type to match. When there is no `/` in the string, it is considered
     * subtype of `application/` type. You should not include suffixes
     * like `+json`, they are ignored by the matcher. Wildcards using `*` are supported.
     *
     * It can be function with signature `[boolean] function([string])` as well.
     *
     * @param {Object} config Configuration object, similar to ngRoute one. Allowed keys are:
     *                        `template, templateUrl, controller, controllerAs, dataAs, resolve, transformResponse`,
     *                        where either `template` or `templateUrl` must be specified.
     *                        `template` has precedence over `templateUrl`.
     *                        `controller` is optional. Can be either String reference or declaration
     *                        according to `$injector` rules. `resolve` is map of resolvables, that are
     *                        resolved before controller is created, and are injected into controller. Same behavior
     *                        as in ngRoute.
     */
    provider.when = function when(mediaType, config) {
        // Make our copy
        config = angular.copy(config);

        if (angular.isFunction(mediaType)) {
            // Matcher function
            views.addMatcher(mediaType, config);
        } else {
            // Normalize mimeType
            mediaType = provider.normalizeMediaType(mediaType);
            // Register
            views.addMatcher(mediaType, config);
        }

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
     * @param {Object} config Configuration object, as in
     * {@link mdvorakDataRouter.$dataRouterRegistryProvider#methods_when when(config)}.
     */
    provider.error = function error(config) {
        views.addMatcher('$error', angular.copy(config));
        return provider;
    };

    /**
     * @ngdoc method
     * @methodOf mdvorakDataRouter.$dataRouterRegistryProvider
     * @name normalizeMediaType
     *
     * @description
     * Normalizes the media type. Removes format suffix (everything after +), and prepends `application/` if there is
     * just subtype provided.
     *
     * @param {String} mimeType Media type to match.
     * @returns {String} Normalized media type.
     */
    provider.normalizeMediaType = function normalizeMediaType(mimeType) {
        if (!mimeType) return null;

        // Get rid of + end everything after
        mimeType = mimeType.replace(/\s*[\+;].*$/, '');

        // Prepend application/ if here is only subtype
        if (mimeType.indexOf('/') < 0) {
            mimeType = 'application/' + mimeType;
        }

        return mimeType;
    };

    /**
     * @ngdoc service
     * @name mdvorakDataRouter.$dataRouterRegistry
     */
    this.$get = function $dataRouterRegistryFactory() {
        return {
            /**
             * @ngdoc method
             * @methodOf mdvorakDataRouter.$dataRouterRegistry
             * @name normalizeMediaType
             *
             * @description
             * Normalizes the media type. Removes format suffix (everything after +), and prepends `application/` if there is
             * just subtype provided.
             *
             * @param {String} mimeType Media type to match.
             * @returns {String} Normalized media type.
             */
            normalizeMediaType: provider.normalizeMediaType,

            /**
             * @ngdoc method
             * @methodOf mdvorakDataRouter.$dataRouterRegistry
             * @name match
             *
             * @description
             * Matches the media type against registered media types. If found, view configuration is return.
             *
             * @param {String} mediaType Media type to be matched. It *MUST* be normalized, it is compared as is.
             * @returns {Object} Matched view or undefined. Note that original configuration object will be returned,
             *                   so don't modify it!
             */
            match: function match(mediaType) {
                return views.match(mediaType);
            },

            /**
             * @ngdoc method
             * @methodOf mdvorakDataRouter.$dataRouterRegistry
             * @name isKnownType
             *
             * @description
             * Determines whether type matches a registered view.
             *
             * @param {String} mediaType Matched content type. Doesn't have to be normalized.
             * @returns {boolean} `true` if type is has registered view, `false` if no match was found.
             */
            isKnownType: function isKnownType(mediaType) {
                return mediaType && !!this.match(provider.normalizeMediaType(mediaType));
            }
        };
    };
});
