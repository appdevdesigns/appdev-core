/**
 * initUser
 * NOT USED
 *
 * @module      :: Policy
 * @description :: make sure the user object is properly initialized
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {


    // get the user info stored in the req object
    var user = ADCore.user.actual(req);

    // NOTE: storing the User obj in the session looses the functions,
    // so we want to recreate the user object:
    if (!user['GUID']) {

        // we lost the info, so restore:
        ADCore.user.init(req, user.data)
        .fail(function(err){
            next(err);
        })
        .then(function(){

            // ok, user data is now an object:
            next();
        })

    } else {

        // user data is now an object:
        next();
    }

};
