var assert = require('chai').assert;
var AD = require('ad-utils');
var async = require('async');


var role;
var user;

var oldLangDefault = 'xx';


var LABEL_EN = 'new role - testing';
var LABEL_KO = '[ko]new role - testing';
var USER_GUID_TEST = 'stupidTestUser';

describe('ADCore.model.translate tests', function(){

    before(function(done){

        oldLangDefault = sails.config.appdev['lang.default'];
        sails.config.appdev['lang.default'] = 'en';
       
        async.series([

            // create a permission role object
            function(next) {

                PermissionRole.create({ })
                .then(function(newRole){
                    role = newRole;

                    role.translations.add({language_code:'en', role_label:LABEL_EN});
                    role.translations.add({language_code:'ko', role_label:LABEL_KO});
                    role.save(function(err, obj){
                        next(err);
                    })
                    return null;

                })
                .catch(function(err){
                    next(err);
                    return null;
                });
            },

            // get a SiteUser object to use
            function(next) {

                SiteUser.find()
                .then(function(list){

                    if (list[0]) {
                        user = list[0];
                        next();
                    } else {

                        // didn't find one, so create one:
                        SiteUser.create({ guid:USER_GUID_TEST})
                        .then(function(newUser){
                            user = newUser;
                            next();
                            return null;
                        })
                        .catch(function(err){
                            next(err);
                            return null;
                        })
                    }
                    
                })
                .catch(function(err){
                    next(err);
                })
            }

        ],function(err, results) {

            done(err);

        })
        
    
    });
    

    ////
    //// Checking for proper Function Usage:
    ////

    it('calling without a model object results in a rejected deferred :', function(done){

        var res = ADCore.model.translate({ 
            code:'en'
        });


        assert.isDefined(res, ' --> returns a valid deferred/promise/something.');

        res.fail(function(err){
            assert.ok(true, ' --> this should have been called.');
            done();
        })
        .then(function(results){
            assert.ok(false, ' --> this should NOT have been called.');
            done();
        })
        .done();

    }); 


    it('calling with a non multilingual model object results in a rejected deferred :', function(done){

        var res = ADCore.model.translate({ 
            model:user,
            code:'en'
        });


        assert.isDefined(res, ' --> returns a valid deferred/promise/something.');

        res.fail(function(err){
            assert.ok(true, ' --> this should have been called.');
            done();
        })
        .then(function(results){
            assert.ok(false, ' --> this should NOT have been called.');
            done();
        })
        .done();

    }); 


    it('calling without a language code results in using the site default :', function(done){

        var res = ADCore.model.translate({ 
            model:role,
            // code:'en'
        });

        assert.isDefined(res, ' --> returns a valid deferred/promise/something.');

        res.fail(function(err){
            assert.ok(false, ' --> this should NOT have been called.');
            done();
        })
        .then(function(results){
            assert.ok(true, ' --> this should have been called.');
            assert.property(role, 'role_label', ' --> should now have a role_label property');
            assert.equal(role.role_label, LABEL_EN, ' --> should have returned the en label');
            done();
        });

    }); 


    it('calling with a language code results in that label :', function(done){

        var res = ADCore.model.translate({ 
            model:role,
            code:'ko'
        });

        assert.isDefined(res, ' --> returns a valid deferred/promise/something.');

        res.fail(function(err){
            assert.ok(false, ' --> this should NOT have been called.');
            done();
        })
        .then(function(results){
            assert.ok(true, ' --> this should have been called.');
            assert.property(role, 'role_label', ' --> should now have a role_label property');
            assert.equal(role.role_label, LABEL_KO, ' --> should have returned the en label');
            done();
        });

    }); 
    




    after(function(ok){
        
        async.series([

            // clean up our new role
            function(next){


                PermissionRoleTrans.destroy({role:role.id})
                .then(function(){
                    // AD.log('translations removed.');

                    // remove our new role:
                    role.destroy()
                    .then(function(role){
                        next();
                    })
                    .catch(function(err){
                        next(err);
                    });
                })
                .catch(function(err){
                    AD.log('error: problem removing translations.', err);
                    next(err);
                })

                

            },

            // clean up our user if we created one:
            function(next) {
                if (user.guid == USER_GUID_TEST) {
                    user.destroy()
                    .then(function(){
                        next();
                    })
                    .catch(function(err){
                        next(err);
                    })
                } else {
                    next();
                }
            }
        ], function(err, results){
            ok(err);
        })
        
    });

});


