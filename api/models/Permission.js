/**
* Permission.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
var _ = require('lodash');

module.exports = {

    tableName:"site_permission",

    attributes: {

        user : {
            model:'SiteUser'
        },

        role : {
            model:'PermissionRole'
        }, 

        scope:{
            collection:'PermissionScope',
            via:'permission'
        },

        enabled:{
            type:'boolean'
        }
    },


    beforeValidate: function(values, cb) {

        // make sure each scope value is an integer
        if (_.isArray(values.scope)) {
            var newScopes = [];
            values.scope.forEach(function(scope){
                newScopes.push(_.toInteger(scope))
            });
            values.scope = newScopes;
        }


        // some protocols can't actually send bool values and send either strings
        // or 1/0 instead:
        switch( values.enabled ) {
            case 'true':
            case '"true"':
            case "'true'":
            case 1:
            case '1':
                values.enabled = true;
                break;

            case 'false':
            case '"false"':
            case "'false'":
            case 0:
            case '0':
                values.enabled = false;
                break;
        }

        cb();
    },


    afterCreate: function(permission, cb) {

        // a new permission listing was created for a USER.
        // so mark that user as needing a session refresh.
        if (permission.user) {

            SiteUser.findOne({ id: permission.user }) 
            .then(function(user) {

                if (user) {
                    ADCore.user.refreshSession(user.guid);
                } else {
                    ADCore.user.refreshSession("*"); // update all!
                }
                
                cb();
                return null;
            })
            .catch(function(err){
                cb(err);
            })

        } else {
            cb();
        }

    },


// beforeUpdate: function(valuesToUpdate, cb) {
//     console.log('... beforeUpdate:', valuesToUpdate);
//     cb();
// },


    afterUpdate: function(updatedPerm, cb) {

        SiteUser.findOne({ id: updatedPerm.user }) 
        .then(function(user) {

            if (user) {
                ADCore.user.refreshSession(user.guid);
            } else {
                ADCore.user.refreshSession("*"); // update all!
            }
            cb();
            return null;
        })
        .catch(function(err){
            cb(err);
        })
    },



    afterDestroy: function(destroyedRecords, cb) {

        var userIDs = _.map(destroyedRecords, 'user');
        SiteUser.find({id:userIDs})
        .then(function(users){
            users.forEach(function(user){
                ADCore.user.refreshSession(user.guid);
            });
            cb();
            return null;
        })
        .catch(function(err){
            cb(err);
        })
    }
};

