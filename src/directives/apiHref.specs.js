"use strict";

describe("mdvorakDataRouter", function () {
    describe('hashbang mode', function () {
        // Module
        beforeEach(module('mdvorakDataRouter', function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }));

        var $httpBackend;

        beforeEach(inject(function (_$httpBackend_) {
            $httpBackend = _$httpBackend_;
            $httpBackend.whenGET('').respond({});
        }));

        // apiHref
        describe("apiHref directive", function () {
            var $compile;
            var $rootScope;

            beforeEach(inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
            }));

            it("should set server-relative href attribute", function () {
                var element = $compile('<a api-href="/test/data"></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('#/test/data');
                expect(element.attr('target')).toBeUndefined();
            });

            it("should set context-relative href attribute", function () {
                var element = $compile('<a api-href="test/data"></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('#/test/data');
                expect(element.attr('target')).toBeUndefined();
            });

            it("should set #/ when api-href is equal to api prefix", function () {
                var element = $compile('<a api-href=""></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('#/');
                expect(element.attr('target')).toBeUndefined();
            });
        });
    });

    describe('html5 mode', function () {
        beforeEach(module('mdvorakDataRouter', function ($locationProvider) {
            $locationProvider.html5Mode(true);
        }));

        var $httpBackend;

        beforeEach(inject(function (_$httpBackend_) {
            $httpBackend = _$httpBackend_;
            $httpBackend.whenGET('').respond({});
        }));

        // apiHref
        describe("apiHref directive", function () {
            var $compile;
            var $rootScope;

            beforeEach(inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
            }));


            it("should set server-relative href attribute", function () {
                var element = $compile('<a api-href="/test/data"></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('test/data');
                expect(element.attr('target')).toBeUndefined();
            });

            it("should set context-relative href attribute", function () {
                var element = $compile('<a api-href="test/data"></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('test/data');
                expect(element.attr('target')).toBeUndefined();
            });

            it("should set base href when apiHref equals to apiPrefix", function () {
                var element = $compile('<a api-href=""></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('/');
                expect(element.attr('target')).toBeUndefined();
            });
        });
    });
});
