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
                        // For CAS, we cannot re-use old iframes. So init a new
                        // dialog box each time.
                        this.element = $(this.html);
            
                        // Init labels
                        this.element.find('[translate]').each(function () {
                            AD.controllers.Label.keylessCreate(this);
                        });

                        if (this.authType != 'CAS') {
                            this.busyIcon = new AD.widgets.ad_icon_busy(this.element.find('.busy-icon'));
                        }
            
                        // Bootstrap Modal
                        this.element.modal({
                            backdrop: 'static',
                            keyboard: false,
                            show: true
                        });

                    },


                    hide: function () {
                        // Applicable only for CAS, but no effect on local auth.
                        var frameWindow = this.element.get(0).contentWindow;
                        if (frameWindow && !frameWindow.closed) {
                            // Try to stop MSIE from complaining about us closing the iframe
                            frameWindow.open('about:blank', '_self', '');
                            frameWindow.close();
                        }

                        this.element.modal('hide');
                        this.element.remove();
                    },
        
        
                    // For local auth
                    "button.login click": function () {
                        var self = this;
                        self.busyIcon.show();
                        self.find('.alert').hide();

                        AD.comm.service.post({
                            url: '/site/login',
                            data: {
                                username: self.element.find('#username'),
                                password: self.element.find('#password')
                            }
                        })
                            .fail(function (err) {
                                err = err || {};
                                var message = err.message || 'Error';
                                self.find('.alert')
                                    .text(message)
                                    .show();
                            })
                            .done(function () {
                                AD.ui.reauth.end();
                            })
                            .always(function () {
                                self.busyIcon.hide();
                            });
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