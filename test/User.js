var assert = require('chai').assert;
var AD = require('ad-utils');

var sailsObj;

describe('SiteUser model', function(){

    var cleanupIDs = [];
    
    before(function(ok){
        this.timeout(60000);
        
        AD.test.sails.load()
        .fail(function(err){
            throw err;
        })
        .done(function(obj) {
            sailsObj = obj;
            ok();
        });
    
    });
    
    
    it('encodes a string into MD5 with hash()', function(ok){
        assert.equal(
            SiteUser.hash('foo'), 
            'acbd18db4cc2f85cedef654fccc4a4d8',
            'Test string did not encode as expected'
        );
        ok();
    }); 
    

    it('can create normal user account',  function(ok){

        SiteUser.create({
            username: 'testUser',
            password: 'foo',
            guid: 'abcd123',
            languageCode: 'kr'
        })
        .then(function(user){
            assert.isDefined(user);
            assert.isDefined(user.id);
            cleanupIDs.push(user.id);

            assert.equal(
                user.username,
                'testUser',
                'username was not created as expected'
            );
            assert.equal(
                user.password,
                'acbd18db4cc2f85cedef654fccc4a4d8',
                'password was not created as expected'
            );
            assert.equal(
                user.guid,
                'abcd123',
                'guid was not created as expected'
            );
            assert.equal( 
                user.languageCode, 
                'kr',
                'languageCode was not created as expected'
            );
            ok();
        })
        .fail(function(err){
            assert.ok(false, ' --> error creating user: '+err);
            // ok(err);
        })
        .done();
    
    });


    it('can create user account with partial information',  function(ok){
        SiteUser.create({
            username: 'testUser2'
        })
        .then(function(user){
            cleanupIDs.push(user.id);
            
            assert.equal(
                user.username,
                'testUser2',
                'username was not created as expected'
            );
            assert.equal(
                user.guid,
                'testUser2',
                'guid was not automatically cloned from username by default'
            );
            assert.equal( 
                user.languageCode, 
                sails.config.appdev['lang.default'],
                'default languageCode was not created'
            );
            assert.equal(
                user.isActive,
                1,
                'isActive was not set by default'
            );
            ok();
        })
        .fail(function(err){
            assert.ok(false, ' --> error creating user: '+err);
            // ok(err);
        })
        .done();
    
    });


    it('can find user from plaintext password',  function(ok){
        SiteUser.hashedFind({
            username: 'testUser',
            password: 'foo'
        })
        .then(function(list){
            assert.isDefined(list[0]);
            ok();
        })
        .fail(function(err){
            assert.ok(false, ' --> error using hashedFind(): '+err);
            // ok(err);
        })
        .done();
    });
    
    
    it('will automatically hash the password when updating', function(ok){
        SiteUser.update(
            { username: 'testUser2' },
            { password: 'foo' }
        )
        .then(function(list){
            assert.equal(list[0].password, 'acbd18db4cc2f85cedef654fccc4a4d8');
            ok();
        })
        .fail(function(err){
            assert.ok(false, ' --> error using update(): '+err);
            // ok(err);
        })
        .done();
    });
    
    
    after(function(ok){
        SiteUser.destroy({ id: cleanupIDs })
        .exec(function(err){
            if (err) {
                assert.ok(false, ' --> error destroy()-ing user: '+err);
                ok(err);
            }
            else ok();
        });
    });

    
});




describe('SiteUser integration with ADCore', function() {
    
    var guid = 'unit.testing.' + Math.random();
    var username = '' + Math.random();
    
    it('initializes a new user account', function(ok){
        var req = { session: { appdev: {} } };
        var data = {
            guid: guid,
            username: username
        };
        ADCore.user.init(req, data);
        assert.isDefined(req.session.appdev.user);
        
        var user = req.session.appdev.user;
        user.ready()
        .fail(function(err){
            throw err;
        })
        .done(function(){
            SiteUser.find({ guid: guid })
            .then(function(list){
                assert.ok(list[0]);
                ok();
            })
            .fail(function(err){
                throw err;
            })
            .done();
        });
    });
    
    
    it('initializes an existing user account', function(ok){
        var req = { session: { appdev: {} } };
        var data = { guid: guid }; // username not specified
        ADCore.user.init(req, data);
        req.session.appdev.user.ready()
        .fail(function(err){ throw err; })
        .done(function(){
            
            // Try and initialize the user created earlier
            SiteUser.find({ guid: guid })
            .then(function(list){
                assert.ok(list[0]);
                assert.equal(list[0].username, username);
                ok();
            })
            .fail(function(err){
                throw err;
            })
            .done();
        
        });
    });
    
    
    after(function(ok){
        SiteUser.destroy({ guid: guid })
        .then(function(){
            ok();
        })
        .done();
    });


});