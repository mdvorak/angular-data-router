module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        cfg: {
            basedir: process.cwd(),
            src: '<%=cfg.basedir%>/src',
            test: '<%=cfg.basedir%>/test',
            demo: '<%=cfg.basedir%>/demo',
            build: '<%=cfg.basedir%>/build',
            dist: '<%=cfg.basedir%>/dist',
            bower: '<%=cfg.basedir%>/bower_components'
        },
        clean: {
            all: ['<%=cfg.dist%>', '<%=cfg.build%>']
        },

        // Compile
        ngAnnotate: {
            build: {
                files: [
                    {
                       '<%=cfg.build%>/dist/angular-data-router.js': '<%=cfg.src%>/angular-data-router.js'
                    }
                ]
            }
        },

        jshint: {
            browser_options: {
                browser: true,
                sub: true,
                undef: true,
                unused: 'vars',
                nonew: true,
                nonbsp: true,
                bitwise: true,

                globals: {
                    angular: true
                }
            },

            grunt: ['Gruntfile.js'],
            sources: {
                options: '<%=jshint.browser_options%>',
                files: {
                    src: ['<%=cfg.src%>/**/*.js']
                }
            },
            bundle: {
                options: '<%=jshint.browser_options%>',
                files: {
                    src: ['<%=cfg.build%>/dist/**/*.js']
                }
            },
            demo: {
                options: '<%=jshint.browser_options%>',
                files: {
                    src: ['<%=cfg.demo%>/**/*.js']
                }
            }
        },

        // Tests
        karma: {
            options: {
                frameworks: ['detectBrowsers', 'jasmine'],
                singleRun: true,
                files: [
                    // Libraries
                    '<%=cfg.bower%>/angular/angular.js',
                    '<%=cfg.bower%>/angular-mocks/angular-mocks.js',

                    // Application files
                    '<%=cfg.build%>/dist/angular-data-router.js',

                    // Tests
                    '<%=cfg.test%>/**/*.js'
                ],
                plugins: [
                    'karma-jasmine',
                    'karma-chrome-launcher',
                    'karma-firefox-launcher',
                    'karma-ie-launcher',
                    'karma-safari-launcher',
                    'karma-opera-launcher',
                    'karma-phantomjs-launcher',
                    'karma-detect-browsers'
                ]
            },
            default: {},
            debug: {
                options: {
                    singleRun: false,
                    browsers: ['Chrome']
                }
            }
        },
        
        // Release
        copy: {
             dist: {
                 files: [
                     {
                         expand: true,
                         cwd: '<%=cfg.build%>/dist',
                         dest: '<%=cfg.dist%>',
                         src: ['**/*']
                     }
                 ]
             }
        },

        // Demo
        less: {
            options: {
                cleancss: true
            },
            demo: {
                files: {
                    '<%=cfg.build%>/demo/demo.css': '<%=cfg.demo%>/demo.less'
                }
            }
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-lesslint');
    grunt.loadNpmTasks('grunt-ng-annotate');

    // Tests
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-karma');

    // Build
    grunt.loadNpmTasks('grunt-bump');

    // Tasks
    grunt.registerTask('javascript', ['jshint:sources', 'ngAnnotate', 'jshint:bundle']);
    // TODO minify

    // Public tasks
    grunt.registerTask('default', ['jshint:grunt', 'clean', 'javascript', 'karma:default']);
    grunt.registerTask('debug', ['karma:debug']);
    grunt.registerTask('demo', ['jshint:demo', 'less:demo']); // TODO
    grunt.registerTask('release', ['default', 'copy:release', 'bump']);
};
