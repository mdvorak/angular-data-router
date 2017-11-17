<a name="0.3.9"></a>
# 0.3.9

- Published NPM package `angular-data-router`

<a name="0.3.5"></a>
# 0.3.5

- Added changelog
- Added support for 'controller as' expression in route definitions ([#15](https://github.com/mdvorak/angular-data-router/issues/15)). From now on, you can use
```    
$dataRouterProvider.when('x.sample', {
    templateUrl: 'sample.html',
    controller: 'SampleCtrl as sampleCtrl'
});
```
