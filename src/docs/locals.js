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
 * ## Data reloading
 * You can reload the data of this view by calling {@link locals.$dataResponse#methods_reload reload(boolean)} method.
 * Router handles everything for you as if it would be first load, including errors.
 *
 * When you pass `true` as the argument, your view controller will always be destroyed and recreated, and view recompiled.
 * If the view is main view, route change lifecycle will occur (`$routeChange*` events will be fired).
 *
 * When you pass `false` or `undefined`, behavior depends on the response. If request succeeds, the media type and URL
 * does not change, the {@link locals.$dataResponse#events_$routeUpdate $routeUpdate} event will be fired and it is up
 * to the controller to update the view (note that if you are using `dataAs` view configuration, scope variable will be
 * updated automatically). If something changes (when request fails, media type of the response is `$error`), full
 * reload is performed, as if you would pass `true` as the argument.
 *
 * ### Example
 * ```js
 *     module.controller('sampleCtrl', function($scope, $dataResponse) {
 *         $scope.data = $dataResponse.data;
 *
 *         // Listen for updates
 *         $dataResponse.$on('$routeUpdate', function routeUpdateListener() {
 *             // Update the data
 *             $scope.data = $dataResponse.data;
 *         });
 *
 *         // Reload handler
 *         $scope.refresh = function refresh() {
 *             $dataResponse.reload();
 *         };
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

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name config
 * @returns {Object}
 * Configuration object from `$http` request.
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name mediaType
 * @returns {String}
 * Normalized media type of the response. For error view, it has special value `$error`.
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name status
 * @returns {Number}
 * Status code of the response. Same as in `$http` response.
 * @description
 * Corresponds to the HTTP response status code. Special case is if there was application error, this is set to `999`.
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name statusText
 * @returns {String}
 * Status text of the response. Same as in `$http` response.
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name headers
 * @returns {Function}
 * Headers the response. Same as in `$http` response.
 */

/**
 * @ngdoc property
 * @propertyOf locals.$dataResponse
 * @name view
 * @returns {Object}
 * View configuration. This is actual configuration (not a copy), so don't modify in any case!
 * @description
 * Configuration of the matched view.
 */

/**
 * @ngdoc method
 * @methodOf locals.$dataResponse
 * @name reload
 *
 * @description
 * Reloads the data of the view. By the parameter you can specify, whether you want to just reload the data
 * or always recreate the view. Note that even when you don't want to recreate the view, if the media type changes,
 * new view is always created.
 *
 * @param {boolean=} forceReload If true, view is always refreshed (controller recreated). Otherwise it is recreated
 * only if media type of the response changes. If the view remains same,
 * {@link locals.$dataResponse#events_$routeUpdate $routeUpdate} event is fired and it is up to the controller to update
 * the view.
 */

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
 * @ngdoc method
 * @methodOf locals.$dataResponse
 * @name dataAs
 *
 * @description
 * Stores the data object (and watches for {@link locals.$dataResponse#events_$routeUpdate $routeUpdate} event)
 * in the scope. Performs automatic listener deregistration when the scope is destroyed.
 *
 * This is programatic alternative for view configuration `dataAs`.
 *
 * @param {Scope} scope Scope where the data will be set to.
 * @param {String} name Name of the data object.
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
