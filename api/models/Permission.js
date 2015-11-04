/**
* Permission.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

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
        })
        .catch(function(err){
            cb(err);
        })
    },



    afterDestroy: function(destroyedRecords, cb) {

        var userIDs = _.pluck(destroyedRecords, 'user');
        SiteUser.find({id:userIDs})
        .then(function(users){
            users.forEach(function(user){
                ADCore.user.refreshSession(user.guid);
            });
            cb();
        })
        .catch(function(err){
            cb(err);
        })
    }
};

