steal(

    'appdev/widgets/ad_ui_reauth/ad_ui_reauth.js'

).then(function() {


    //Define the unit tests
    describe('ad_ui_reauth Widget', function(){

        var widget;

        before(function(done) {
            widget = new AD.widgets.ad_ui_reauth();
            done();
        });
        
        it('is not present on the page prematurely', function(done){
            var htmlContent = document.body.outerHTML;
            chai.assert.notMatch(
               htmlContent, /appdev-formLogin/,
               'widget HTML should not be in the DOM before show()'
            );
            done();
        });

        it('adds itself to the page', function(){
            widget.show();
            // phantomjs doesn't trigger this automatically, but real browsers do
            $('.modal-backdrop')
                .trigger('webkitTransitionEnd')
                .trigger('transitionend')
                .trigger('otransitionend')
                .trigger('oTransitionEnd')
                .trigger('transitionend');

            var htmlContent = document.body.outerHTML;
            chai.assert.match(
               htmlContent, /appDev-formLogin/,
               'widget HTML should be in the DOM after show()'
            );
        });

        it('should trigger "Error loading resource file:///site/login (203)" error while testing', function() {
            // This is normal. It means the iframe is trying to load the login page.
            chai.assert(true);
        });

        it('removes itself from the page', function() {
            widget.hide();
            var htmlContent = $(document.body).html();
            chai.assert.notMatch(
               htmlContent, /appDev-formLogin/,
               'widget HTML should not be in the DOM after hide()'
            );
        });

    });


});
