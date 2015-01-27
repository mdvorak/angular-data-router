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

