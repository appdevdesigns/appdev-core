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

    // make sure there is an .appdev.localAuth defined:
    sails.config.appdev = sails.config.appdev || {};
    sails.config.appdev.localAuth = sails.config.appdev.localAuth || {};

    function checkLoginView (config, param, defaultView, next) {

        var cwd = process.cwd();

        var view = config[param];
        if ((view) && (view != '')) {
            var pathToView = path.join(cwd, 'views', view);

            fs.lstat(pathToView, function(err, stat){

                function noGood () {
                    ADCore.error.log("Error: Provided localLoginView ["+view+"] was not found at "+pathToView,{
                        localLoginView:view,
                        pathToView: pathToView
                    });

                    // fall back to our default value:
                    config[param] = defaultView;
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
            config[param] = defaultView;
            next(); // no error

        }

    }

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

            checkLoginView (sails.config.appdev.localAuth, 'localLoginView', defaultView, next);
        
        },


        // 3) ensure valid localLogoutView
        //    this is configurable in [sails]/config/appdev.js
        //    or [sails]/config/local.js
        function(next){
            var defaultView = 'appdev-core/adcore/logout.ejs';

            checkLoginView (sails.config.appdev.localAuth, 'localLogoutView', defaultView, next);

        }

    ], function(err, results){

        cb(err);
    });

    // Initialize passport strategies
    ADCore.auth.init();
    
};