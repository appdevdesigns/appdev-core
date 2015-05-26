/**
 * hasPermission.js
 *
 * @module      :: Policy
 * @description :: A policy to check the current url, and see if a permission 
 *                 is associatted with it.
 *
 *                 If there is a permission, then the current user needs to 
 *                 have that permission before  being allowed to continue.  If  
 *                 not, then a 403 response is returned.
 */
module.exports = function(req, res, next) {


    Permissions.hasRoutePermission(req, res, next);

};





