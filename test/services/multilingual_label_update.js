var assert = require('chai').assert;
var AD = require('ad-utils');

var testLabel = {
    language_code:'en',
    label_key:'test.key',
    label_context:'test.context',
    label_needs_translation:1,
    label_label:'test label'
}

describe('Multilingual.label.update tests ', function(){

    var allLabels = [];     // initial list of labels.

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
        var oD = AD.test.util.newOnDone(ok);


        var dfd = Multilingual.label.create(function(err, newLabel){
            assert.isNotNull(err, ' should have returned an error.');
            assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
            assert.isUndefined(newLabel, ' should not have returned a new area.'); 
            AD.test.util.onDone(oD);
        })
        .fail(function(err){

            assert.isNotNull(err, ' should have returned an error.');
            assert.equal(err.code, 'E_MISSINGPARAM', ' error should have code: E_MISSINGPARAM ');
            AD.test.util.onDone(oD);
        })
        .then(function(newLabel){
            assert.ok(false, 'should not have gotten here.');
            AD.test.util.onDone(oD);
        })

        AD.test.util.isDeferred(dfd, assert);

    });


// it('have not done this yet', function(ok){
//     assert.ok(false, ' ---> do this');
//     ok();
// })

//// LEFT OFF HERE:

    // calling without the required label data (key, context, label) results in an error/rejected deferred
    // calling with key/context that is unknown, exits without error, but null data returned
    // calling with known key/context exits without error, and returns new {label} entry


    // after(function(ok){
     
        
    // });

});


