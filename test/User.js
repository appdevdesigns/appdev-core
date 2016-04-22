var assert = require('chai').assert;
var AD = require('ad-utils');

var sailsObj;

describe('SiteUser model', function(){

    var cleanupIDs = [];
    
    before(function(ok){
        this.timeout(80000);
        
        AD.test.sails.load()
        .fail(function(err){
            throw err;
        })
        .done(function(obj) {
            sailsObj = obj;
            ok();
        });
    
    });
    
    
    it('encodes a string with hash()', function(ok){
        this.timeout(80000);
        SiteUser.hash('foo', 'salt')
        .fail(function(err) {
            assert.ok(false, err.message);
        })
        .done(function(result) { 
            assert.equal(result, 'a1c0e4c9520fa39c867a3816a8f15a3ecc3402df65b15d34ff26281e9a250487ba0c8e52354f3b56ffee5fc2b89fb4c920d41826ecbe4f58f80ef683851d4eb06f69abd15ce4d78f5f4e79b8f9df57ee5176bf21fef70f8a011e3ae1f8466259b057306411a19281bb28066c4f7fbe110c49ea4ec1544f2c0e373556e4134fe864f131db64a678a673c9782983fc443a7bfa25596b4be9e57cfef24a73dc353a59e8877b88c044a771a4b62740f64a5bcfedac204df175552eec9bf916eb4ff890a418c8fc541741134452bf3d306b3260aaec7659665fb0d95b75eb1a3a3b33fdc0e2c506aee3d80a0b4ffa3469987c251051903824d34fcfc5611c2bc76a322fd86ed5e6707f0774010edc89413161e5273b2aa0ccef3496dd0be6aeea30ee45536a607a00b3017e8babc22bddb12fadb0a34611b4e65f2ad7bd84f8d01489dc1a15ebc95d977c980d37f97b4e465450a826409025d8e3b26aa3995d27361128d078d276d4752c56b06b30433e6eac403179b384f5810d94d5b23ae66903331ac3d7d53f6a4489430f5046bfe844ae57265a7d5986152d329278d822c2b95828b1e15050bee451c6e45bfc2493d39c466436223b608d5187f04a2d29562007a259c91b8f1bda7bb39bea476e78c2831ad6b9c8fa8bd338f427650ab9c422587bbc2b1f1615b2b5723c00d32c3cae6097046d94e3ef8bcbe11a4bf4ae9e0dfe', 'Test string did not encode as expected'
            );
            ok();
        });
    }); 
    

    it('can create local user account',  function(ok){
        this.timeout(80000);
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
                user.password.length,
                1024,
                'password was not hashed as expected'
            );
            assert.equal(
                user.salt.length,
                64,
                'password salt was not generated as expected'
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
            return null;
        })
        .catch(function(err){
            assert.ok(false, ' --> error creating user: '+err);
            // ok(err);
        });
    
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
            return null;
        })
        .catch(function(err){
            assert.ok(false, ' --> error creating user: '+err);
            // ok(err);
        });
    
    });


    it('can find user from plaintext password',  function(ok){
        this.timeout(80000);
        SiteUser.findByUsernamePassword({
            username: 'testUser',
            password: 'foo'
        })
        .then(function(user){
            assert.ok(user, 'Could not find user');
            ok();
            return null;
        })
        .fail(function(err){
            assert.ok(false, ' --> error using findByUsernamePassword(): '+err);
            // ok(err);
        });
    });
    
    
    it('will automatically hash the password when updating', function(ok){
        this.timeout(80000);
        SiteUser.update(
            { username: 'testUser2' },
            { password: 'foo' }
        )
        .then(function(list){
            assert.equal(list[0].password.length, 1024, 'Password was not hashed as expected');
            ok();
            return null;
        })
        .fail(function(err){
            assert.ok(false, ' --> error using update(): '+err);
            // ok(err);
        });
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



/*
 * TODO: revamp these unit tests since the ADCore.user.init() no longer exist:
 *
 
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

*/