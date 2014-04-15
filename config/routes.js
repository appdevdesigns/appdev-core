/**
 * Routes
 *
 * Use this file to add any module specific routes to the main Sails
 * route object.
 */


module.exports = {

    'get /site/config/data.js'      : 'appdev-core/ADCoreController.configData',
    'get /site/labels/:context'     : 'appdev-core/ADCoreController.labelConfigFile',
    'get /site/labels/:context/*'   : 'appdev-core/ADCoreController.labelConfigFile',
    'get /site/login'               : 'appdev-core/ADCoreController.login',
    'get /site/logout'              : 'appdev-core/ADCoreController.logout',


    //// only active in development environment:
    'get /node_modules/**' : 'appdev-core/ADCoreController.testingFiles'

};

