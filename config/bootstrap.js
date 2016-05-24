/**
 * Bootstrap
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */
var path = require('path');
var AD = require('ad-utils');
var fs = require('fs');

module.exports = function (cb) {

    async.parallel([

        // 1) register Permissions
        function(next) {
            AD.module.permissions(path.join(__dirname, '..', 'setup', 'permissions'), next);
        },


        // 2) ensure valid localLoginView
        //    this is configurable in [sails]/config/appdev.js
        //    or [sails]/config/local.js
        function(next){
            var defaultView = 'appdev-core/adcore/loginform.ejs';
            var cwd = process.cwd();

            var view = sails.config.appdev.localLoginView;
            if ((view) && (view != '')) {
                var pathToView = path.join(cwd, 'views', view);

                fs.lstat(pathToView, function(err, stat){

                    function noGood () {
                        ADCore.error.log("Error: Provided localLoginView ["+view+"] was not found at "+pathToView,{
                            localLoginView:view,
                            pathToView: pathToView
                        });

                        // fall back to our default value:
                        sails.config.appdev.localLoginView = defaultView;
                        next(); // no error
                    }

                    if (err) {

                        noGood();
                    } else {

                        if (stat.isFile()) {

                            // looks good
                            next();

                        } else {

                            noGood();
                        }
                    }
                })

            } else {

                // localLoginView is not provided, so set to default:
                sails.config.appdev.localLoginView = defaultView;
                next(); // no error

            }
            

        }
    ], function(err, results){

        cb(err);
    });

    // Initialize passport strategies
    ADCore.auth.init();
    
};