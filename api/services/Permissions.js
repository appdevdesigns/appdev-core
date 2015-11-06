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
                        AD.log('<green>.... reqPath['+reqPath+']  -> user['+user.GUID()+'] had permission: </green><yellow><bold>'+ perm.join(', ') + '</bold></yellow>');
                        next();
                        return;
                    }
                };


                // if we got here, then we did not pass any permission checks
                AD.log('<red>.... reqPath['+reqPath+']  -> user[</red><yellow>'+user.GUID()+'</yellow><red>] did not have any of the required permissions '+ permissions.join(', ') + '</red>');
                res.forbidden();
                return;
            }
        }

        
        // if we got here, we did not find any permissions for this route. 
        // so continue.
        // AD.log('<yellow>    -> no permissions registered for this reqPath</yellow>');
        next();
    },



    limitRouteToScope:function(req, res, next, options) {


        // make sure options isn't undefined:
        options = options || {};

        // make sure options have some default settings:
        options = _.merge({
            actionKey:'no.action.key.specified',
            field:'userID',
            userField:'id',
            error:{ code: 403, message:'Not Permitted.' }
        }, options);

// console.log('... options:', options);

        Permissions.scopeUsersForAction(req, options.actionKey)
        .fail(function(err){

            // if the error was the user doesn't have this permission:
            if (err.code == 'ENO_PERMISSION') {
// console.log('... ERROR: ENO_PERMISSION');
                var ourError = new Error( options.error.message );
                ourError.actionKey = options.actionKey;
                ADCore.comm.error(res, ourError, options.error.code);
                // res.forbidden();
            } else {
// console.log('... ERROR: not sure what went wrong:', err);
                // not sure what went wrong here:
                next(err);
            }
        })
        .then(function(validUsers){

            var validIDs = _.pluck(validUsers, options.userField);

            // was the request already specifying the specified .field?
            var allParams = req.params.all();
// console.log('... allParams:', allParams);
// console.log('... options.where:', req.options.where);
// console.log('... validIDs:', validIDs);

//// TODO: check if we need to account for a possible incoming where:{ userID:xx }  clause

            if( allParams[options.field]) {

                var parsedField  = _.parseInt(allParams[options.field]);

                // if it looks like we should be comparing numbers:
                if (!_.isNaN(parsedField)) {

                    // make sure we treat it as a number
                    allParams[options.field] = parsedField;
                }

                // if they asked for one that is already allowed
                if (validIDs.indexOf(allParams[options.field]) != -1) {
// console.log('... looks good!');
                    // let things go on:
                    next();
                } else {
// console.log('... didnt match up!');
                    // can't ask for that one!
                    var ourError = new Error( options.error.message );
                    ADCore.comm.error(res, ourError, options.error.code);
                    // res.forbidden();
                }

            } else {

                // some routes operate on a given primaryKey: findOne, update, destroy 
                // other routes operate on a condition: find

                // look for a primaryKey value:
                var pk = req.param('id');

                // if a route with a primaryKey value
                if ((req.options.action == 'findOne')
                    || (pk)) {
// console.log('... findOne()');
                    // These blueprints only looks at the specified :id value.
                    // so we need to preempt and do a find, and check if result
                    // has an validID value

                    var model = req.options.model || req.options.controller;
                    if (!model) throw new Error(util.format('No "model" specified in route options.'));

                    var Model = req._sails.models[model];
                    if ( !Model ) throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`',model));

                    Model.findOne(pk)
                    .then(function(model){
// console.log('... model:', model);
// console.log('... validIDs:', validIDs);
// console.log('... comparing model.'+options.field+':'+ model[options.field]);

                        if (validIDs.indexOf(model[options.field]) != -1) {

// console.log('... validID found!');
                            // ok, this one is permitted, so continue:
                            next();

                        } else {
// console.log('... no validID found.');

                            // can't ask for this one!
                            var ourError = new Error( options.error.message );
                            ADCore.comm.error(res, ourError, options.error.code);
                            // res.forbidden();
                        }
                    })
                    .catch(function(err){

                        next(err);
                    })

                } else {

// console.log('... updating condition.');
                    // add to the query a condition for userID to be in our validIDs:
                    req.options.where = req.options.where || {};
                    req.options.where[options.field] =  validIDs;
// console.log('... options:', req.options);
                    next();

                }

            }

        });

    },



    /**
     * @function Permissions.scopeUsersForAction()
     *
     * Use this to request the valid SiteUsers that the authenticated user 
     * can access for the given actionKey.
     *
     * @param {obj}    req        The request object for the current route.
     * @param {string} actionKey  which actionKey permission to compile scope
     *                            information for.
     * @return {array} returns an array of SiteUser 
     */
    scopeUsersForAction: function(req, actionKey) {
        var dfd = AD.sal.Deferred();


        var user = ADCore.user.current(req);

        
        if (user.hasPermission( actionKey )) {

// TODO: actually lookup the Scope data and resolve it to a list of SiteUser accounts.
dfd.resolve([{ id:'1', guid:'user.1' }, { id:'1', guid:'user.2' }]);

        } else {
            var err = new Error('No Permission');
            err.code = 'ENO_PERMISSION';
            err.actionKey = actionKey;
            dfd.reject(err);
        }

        return dfd;
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


