NG_DOCS={
  "sections": {
    "api": "Angular Data Router Documentation"
  },
  "pages": [
    {
      "section": "api",
      "id": "locals",
      "shortName": "locals",
      "type": "overview",
      "moduleName": "locals",
      "shortDescription": "This is not an existing module, but describes locals available in the view controllers, provided by the router.",
      "keywords": "_note api controllers describes existing locals module overview provided resolvables router view"
    },
    {
      "section": "api",
      "id": "locals.$data",
      "shortName": "locals.$data",
      "type": "service",
      "moduleName": "locals",
      "shortDescription": "$data object contains loaded data, as parsed by the $http service.",
      "keywords": "$data $http $scope api controller data function js loaded locals module object parsed samplectrl scope service set"
    },
    {
      "section": "api",
      "id": "locals.$dataResponse",
      "shortName": "locals.$dataResponse",
      "type": "service",
      "moduleName": "locals",
      "shortDescription": "$dataResponse is the whole response object, which provides same attributes as $http plus some more.",
      "keywords": "$broadcast $data $dataresponse $dataurl $error $http $on $routechange $routeupdate $scope actual alternative api application args argument arguments attributes automatic automatically behaves behavior call callback called calling case change changed changes code config configuration controller copy corresponds created currently data dataas depends deregister deregistered deregistration destroyed directly don error errors event events events_ example fails false fired fires forcereload full function handler handles headers http including instance js lifecycle listen listener load loaded locals main matched media mediatype method methods_reload modified modify module normalized note null number object occur parameter pass performed performs pretty programatic propagated property provided recompiled recreate recreated refresh refreshed registers reload reloading reloads remains remover request required resource response route router routeupdatelistener samplectrl scope sense service set signature special status statustext stores succeeds text true type undefined update updated updates url variable view watches"
    },
    {
      "section": "api",
      "id": "locals.$dataType",
      "shortName": "locals.$dataType",
      "type": "service",
      "moduleName": "locals",
      "shortDescription": "$dataType object contains media type of the loaded data.",
      "keywords": "$datatype $scope api controller data function js loaded locals media module object samplectrl service type"
    },
    {
      "section": "api",
      "id": "locals.$dataUrl",
      "shortName": "locals.$dataUrl",
      "type": "service",
      "moduleName": "locals",
      "shortDescription": "$dataUrl equals to the API URL used to get the data.",
      "keywords": "$dataurl $http $scope api controller data delete deleteself equals function header js locals location module note perform redirect remove resource response samplectrl service url"
    },
    {
      "section": "api",
      "id": "mdvorakDataApi",
      "shortName": "mdvorakDataApi",
      "type": "overview",
      "moduleName": "mdvorakDataApi",
      "shortDescription": "This is standalone module that allows two-way mapping of view and API URLs.",
      "keywords": "$dataapiprovider allows api details mapping mdvorakdataapi module overview provider standalone two-way urls view"
    },
    {
      "section": "api",
      "id": "mdvorakDataApi.$dataApi",
      "shortName": "mdvorakDataApi.$dataApi",
      "type": "service",
      "moduleName": "mdvorakDataApi",
      "shortDescription": "Extension of Angular $location. It maps view URLs to API and vice versa.",
      "keywords": "$dataapi $location absolute account angular api base behavior browser change changed configuration configured context counterpart current currently default dependent error expected extension full hostname href html5 http includes including inside internally location logged mapapitoview maps mapviewtoapi mdvorakdataapi method methods_mapapitoview methods_mapviewtoapi methods_url mode modifies namespace normalized normalizes normalizeurl note null overridden path paths performs point prefix relative requests resource returned returns server-relative service set sets tag takes url urls versa vice view viewed"
    },
    {
      "section": "api",
      "id": "mdvorakDataApi.$dataApiProvider",
      "shortName": "mdvorakDataApi.$dataApiProvider",
      "type": "service",
      "moduleName": "mdvorakDataApi",
      "shortDescription": "Provider allows you to configure API prefix.",
      "keywords": "$dataapi $dataapiprovider $datarouterprovider $location _note absolute account allows anchor api apiprefix attribute base behave behaves behavior browser cases configuration configure configured configures context counterpart current default dependent expected full hostname href html5 http ignored includes including inside mapapitoview mapping maps mapviewtoapi mdvorakdataapi mdvorakdatarouter method methods_apiprefix methods_mapapitoview methods_mapviewtoapi methods_normalizeurl methods_prefix mode namespace normalized normalizes normalizeurl note null object overridden path paths prefix provider relative requests resource returned server-relative service shortcut starts tag takes url view weird"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter",
      "shortName": "mdvorakDataRouter",
      "type": "overview",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Angular Data Router module. You should configure it using",
      "keywords": "$datarouterprovider angular api configure data mdvorakdataapi mdvorakdatarouter module overview router"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.$dataRouter",
      "shortName": "mdvorakDataRouter.$dataRouter",
      "type": "service",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Centerpiece of the data router. It tracks the $location and loads the main view data.",
      "keywords": "$dataapi $dataresponse $datarouter $datarouterregistry $location api cases centerpiece controller current currently data easier instance life loaded loads locals main mdvorakdataapi mdvorakdatarouter note object property reference registry response router service signature tracks view work"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.$dataRouterLoader",
      "shortName": "mdvorakDataRouter.$dataRouterLoader",
      "type": "service",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Abstraction of data loading and view preparation. It uses views registered in",
      "keywords": "$datarouterloader $datarouterregistry abstraction allows api application completely content current data displayed doesn eagerly false fetched fetches finally flag forcereload format including indicating initialized loaded loading loads locals match mdvorakdatarouter media mediatype method mimetype normalized normalizemediatype normalizes parameter prefetch prefetchtemplate preparation prepares prepareview prepends promise provided registered reloaded removes resolvables resolves response returned returns routedataupdate service set subtype suffix template type unknown update url view views"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.$dataRouterLoaderProvider",
      "shortName": "mdvorakDataRouter.$dataRouterLoaderProvider",
      "type": "service",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Provider allows configuration of loading and resolving views. Note that media types are registered in",
      "keywords": "$data $datarouter $datarouterloader $datarouterloaderprovider $datarouterregistryprovider $http _links _note _type additional allows api application config configuration content-type controllers currently custom data default details directly documentation ease empty example extracts extracttype extracttypefromjson function global header href implementation js key load loading mdvorakdatarouter media merged method normalized note null object precedence property provided provider reference registered relateddata resolve resolving response return returns routes service sets supported type types url view views"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.$dataRouterProvider",
      "shortName": "mdvorakDataRouter.$dataRouterProvider",
      "type": "service",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Allows simple configuration of all parts of the data router in one place.",
      "keywords": "$dataapiprovider $datarouterloaderprovider $datarouterprovider $datarouterregistryprovider absolute alias allows angular api apiprefix application argument base changed code config configrouter configuration configures content controller currently data dataas default defined details disable disables displayed documentation enabled enables error event example examplectrl fails false force forces generic global handling href html http includes intended javascript key loaded location mapping match mdvorakdataapi mdvorakdatarouter mediatype merged method methods_error methods_global methods_prefix methods_when module normalized object optional parameters parts path phase place precedence prefix prefixes provider redirect redirected redirectto reference relative resolvables resolve resource response returns route router routes service set sets simple status supported supports template templateurl tests type unit url view wildcards"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.$dataRouterRegistry",
      "shortName": "mdvorakDataRouter.$dataRouterRegistry",
      "type": "service",
      "moduleName": "mdvorakDataRouter",
      "keywords": "$datarouterregistry api application compared configuration content determines doesn don false format isknowntype match matched matches mdvorakdatarouter media mediatype method mimetype modify normalized normalizemediatype normalizes note object original prepends provided registered removes return returned service subtype suffix true type types undefined view"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.$dataRouterRegistryProvider",
      "shortName": "mdvorakDataRouter.$dataRouterRegistryProvider",
      "type": "service",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "This is the place where media types are configured to the views.",
      "keywords": "$datarouterregistryprovider $injector _note allowed api application argument behavior code config configuration configured configures considered content controller controlleras created dataas declaration defined displayed error exact fails format function generic http ignored include injected iterated loaded map match matcher matchers mdvorakdatarouter media mediatype method methods_when mimetype ngroute normalized normalizemediatype normalizes object optional order place precedence prepends provided reference registration removes resolvables resolve resolved resource response responseas rules service signature slower status string subtype suffix suffixes supported takes template templateurl transformresponse type types view views wildcard wildcards"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.apiHref",
      "shortName": "mdvorakDataRouter.apiHref",
      "type": "directive",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Translates API URL into view URL and sets it as href. It is replacement for ngHref directive.",
      "keywords": "$datarouterprovider $scope _blank _self ac angular api api-href apihref apiprefix application attribute base behave behavior browser case changes code config configured controller data detail directive download downloaded error example external force full function hasbang href html html5mode ignored image inside js link links mapped maps mdvorakdatarouter media mode module navigates navigation ng-controller nghref opens optional parent performed performs points prefetched redirect reload replacement resource sample samplectrl scenarios screen server set sets specification supported supports target template templateurl translates triggers type url users view window"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.dataview",
      "shortName": "mdvorakDataRouter.dataview",
      "type": "directive",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Renders the view for the given data. This directive works in two modes.",
      "keywords": "$anchorscroll $dataapi api applies attribute autoscroll browser call configured context current data dataview directive displayed displays eac form handler loaded location main mapped mapviewtoapi mdvorakdataapi mdvorakdatarouter method methods_mapviewtoapi modes onload published renders resource scope scroll set src updated url view viewport works"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.emptyHref",
      "shortName": "mdvorakDataRouter.emptyHref",
      "type": "directive",
      "moduleName": "mdvorakDataRouter",
      "shortDescription": "Defines behavior when link has empty href attribute. It is complementary to apiHref",
      "keywords": "ac active api api-href apihref attr attribute behavior complementary defines directive directives disable disabled empty empty-href emptyhref example hide href html ignored invalid link links logged mdvorakdatarouter nghref usage visible warning"
    },
    {
      "section": "api",
      "id": "mdvorakDataRouter.entryPointHref",
      "shortName": "mdvorakDataRouter.entryPointHref",
      "type": "directive",
      "moduleName": "mdvorakDataRouter",
      "keywords": "$location ac api api-href application behavior calling conjuction directive entry-point entrypointhref generates link mdvorakdatarouter ng-href path produces root"
    }
  ],
  "apis": {
    "api": true
  },
  "html5Mode": false,
  "editExample": true,
  "startPage": "/api",
  "scripts": [
    "angular.min.js",
    "angular-animate.min.js",
    "angular-data-router.js"
  ]
};