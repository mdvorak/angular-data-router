<a name="0.3.5"></a>
# 0.3.5

- Added changelog
- Added support for 'controller as' expression in route definitions (#15). From now on, you can use
    
    $dataRouterProvider.when('x.sample', {
        templateUrl: 'sample.html',
        controller: 'SampleCtrl as sampleCtrl'
    });
