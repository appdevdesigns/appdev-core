/**
 * This is a mock steal() function that only executes functions and does not
 * load any scripts or other resources. 
 *
 * Can be used for unit testing specific  objects that would normally use 
 * steal to load a bunch of other libraries that may interfere with testing. 
 * You will have to load any dependencies yourself manually.
 */

(function() {
    // Save reference to whatever was assigned to the `steal` variable before.
    var original = window.steal;
    
    var steal = function() {
        for (var i=0; i<arguments.length; i++) {
            // Execute functions passed in to steal()
            if (typeof arguments[i] == 'function') {
                arguments[i]();
            }
            // Ignore everything else
        }
        return steal;
    };
    
    steal.then = steal;
    
    // Restores original `steal` reference, if any
    steal.noConflict = function() {
        window.steal = original;
        return steal;
    };
    
    // Set up globally
    window.steal = steal;

})();
