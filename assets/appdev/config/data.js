// Under normal circumstances, this file should never get loaded. Instead,
// the server will run appdev-core/ADCoreController.js configData().
//
// However, this file might be invoked if steal.js compiles everything and
// bypasses the server route for appdev/config/data.js . 

steal(
    'appdev/config/config.js',
    'jquery',
    function () {
        
        // Set the default config if we can't fetch from the server
        var fallback = function() {
            AD.config.setValue('authType', 'CAS');
        };
        
        $.ajax({ url: '/appdev/config/data.json' })
        .done(function(response) {
            if (!response.data) fallback();
            else {
                var settings = response.data;
                for (var key in settings) {
                    AD.config.setValue(key, settings[key]);
                }
                if (settings.siteBaseURL) {
                    
                    // socket.io base URL
                    window.io = window.io || {};
                    window.io.sails = window.io.sails || {};
                    window.io.sails.url = settings.siteBaseURL;
                    
                    // Steal.js base URL
                    if (typeof System != 'undefined') {
                        System.baseURL = settings.siteBaseURL;
                    }
                    
                    // CanJS ajax base URL
                    if (typeof can != 'undefined' && can.ajax) {
                        var original = can.ajax;
                        can.ajax = function(a, b) {
                            if (typeof a == 'string' && a[0] == '/') {
                                a = settings.siteBaseURL + a;
                            }
                            else if (typeof a == 'object' && a.url && a.url[0] == '/') {
                                a.url = settings.siteBaseURL + a.url;
                            }
                            return original(a, b);
                        };
                    }
                    
                    console.log('Base URL applied to canJS');
                }
            }
        })
        .fail(function(err) {
            console.error(err);
            fallback();
        });

    }
);