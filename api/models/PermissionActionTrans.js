/**
* PermissionActionTrans.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    connection:"mysql",


    tableName:"site_perm_actions_trans",
    // migrate:'safe',  // don't update the tables!
migrate:'alter',  // modify the tables

    attributes: {

        action_description : { type: 'text' }
          
        // @hasOne PermissionAction reference
        ,permissionaction:{
            model:'PermissionAction'
        },

        language_code : {
            type : "string",
            size : 10,
            defaultsTo : "-"
        }

    }
};

