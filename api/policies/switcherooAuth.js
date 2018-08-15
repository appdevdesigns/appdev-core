/**
 * switcherooAuth.js
 *
 * @module      :: Policy
 * @description :: Allow user to impersonate another user.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var url = require('url');
 
module.exports = function(req, res, next) {


    // if actual user is not already authenticated, then skip!
    if (!req.AD.isAuthenticated()) {
        return next();
    }
    else {

        // if there is an authorization token, skip!
        var token = req.headers['authorization'];
        if (token) {
            return next();
        }

        // if there is a switcheroo request in place for the current user
        // then switcheroo!
        var currentUser = ADCore.user.actual(req);
        SiteSwitcheroo.find({username: currentUser.username() })
        .then((list)=>{
            if (list.length == 0) {

                // no requests, so just continue on:
                return next();
            }

            ADCore.auth.switcheroo(req, list[0].toGuid)
            .then(()=>{

sails.log('::: switcherooAuth: '+currentUser.username()+' -> '+list[0].toUsername+' done, continuing on ...');
                next();
            }) 


        })
 

    } 
    

};
