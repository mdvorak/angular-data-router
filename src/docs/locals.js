/**
 * @ngdoc overview
 * @name locals
 * @description
 * This is not an existing module, but describes locals available in the view controllers, provided by the router.
 *
 * _Note that these locals are also available in the view resolvables._
 */

/**
 * @ngdoc service
 * @name locals.$data
 *
 * @description
 * `$data` object contains loaded data, as parsed by the `$http` service.
 *
 * @example
 * ```js
 *     module.controller('sampleCtrl', function($scope, $data) {
 *         // Set name from the loaded data to the scope
 *         $scope.name = $data.name;
 *     });
 * ```
 */

/**
 * @ngdoc service
 * @name locals.$dataUrl
 *
 * @description
 * `$dataUrl` equals to the API URL used to get the data.
 *
 * @example
 * ```js
 *     module.controller('sampleCtrl', function($scope, $dataUrl, $http) {
 *         // Delete the resource
 *         $scope.deleteSelf = function remove() {
 *             // Note that you should probably get the Location header or
 *             // something in the response and perform the redirect
 *             $http.delete($dataUrl);
 *         };
 *     });
 * ```
 */

/**
 * @ngdoc service
 * @name locals.$dataType
 *
 * @description
 * `$dataType` object contains media type of the loaded data.
 *
 * @example
 * ```js
 *     module.controller('sampleCtrl', function($scope, $dataType) {
 *         $scope.type = $dataType;
 *     });
 * ```
 */

/**
 * @ngdoc service
 * @name locals.$dataResponse
 *
 * @description
 * `$dataResponse` is the whole response object, which provides same attributes as `$http` plus some more.
 * The instance never changes for the given view, its data might however.
 *
 * ### Data refresh
 * TODO
 *
 * @example
 * ```js
 *     module.controller('sampleCtrl', function($scope, $dataResponse) {
 *         // TODO
 *     });
 * ```
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name url
 * @returns {String}
 * API URL of the loaded resource. Same as {@link locals.$dataUrl $dataUrl} object.
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name data
 * @returns {Object}
 * The loaded data. Same as {@link locals.$data $data}.
 * @description
 * Note that data can be null or pretty much anything. It is not modified by the router itself.
 */

// TODO rest of properties and methods

/**
 * @ngdoc method
 * @methodOf locals.$dataResponse
 * @name $on
 *
 * @description
 * Registers the listener for the required event.
 *
 * This behaves same as scope events, except events are not propagated.
 *
 * @param {String} name Name of the event. Currently only `$routeUpdate` makes sense.
 * @param {Function} listener Callback for the event.
 * @param {Scope=} scope If the scope is provided, listener is automatically deregistered when the scope is destroyed.
 *
 * @returns {Function} Remover function, as with scope events. Call it to deregister the listener.
 */

/**
 * @ngdoc method
 * @methodOf locals.$dataResponse
 * @name $broadcast
 *
 * @description
 * Fires the event on this object. You should not need to call this directly.
 *
 * This behaves same as scope events, except events are not propagated.
 *
 * @param {String} name Name of the event.
 * @param {Object=} args Event arguments. Any number of arguments can be specified.
 *
 * @returns {Object} Event object.
 */

/**
 * @ngdoc event
 * @eventOf locals.$dataResponse
 * @name $routeUpdate
 * @event broadcast on $dataResponse
 *
 * @param {Object} $dataResponse Reference to the self.
 *
 * @description
 * This event is fired on the `$dataResponse` instance. It notifies the listeners that data has been reloaded
 * and controller needs to update the view.
 */
