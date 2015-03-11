"use strict";

/**
 * @ngdoc directive
 * @name mdvorakDataRouter.emptyHref
 * @kind directive
 * @restrict AC
 * @priority 0
 * @element A
 *
 * @param {Boolean} emptyHref Must be either `hide` or `disable`. Any other value is ignored and warning is logged.
 *
 * @description
 * Defines behavior when link has empty href attribute. It is complementary to {@link mdvorakDataRouter.apiHref apiHref}
 * or `ngHref` directives.
 *
 * @example
 * Usage
 * ```html
 *     <a api-href="links.example.href" empty-href="hide">Hide when no link is given</a>
 *     <a api-href="links.example.href" empty-href="disable">Disabled when no link is given</a>
 *     <a api-href="links.example.href" empty-href="disabled">Same as disable</a>
 *     <a api-href="links.example.href" empty-href="anything">Always visible and active, since attr is invalid</a>
 * ```
 */
module.directive('emptyHref', function emptyHrefFactory($log) {
    return {
        restrict: 'AC',
        priority: 0,
        link: function emptyHrefLink(scope, element, attrs) {
            var observer;

            // Modes
            switch (angular.lowercase(attrs['emptyHref'])) {
                case 'hide':
                    observer = function hrefHideObserver(href) {
                        element.toggleClass('ng-hide', !href && href !== '');
                    };
                    break;

                case 'disable':
                case 'disabled':
                    observer = function hrefDisableObserver(href, oldHref) {
                        // Handle empty string correctly
                        if (href === '') href = true;
                        if (oldHref === '') oldHref = true;

                        // Boolean value has changed
                        if (href && !oldHref) {
                            // From disabled to enabled
                            element.removeClass('disabled').off('click', disabledHandler);
                        } else if (!href && oldHref) {
                            // From enabled to disabled
                            element.addClass('disabled').on('click', disabledHandler);
                        }
                    };

                    // Fix init in disabled state
                    if (!attrs.href && attrs.href !== '') {
                        // Handler modifies the object only when change occur.
                        // But during init, oldHref is undefined, and link is not properly disabled.
                        element.addClass('disabled').on('click', disabledHandler);
                    }
                    break;

                default:
                    $log.warn("Unsupported empty-href value: " + attrs['emptyHref']);
                    return;
            }

            // Watch for href
            attrs.$observe('href', observer);

            // Disabled handler
            function disabledHandler(e) {
                e.preventDefault();
            }
        }
    };
});
