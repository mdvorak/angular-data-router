module.exports = function (grunt) {
    // Load tasks
    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});

    // Project configuration.
    grunt.initConfig({
        cfg: {
            src: 'src',
            demo: 'demo',
            build: 'build',
            dist: 'dist',
            docs: 'docs',
            bower: 'bower_components'
        },
        clean: {
            build: ['<%=cfg.build%>'],
            dist: ['<%=cfg.dist%>', '<%=cfg.docs%>'],
            tmp: ['<%=cfg.build%>/bundle.js']
        },

        // Validate
        jshint: {
            options: {
                undef: true,
                unused: 'vars',
                nonew: true,
                nonbsp: true,
                bitwise: true
            },
            grunt: {
                options: {
                    node: true
                },
                files: {
                    src: ['Gruntfile.js']
                }
            },
            src: {
                options: {
                    browser: true,
                    sub: true,
                    globalstrict: true,

                    globals: {
                        angular: true,
                        module: true,
                        RouteError: true
                    }
                },
                files: {
                    src: ['<%=cfg.src%>/**/*.js', '!<%=cfg.src%>/module.js', '!<%=cfg.src%>/**/*.specs.js']
                }
            },
            bundle: {
                options: {
                    browser: true,
                    sub: true,

                    globals: {
                        angular: true
                    }
                },
                files: {
                    src: ['<%=cfg.build%>/dist/angular-data-router.js']
                }
            },
            demo: {
                options: {
                    browser: true,
                    sub: true,

                    globals: {
                        angular: true
                    }
                },
                files: {
                    src: ['<%=cfg.demo%>/**/*.js']
                }
            },
            test: {
                options: {
                    sub: true,
                    globalstrict: true,
                    globals: {
                        angular: true,
                        describe: true,
                        it: true,
                        beforeEach: true,
                        expect: true,
                        module: true,
                        inject: true
                    }
                },
                files: {
                    src: ['<%=cfg.src%>/**/*.specs.js']
                }
            }
        },

        // Compile
        concat: {
            build: {
                options: {
                    get banner() {
                        var licence = grunt.file.read('LICENCE').replace(/^/mg, ' ').replace(/[ ]+$/mg, '');
                        var module = grunt.file.read('src/module.js');
                        return '/*\n' + licence + ' */\n\n(function dataRouterModule(angular) {\n' + module + '\n';
                    },
                    footer: '\n})(angular);',
                    process: function (src) {
                        return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    }
                },
                files: [
                    {
                        dest: '<%=cfg.build%>/bundle.js',
                        src: [
                            '<%=cfg.src%>/dataRouterRegistry.js',
                            '<%=cfg.src%>/dataRouterLoader.js',
                            '<%=cfg.src%>/dataRouter.js',
                            '<%=cfg.src%>/matchMap.js',
                            '<%=cfg.src%>/routeError.js',
                            '<%=cfg.src%>/directives/**/*.js',
                            '!<%=cfg.src%>/**/*.specs.js'
                        ]
                    }
                ]
            }
        },

        ngAnnotate: {
            build: {
                files: [
                    {
                        '<%=cfg.build%>/dist/angular-data-router.js': '<%=cfg.build%>/bundle.js'
                    }
                ]
            }
        },

        jsbeautifier: {
            options: {
                jslintHappy: true
            },
            build: {
                src: ['<%=cfg.build%>/dist/angular-data-router.js']
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
                    '<%=cfg.src%>/**/*.specs.js'
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
                        src: ['**']
                    }
                ]
            }
        },
        gitadd: {
            dist: {
                options: {
                    all: true
                },
                files: {
                    src: [
                        '<%=cfg.dist%>/**',
                        '<%=cfg.docs%>/**'
                    ]
                }
            }
        },
        bump: {
            options: {
                pushTo: 'origin',
                commitMessage: '[release v%VERSION%]',
                commitFiles: ['package.json', 'dist/**']
            }
        },

        // Docs
        ngdocs: {
            options: {
                dest: 'docs',
                html5Mode: false
            },
            api: {
                src: ['<%=cfg.src%>/**/*.js', '!<%=cfg.src%>/**/*.spec.js'],
                title: 'Angular DataRouter Documentation'
            }
        },

        // Demo
        connect: {
            server: {
                options: {
                    hostname: 'localhost',
                    port: 9000
                }
            }
        },
        watch: {
            src: {
                files: ['<%=cfg.src%>/**/*.js'],
                tasks: ['javascript', 'jshint:test']
            },
            demojs: {
                files: ['<%=cfg.demo%>/**/*.js'],
                tasks: ['jshint:demo']
            }
        }
    });

    // Private tasks
    grunt.registerTask('javascript', ['jshint:src', 'concat:build', 'ngAnnotate:build', 'jshint:bundle', 'jsbeautifier:build', 'uglify:build', 'clean:tmp']);

    // Public tasks
    grunt.registerTask('default', ['jshint:grunt', 'clean:build', 'javascript', 'jshint:test', 'karma:default']);
    grunt.registerTask('debug', ['karma:debug']);
    grunt.registerTask('demo', ['jshint:demo', 'default', 'connect:server', 'watch']);

    grunt.registerTask('dist', ['default', 'clean:dist', 'copy:dist']);
    grunt.registerTask('release', ['git-is-clean', 'dist', 'gitadd:dist', 'bump', 'git-is-clean']);
};
