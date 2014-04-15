/**
 * isAuthenticated
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

    // if User is authenticated, proceed to the next policy,
    if (ADCore.auth.isAuthenticated(req)) {
        return next();
    } else {

        // call the authentication's
        if (sails.config.appdev.authType == 'CAS') {
            CAS.isAuthenticated(req, res, next);
        } else {
            ADCore.auth.local.isAuthenticated(req, res, next);
        }
    }


};
