module.exports = function (grunt) {
    // Load tasks
    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

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
            build: ['<%=cfg.build%>'],
            dist: ['<%=cfg.dist%>']
        },

        // Validate
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
            src: {
                options: '<%=jshint.browser_options%>',
                files: {
                    src: ['<%=cfg.src%>/**/*.js']
                }
            },
            demo: {
                options: '<%=jshint.browser_options%>',
                files: {
                    src: ['<%=cfg.demo%>/**/*.js']
                }
            }
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
        uglify: {
            build: {
                options: {
                    sourceMap: true
                },
                files: [{
                    expand: true,
                    src: ['<%=cfg.build%>/dist/**/*.js'],
                    ext: '.min.js'
                }]
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
        bump: {
            options: {
                pushTo: 'origin',
                commitMessage: '[release v%VERSION%]',
                commitFiles: ['package.json', 'dist/**']
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

    // Private tasks
    grunt.registerTask('javascript', ['jshint:src', 'ngAnnotate:build', 'uglify:build']);

    // Public tasks
    grunt.registerTask('default', ['jshint:grunt', 'clean:build', 'javascript', 'karma:default']);
    grunt.registerTask('debug', ['karma:debug']);
    grunt.registerTask('demo', ['jshint:demo', 'less:demo']); // TODO

    grunt.registerTask('dist', ['default', 'clean:dist', 'copy:dist']);
    grunt.registerTask('release', ['dist', 'bump:patch:prerelease']);
};
