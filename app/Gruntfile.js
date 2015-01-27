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
              src: ['js/app.js', 'js/timelinecontroller.js',
                    'js/initdatacontroller.js', 'js/jobscontroller.js',
                    'js/sidebarcontroller.js', 'js/controllers.js',
                    'js/viewservice.js',
                    'js/services.js', 'js/factories.js',
                    'js/directives.js', 'js/d3directives.js',
                    'js/d3.tip.js', 'js/d3.legend.js'],
              dest: 'dist/greenboard.js',
            },
        },
        watch: {
            scripts: {
                files: 'js/*.js',
                tasks: ['concat']
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
