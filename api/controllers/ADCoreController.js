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
var _ = require('lodash');

module.exports = {

    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to ADCoreController)
     */
    _config: {},


    /**
     * GET /begin
     *
     * This route does nothing on its own, but is covered by the normal 
     * authentication policies. Can be used to begin a user session.
     */
    begin: function(req, res) {
        res.send('"OK"');
    },
    
    
    /**
     * GET /steal/steal.js
     *
     * Deliver a modified version of steal.js that supports cookies over CORS
     * requests.
     */
    steal: function(req, res) {
        res.sendfile('assets/appdev/steal-cors/steal.js');
    },
    
    
    /**
     * GET /appdev/config/data.js
     *
     * returns the configuration data back to the requester as a javascript
     * code file.
     */
    configData: function(req, res) {
     // prepare proper content type headers
        res.setHeader('content-type', 'application/javascript');
        
        var settings = _.clone(sails.config.appdev);
        
        // Some settings should not be sent to the client side
        var private = ['authKeys'];
        for (var key in settings) {
            if (private.indexOf(key) >= 0) {
                delete settings[key];
            }
        }
        
        if (settings.authType.toLowerCase() == 'cas') {
            if (sails.config.cas) {
                settings.casURL = sails.config.cas.baseURL;
            }
        }
        
        // Include info about the current user
        settings.user = req.user && req.user.data;
        
        // render this view with data
        return res.view({
            settings: settings,
            layout: false
        });
    },


    /**
     * GET /appdev/config/data.json
     *
     * returns the configuration data back to the requester as json
     */
    configDataJSON: function(req, res) {
        res.setHeader('content-type', 'application/javascript');
        
        var settings = _.clone(sails.config.appdev);
        
        if (settings.authType.toLowerCase() == 'cas') {
            if (sails.config.cas) {
                settings.casURL = sails.config.cas.baseURL;
            }
        }
        
        settings.user = req.user && req.user.data;
        
        // Some settings should not be sent to the client side
        var private = ['authKeys'];
        for (var key in settings) {
            if (private.indexOf(key) >= 0) {
                delete settings[key];
            }
        }
        
        res.AD.success(settings);
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
        var authType = sails.config.appdev.authType.toLowerCase();
        var canRegister = sails.config.appdev.localAuth && 
                            sails.config.appdev.localAuth.canRegister;


        // Check for error message from authentication failure
        var authErrMessage = req.session.authErrMessage;
        delete req.session.authErrMessage;
        
        if ('local' == sails.config.appdev.authType.toLowerCase()) {

            // NOTE: sails.config.appdev.localLoginView is verified
            //       in appdev-core/config/bootstrap.js
            res.view(sails.config.appdev.localAuth.localLoginView, { 
                authErrMessage: authErrMessage,
                canRegister: canRegister
            });
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
     * Don't forget the CSRF token.
     */
    loginPost: function (req, res) {
        if ('local' == sails.config.appdev.authType.toLowerCase()) {
            ADCore.auth.passport.authenticate('local', 
                function(err, user, info) {
                    // No error, but passport has a message on why auth failed
                    if (!user && !err && info && info.message) {
                        err = new Error(info.message);
                    }
                    // No error, and no idea why auth failed
                    if (!user && !err) {
                        err = new Error('Passport local auth error');
                    }
                    
                    if (err) {
                        if (req.wantsJSON) {
                            res.AD.error(err);
                        } else {
                            // Go back to the login form, show message there
                            req.session.authErrMessage = err.message;
                            res.redirect('/site/login');
                        }
                    }
                    // User was authenticated
                    else {
                        req.login(user, function() {
                            if (req.wantsJSON) {
                                res.AD.success({});
                            } else {
                                // Logged in. Redirect to their original page.
                                var url = req.session.originalURL;
                                if (!url || url == '/site/login') {
                                    // If the original page was the login form
                                    // we need to go somewhere else.
                                    url = '/site/login-done';
                                }
                                res.redirect(url);
                            }
                        });
                    }
                }
            )(req, res, function(err) {

                if (!err) err = new Error('unknown error');

                if (req.wantsJSON) {
                    res.AD.error(err);
                } else {
                    // Go back to the login form, show message there
                    req.session.authErrMessage = err.message;
                    res.redirect('/site/login');
                }
                

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
     *
     * Authentication is enforced for this page. When it is successfully loaded
     * it will show a "busy" animation. The page will try to close itself.
     */
    loginDone: function (req, res) {
        // The site policies will have ensured that the users are authenticated
        // by the time they reach here.
        if (req.wantsJSON) {

            // it is from a service so respond with a success packet
            res.AD.success({});

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
     * Ends the session for the current user.
     *
     * This route should be exempt from the 'sessionAuth' policy
     */
    logout: function (req, res) {
        
        delete req.session.appdev;
        
        // Currently authenticated. Do logout now.
        if (req.AD.isAuthenticated()) {
            if ('cas' == sails.config.appdev.authType.toLowerCase()) {
                // CAS logout
                var returnURL = req.externalURL;
                // This will redirect to CAS and return in a logged out state.
                ADCore.auth.cas.logout(req, res, returnURL);
                return;
            } else {
                // All other logouts are handled by Passport
                req.logout();
            }
        }


        // if an authLogoutRedirect is set --> redirect to there.
        if (sails.config.appdev.authLogoutRedirect) {
            res.redirect(sails.config.appdev.authLogoutRedirect);

        } else {

            // else show us the logout view:
            res.view(sails.config.appdev.localAuth.localLogoutView, {});
        }        

    },
    
    
    
    /**
     * POST /appdev-core/logoutGUID
     * { "guid": "my_guid_string" }
     * 
     * Ends all sessions of a given user
     */
    logoutGUID: function (req, res) {
        var json = JSON.stringify({ user: req.param('guid') });
        var pattern = '%"passport":'+ json +'%';
        
        SiteUser.query(" \
            DELETE FROM `sessions` \
            WHERE `data` LIKE ? \
        ", [pattern], function(err) {
            if (err) res.AD.error(err);
            else res.AD.success({});
        });
    },
    
    
    
    /**
     * /auth/fail
     *
     * Users can be directed here if authentication fails beyond recovery
     */
    authFail: function (req, res) {
        res.view();
    },



    /**
     * /auth/google
     *
     * Callback route needed for Passport Google authentication.
     * Needs to be whitelisted in your Google Developer account.
     */
    authGoogle: function (req, res) {
        var passportGoogle = ADCore.auth.passport.authenticate(
            'google', 
            { failureRedirect: '/auth/fail' }
        );
        passportGoogle(req, res, function() {
            var url = req.session.originalURL || '/site/login-done';
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
                     res.serverError();

                }

             });

        } else {

            // sorry, not allowed in production.
            res.forbidden();
        }

    }


};
