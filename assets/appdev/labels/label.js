(function(){

/**
 * @class AD.controllers.Label
 * This is the controller object used for each label on the page.
 */
var Label = can.Control.extend({
    
    // Technically not really constants, but you get the idea
    constants: {
        // The label key will be determined by the value of this attribute on
        // the raw text element.
        keyAttribute: "app-label-key",
        
        // The label's current language will be reflected in this attribute
        langAttribute: "app-label-lang",
        
        // After initializing, the text element will be assigned this CSS class
        // for identification.
        cssClass: "ad-label",
        
        // A reference to the controller object will be stored in the element
        // via jQuery data under this name.
        jQueryData: "AD-Label"
    },
    
    
    
    /**
     * @function keylessCreate
     *
     * Initialize an element into a new Label object. The element's original
     * html content will be used as the label key.
     *
     * @param jQuery $element
     * @return Label
     */
    keylessCreate: function ($element) {
        // Use the original text as the label key
        var originalText = $element.html();
        $element.attr(this.constants.keyAttribute, originalText);
        return this.create($element);
    },
    
    
    /**
     * @function create
     *
     * Initialize an element into a new Label object. The element must
     * have the label key embedded as an attribute under "app-label-key". Any
     * existing html content in the element will be replaced.
     *
     * @param jQuery $element
     * @return Label
     */
    create: function ($element) {
        var labelInstance = new Label($element);
        return labelInstance;
    },

    
    /**
     * @function transform
     *
     * Modify the HTML content of a raw text element to the standard label
     * structure.
     *
     * @param jQuery $element
     * @return jQuery
     *      Returns the SPAN element that will hold the actual label text.
     */ 
    transform: function ($element) {
        var $span = $('<span>');

        // Discard the original text
        $element.empty();

        $element.append($span);
        $element.addClass(this.constants.cssClass);

        // TODO??: provide pop-up translator selection icon

        return $span;
    },
    
    // Will be merged with this.options in each object instance
    defaults: {
    },
    
    // An array of references to all label objects currently in use.
    collection: [],
    
    /**
     * @function translateAll
     * Translates all label controls currently in existence.
     */
    translateAll: function (langCode) {
        // `this` is the Label class
        $.each(this.collection, function() {
            // `this` is now a Label instance
            this.translate(langCode);
        });
    }

}, {
    
    init: function ($element) {
        this.labelKey = $element.attr(this.constructor.constants.keyAttribute);
        // Skip if no label key, or if this element was already initialized
        if (this.labelKey && !$element.hasClass(this.constructor.constants.cssClass)) {
            // Init the HTML
            this.$span = this.constructor.transform($element);
            
            // Update static collection
            this.constructor.collection.push(this);
            
            // Provide a reference to this Label object on the HTML element
            $element.data(this.constructor.constants.jQueryData, this);
            
            this.translate(); // translate into current default language
        }
    },
    
    destroy: function () {
        // Update static collection
        var i = this.constructor.collection.indexOf(this);
        if (i >= 0) {
            this.constructor.collection.splice(i, 1);
        }
        
        can.Control.prototype.destroy.call(this);
    },
    
    /**
     * @function translate
     * @param string langCode (Optional)
     * Changes the text in the label to 
     */
    translate: function (langCode) {
        langCode = langCode || AD.lang.currentLanguage;
        
        var label = AD.lang.label.getLabel(this.labelKey, langCode);
        // fall back on displaying just the key if no label was found
        if (label === false) {
            label = '[' + this.labelKey + ']';
        }

        this.$span.html(label);
        this.element.attr(this.constructor.constants.langAttribute, langCode);
    },
    
    // Listen for globally published messages requesting translation
    "AD.label.translate subscribe": function(langCode) {
        this.translate(langCode);
    }
    
});



AD.controllers.Label = Label;

})();