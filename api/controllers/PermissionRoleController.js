/**
 * PermissionRoleController
 *
 * @description :: Server-side logic for managing Permissionroles
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    _config: {
        model: "permissionrole", // all lowercase model name
 //       actions: true,
 //       shortcuts: true,
        rest: true
    },
    
    /**
     * GET /site/permission/page/roles
     *
     * Request the current page's list of permission roles as well as all possible roles with descriptions
     */
    getPageRoles: function (req, res) {
        var action_key = req.param('action_key');

        Permissions.getUserRoles(req, true)
        .fail(function(err){
            res.AD.error(err);
        })
        .then(function(result){
            var roles = result;

            Permissions.getRolesByActionKey(action_key)
            .fail(function(err){
                res.AD.error(err);
            })
            .then(function(result){
                res.AD.success({
                    roles: roles,
                    selected: result
                });
            });
            
        })
        

    },
    
    /**
     * PUT /site/permission/page/roles/add
     *
     * Add new role to the current page's list of permission roles
     */
    addPageRoles: function (req, res) {
        var role_id = req.param('role_id');
        var action_key = req.param('action_key');

        Permissions.assignAction(role_id, action_key)
        .fail(function(err){
            res.AD.error(err);
        })
        .then(function(result){

            res.AD.success({
                body: result
            });
            
        })
    },

    /**
     * DELETE /site/permission/page/roles/delete
     *
     * Delete role from the current page's list of permission roles
     */
    deletePageRoles: function (req, res) {
        var role_id = req.param('role_id');
        var action_key = req.param('action_key');

        Permissions.removeAction(role_id, action_key)
        .fail(function(err){
            res.AD.error(err);
        })
        .then(function(result){

            res.AD.success({
                body: result
            });
            
        })
    }
	
};

