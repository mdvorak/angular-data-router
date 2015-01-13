"use strict";

describe("angular-data-route", function () {
    describe('hashbang mode', function () {
        // Module
        beforeEach(module('ng', function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }));

        beforeEach(module('mdvorakDataRouter'));

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


            it("should set href attribute", function () {
                var element = $compile('<a api-href="/test/data"></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('#/test/data');
                expect(element.attr('target')).toBeUndefined();
            });
        });
    });

    describe('html5 mode', function () {
        beforeEach(module('ng', function ($locationProvider) {
            $locationProvider.html5Mode(true);
        }));

        beforeEach(module('mdvorakDataRouter'));

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


            it("should set href attribute", function () {
                var element = $compile('<a api-href="/test/data"></a>')($rootScope);
                $rootScope.$digest();

                // Verify
                expect(element.attr('href')).toEqual('/test/data');
                expect(element.attr('target')).toBeUndefined();
            });
        });
    });
});
