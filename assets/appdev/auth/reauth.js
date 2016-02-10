steal(
// 'appdev',
    'appdev/ad.js',
    'appdev/config/config.js',
    'appdev/widgets/ad_ui_reauth/ad_ui_reauth.js',
    //'appdev/comm/hub.js'
    function () {
        steal.import('appdev/widgets/ad_ui_reauth/ad_ui_reauth').then(function () {
            /**
     * @class AD.ui
     * @parent AD_Client
     */
            if (typeof AD.ui == "undefined") {
                AD.ui = {};
            }

            //--------------------------------------------------------------------------

            /**
             * @class AD.ui.reauth
             * This is the object used for configuring reAuthentication on the page.
             */
            AD.ui.reauth = {
                /**
                * @function init
                * Initialize the object for reauthentication
                */
                init: function () {
                    this.reauthenticating = false;
                    this.widget = new AD.widgets.ad_ui_reauth();
                    this.dfd = null;
                },
        
                /**
                * @function inProgress
                * @return boolean
                *   true if re-authentication is currently in progress
                */
                inProgress: function () {
                    if (this.reauthenticating) {
                        return true;
                    } else {
                        return false;
                    }
                },
        
                /**
                 * Begin re-authentication.
                 * @return Deferred
                 *      The deferred will resolve when authentication completes
                 */
                start: function () {
                    if (!this.reauthenticating) {
                        this.reauthenticating = true;
                        this.widget.show();
                        this.dfd = AD.sal.Deferred();
                    }
                    return this.dfd;
                },
        
                /**
                 * Called after the user has been authenticated
                 */
                end: function () {
                    this.reauthenticating = false;
                    this.widget.hide();
                    this.dfd.resolve();
                }

            };

            AD.ui.reauth.init();

        })
    });