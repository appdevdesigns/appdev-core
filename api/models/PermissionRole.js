/**
* PermissionRoles.js
*
* @description :: Define Roles that represent collections of Actions and Field level permissions.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var AD = require('ad-utils');

module.exports = {

    tableName:"site_perm_role",
    // migrate:'safe',  // don't update the tables!
migrate:'alter',  // modify the tables


    attributes: {
        // this table just has the default id, createdAt, updatedAt fields.



        // Permissions
        // @Relationship:  hasMany
        permissions:{
            collection:'Permission',
            via:'role',
            dominant:true
        },


        // PermissionAction
        // @Relationship:  many-to-many  
        actions:{
            collection:'PermissionAction',
            via:'roles',
            dominant:true
        },




        // this will pull in the translations using .populate('translations')
        translations:{
            collection:'PermissionRoleTrans',
            via:'role'
        },

        translate:function(code) {
            return ADCore.model.translate({
                model:this,         // this instance of a Model
                code:code,          // the language code of the translation to use.
                ignore:['role']     // don't include this field when translating
            });
        },

        _Klass: function() {
            return PermissionRoles;
        }

    }
};
