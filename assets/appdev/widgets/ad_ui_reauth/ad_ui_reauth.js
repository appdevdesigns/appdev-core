steal(
// List your dependencies here:
    'appdev/ad.js',
    'appdev/widgets/ad_icon_busy/ad_icon_busy.js',
    'appdev/widgets/ad_ui_reauth/ad_ui_reauth.css',
    'appdev/widgets/ad_ui_reauth/reauth_local.ejs',
    'appdev/widgets/ad_ui_reauth/reauth_cas.ejs',
    function () {
        System.import('can').then(function () {
            steal.import('can/control/control').then(function () {

                AD.widgets.ad_ui_reauth = can.Control.extend({

                    init: function (element, options) {
                        this.authType = AD.config.getValue('authType');
                        var _this = this;


                        function processFrag (frag) {

                            // Bootstrap Modal does not play well with documentFragment,
                            // and the template must be good for adding into the DOM multiple
                            // times. So convert to plain HTML string instead.
                            // Would it be wrong to simply use $.get() to fetch the template
                            // rather than can.view() ?
                            // this.html = domFrag.firstChild.innerHTML;
                            _this.html = frag.firstChild.innerHTML;
                        }

                        if (this.authType == 'local') {
                            can.view('/appdev/widgets/ad_ui_reauth/reauth_local.ejs', {}, processFrag);
                        } else {
                            domFrag = can.view('/appdev/widgets/ad_ui_reauth/reauth_cas.ejs', {}, processFrag);
                        }

                    },


                    show: function () {
                        var _this = this;

                        // For CAS, we cannot re-use old iframes. So init a new
                        // dialog box each time.
                        this.element = $(this.html);

                        if (this.authType != 'CAS') {
                            this.busyIcon = new AD.widgets.ad_icon_busy(this.element.find('.busy-icon'));
                        }

                        this.element.find('button.login').click(function(a,b,c) {
                            _this.authLocal();
                        })
                    
                        // make sure the labels are translated
                        AD.lang.label.translate(this.element);

                        // turn into a Bootstrap Modal & display
                        this.element.modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });

                    },


                    hide: function () {
                        var _this = this;

                        // Applicable only for CAS, but no effect on local auth.
                        var frameWindow = this.element.get(0).contentWindow;
                        if (frameWindow && !frameWindow.closed) {
                            // Try to stop MSIE from complaining about us closing the iframe
                            frameWindow.open('about:blank', '_self', '');
                            frameWindow.close();
                        }

                        this.element.modal('hide');

                        // give things time to hide before doing a remove:
                        setTimeout(function(){ 
                            _this.element.remove();
                        }, 1000);
                    },


                    authLocal:function(){
                        var _this = this;

                        this.busyIcon.show();
                        this.element.find('.alert').hide();

                        AD.comm.service.post({
                            url: '/site/login',
                            data: {
                                username: _this.element.find('#username').val(),
                                password: _this.element.find('#password').val()
                            }
                        })
                        .fail(function (err) {
                            err = err || {};
                            var message = err.message || 'Error';

                            // check for a known error and it's translation:
                            if (err.mlKey) {
                                var mlTrans = AD.lang.label.getLabel(err.mlKey);
                                if (mlTrans) {
                                    message = mlTrans;
                                }
                            }
                            _this.element.find('.alert')
                                .text(message)
                                .show();
                        })
                        .done(function () {
                            _this.hide();
                            AD.ui.reauth.end();
                        })
                        .always(function () {
                            _this.busyIcon.hide();
                        });
                    },
        
        
                    // For local auth
                    "button.login click": function () {
                        
                        this.authLocal();

                    },


                    "#password keypress": function (ev, el) {
                        // Pressing enter from the password field should trigger a submit
                        if (ev.keyCode == 13 || ev.keyCode == 10 || ev.keyCode == 3) {
                            this.element.find('button.login').trigger('click');
                        }
                    }

                });


            });

        });
    });