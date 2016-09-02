var assert = require('chai').assert;
var AD = require('ad-utils');

var testLabel = {
    language_code:'en',
    label_key:'test.key',
    label_context:'test.context',
    label_needs_translation:1,
    label_label:'test label'
}

describe('Multilingual.label.create tests ', function(){

    var allLabels = [];     // initial list of labels.


    function onDone(o) {
        if (o.err) {
            o.ok(o.err);
        } else {
            o.numDone++;
            if (o.numDone == 2) {
                o.ok();
            }
        }
    }

    function isDeferred(dfd) {

        assert.isDefined(dfd, ' should be defined ');
        assert.property(dfd, 'fail', ' should look like a deferred. .fail() ');
        assert.property(dfd, 'then', ' should look like a deferred. .then() ');

    }

    before(function(done){
    
        SiteMultilingualLabel.find()
        .exec(function(err, list){
            if (err) {
                done(err);
            } else {
                allLabels = list;
                done();
            }
        })
    });
    

    ////
    //// Checking for proper Function Usage:
    ////

    // calling without a labelDef results in an error/rejected deferred
    it('calling without a labelDef results in an error/rejected deferred', function(ok){

        // wait for both checks to complete.
        var oD = { numDone:0, ok:ok };


        var dfd = Multilingual.label.create(function(err, newLabel){
            assert.isNotNull(err, ' should have returned an error.');
            assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
            assert.isUndefined(newLabel, ' should not have returned a new area.'); 
            onDone(oD);
        })
        .fail(function(err){

            assert.isNotNull(err, ' should have returned an error.');
            assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
            onDone(oD);
        })
        .then(function(newLabel){
            assert.ok(false, 'should not have gotten here.');
            onDone(oD);
        })

        isDeferred(dfd);

    });


it('have not finished this yet', function(ok){
    assert.ok(false, ' ---> keep going');
    ok();
})
//// LEFT OFF HERE:

    // calling without the required label data results in an error/rejected deferred

    // calling with new label data results in a new label entry.

    // calling with same label data returns without error


    




    // after(function(ok){
     
        
    // });

});


