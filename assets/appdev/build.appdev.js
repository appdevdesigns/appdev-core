/*
 * build.appdev.js
 *
 * This file is intended to be used by the appdev build command line tool.
 *
 * This file exports the actual command() to run when trying to build this 
 * application/widget.
 *
 * Create your command() to run from the [root]/assets  directory.
 *
 */



var AD = require('ad-utils');
var path = require('path');
var async = require('async');
var transform = require("steal-tools").transform;
var fs = require('fs');

module.exports = {

    /* 
     * command()
     *
     * This is the actual command to execute.
     * 
     * This method is required.
     *
     * @param {obj} builder  the calling appdev build object.  
     * @param {fn} cb   The callback fn to run when command is complete.
     *                  The callback follows the usual node: cb(err) format.
     */
    command: function (builder, cb) {

        var self = this;

        // this is expected to be running the /assets directory

        async.series([

            function (next) {
                AD.log();
                AD.log('<green>building</green> appdev JS files');
                AD.log('<green>+++++++++++++++</green>');

                transform(
                    {
                        main: path.join('appdev', 'appdev'),
                        config: 'stealconfig.js'
                    },
                    {
                        minify: true,
                        noGlobalShim: true,
                        ignore: [
                            /^.*(.css)+/, // Ignore css files
                            /^(?!(appdev).*)/, // Get only appdev module files
                        ]
                    }).then(function (transform) {
                        // Get the main module and it's dependencies as a string
                        var main = transform();

                        fs.writeFile(path.join('appdev', 'production.js'), main.code, "utf8", function (err) {
                            if (err) {
                                AD.log.error('<red>could not write minified appdev JS file !</red>', err);
                                next(err);
                            }

                            next();
                        });
                    })
                    .catch(function (err) {
                        AD.log.error('<red>could not complete appdev JS build!</red>', err);
                        next(err);
                    });
            },


            function (next) {
                AD.log('<green>building</green> appdev CSS files');
                AD.log('<green>+++++++++++++++</green>');

                // Minify css files
                transform(
                    {
                        main: path.join('appdev', 'appdev'),
                        config: 'stealconfig.js'
                    },
                    {
                        minify: true,
                        noGlobalShim: true,
                        ignore: [
                            /^(?!.*(.css)+)/, // Get only css files
                            /^(?!(appdev).*)/, // Get only appdev module files
                        ]
                    }).then(function (transform) {
                        var main = transform();

                        fs.writeFile(path.join('appdev', 'production.css'), main.code, "utf8", function (err) {
                            if (err) {
                                AD.log.error('<red>could not write minified appdev CSS file !</red>', err);
                                next(err);
                            }

                            next();
                        });
                    })
                    .catch(function (err) {
                        AD.log.error('<red>could not complete appdev CSS build!</red>', err);
                        next(err);
                    });
            }

        ], function (err, results) {

            cb(err);
        });
    }
}