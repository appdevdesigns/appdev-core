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
        SiteUser.findOne({ id: permission.user }) 
        .then(function(user) {
            ADCore.user.refreshSession(user.guid);
            cb();
        })
        .catch(function(err){
            cb(err);
        })

    },


// beforeUpdate: function(valuesToUpdate, cb) {
//     console.log('... beforeUpdate:', valuesToUpdate);
//     cb();
// },

    afterUpdate: function(updatedPerm, cb) {

// console.log('... afterUpdate() updatedPerm:', updatedPerm);

        SiteUser.findOne({ id: updatedPerm.user }) 
        .then(function(user) {
// console.log('   -> user:', user);
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

