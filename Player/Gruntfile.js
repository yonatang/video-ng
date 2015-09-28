'use strict';

var PORT = 9009;

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-aws-s3');

    grunt.initConfig({
        project: {
            dist: 'dist',
            src: 'src'

        },
        aws: grunt.file.readJSON('aws-data.json'),
        typescript: {
            base: {
                src: ['<%= project.src %>/**/*.ts'],
                dest: '<%= project.dist %>',
                options: {
                    module: 'amd', //or commonjs
                    target: 'es5', //or es3
                    //basePath: 'path/to/typescript/files',
                    sourceMap: true,
                    declaration: true
                }
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    collapseBooleanAttributes: false,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= project.src %>',
                        src: ['**/*.html'],
                        dest: '<%= project.dist %>'
                    }
                ]
            }
        },
        copy: {
            dist: {
                expand: true,
                cwd: '<%= project.src %>',
                dest: '<%= project.dist %>',
                src: '**/*.css'
            }
        },
        connect: {
            server: {
                options: {
                    port: PORT,
                    base: '<%= project.dist %>',
                    keepalive: true,
                    open: true
                }
            }
        },

        aws_s3: {
            /*jshint camelcase: true */
            options: {
                accessKeyId: '<%= aws.AWSAccessKeyId %>', // Use the variables
                secretAccessKey: '<%= aws.AWSSecretKey %>', // You can also use env variables
                region: '<%= aws.AWSRegion %>',
                uploadConcurrency: 5, // 5 simultaneous uploads
                downloadConcurrency: 5 // 5 simultaneous downloads
            },
            demoClean: {
                options: {
                    bucket: '<%= aws.AWSBucket %>'
                },
                files: [
                    {dest: '/', action: 'delete'},
                ]
            },
            demo: {
                options: {
                    bucket: '<%= aws.AWSBucket %>',
                    mime: {
                        '<%= project.dist %>/**/*.js': 'application/javascript',
                        '<%= project.dist %>/**/*.ts': 'application/typescript',
                        '<%= project.dist %>/**/*.png': 'image/png',
                        '<%= project.dist %>/**/*.ico': 'image/x-icon',
                        '<%= project.dist %>/**/*.txt': 'text/plain',
                        '<%= project.dist %>/**/*.html': 'text/html',
                        '<%= project.dist %>/**/*.css': 'text/css'
                    }
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['**'], dest: '/'},
                    //{expand: true, cwd: 'assets/prod/large', src: ['**'], dest: 'assets/large/', stream: true}, // enable stream to allow large files
                    //{expand: true, cwd: 'assets/prod/', src: ['**'], dest: 'assets/', params: {CacheControl: '2000'}},
                    // CacheControl only applied to the assets folder
                    // LICENCE inside that folder will have ContentType equal to 'text/plain'
                ]
            }
        },
        clean: {
            dist: {
                options: {force: true},
                files: [
                    {
                        dot: true,
                        src: ['<%= project.dist %>/**']
                    }
                ]
            }
        }
    });
    grunt.registerTask('serve', [
        'build','connect'

    ]);
    grunt.registerTask('build', [
        'clean:dist',
        'typescript',
        'htmlmin',
        'copy'
    ]);
    grunt.registerTask('deploy', [
        'build', 'aws_s3:demoClean', 'aws_s3:demo'
    ]);
    grunt.registerTask('default', ['build']);

};
