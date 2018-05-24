/**
 * sessionAuth.js
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var url = require('url');
 
module.exports = function(req, res, next) {


    // if User is authenticated, proceed to the next policy,
    // or if this is the last policy, the controller
    if (req.AD.isAuthenticated()) {
        return next();
    }
    else {

        // if we are in a non-production environment, and an
        // appdev.test.user.guid is provided in the config file,
        // let's default to that user:
        if ((sails.config.environment != 'production')
            && (sails.config.appdev)
            && (sails.config.appdev.test) 
            && (sails.config.appdev.test.user)
            && (sails.config.appdev.test.user.guid)) {

            
            ADCore.auth.testUser(req, sails.config.appdev.test.user.guid)
            .fail(function(err){
                next(err);
            })
            .then(function(){
                next();
            })
            return;

        } else {


            // unauthenticated JSON requests
            if (req.wantsJSON && !req.param('ticket')) {

                res.AD.reauth();
                return;
            }
            // Otherwise authenticate now
            else {

                // Save the current path in the session so we can restore it after
                // authentication if needed.
                req.session.originalURL = req.externalCleanURL;
                
                switch (sails.config.appdev.authType.toLowerCase()) {
                    case 'cas':
                        // This will redirect to the CAS site. If successful the user
                        // will return here and proceed to ...
                        var auth = ADCore.auth.passport.authenticate('cas', function(err, user, info) {

                            // using the custom callback method
                            // see:  http://passportjs.org/docs   "Custom Callback" section.
                            //
                            // The custom callback should check on the returned err, or
                            // info data, and respond accordingly.
                            //
                            // The custom callback needs to progress to the next step 
                            // in our process.  So return a response, or go next().
                            //
                            
                            // Sending in err is reflective of a server error:
                            if (err) {
                                ADCore.error.log('CAS Auth Failed! Something Server Related', {
                                    error: err,
                                    message: 'something server side is wrong with authentication attempt.',
                                });
                                res.serverError(err);
                                //next(err);
                                return;
                            }


                            // Setting info reflects an error in authentication:
                            // if (_.isError(info)) {
                            if (info instanceof Error) {

                                // Case 1: handle untrusted cert error:
                                if (info.code == 'CERT_UNTRUSTED') {
                                    ADCore.error.log('CAS Auth Failed! CERT_UNTRUSTED', {
                                        error: info,
                                        message: 'received an untrusted cert',
                                        toTry: 'tell Doug and hope he figures it out!'
                                    });
                                    next(info);
                                    return;
                                }

                            }


                            // if user == false, then auth failed
                            // if info is set then send them to /auth/fail
                            if ((!user) || (info)) {
                                ADCore.error.log('CAS Auth failed', {
                                    user: user, info: info
                                });
                                res.AD.redirect('/auth/fail');
                                return;
                            }


                            // if we get here, things look good.
                            // now we need to perform the passport.logIn() routine
                            // to initialize and store the user object in the req object.
                            req.logIn(user, function(err) {

                                // error with logIn() so continue with error handling
                                if (err) { 

                                    // make sure a developer gets this error
                                    ADCore.error.log("Error performing passport.logIn()", {
                                        user: user,
                                        error:err
                                    });
                                    return next(err); 
                                }


                                // Authenticated!
                                // Instead of going directly to next(), we can redirect
                                // to the original URL to remove the 'ticket' from the
                                // address bar.
                                if (req.session.originalURL) {
                                    res.AD.redirect(req.session.originalURL);
                                } else {
                                    next();
                                }
                            });

                        });
                        auth(req, res, next);
                        break;
                        
                    case 'google':
                        // This will redirect to Google. If successful Google will 
                        // return the user to /auth/google
                        var auth = ADCore.auth.passport.authenticate('google', { scope: 'profile' });
                        auth(req, res, next);
                        break;
                        
                    default:
                    case 'local':
                        res.redirect('/site/login');
                        break;
                }
            }


        }

    } 
    

};
