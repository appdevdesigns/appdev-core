/**
* PermissionRolesTrans.js
*
* @description :: This is the multilingual translations for the Roles defined in the system.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

    tableName:"site_perm_role_trans",
    // migrate:'safe',  // don't update the tables!
migrate:'alter',  // modify the tables


    // connection:"mysql",


    attributes: {


        // role_id : {
        //     type : "integer",
        //     size : 11,
        //     defaultsTo : "0"
        // }, 

        role:{
            model:'PermissionRole'
        },
        

        language_code : {
            type : "string",
            size : 10,
            defaultsTo : "-"
        }, 

        role_label : {
            type : "string",
            size : 100,
            defaultsTo : "-"
        }, 


    }
};

