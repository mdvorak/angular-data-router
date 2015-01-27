"use strict";

// RouteError exception
function RouteError(msg, status) {
    this.message = msg;
    this.status = status;
    this.stack = new Error().stack; // Includes ctor as well, byt better then nothing
}

RouteError.prototype = Object.create(Error.prototype);
RouteError.prototype.name = 'RouteError';
RouteError.prototype.constructor = RouteError;

// Helper functions
function wildcardMatcherFactory(wildcard) {
    var pattern = new RegExp('^' + wildcardToRegex(wildcard) + '$');

    // Register matcher
    return function wildcardMatcher(s) {
        return pattern.test(s);
    };
}

function wildcardToRegex(s) {
    return s.replace(/([-()\[\]{}+?.$\^|,:#<!\\])/g, '\\$1').
        replace(/\x08/g, '\\x08').
        replace(/[*]+/, '.*');
}

function normalizeMediaType(mimeType) {
    if (!mimeType) return undefined;

    // Get rid of + end everything after
    mimeType = mimeType.replace(/\s*[\+;].*$/, '');

    // Prepend application/ if here is only subtype
    if (mimeType.indexOf('/') < 0) {
        mimeType = 'application/' + mimeType;
    }

    return mimeType;
}