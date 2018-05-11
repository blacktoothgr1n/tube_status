// Karma configuration
// Generated on Sun Mar 25 2018 23:57:08 GMT+0100 (BST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      { pattern: 'lib/*.js', watched: false, served: true, included: true },
      { pattern: 'node_modules/jasmine-jquery/lib/jasmine-jquery.js', watched: false, served: true, included: true },
      { pattern: 'src/tube_status.js', watched: true, served: true, included: true },
      { pattern: 'css/*.css', watched: false, served: true, included: false },
      { pattern: 'index.html', watched: false, served: true, included: false },
      { pattern: 'spec/*.json', watched: false, served: true, included: false },
      { pattern: 'spec/*.js', watched: true, served: true, included: true },
      { pattern: 'images/*.jpg', watched: false, served: true, included: false },
      { pattern: 'images/*.png', watched: false, served: true, included: false }
    ],

    proxies:  {
      '/images/': '/base/images/'
    },

    // list of files / patterns to exclude
    exclude: [
      '**/*.swp'
    ],

    browserConsoleLogOptions: {
    level: 'log',
    format: '%b %T: %m',
    terminal: true
    },


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'src/*.js': 'coverage'
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      reporters: [
        {type: 'html', dir: './coverage'},
        {type: 'text-summary'},
      ]
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['ChromeHeadless'],
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
