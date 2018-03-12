/**
 * Routes
 *
 * Use this file to add any module specific routes to the main Sails
 * route object.
 */


module.exports = {

    'get /appdev/config/data.js'    : 'appdev-core/ADCoreController.configData',
    'get /appdev/config/data.json'  : 'appdev-core/ADCoreController.configDataJSON',
    'get /site/labels/:context'     : 'appdev-core/ADCoreController.labelConfigFile',
    'get /site/labels/:context/*'   : 'appdev-core/ADCoreController.labelConfigFile',
    
    //// Authentication
    
    'post /site/login'              : 'appdev-core/ADCoreController.loginPost',
    'get /site/login'               : 'appdev-core/ADCoreController.loginForm',
    'get /site/login-done'          : 'appdev-core/ADCoreController.loginDone',
    'get /site/logout'              : 'appdev-core/ADCoreController.logout',
    'get /auth/google'              : 'appdev-core/ADCoreController.authGoogle',
    'get /auth/fail'                : 'appdev-core/ADCoreController.authFail',
    'post /appdev-core/authTicket'  : 'appdev-core/SiteUserController.registerAuthTicket',
    'post /appdev-core/logoutGUID'  : 'appdev-core/ADCoreController.logoutGUID',

    
    //// User Operations
    'post /site/user/data'          : 'appdev-core/SiteUserController.selfSave',
    'get /site/user/data'           : 'appdev-core/SiteUserController.selfInfo',
    'post /site/user/changePassword': 'appdev-core/SiteUserController.changePW',
    'post /site/user/register'      : 'appdev-core/SiteUserController.register',
    
    
    'get /begin'                    : 'appdev-core/ADCoreController.begin',
    'get /steal/steal.js'           : 'appdev-core/ADCoreController.steal',
    
    //// Permissions
    'get /site/permission/scopeobject/:id/definition' : 'appdev-core/PermissionScopeObjectController.getScopeDefinition',
        // allows the UI to request the model fields and details for a requested ScopeObject

// 'get /site/permission/role'	: 'appdev-core/PermissionsController.getRoles',
    'get /site/permission/page/roles'               : 'appdev-core/PermissionRoleController.getPageRoles',
    'put /site/permission/page/roles/add'           : 'appdev-core/PermissionRoleController.addPageRoles',
    'delete /site/permission/page/roles/delete'     : 'appdev-core/PermissionRoleController.deletePageRoles',


    //// only active in development environment:
    'get /node_modules/**' : 'appdev-core/ADCoreController.testingFiles'

};

