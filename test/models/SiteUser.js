var assert = require('chai').assert;
var AD = require('ad-utils');

describe('SiteUser model', function(){

    var cleanupIDs = [];
    
    
    it('encodes a string with hash()', function(ok){
        this.timeout(80000);
        SiteUser.hash('foo', 'salt')
        .fail(function(err) {
            assert.ok(false, err.message);
            ok(err);
        })
        .done(function(result) { 
            assert.equal(result, 'a1c0e4c9520fa39c867a3816a8f15a3ecc3402df65b15d34ff26281e9a250487ba0c8e52354f3b56ffee5fc2b89fb4c920d41826ecbe4f58f80ef683851d4eb06f69abd15ce4d78f5f4e79b8f9df57ee5176bf21fef70f8a011e3ae1f8466259b057306411a19281bb28066c4f7fbe110c49ea4ec1544f2c0e373556e4134fe864f131db64a678a673c9782983fc443a7bfa25596b4be9e57cfef24a73dc353a59e8877b88c044a771a4b62740f64a5bcfedac204df175552eec9bf916eb4ff890a418c8fc541741134452bf3d306b3260aaec7659665fb0d95b75eb1a3a3b33fdc0e2c506aee3d80a0b4ffa3469987c251051903824d34fcfc5611c2bc76a322fd86ed5e6707f0774010edc89413161e5273b2aa0ccef3496dd0be6aeea30ee45536a607a00b3017e8babc22bddb12fadb0a34611b4e65f2ad7bd84f8d01489dc1a15ebc95d977c980d37f97b4e465450a826409025d8e3b26aa3995d27361128d078d276d4752c56b06b30433e6eac403179b384f5810d94d5b23ae66903331ac3d7d53f6a4489430f5046bfe844ae57265a7d5986152d329278d822c2b95828b1e15050bee451c6e45bfc2493d39c466436223b608d5187f04a2d29562007a259c91b8f1bda7bb39bea476e78c2831ad6b9c8fa8bd338f427650ab9c422587bbc2b1f1615b2b5723c00d32c3cae6097046d94e3ef8bcbe11a4bf4ae9e0dfe', 'Test string did not encode as expected'
            );
            ok();
        });
    }); 
    

    it('can create local user account',  function(ok){
        this.timeout(80000);

        // wait for both checks to complete.
        var numDone = 0;
        function onDone(err) {
            if (err) {
                ok(err);
            } else {
                numDone++;
                if (numDone == 2) {
                    ok();
                }
            }
        }

        // listen to broadcasted data and verify it.
        var subID = ADCore.queue.subscribe('siteuser.created', function(msg, userData){

            ADCore.queue.unsubscribe(subID);    // remove this before any assert prevents the removal.

            assert.equal( msg, 'siteuser.created', ' should be checking the siteuser.created event. ');
            assert.notProperty(userData.user, 'password', ' should not have included password in broadcast data ');
            assert.notProperty(userData.user, 'salt', ' should not have included salt in broadcast data ');

            onDone();
        })


        SiteUser.create({
            username: 'testUser',
            password: 'foo',
            guid: 'abcd123',
            languageCode: 'kr'
        })
        .exec(function(err, user){

            if (err) {

                assert.ok(false, ' --> error creating user: '+err);
                onDone(err);

            } else {


                assert.isDefined(user);
                assert.isDefined(user.id);
                cleanupIDs.push(user.id);

                assert.equal(
                    user.username,
                    'testUser',
                    'username was not created as expected'
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

                assert.isDefined(
                    user.password, 
                    ' should have a password returned. '
                );

                assert.lengthOf(
                    user.password,
                    1024,
                    'password was not hashed as expected'
                );

                assert.lengthOf(
                    user.salt,
                    64,
                    'password salt was not generated as expected'
                );


                onDone();
            }
        });

    
    });


    it('can create user account with partial information',  function(ok){

        // wait for both checks to complete.
        var numDone = 0;
        function onDone(err) {
            if (err) {
                ok(err);
            } else {
                numDone++;
                if (numDone == 2) {
                    ok();
                }
            }
        }

        // listen to broadcasted data and verify it.
        var subID = ADCore.queue.subscribe('siteuser.created', function(msg, userData){

            ADCore.queue.unsubscribe(subID);    // remove this before any assert prevents the removal.

            assert.equal( msg, 'siteuser.created', ' should be checking the siteuser.created event. ');
            assert.notProperty(userData.user, 'password', ' should not have included password in broadcast data ');
            assert.notProperty(userData.user, 'salt', ' should not have included salt in broadcast data ');

            onDone();
        });


        SiteUser.create({
            username: 'testUser2'
        })
        .exec(function(err, user) {

            if (err) {

                assert.ok(false, ' --> error creating user: '+err);
                onDone(err);

            } else {

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
                onDone();  
            }
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
            ok(err);
        });
    });
    
    
    it('will automatically hash the password when updating', function(ok){

        // wait for both checks to complete.
        var numDone = 0;
        function onDone(err) {
            if (err) {
                ok(err);
            } else {
                numDone++;
                if (numDone == 2) {
                    ok();
                }
            }
        }

        // listen to broadcasted data and verify it.
        var subID = ADCore.queue.subscribe('siteuser.updated', function(msg, userData){

            ADCore.queue.unsubscribe(subID);    // remove this before any assert prevents the removal.

            assert.equal( msg, 'siteuser.updated', ' should be checking the siteuser.created event. ');
            assert.notProperty(userData.user, 'password', ' should not have included password in broadcast data ');
            assert.notProperty(userData.user, 'salt', ' should not have included salt in broadcast data ');

            onDone();
        });


        this.timeout(80000);
        SiteUser.update(
            { username: 'testUser2' },
            { password: 'foo' }
        )
        .exec(function(err, list){
            if (err) {

                assert.ok(false, ' --> error using update(): '+err);
                onDone(err);
            } else {

                assert.lengthOf(list[0].password, 1024, 'Password was not hashed as expected');
                onDone();
            }
        });

    });
    

    //// NOTE: this also removes all the SiteUser entries we created in this 
    //// unit tests.
    it('should emit a siteuser.destroyed event when siteusers are destroyed', function(ok){

        // wait for both checks to complete.
        var numDone = 0;
        function onDone(err) {
            if (err) {
                ok(err);
            } else {
                numDone++;
                if (numDone == 2) {
                    ok();
                }
            }
        }

        // listen for siteuser.destroyed event 
        var subID = ADCore.queue.subscribe('siteuser.destroyed', function(msg, userData){

            ADCore.queue.unsubscribe(subID);    // remove this before any assert prevents the removal.

            assert.isDefined(userData, ' should have returned userData ');
            assert.isDefined(userData.user, ' should have returned .user parameter.');
            assert.isArray(userData.user, ' should have returned an array. ');
            assert.lengthOf(userData.user, cleanupIDs.length, ' should have removed same number of entries ');

            userData.user.forEach(function(u){
                assert.notProperty(u, 'password', ' should not have included password in broadcasted data ');
                assert.notProperty(u, 'salt', ' should not have included salt in broadcasted data ');
            })
            onDone();
        });

        SiteUser.destroy({ id: cleanupIDs })
        .exec(function(err){
            if (err) {
                assert.ok(false, ' --> error destroy()-ing user: '+err);
                onDone(err);
            }
            else onDone();
        });
    });



    // after(function(ok){
    // });

    
});

