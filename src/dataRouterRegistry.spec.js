"use strict";

describe("mdvorakDataRouter", function () {
    describe("$dataRouterRegistryProvider", function () {
        var $dataRouterRegistryProvider;

        beforeEach(module('mdvorakDataRouter', function (_$dataRouterRegistryProvider_) {
            $dataRouterRegistryProvider = _$dataRouterRegistryProvider_;
        }));

        // Reference to the $dataRouterRegistry is needed so the module is initialized
        beforeEach(inject(function (_$dataRouterRegistry_) {
        }));

        // When
        describe("when", function () {
            it("should parse config and register result", function () {
                var config = {};
                var copy = {};

                // Mock
                spyOn($dataRouterRegistryProvider, '$$parseConfig').and.returnValue(copy);

                // Call
                $dataRouterRegistryProvider.when('application/test', config);

                // Verify
                expect($dataRouterRegistryProvider.$$parseConfig.calls.count()).toEqual(1);
                expect($dataRouterRegistryProvider.$$parseConfig).toHaveBeenCalledWith(config, 'application/test');

                expect($dataRouterRegistryProvider.$$views.$exact['application/test']).toBe(copy);
            });
        });

        // Error
        describe("error", function () {
            it("should parse config and register result", function () {
                var config = {};
                var copy = {};

                // Mock
                spyOn($dataRouterRegistryProvider, '$$parseConfig').and.returnValue(copy);

                // Call
                $dataRouterRegistryProvider.error(458, config);

                // Verify
                expect($dataRouterRegistryProvider.$$parseConfig.calls.count()).toEqual(1);
                expect($dataRouterRegistryProvider.$$parseConfig).toHaveBeenCalledWith(config, '$error_458');

                expect($dataRouterRegistryProvider.$$views.$exact['$error_458']).toBe(copy);
            });
        });

        // ParseConfig
        describe("$$parseConfig", function () {
            it("should create copy of the config", function () {
                var config = {foo: 1};

                // Call
                var retval = $dataRouterRegistryProvider.$$parseConfig(config, 'foo');

                // Verify
                expect(retval).not.toBe(config);
                expect(retval.foo).toEqual(config.foo);
            });

            it("should accept controller parameter", function () {
                var config = {controller: 'FooCtrl'};

                // Call
                var retval = $dataRouterRegistryProvider.$$parseConfig(config, 'foo');

                // Verify
                expect(retval).not.toBe(config);
                expect(retval.controller).toEqual(config.controller);
                expect(retval.controllerAs).toBeUndefined();
            });

            it("should not touch controllerAs parameter", function () {
                var config = {
                    controller: 'FooCtrl',
                    controllerAs: 'fooCtrl'
                };

                // Call
                var retval = $dataRouterRegistryProvider.$$parseConfig(config, 'foo');

                // Verify
                expect(retval).not.toBe(config);
                expect(retval.controller).toEqual(config.controller);
                expect(retval.controllerAs).toEqual(config.controllerAs);
            });

            it("should parse 'controller as' expression", function () {
                var config = {
                    controller: 'FooCtrl as fooCtrl'
                };

                // Call
                var retval = $dataRouterRegistryProvider.$$parseConfig(config, 'foo');

                // Verify
                expect(retval).not.toBe(config);
                expect(retval.controller).toEqual('FooCtrl');
                expect(retval.controllerAs).toEqual('fooCtrl');
                expect(config.controller).toEqual('FooCtrl as fooCtrl');
                expect(config.controllerAs).toBeUndefined();
            });

            it("should throw error when both 'controller as' and controllerAs are used", function () {
                var config = {
                    controller: 'FooCtrl as fooCtrl',
                    controllerAs: 'fooCtrl'
                };

                // Call
                expect(function () {
                    $dataRouterRegistryProvider.$$parseConfig(config, 'foo');
                }).toThrowError(/Defined both controllerAs and 'controller as' expressions for route/);
            });

            it("should throw error when controller parameter is invalid", function () {
                expect(function () {
                    $dataRouterRegistryProvider.$$parseConfig({
                        controller: 'Foo Ctrl'
                    }, 'foo');
                }).toThrowError(/Badly formed controller string/);

                expect(function () {
                    $dataRouterRegistryProvider.$$parseConfig({
                        controller: 'FooCtrl as '
                    }, 'foo');
                }).toThrowError(/Badly formed controller string/);

                expect(function () {
                    $dataRouterRegistryProvider.$$parseConfig({
                        controller: 'FooCtrl as d d'
                    }, 'foo');
                }).toThrowError(/Badly formed controller string/);
            });
        });
    });
});
