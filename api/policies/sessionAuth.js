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
    if (ADCore.auth.isAuthenticated(req)) {
        return next();
    }
    // Otherwise authenticate now
    else {
        // Save the current path in the session so we can restore it after
        // authentication if needed.
        var cleanQuery = _.clone(req.query);
        delete cleanQuery.ticket;
        req.session.originalURL = url.format({
            protocol: req.protocol || 'http',
            host: req.headers.host,
            pathname: req.path,
            query: cleanQuery
        });
        
        switch (sails.config.appdev.authType.toLowerCase()) {
            case 'cas':
                // This will redirect to the CAS site. If successful the user
                // will return here and proceed to ...
                var auth = ADCore.auth.passport.authenticate('cas');
                auth(req, res, function() {
                    // ... authenticated!
                    // Instead of going directly to next(), we can redirect
                    // to the original URL to remove the 'ticket' from the
                    // address bar.
                    res.redirect(req.session.originalURL || '/');
                });
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

};
