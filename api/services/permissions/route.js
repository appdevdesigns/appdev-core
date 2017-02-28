/**
 * @class  Permissions.route
 * @parent Permissions
 * 
 * a set of utilities for exposing the Permission Route methods to external 
 * modules.
 * 
 * 
 * ## Usage
 *
 */


var AD = require('ad-utils');
var _ = require('lodash');


var registeredRoutes = {
    // routeKey : { actions:[ actionKey1, [actionKey2, actionKey3], ... ], object:'objectKey' }
};


module.exports = {

   
    /**
     * @function Permission.route.hasPermission
     *
     * this routine checks if the current route/path requries a permission and 
     * that the current User has this permission.
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
    hasPermission: function(req, res, next) {

//// TODO: <2013/12/12> Johnny : uncomment the unit tests for this action
////       when implemented.

// AD.log('... route.hasPermission()');

        // create a reqPath to test against
        //  or can do:  var reqPath = req.route.method+' '+req.route.path;
        var reqPath = req.method + ' ' + req.url;
        reqPath = reqPath.toLowerCase();    // lowercase it all
        // AD.log('<green>.... reqPath['+reqPath+']</green>');


        var user = ADCore.user.current(req);


        // prepare a callback routine to determine if the user has all the 
        // listed permissions. 
        var hasAll = function( list) {

            if (list.length > 0) {

                var perm = list.shift();

                // '*'  : means anyone can access.  Some routes are open to anyone.
                if ((perm == '*') || (user.hasPermission( perm ))) {
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
// console.log('.... permission:', registeredRoutes[p]);
                var permissions = registeredRoutes[p].action;
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
                
                
                res.AD.error(ADCore.error.fromKey('E_NOTPERMITTED'), 403);
                return;
            }
        }

        
        // if we got here, we did not find any permissions requried for this route. 
        // so continue.
        // AD.log('<yellow>    -> no permissions registered for this reqPath</yellow>');
        next();
    },



    /**
     * @function Permission.route.limitToActionScope()
     *
     * Use this method to limit the current RESTful resource/ blueprint route 
     * to only return values that match a user's set of Action+Scope 
     * combinations.
     *
     * Given an actionKey and a scopeObject, this method will compile the user's
     * scope definition for the scope object, and come up with a filter for that
     * object.
     * 
     * If the resource being returned is the same as the scope object, then 
     * this filter will be added to the .where condition for this request.
     *
     * If the resource is different, then this filter will be resolved and a 
     * limiting condition based upon the gathered values will be added to the 
     * request.
     *
     *
     * @param {obj} req     The Sails request object
     * @param {obj} res     The Sails response object
     * @param {fn}  next    The Sails/express callback fn
     * @param {obj} options The options for this specific route definitions.
     *
     *          options.actionKey {string}   the Permission action key to base
     *                                       our scope upon
     *                                       eg: 'adcore.admin'
     *
     *
     *          options.object {object}  the definition of the scope object to 
     *                                   build the limit on.
     *                  object.key     {string} the sails.models[key] for this object.
     *                                          Should match PermissionScopeObject.keyModel
     *                                          eg. 'siteuser'
     *                  object.field   {string} the 'foreign key' of the resource.field
     *                                          eg. 'id'
     *
     *
     *          options.resource {object}  (optional) The definition of the object
     *                                     being returned from this service. If this
     *                                     is not the same as .object then we need
     *                                     to indicate how to relate the scoped object
     *                                     data to limit this data.
     *                  resource.field {string} the field in resource that points to 
     *                                          the fk in object
     *                                          resource[resource.field] = object[object.field]
     *                                          eg: 'userID'
     *                                          eg: resource.userID = object.id
     *
     *
     *          options.error     {obj}      An object representing the error information 
     *                                       to return if the user is not permitted.
     */
    limitToActionScope:function(req, res, next, options) {

        // make sure options isn't undefined:
        options = options || {};

        // make sure options have some default settings:
        options = _.merge({
            actionKey:'no.action.key.specified',
            object:'not.provided',
            error:{ code: 403, message:'Not Permitted.' }
        }, options);

console.log();
console.log('... Permission.route.limitToActionScope()');
console.log('*** options:', options);

// TODO: verify actionKey

        var scopeList = null;  // list of [{scope}, {scope},... ]
        async.series([

            // get list of [ {scope}, {scope}, ... ] from user + actionKey + object.key
            function(ok) {
console.log('... get list of [scope, scope] from user');
                var User = req.AD.user();
                User.ready()
                .fail(function(err){
                    ok(err);
                })
                .then(function(){
                    scopeList = User.scopesForActionObject(options.actionKey, options.object.key);
console.log('... scopeList:', scopeList);
                    ok();
                })
            },



            // compile scope.filterUI defs into sails compatible scope.filter definition
                    // Filter.queryBuilderToSailsFilter( object.attr, scope.filterUI )
            function(ok) {

                if(scopeList) {

                    var error = null;
                    var hasError = false;
                    scopeList.forEach(function(s){

                        if (!hasError) {
                            var Model = sails.models[s.object.keyModel]
                            if (Model) {

                                // update current scope.filter to sails compatible filter:
                                s.filter = Filter.queryBuilderToSailsFilter(Model.attributes, s.filterUI);
                            
                            } else {

                                hasError = true;
                                error = new Error('Unknown Model ['+s.object.keyModel+']');
                                return false;
                            }
                        }
                        
                    })
                    
console.log('... scopeList 2:', scopeList);
                    ok(error);

                } else {
// TODO: Question: is this an error if there are no scopes to compile?
                    ok();
                }

            }

            // combine into scopeFilter: { 'or':[scope.filter, scope.filter ]}

            // if (object != resource) 
                // find all objects using scopeFilter
                // reduce scopeFilter to: { resource.field: [ results[object.field] ]}


            // add scopeFilter to condition.


        ], function(err, results){

            // return   
            if (err) {
                next(err);
            } else {
                next();
            }
        })

        


    },



    /**
     * @function Permissions.route.registerDefinition()
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
     * permissions are defined as a combination of actions and objects.
     *
     * format: { action:[], object:'objectKey' }
     * 
     * - (requried) Actions:
     * if you want to designate that the '/adcore' route must have the 'adcore.admin'
     * action permission, then you can pass in:
     *      [ 'adcore.admin' ]
     *
     * if '/adcore' can have 'adcore.admin'  OR  'adcore.developer' then:
     *      [ 'adcore.admin', 'adcore.developer' ]
     *
     * if '/adcore' can have 'adcore.admin'  OR  ('adcore.developer' AND 'adcore.nice.guy')
     *      [ 'adcore.admin', [ 'adcore.developer', 'adcore.nice.guy'] ]
     *
     * You can pass in as many of these combinations of action keys / permissions 
     * as you wish.
     *
     *
     * - (optional) Object
     * if a route is providing a given object resource to the requestor, you specify
     * that object key here.  
     *
     * By specifying an object, you allow the system to limit the data being returned
     * according to the user's assigned SCOPEs that relate to this (action key + object)
     * definition.
     *
     * The key is the unique key used by Sails to reference the model:
     *      sails.models[key]
     *
     * It is usually the Model Name in all lowercase():
     *      SiteUser  =>  'siteuser'
     *
     *
     * Examples:
     * - if you want to allow access to everyone for a route, with no data limiting:
     *   {
     *      action:['*']
     *   }
     *   (of course, this is the same as not specifying a route definition in the first place.)
     *
     * - if you want to allow access to everyone for a route, but limit the data according
     *   to the user's scope definitions for the 'siteuser' object.
     *   {
     *      action:['*'],
     *      object:'siteuser'
     *   }
     *
     * - if you want to allow access to only people who have been assigned 'adcore.admin' 
     *   and limit the data to their 'siteuser' scopes:
     *   {
     *      action:['adcore.admin'],
     *      object:'siteuser'
     *   }
     *
     *
     * @param {string} route  the string describing a route to watch
     * @param {array}  perm   An array of actionsKeys required to access this 
     *                        route.
     */
    registerDefinition: function( route, perm ) {

        AD.log('<green>route::::</green> '+ route+' registered');

//// TODO:
// if perm is not in proper format: { action:[], object:{} }
// then reformat & dump console error to alert Developer to update definition.
//
        // old perm definition:  [ 'actionKey', ... ]
        if (_.isArray(perm)) {
            AD.log('<yellow>Outdated route permission definition:</yellow> route:['+route+']');
            perm = {
                action:perm
            }
        }

        registeredRoutes[ route.toLowerCase() ] = perm;

    },



};


function _PostTranslationRequest( options) {

    var object = options.action;


    ADCore.queue.publish('opsportal.translation.multilingual.create', {

            actionKey:'site.permission.action.translate',   // user has to have this action key
            userID:'*',                                     // not tied to a specific user who created the entry
            callback:PERMISSION_TRANSLATION_DONE,           // the event to trigger when translation is done
            // reference:{ id:object.id },                    // (optional) likewise, don't need to provide a reference

            //// MENU options:
            // icon:'fa-lock',                                 // (optional) 
            menuKey:'permission.new.action',                // the multilingual text.key for this object
            menuContext: 'appdev',                          // the multilingual context for the actionKey label
            // itemName:object.action_key,                     // (optional) itemName printed directly
            // createdBy: 'system',                            // (optional) who is it by?
            // date: AD.util.moment(new Date()).format('L'),   // (optional) what date reference to use

            //// The actual model instance 
            object: object,                                 // the instance of the BASE model (not TRANS)
            fromLanguage: options.fromLanguage,             // which lang was the original

            fieldsToLabelKeys: { 'action_description':'permission.action.description' },
            labelContext: 'appdev'
    });

}
