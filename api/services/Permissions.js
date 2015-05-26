/**
 * Permissions
 *
 * @module      :: Service
 * @description :: This is a collection of Permission routines for our applications.
 *
 */
var AD = require('ad-utils');


var registeredRoutes = {
    // routeKey : [ actionKey1, [actionKey2, actionKey3], ... ]
};


module.exports = {


    /**
     * @function hasRoutePermission
     *
     * this routine checks the current user to see if the current route/path
     * requries a permission and that the current User has this permission.
     *
     * If a user fails the permission check, then a 403 Forbidden error is
     * returned.
     *
     * This routine is expected to be used from a policy that needs to verify
     * the user can access the current route.  
     * (see the hasPermission.js policy.)
     *
     * @param {obj} req  The node/express req object
     * @param {obj} res  The node/express res object
     * @param {fn}  next The node/express callback for this middleware step
     */
    hasRoutePermission: function(req, res, next) {

//// TODO: <2013/12/12> Johnny : uncomment the unit tests for this action
////       when implemented.


        // create a reqPath to test against
        //  or can do:  var reqPath = req.route.method+' '+req.route.path;
        var reqPath = req.method + ' ' + req.url;
        reqPath = reqPath.toLowerCase();    // lowercase it all
        // AD.log('<green>.... reqPath['+reqPath+']</green>');


        var user = ADCore.user.current(req);


        // prepare a callback routine to determine if the user all all the 
        // listed permissions. 
        var hasAll = function( list) {

            if (list.length > 0) {

                var perm = list.shift();

                if (user.hasPermission( perm )) {
                    return hasAll( list );
                } else {
                    return false;
                }

            } else {
                return true;
            }
        }


        // look for a matching route in our registeredRoutes
        for (var p in registeredRoutes) {
            if ( reqPath.indexOf(p) != -1) {

                var permissions = registeredRoutes[p];
                for (var i = permissions.length - 1; i >= 0; i--) {
                    
                    var perm = permissions[i]
                
                    // make sure entry is an [] 
                    if (! _.isArray(perm)) perm = [perm];

                    // if user has all these permissions then continue!
                    if (hasAll(perm)) {
                        AD.log('<green>.... reqPath['+reqPath+']  -> user had permission: </green><yellow><bold>'+ perm.join(', ') + '</bold></yellow>');
                        next();
                        return;
                    }
                };


                // if we got here, then we did not pass any permission checks
                AD.log('<red>.... reqPath['+reqPath+']  -> user did not have any of the required permissions '+ permissions.join(', ') + '</red>');
                res.forbidden();
                return;
            }
        }

        
        // if we got here, we did not find any permissions for this route. 
        // so continue.
        // AD.log('<yellow>    -> no permissions registered for this reqPath</yellow>');
        next();
    },




    /**
     * @function Permissions.registerDefinition()
     *
     * Use this to register a route string with a set of required permissions.
     *
     * Expected to be performed upon boostrap to register any route permissions
     * for an application.
     *
     *
     *
     * Route:
     * ------------
     * routes can be defined as a string that will be matched against an incoming 
     * method + url.
     *
     * if you want to make sure that a 'get' operation on the '/adcore/siteuser'
     * is checked for a permission, then define the route as:
     *      'get /adcore/siteuser'
     *
     * if you want to make sure that all operations on the /adcore/siteuser is 
     * checked, then :
     *      '/adcore/siteuser'
     *
     * if you want to make sure all requests to any /adcore/* resource is checked
     * then:
     *      '/adcore'
     *
     *
     *
     * Permissions:
     * ------------
     * permissions are defined as an array of action keys.
     * 
     * if you want to designate that the '/adcore' route must have the 'adcore.admin'
     * permission, then you can pass in:
     *      [ 'adcore.admin' ]
     *
     * if '/adcore' can have 'adcore.admin'  OR  'adcore.developer' then:
     *      [ 'adcore.admin', 'adcore.developer' ]
     *
     * if '/adcore' can have 'adcore.admin'  OR  ('adcore.developer' AND 'adcore.nice.guy')
     *      [ 'adcore.admin', [ 'adcore.developer', 'adcore.nice.guy'] ]
     *
     *
     *
     * @param {string} route  the string describing a route to watch
     * @param {array}  perm   An array of actionsKeys required to access this 
     *                        route.
     */
    registerDefinition: function( route, perm ) {

        AD.log('<green>route:</green> '+ route+' registered');
        registeredRoutes[ route.toLowerCase() ] = perm;

    }


};






///// 
///// HELPER FUNCTIONS
/////


/*
 * @function getTransFields
 *
 * Find the Translation fields for a given Model.
 *
 * @param {obj} Model  A Multilingual Model Object (the Data Model)
 * @return {array}  if the translation Model was found, null otherwise
 */
// var getTransFields = function(Model) {


// }


