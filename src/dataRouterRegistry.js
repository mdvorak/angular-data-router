"use strict";

module.provider('$dataRouterRegistry', function $dataRouterRegistryProvider($$dataRouterMatchMap) {
    var provider = this;
    var views = provider.$$views = $$dataRouterMatchMap.create();

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
     */
    provider.when = function when(mediaType, config) {
        // Make our copy
        config = angular.copy(config);

        if (angular.isFunction(mediaType)) {
            // Matcher function
            views.addMatcher(mediaType, config);
        } else {
            // Normalize mimeType
            mediaType = provider.$$normalizeMediaType(mediaType);
            // Register
            views.addMatcher(mediaType, config);
        }

        return provider;
    };

    /**
     * Configures view for error page. Displayed when resource or view template cannot be loaded.
     *
     * @param config {Object} Configuration object, as in #when().
     */
    provider.error = function error(config) {
        views.addMatcher('$error', angular.copy(config));
        return provider;
    };

    /**
     * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
     * just subtype.
     *
     * @param mimeType {String} Media type to match.
     * @returns {String} Normalized media type.
     */
    provider.$$normalizeMediaType = function normalizeMediaType(mimeType) {
        if (!mimeType) return undefined;

        // Get rid of + end everything after
        mimeType = mimeType.replace(/\s*[\+;].*$/, '');

        // Prepend application/ if here is only subtype
        if (mimeType.indexOf('/') < 0) {
            mimeType = 'application/' + mimeType;
        }

        return mimeType;
    };

    // Factory
    this.$get = function $dataRouterRegistryFactory() {
        return {
            /**
             * Normalizes the media type. Removes format suffix (everything after +), and prepends application/ if there is
             * just subtype.
             *
             * @param mimeType {String} Media type to match.
             * @returns {String} Normalized media type.
             */
            normalizeMediaType: provider.$$normalizeMediaType,

            /**
             * Matches the media type against registered media types. If found, view configuration is return.
             *
             * @param mediaType {String} Media type to be matched. It will be normalized. Wildcards are not supported.
             * @returns {Object} Matched view or undefined. Note that original configuration object will be returned,
             *                   so don't modify it!
             */
            match: function match(mediaType) {
                return views.match(provider.$$normalizeMediaType(mediaType));
            },

            /**
             * Returns true  if the type matches a registered view, false if we don't know how to view it.
             *
             * @param mediaType {String} Matched content type.
             * @returns {boolean} true if type is ahs registered view, false otherwise.
             */
            isKnownType: function isKnownType(mediaType) {
                return mediaType && !!this.match(mediaType);
            }
        };
    };
});

