"use strict";

describe("mdvorakDataApi", function () {
    describe("$dataApiProvider", function () {
        var host = location.href.match(/^\w+:\/\/[^\/]+\//)[0];
        var $dataApiProvider;

        beforeEach(module('mdvorakDataApi', function (_$dataApiProvider_) {
            $dataApiProvider = _$dataApiProvider_;
        }));

        // Needed so the module is initialized
        beforeEach(inject(function ($dataApi) {
        }));

        // Tests
        describe("normalizeUrl", function () {
            it("should return null for undefined or null", function () {
                expect($dataApiProvider.normalizeUrl(null)).toBe(null);
                expect($dataApiProvider.normalizeUrl(undefined)).toBe(null);
            });

            it("should return hostname for empty string", function () {
                expect($dataApiProvider.normalizeUrl('')).toBe(host);
            });

            it("should correctly treat base-relative URL", function () {
                expect($dataApiProvider.normalizeUrl('foo/415')).toBe(host + 'foo/415');
            });

            it("should correctly treat server-relative URL", function () {
                expect($dataApiProvider.normalizeUrl('/foo/415')).toBe(host + 'foo/415');
            });

            it("should not modify absoulte URL", function () {
                expect($dataApiProvider.normalizeUrl('https://tests:11/foo')).toBe('https://tests:11/foo');
            });

            it("should normalize port of absolute URL", function () {
                expect($dataApiProvider.normalizeUrl('https://tests:443/foo')).toBe('https://tests/foo');
            });

            it("should retain URL parameters", function () {
                expect($dataApiProvider.normalizeUrl('foo/415?moo=451&boo=aaa')).toBe(host + 'foo/415?moo=451&boo=aaa');
            });

            it("should retain hash in the URL", function () {
                expect($dataApiProvider.normalizeUrl('foo/415#someid')).toBe(host + 'foo/415#someid');
            });

            it("should retain both URL parameters and hash", function () {
                expect($dataApiProvider.normalizeUrl('foo/415?moo=451&boo=aaa#someid')).toBe(host + 'foo/415?moo=451&boo=aaa#someid');
            });
        });

        describe("prefix", function () {
            it("should return current prefix when called without arguments", function () {
                expect($dataApiProvider.prefix()).toBe(host);
            });

            it("should set $apiPrefix variable to normalized value", function () {
                // Mock
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue('http://test/normalized');

                // Test
                expect($dataApiProvider.prefix('something')).toBe('http://test/normalized');
                expect($dataApiProvider.$apiPrefix).toBe('http://test/normalized');

                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('something');
            });
        });

        describe("mapViewToApi", function () {
            it("should add prefix to view URL with view correctly starting with /", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';

                // Test
                expect($dataApiProvider.mapViewToApi('/bar/44')).toBe('http://foo/api/bar/44');
            });

            it("should add prefix to view URL with view badly not starting with /", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';

                // Test
                expect($dataApiProvider.mapViewToApi('bar/44')).toBe('http://foo/api/bar/44');
            });

            it("should retain search parameters and hash", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';

                // Test
                expect($dataApiProvider.mapViewToApi('bar/44?foo=23&moo=asd#rest')).toBe('http://foo/api/bar/44?foo=23&moo=asd#rest');
            });
        });

        describe("mapApiToView", function () {
            it("should return null when URL is not part of API", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue('http://test/external');

                // Test
                expect($dataApiProvider.mapApiToView('external')).toBe(null);
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('external');
            });

            it("should return null when URL cannot be normalized for some reason", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue(null);

                // Test
                expect($dataApiProvider.mapApiToView('/foo')).toBe(null);
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('/foo');
            });

            it("should return null when URL is null", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue(null);

                // Test
                expect($dataApiProvider.mapApiToView(null)).toBe(null);
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith(null);
            });

            it("should return empty string if URL equals to prefix", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue('http://foo/api/');

                // Test
                expect($dataApiProvider.mapApiToView('http://foo/api/')).toBe('');
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('http://foo/api/');
            });

            it("should return view URL", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue('http://foo/api/boo/444');

                // Test
                expect($dataApiProvider.mapApiToView('http://foo/api/boo/444')).toBe('boo/444');
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('http://foo/api/boo/444');
            });

            it("should retain URL parameters and hash", function () {
                $dataApiProvider.$apiPrefix = 'http://foo/api/';
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue('http://foo/api/boo/444?moo=33&goo=xxx#itrules');

                // Test
                expect($dataApiProvider.mapApiToView('http://foo/api/boo/444?moo=33&goo=xxx#itrules')).toBe('boo/444?moo=33&goo=xxx#itrules');
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('http://foo/api/boo/444?moo=33&goo=xxx#itrules');
            });
        });
    });

    describe("$dataApi", function () {
        var $dataApiProvider, $dataApi;

        beforeEach(module('mdvorakDataApi', function (_$dataApiProvider_) {
            $dataApiProvider = _$dataApiProvider_;
        }));

        beforeEach(inject(function (_$dataApi_) {
            $dataApi = _$dataApi_;
        }));

        // Tests
        describe("normalizeUrl", function () {
            it("should call provider implementation", function () {
                // Mock
                spyOn($dataApiProvider, "normalizeUrl").and.returnValue('foo://boo/moo');

                // Test
                expect($dataApi.normalizeUrl('foo')).toBe('foo://boo/moo');
                expect($dataApiProvider.normalizeUrl).toHaveBeenCalledWith('foo');
            });
        });

        describe("mapViewToApi", function () {
            it("should call provider implementation", function () {
                // Mock
                spyOn($dataApiProvider, "mapViewToApi").and.returnValue('http://test/boo/21');

                // Test
                expect($dataApi.mapViewToApi('/boo/21')).toBe('http://test/boo/21');
                expect($dataApiProvider.mapViewToApi).toHaveBeenCalledWith('/boo/21');
            });
        });

        describe("mapApiToView", function () {
            it("should call provider implementation", function () {
                // Mock
                spyOn($dataApiProvider, "mapApiToView").and.returnValue('/boo/21');

                // Test
                expect($dataApi.mapApiToView('http://test/boo/21')).toBe('/boo/21');
                expect($dataApiProvider.mapApiToView).toHaveBeenCalledWith('http://test/boo/21');
            });
        });

        describe("prefix", function () {
            it("should call provider implementation", function () {
                // Mock
                spyOn($dataApiProvider, "prefix").and.returnValue('/boo');

                // Test
                expect($dataApi.prefix()).toBe('/boo');
                expect($dataApiProvider.prefix).toHaveBeenCalledWith();
            });

            it("should not allow change of the prefix", function () {
                // Mock
                spyOn($dataApiProvider, "prefix").and.returnValue('/boo');

                // Test
                expect($dataApi.prefix('XXXX')).toBe('/boo');
                expect($dataApiProvider.prefix).toHaveBeenCalledWith();
            });
        });

        describe("url", function () {
            var $location;

            beforeEach(inject(function (_$location_) {
                $location = _$location_;
            }));

            it("should return view url mapped to API", function () {
                // Mock
                spyOn($location, "url").and.returnValue('/foo/bar');
                spyOn($dataApiProvider, "mapViewToApi").and.returnValue('http://test/api/foo/bar');

                // Test
                expect($dataApi.url()).toBe('http://test/api/foo/bar');

                expect($location.url).toHaveBeenCalledWith();
                expect($dataApiProvider.mapViewToApi).toHaveBeenCalledWith('/foo/bar');
            });

            it("should return view url with parameters and hash", function () {
                // Mock
                spyOn($location, "url").and.returnValue('/foo/bar?moo=555&boo=asd#something');
                spyOn($dataApiProvider, "mapViewToApi").and.returnValue('http://test/api/foo/bar?moo=555&boo=asd#something');

                // Test
                expect($dataApi.url()).toBe('http://test/api/foo/bar?moo=555&boo=asd#something');

                expect($location.url).toHaveBeenCalledWith();
                expect($dataApiProvider.mapViewToApi).toHaveBeenCalledWith('/foo/bar?moo=555&boo=asd#something');
            });

            it("should set view to mapped API URL", function () {
                // Mock
                spyOn($location, "url");
                spyOn($dataApiProvider, "mapApiToView").and.returnValue('/foo/bar');

                // Test
                expect($dataApi.url('http://test/api/foo/bar')).toBe('http://test/api/foo/bar');

                expect($location.url).toHaveBeenCalledWith('/foo/bar');
                expect($dataApiProvider.mapApiToView).toHaveBeenCalledWith('http://test/api/foo/bar');
            });

            it("should do nothing when URL cannot be mapped to API", function () {
                // Mock
                spyOn($location, "url");
                spyOn($dataApiProvider, "mapApiToView").and.returnValue(null);

                // Test
                expect($dataApi.url('http://test/api/foo/bar')).toBe(undefined);

                expect($location.url.calls.count()).toBe(0);
                expect($dataApiProvider.mapApiToView).toHaveBeenCalledWith('http://test/api/foo/bar');
            });
        });
    });
});
