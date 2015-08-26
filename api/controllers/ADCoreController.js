/**
 * ADCoreController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var path = require('path');
var fs = require('fs');
var url = require('url');
var AD = require('ad-utils');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to ADCoreController)
     */
    _config: {},



    /**
     * configData
     * returns the configuration data back to the requester as a javascript
     * code file.
     */
    configData: function(req, res) {
//console.log(sails);
     // prepare proper content type headers
        res.setHeader('content-type', 'application/javascript');

        // render this view with data
        return res.view({
            settings:sails.config.appdev,
            layout:false
        });
    },



    /**
     * Action blueprints:
     *    `/adlanguage/labelConfigFile`
     *    route: /site/label/:context (applicationkey)
     */
     labelConfigFile: function (req, res) {

         var context = req.param('context');
         // let's make sure context is not a filename:
         context = context.split('.')[0];

//// TODO: pull user's default language from their session and save to template:
         // var currLangCode = req.session.languageCode
         //                    || req.session.preferences.defaultLanguage;
         var currLangCode = ADCore.user.current(req).getLanguageCode(); // 'en';

         ADCore.labelsForContext(context, currLangCode, function(err, data) {

             if (err) {

                 // error handler
                 console.log(err);
                 res.error(err);

             } else {

                 // prepare proper content type headers
                 res.setHeader('content-type', 'application/javascript');

                 // render this view with data
                 return res.view({
                     langCode:currLangCode,
                     labels: data,
                     layout:false
                 });
             }

         });

    },
    
    
    
    /**
     * GET /site/login
     *
     * Used for local authentication. Displays a login form that posts 
     * username and password back to the site.
     */
    loginForm: function (req, res) {
        if ('local' == sails.config.appdev.authType.toLowerCase()) {
            res.view();
        }
        else {
            // Users should not even be coming here if the site isn't using
            // local auth. 
            res.redirect('/site/login-done');
        }
    },
    
    
    
    /**
     * POST /site/login
     * 
     * Used for local authentication. The form or script should post
     * parameters `username` and `password`.
     *
     * @TODO: Fix issue where Sails won't even let the controller handle
     *  post requests to this route. 403
     */
    loginPost: function (req, res) {
        if ('local' == sails.config.appdev.authType.toLowerCase()) {
            var localAuth = ADCore.auth.passport.authenticate('local', {
                failureRedirect: '/site/login'
            });
            localAuth(req, res, function() {
                // Logged in. Redirect to their originally requested page
                var url = req.session.originalURL || '/site/login-done';
                res.redirect(url);
            });
        }
        else {
            // Users should not even be coming here if the site isn't using
            // local auth. 
            res.redirect('/site/login-done');
        }
    },
    
    
    /**
     * /site/login-done
     */
    loginDone: function (req, res) {
        // The site policies will have ensured that the users are authenticated
        // by the time they reach here.
        if (req.wantsJSON) {

            // is is from a service so respond with a success packet
            ADCore.comm.success(res, {});

        } else {

            // The 'sessionAuth' policy takes care of logging in the user. Any
            // page visited will automatically direct the user to the CAS login
            // screen. This is just a self-closing HTML page for the client 
            // side script to open in a frame or pop-up.
            res.view({ layout: false });
        }
        return;
    },



    /**
     * /site/logout
     *
     * This route should be exempt from the 'sessionAuth' policy
     */
    logout: function (req,res) {
        
        delete req.session.appdev;
        
        // Currently authenticated. Do logout now.
        if (ADCore.auth.isAuthenticated(req)) {
            if ('cas' == sails.config.appdev.authType.toLowerCase()) {
                // CAS logout
                var returnURL = url.format({
                    protocol: req.protocol || 'http',
                    host: req.headers.host,
                    pathname: '/site/logout',
                    query: req.query
                });
                // This will redirect to CAS and return in a logged out state.
                ADCore.auth.cas.logout(req, res, returnURL);
                return;
            } else {
                // All other logouts are handled by Passport
                req.logout();
            }
        }
        
        res.view();
        
    },
    
    
    
    /**
     * /auth/fail
     *
     * Users will be directed here if authentication fails
     */
    authFail: function (req, res) {
        res.view();
    },



    /**
     * /auth/google
     * Callback route for Passport Google authentication.
     */
    authGoogle: function (req, res) {
        var passportGoogle = ADCore.auth.passport.authenticate(
            'google', 
            { failureRedirect: '/auth/fail' }
        );
        passportGoogle(req, res, function() {
            var url = req.session.originalURL || '/';
            res.redirect(url);
        });
    },
    
    
    
    testingFiles:function(req,res) {
        // in order to allow mocha-phantomjs to include files in our
        // installed node_modules/ folders we add this action that
        // will return those files.
        //
        // route :  /node_modules/*
        //


        // this method is NOT active in production environment
        if (sails.config.environment != 'production') {

            var urlParts = req.url.split('/');

            // if this maps to a normal asset
            var assetPath = path.join(process.cwd(), urlParts.join(path.sep));
            fs.exists(assetPath,function (exists) {

                if (exists) {

                    // just return that file
                    res.sendfile(assetPath);

                } else {

console.log('path not found:'+assetPath);
                     res.error();

                }

             });

        } else {

            // sorry, not allowed in production.
            res.forbidden();
        }

    }


};
