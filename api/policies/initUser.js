/**
 * initUser
 *
 * @module      :: Policy
 * @description :: make sure the user object is properly initialized
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

    // if User is authenticated, proceed to the next policy,
    var user = ADCore.user.actual(req);

    // note storing the User obj in the session looses the functions,
    // so we want to recreate the user object:
    if (!user['GUID']) {

        // we lost the info, so restore:
        ADCore.user.init(req, user.data);
    }


    // ok, user data is now an object:
    next();

};
