// eslint-disable-next-line strict, no-undef
module.exports = function (grunt) {
  // eslint-disable-next-line no-undef
  require('jit-grunt')(grunt, {
    'bump-only': 'grunt-bump',
    'bump-commit': 'grunt-bump'
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner:
      '/*!\n' +
      '* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) 2011 - <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
      '* License: <%= pkg.license %>\n' +
      '*/\n',
    clean: {
      files: ['dist', 'build']
    },
    concat: {
      jquery: {
        src: [
          'src/jqueryextensions.js',
          'src/core.js',
          'src/graphics.js',
          'src/mapimage.js',
          'src/mapdata.js',
          'src/areadata.js',
          'src/areacorners.js',
          'src/scale.js',
          'src/tooltip.js'
        ],
        dest: 'build/jquery.<%= pkg.name %>.jquery.js'
      },
      zepto: {
        src: ['src/zepto.js', '<%= concat.jquery.src %>'],
        dest: 'build/jquery.<%= pkg.name %>.zepto.js'
      },
      jquerydist: {
        options: {
          banner: '<%= banner %>',
          process: true
        },
        src: '<%= umd.jquery.options.dest %>',
        dest: 'dist/jquery.<%= pkg.name %>.js'
      },
      zeptodist: {
        options: {
          banner: '<%= banner %>',
          process: true
        },
        src: '<%= umd.zepto.options.dest %>',
        dest: 'dist/jquery.<%= pkg.name %>.zepto.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        sourceMap: true,
        sourceMapIncludeSources: true,
        report: 'gzip'
      },
      jquery: {
        src: '<%= concat.jquerydist.dest %>',
        dest: 'dist/jquery.<%= pkg.name %>.min.js'
      },
      zepto: {
        src: '<%= concat.zeptodist.dest %>',
        dest: 'dist/jquery.<%= pkg.name %>.zepto.min.js'
      }
    },
    umd: {
      jquery: {
        options: {
          src: '<%= concat.jquery.dest %>',
          dest: 'build/jquery.<%= pkg.name %>.jquery.umd.js',
          template: 'jqueryplugin.hbs'
        }
      },
      zepto: {
        options: {
          src: '<%= concat.zepto.dest %>',
          dest: 'build/jquery.<%= pkg.name %>.zepto.umd.js',
          template: 'zeptoplugin.hbs'
        }
      }
    },
    connect: {
      options: {
        livereload: 9100,
        open: true,
        hostname: 'localhost',
        useAvailablePort: true,
        base: '.'
      },
      tests: {
        options: {
          port: 9101,
          open:
            'http://<%= connect.options.hostname %>:<%= connect.tests.options.port %>/tests/imagemapster-test-runner.html'
        }
      },
      examples: {
        options: {
          port: 9102,
          open:
            'http://<%= connect.options.hostname %>:<%= connect.examples.options.port %>/examples/index.html'
        }
      }
    },
    watch: {
      gruntfile: {
        files: 'gruntfile.js'
      },
      src: {
        files: ['src/**/*.js'],
        tasks: ['build'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      examples: {
        files: ['examples/**/*.html', 'examples/**/*.css'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      tests: {
        files: ['tests/**/*.js', 'tests/**/*.html'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      }
    },
    docco: {
      source: {
        src: ['src/**/*.js'],
        options: {
          output: 'docs/'
        }
      }
    },
    bump: {
      options: {
        files: ['package.json', 'package-lock.json', 'bower.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['-a'], // '-a' for all tracked files
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        prereleaseName: 'beta',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
      }
    },
    shell: {
      options: {
        stdout: true,
        stderr: true,
        failOnError: true
      },
      npm: {
        command: 'npm publish'
      },
      npmpre: {
        command: 'npm publish --tag next'
      }
    },
    eslint: {
      options: {
        failOnError: true,
        extensions: ['.js', '.html']
      },
      target: ['.']
    }
  });

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build', [
    'clean',
    'eslint',
    'concat:jquery',
    'concat:zepto',
    'umd:jquery',
    'umd:zepto',
    'concat:jquerydist',
    'concat:zeptodist'
  ]);
  grunt.registerTask('dist', ['build', 'uglify']);
  grunt.registerTask('debug', ['build', 'connect', 'watch']);
  grunt.registerTask('example', ['build', 'connect:examples', 'watch']);
  grunt.registerTask('test', ['build', 'connect:tests', 'watch']);
  grunt.registerTask('postBump', ['dist', 'bump-commit', 'shell:npm']);
  grunt.registerTask('postBumpPre', ['dist', 'bump-commit', 'shell:npmpre']);
  grunt.registerTask('preBump', ['clean', 'dist']);
  grunt.registerTask('patch', ['preBump', 'bump-only:patch', 'postBump']);
  grunt.registerTask('minor', ['preBump', 'bump-only:minor', 'postBump']);
  grunt.registerTask('major', ['preBump', 'bump-only:major', 'postBump']);
  grunt.registerTask('prerelease', [
    'preBump',
    'bump-only:prerelease',
    'postBumpPre'
  ]);
  grunt.registerTask('prepatch', ['preBump', 'bump-only:prepatch', 'postBumpPre']);
  grunt.registerTask('preminor', ['preBump', 'bump-only:preminor', 'postBumpPre']);
  grunt.registerTask('premajor', ['preBump', 'bump-only:premajor', 'postBumpPre']);
};
