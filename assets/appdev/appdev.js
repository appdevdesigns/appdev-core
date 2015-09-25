steal(
    'jquery'
).then(
    // 'canjs/can.jquery.js',
    'can',
    'can/view/ejs',
    'can/construct/super',
    'appdev/ad.js',
// ).then (
    function() {

       AD.ui.jQuery = window.jQuery; //$;

        if (AD.ui._resolveConflict) {
            console.log(' .... trying to not conflict with existing jQuery');
            $.noConflict();  // return things as they were.
        }
    },
// ).then(

        'appdev/comm/hub.js',
        'appdev/util/uuid.js',
        'appdev/util/async.js',
        'appdev/util/string.js',
        'appdev/config/config.js',
        'appdev/util/uiScrollbarSize.js',
// )
// .then(
        'appdev/config/data.js',
        'appdev/model/model.js',
        'appdev/labels/lang.js',
        'appdev/labels/label.js',
        'appdev/comm/service.js',
        'appdev/comm/socket.js',
        'appdev/auth/reauth.js',
// )
// .then(
        'appdev/UIController.js',
        'appdev/control/control.js',
        'appdev/widgets/ad_icon_busy',
        'appdev/widgets/ad_ui_reauth',
        'site/labels/appdev.js',
        function($) {

console.log('AD setup done ...');

        }
);
