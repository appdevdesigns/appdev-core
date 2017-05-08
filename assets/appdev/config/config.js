steal('appdev/sal/web-jquery.js', function() {

    /**
     * @class AD.config
     * @parent AD_Client
     */
	if (typeof AD.config == "undefined") {
		AD.config = {};
	}
    
    /**
     * @private
     * This is where the config values are stored.
     */
    var storage = {};
    
    /**
     * @function setValue
     * Set a single value definition.
     * @param [string] key
     * @param [string] value
     */
    AD.config.setValue = function (key, value) {
        storage[key] = value;
        readyNow();
    };
    
    /**
     * @function getValue
     * Retrieve a value from the config settings.
     *
     * @param [string] key   
     * @return [string|false]
     *      False is returned if there was no match for the key.
     */
    AD.config.getValue = function (key) {
        
        // Key not found
        if (!storage[key]) {
            return false;
        }
        
        var value = storage[key];
        
        return value;
    };
    
    /**
     * @private
     */
    var readyDFD = AD.sal.Deferred();
    var readyTimeout = null;
    
    /**
     * @private
     */
    var readyNow = function() {
        // If many readyNow() calls are made together, only respond to the
        // most recent one.
        if (readyTimeout) clearTimeout(readyTimeout);
        readyTimeout = setTimeout(function() {
            readyDFD.resolve();
        }, 50);
    }
    
    /**
     * Returns a Deferred that resolves when config values have been set the
     * first time.
     *
     * @param {function} [callback]
     * @return {Deferred}
     */
    AD.config.whenReady = function(callback) {
        callback && readyDFD.done(callback);
        return readyDFD;
    };

});