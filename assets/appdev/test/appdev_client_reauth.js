(function() {

    //Define the unit tests
    describe('ReAuthentication Controller', function(){
        
        var dfd;
        
        it('is not inProgress before start()', function() {
            chai.assert.isFalse(AD.ui.reauth.inProgress());
        });
        
        it('returns a Deferred on start()', function(){
            dfd = AD.ui.reauth.start();
            chai.assert.isObject(dfd);
            chai.assert.isFunction(dfd.done);
            chai.assert.isFunction(dfd.fail);
        });

        it('is inProgress after start()', function() {
            chai.assert.isTrue(AD.ui.reauth.inProgress());
        });
        
        it('resolves the Deferred after end()', function() {
            AD.ui.reauth.end();
            chai.assert.equal('resolved', dfd.state());
        });
        
        it('is not inProgress after end()', function() {
            chai.assert.isFalse(AD.ui.reauth.inProgress());
        });

    });


})();
