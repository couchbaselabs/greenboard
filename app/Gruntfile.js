module.exports = function(grunt) {
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build : {
                files: {'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js',
                        'dist/angularjs-nvd3-directives.min.js': 'dist/angularjs-nvd3-directives.js'}
            }
        },
        concat: {
            dist: {
              src: ['js/*.js'],
              dest: 'dist/greenboard.js',
            },
        },
        watch: {
            scripts: {
                files: 'js/*.js',
                tasks: ['concat', 'uglify']
            }
        }
    });

    // concat tasks
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);

}
