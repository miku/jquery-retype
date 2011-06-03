/* 
    encoding: UTF-8 
    jquery.retype.js
    date: 2009-06-11
    copyright: (c) 2008--2009 Martin Czygan < martin.czygan ~ gmail.com >  
    web: http://plugins.jquery.com/project/retype
    src: http://bitbucket.org/miku/jquery-retype/
    example: http://myyn.org/retype
    special thanks: wim rijnders | http://wimrijnders.nl/
*/

function setCaretTo(obj, pos) { 
    obj.focus(); 
    obj.setSelectionRange(pos, pos); 
}

(function($) {
    
    // construct a dom fragment for text input
    // this is just html and won't do much for itself 
    function getRetypeStyledHtml(options) {
        var construct = "";

        // container, the actual div and the textarea
        construct = construct + ('<div class="retype-container">');
        construct = construct + ('<div class="retype-div">');

        construct = construct + ('<div class="retype-textarea">');
        construct = construct + ('<textarea class="retype-textarea" id="' + options.id + '" scrolltop="scrollHeight"></textarea>');
        construct = construct + ('</div>');

        // the options-div
        construct = construct + ('<div class="retype-options">');

        // one option per language
        for (var i = 0; i < options.language.length; i++) {

            var languageId = 'retype-language-' + options.language[i].name;
            var languageName = options.language[i].name;
            var languageDisplayName = languageName;
            if (options.language[i].displayName) {
                languageDisplayName = options.language[i].displayName;
            }
            construct = construct + ('<li class="retype-option">');         
            construct = construct + ('<a href="#' + languageName + '" id="' + languageId + '">' + languageDisplayName + '</a>');
            construct = construct + ('</li>');
        }

        // Comment out keyboard as long as we don't really have one 
        // construct = construct + ('<li class="retype-option-keyboard"><a href="#">Keyboard</a></li>');
        construct = construct + ('</div><!-- options -->');
        construct = construct + ('<div class="retype-help"></div>');
        construct = construct + ('</div><!-- div --></div><!-- container -->');

        return construct;
    }
    
    // this actually manipulates the dom with insertion of a couple of divs,
    // which can be styled individually
    // the languages are shown below the textarea, the event handlers
    // for the click are installed here
    $.fn.retypeStyled = function(mode, options) {

        mode = mode || 'on';
        // var options = $.extend({}, $.fn.retype.options, options);

        return this.each(function(){
            $this = $(this);
            
            var number_of_retype_containers_in_dom = $(".retype-container").size();
            var unique_id = "retype-container-" + number_of_retype_containers_in_dom;
            
            // create the html
            var construct = getRetypeStyledHtml(options);
                        
            // append the tree fragment
            $this.append(construct);
            
            // add an id ...
            $(this).children(".retype-container").attr('id', unique_id);
            
            // connect the mappings
            // why not a normal for-loop?
            // http://www.bennadel.com/blog/534-The-Beauty-Of-The-jQuery-Each-Method.htm
            $("#" + unique_id + " .retype-option").each(
                function(intIndex){
                    $(this).bind(
                        "click",
                        function(e) {
                            // visually 'clear' selection
                            $("#" + unique_id + " *").removeClass("retype-option-selected");
                            // visually 'select'
                            $("#" + unique_id + " #retype-language-" + options.language[intIndex].name).addClass("retype-option-selected");
                            
                            // 'logic' select
                            $("#" + options.id).retype("off");

                            // inject the debug option
                            $.extend(options.language[intIndex], { 'debug' : options.debug });
                            
                            $("#" + options.id).retype("on", options.language[intIndex] );

                            // look for some help
                            $("#" + unique_id + " .retype-help").hide();
                            if (options.language[intIndex].help) {
                                $("#" + unique_id + " .retype-help").html("<p>" + options.language[intIndex].help + "</p>");
                            }
                            if (options.language[intIndex].help_url) {
                                $("#" + unique_id + " .retype-help").load(options.language[intIndex].help_url);
                            }
                            $("#" + unique_id + " .retype-help").fadeIn("fast");
                            
                            $("#" + options.id).focus();
                        }
                    );
                }
            );

            // initial selection
            
            $("#retype-language-" + options.language[0].name).addClass("retype-option-selected");
            $("#" + options.id).retype("off");
            $("#" + options.id).retype("on", options.language[0] );
            
            // optional debug
            
            // $("#" + options.id).retype("on", { 
            //  "mapping" : options.language[0].mapping,
            //  "debug" : options.debug }
            // );
            
            if (options.language[0].help) {
                $("#" + unique_id + " .retype-help").html("<p>" + options.language[0].help + "</p>");
            }
            if (options.language[0].help_url) {
                $("#" + unique_id + " .retype-help").load(options.language[0].help_url);
            }
            
            $("#" + options.id).focus();
            


        // For multiple character input, following variable remembers previous 
        // position of cursor, so we know the previous character
        // inputted if the cursor was not moved.
        //
        // The caret position needs to be remembered for every text input separately.
        // Since the options data structure is associated with a text input, this is
        // the logical place to put it.
        options.prev_caret_position = -1; 

        });
    };
    
    $.fn.retype = function(mode, options) {
        mode = mode || 'on';

        // this is not particulary useful right now ..
        options = $.extend({}, $.fn.retype.options, options);
        
        if (options.mapping_url) {
            $.get(options.mapping_url, function(data) {
                eval("options.mapping = " + data);
            });
        }
                
        // iterate and reformat each matched element
        return this.each(function() {
            $this = $(this);

            if (mode == "on" || mode == "enable") {
                
                // update elements
                $this.keydown(handle_echoid);
                $this.keydown(handle_escape);
                $this.keypress(handle_alpha);

                // Little Hack: 
                // Disable keyup handling for dvorak so that it
                // does not break the other mappings. Later on, 
                // we will think of something better
                if ( options.name != 'Dvorak' ) {
                    $this.keyup(handle_composite);
                }
                
                // debug
                if (options.debug == true) {
                    $this.keydown(retype_debug).keypress(retype_debug); 
                }
                
                
            } else {
                $this.unbind("keydown");
                $this.unbind("keyup");
                $this.unbind("keypress");
            }
            
            function retype_debug(e) {
                $("#retype-debug").html(
                    "<strong>clientHeight</strong>: " + $("#" + options.id).attr("clientHeight") + "<br>" +
                    "<strong>scrollHeight</strong>: " + $("#" + options.id).attr("scrollHeight") + "<br>" +
                    "<strong>KeyCode</strong>: " + e.which + "<br>" +
                    "<strong>ALT</strong>: " + e.altKey + "<br>" +
                    "<strong>META</strong>: " + e.metaKey + "<br>" +
                    "<strong>SHIFT</strong>: " + e.shiftKey + "<br>" +
                    "<strong>CTRL</strong>: " + e.ctrlKey + "<br>");
            }

            // Handle escape separately is ugly, but we need it -- because if we bind it to both
            // keyup and keydown we get doublettes .. 
            function handle_escape(e) {
                if (e.which == 27) {
                    
                    // scroll-pain (for moz)
                    // after switching to a mapping, mozilla 
                    // would not scroll to the cursor location, 
                    // but rather up to textarea's top
                    // which is inconvenient
                    // : so safe the scrollTop, and restore it after the 
                    // processing
                    var scrollTop = this.scrollTop;

                    // get the standard data from the textarea
                    // range of the selection, the current value of the textarea
                    // <prefix> <caret_position> <suffix> 
                    var range = $(this).getSelection();
                    var current = this.value;
                    var prefix = current.substring(0, range.start);
                    var suffix = current.substring(range.start, current.length);
                    var caret_position = range.start;

                    // the new content of the textarea, and the default length of our replacement
                    var the_new_current = "";
                    var replacement_length = 1;
                    
                    // check for shift key
                    if (e.shiftKey) {
                        // and only do something, if we have a mapping for it
                        if (options.mapping["shift-escape"]) {
                            replacement_length = options.mapping["shift-escape"].length;                            
                            the_new_current = prefix + options.mapping["shift-escape"] + suffix;
                        } else { return; }
                    } else {
                        if (options.mapping["escape"]) {
                            replacement_length = options.mapping["escape"].length;
                            the_new_current = prefix + options.mapping["escape"] + suffix;
                        } else { return; }
                    }
                    
                    // update the value of the textarea
                    this.value = the_new_current;

                    // move the cursor manually to the right place
                    setCaretTo( this, caret_position + replacement_length);
                    
                    // restore scroll position
                    this.scrollTop = scrollTop;
                    
                    // supress default action
                    return false;
                }
            }    // end handle_escape
            
            // handle alt+<x> keys...
            // TODO
            function handle_composite(e) {
                
                // scroll pain (for moz) (see comment on line 195)
                var scrollTop = this.scrollTop;
                
                var range = $(this).getSelection();
                var current = this.value;
                var prefix = current.substring(0, range.start);
                var suffix = current.substring(range.start, current.length);
                var caret_position = range.start;
                var the_new_current = "";
                
                // get the last character from the input - why?
                // because german umlauts leave no keycode in the event so we have to treat them specially
                var last_typed = current.substring(range.start - 1, range.start);
                                
                // check for all non-alpha characters which you like to map 
                // (and which are defined in ``mapping``)
                if ( 
                    last_typed == '\u00E4' || // ä
                    last_typed == '\u00F6' || // ö
                    last_typed == '\u00FC' || // ü
                    last_typed == '\u00C4' || // Ä 
                    last_typed == '\u00D6' || // Ö
                    last_typed == '\u00DC' || // Ü
                    last_typed == '<'      || 
                    last_typed == '>' ) {

                    // since one character has been written we have to delete one
                    // more in the prefix
                    prefix = current.substring(0, range.start - 1);
                    
                    // get the mapping ...
                    if (options.mapping[last_typed]) {

                        var replacement_length = options.mapping[last_typed].length;
                        var the_new_current = prefix + options.mapping[last_typed] + suffix;

                        // ... and update
                        this.value = the_new_current;
                        setCaretTo(this, caret_position + replacement_length);
                        
                        // restore scroll position
                        this.scrollTop = scrollTop;
                        
                        return false;
                    } else { return; }
                }

                // restore scroll position
                this.scrollTop = scrollTop;
                
                return false;
            } // handle_composite

            // updates are for the german umlauts characters, since these are two-byte chars
            // which do not get mapped to keyCodes ...
            // we need to let them write it into the textarea, then replace it with the 
            // desired char; this looks ugly -- you can see it if you watch as you type, echoid ...
            function handle_echoid(e) {
                
                // get the standard data from the textarea
                // range of the selection, the current value of the textarea
                // <prefix> <caret_position> <suffix> 
                
                // scroll pain (for moz) -- see comment line 195
                var scrollTop = this.scrollTop;
                
                var range = $(this).getSelection();
                var current = this.value;
                var prefix = current.substring(0, range.start);
                var suffix = current.substring(range.start, current.length);
                var caret_position = range.start;

                if (e.altKey) {
                    var the_key_string = null;

                    if (e.shiftKey) {
                        the_key_string = "shift+alt+" + String.fromCharCode(e.which);
                    } else {
                        the_key_string = "alt+" + String.fromCharCode(e.which); 
                    }

                    if (options.mapping[the_key_string]) {
                        var the_new_current = prefix + options.mapping[the_key_string] + suffix;
                        // update
                        this.value = the_new_current;
                        setCaretTo( this, caret_position + 1 );

                        // restore scroll position
                        this.scrollTop = scrollTop;

                        return false;
                    }
                }
                
            } // handle_echoid
            
            // handle the "normal" alpha keys
            function handle_alpha(e) {
                var returnval = true;
                var caret_position;
                
                // scroll pain (for moz) -- see comment line 195
                var scrollTop = this.scrollTop;
                
                if (!e.ctrlKey && !e.altKey && !e.metaKey) {
                    var range = $(this).getSelection();
                    caret_position = range.start;
                    var current = this.value;

                    var the_key_string = String.fromCharCode(e.which); 

                    // Check extended ranges
                    // for the time being, allow only two input characters.
                    if ( options.prev_caret_position + 1 == caret_position ) {
                        var prevKey = current.substring( options.prev_caret_position,caret_position);
                
                        if (options.mapping[prevKey + the_key_string]) {
                            // Found an extended mapping    
                            the_key_string = prevKey + the_key_string;
                            --caret_position;
                        }
                    }

                    if (options.mapping[the_key_string]) {
                        // We have a mapping; perform it


                        if (document.selection) { 
                            //IE
                            range = document.selection.createRange();

                            if( the_key_string.length > 1) {
                                range.moveStart( 'character', -(the_key_string.length -1 ) );
                            }

                            range.text = options.mapping[the_key_string];

                            // Block default action
                            returnval = false;
                        } else {
                            //Basically all other browsers

                            // get the standard data from the textarea
                            // range of the selection, the current value of the textarea
                            // <prefix> <caret_position> <suffix> 
                            var range = $(this).getSelection();
                            var current = this.value;
                            var prefix = current.substring(0, caret_position);
                            var suffix = current.substring(range.end, current.length);
    
                        
                            // do the replace
                            var replacement_length = options.mapping[the_key_string].length;
                            var the_new_current = prefix + options.mapping[the_key_string] + suffix;
                            // update
                            $(this).val( the_new_current );
    
    
                            /* DEBUG
                            $("#live-debug").html("<pre>caret_position: " + caret_position +
                                 "; replacement_length: " + replacement_length +
                                 "; maps to: " + options.mapping[the_key_string] +
                                 "; prefix: '" + prefix +
                                 "'; suffix: '" + suffix +
                                 "'; the_new_current: " + the_new_current +
                                "</pre>"
                            );
                            //END DEBUG */
    
                            if (caret_position == -1) { caret_position += 1; }
    
                            setCaretTo( this, caret_position + replacement_length);
    
                            // Block default action
                            returnval = false;
    
                        }
                    } else { 
                        // No mapping; use default action
                    }

                    // restore scroll position
                    this.scrollTop = scrollTop;
                    
                    options.prev_caret_position = caret_position;

                    return returnval;
                } 
            } // handle_alpha
        }); // end: iterate and reformat each matched element
    };

// end of closure
})(jQuery);

// EOF
