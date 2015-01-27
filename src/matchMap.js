"use strict";

// Note: It is constant so it can be used during config phase
module.constant('$$dataRouterMatchMap', {
    create: function create() {
        return new DataRouterMatchMap();
    }
});

/**
 * Collection of matchers, both exact and matcher functions.
 * @constructor
 */
function DataRouterMatchMap() {
    this.$exact = {};
    this.$matchers = [];

    this.addMatcher = function addMatcher(pattern, data) {
        if (angular.isFunction(pattern)) {
            this.$matchers.push({
                m: pattern,
                d: data
            });
        } else if (pattern.indexOf('*') > -1) {
            // Register matcher
            this.$matchers.push({
                m: wildcardMatcherFactory(pattern),
                d: data
            });
        } else {
            // Exact match
            this.$exact[pattern] = data;
        }
    };

    this.match = function match(s) {
        // Exact match
        var data = this.$exact[s], i, matchers;
        if (data) return data;

        // Iterate matcher functions
        for (matchers = this.$matchers, i = 0; i < matchers.length; i++) {
            if (matchers[i].m(s)) {
                return matchers[i].d;
            }
        }
    };

    // Helper functions
    function wildcardMatcherFactory(wildcard) {
        var pattern = new RegExp('^' + wildcardToRegex(wildcard) + '$');

        // Register matcher
        return function wildcardMatcher(s) {
            return pattern.test(s);
        };
    }

    function wildcardToRegex(s) {
        return s.replace(/([-()\[\]{}+?.$\^|,:#<!\\])/g, '\\$1')
            .replace(/\x08/g, '\\x08')
            .replace(/[*]+/, '.*');
    }
}
