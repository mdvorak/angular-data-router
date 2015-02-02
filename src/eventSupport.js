"use strict";

module.factory('$$dataRouterEventSupport', function dataRouterEventSupportFactory($exceptionHandler) {
    var slice = [].slice;

    // This code is ripped of Scope class
    function EventSupport() {
    }

    EventSupport.$new = function () {
        return new EventSupport();
    };

    EventSupport.$$extend = function (dst, src) {
        // Preserve listeners
        var $$listeners = dst.$$listeners;
        angular.extend(dst, src);
        dst.$$listeners = $$listeners;

        return dst;
    };

    EventSupport.prototype = {
        constructor: EventSupport,

        $on: function (name, listener, scope) {
            if (!this.$$listeners) this.$$listeners = {};

            var namedListeners = this.$$listeners[name];
            if (!namedListeners) {
                namedListeners = this.$$listeners[name] = [listener];
            } else {
                namedListeners.push(listener);
            }

            // Remove function
            var remove = function removeFn() {
                var indexOfListener = namedListeners.indexOf(listener);
                if (indexOfListener !== -1) {
                    namedListeners[indexOfListener] = null;
                }
            };

            if (scope) {
                var removeDestroy = scope.$on('$destroy', remove);

                return function combinedRemove() {
                    remove();
                    removeDestroy();
                };
            } else {
                return remove;
            }
        },

        $broadcast: function (name, args) {
            var event = {
                name: name,
                preventDefault: function () {
                    event.defaultPrevented = true;
                },
                defaultPrevented: false
            };

            var listeners = (this.$$listeners && this.$$listeners[name]) || [];
            var i, length;

            // Prepare arguments
            args = [event].concat(slice.call(arguments, 1));

            for (i = 0, length = listeners.length; i < length; i++) {
                // if listeners were deregistered, defragment the array
                if (!listeners[i]) {
                    listeners.splice(i, 1);
                    i--;
                    length--;
                    continue;
                }

                try {
                    listeners[i].apply(null, args);
                } catch (e) {
                    $exceptionHandler(e);
                }
            }

            return event;
        }
    };

    return EventSupport;
});