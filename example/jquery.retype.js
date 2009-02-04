/* 
	encoding: UTF-8 
	jquery.retype.js
	date: 2009-01-27
	copyright: (c) 2008--2009 Martin Czygan < martin.czygan ~ gmail.com >  
	web: http://plugins.jquery.com/project/retype
	src: http://bitbucket.org/miku/jquery-retype/
	example: http://myyn.org/retype
*/

(function($) {
	
	// construct a dom fragment for text input
	// this is just html and won't do much for itself 
	function getRetypeStyledHtml(options) {
		var construct = "";

		// container, the actual div and the textarea
		construct = construct + ('<div class="retype-container">');
		construct = construct + ('<div class="retype-div">');

		construct = construct + ('<div class="retype-textarea">');
		construct = construct + ('<textarea id="' + options.id + '" rows="10" cols="50" scrolltop="scrollHeight"></textarea>');
		construct = construct + ('</div>');

		// the options-div
		construct = construct + ('<div class="retype-options">');

		// one option per language
		for (var i = 0; i < options.language.length; i++) {

			var languageId = 'retype-language-' + options.language[i].name;
			var languageName = options.language[i].name;
			if (options.language[i].displayName) {
				var languageDisplayName = options.language[i].displayName;
			} else {
				var languageDisplayName = languageName;
			}

			construct = construct + ('<li class="retype-option">');			
			construct = construct + ('<a href="#' + languageName + '" id="' + languageId + '">' + languageDisplayName + '</a>');
			construct = construct + ('</li>');
		}

		construct = construct + ('<li class="retype-option-keyboard"><a href="#">Keyboard</a></li>');
		construct = construct + ('</div><!-- options -->');
		construct = construct + ('<div class="retype-help"></div>')
		construct = construct + ('</div><!-- div --></div><!-- container -->');

		return construct;
	}
	
	// this actually manipulates the dom with insertion of a couple of divs,
	// which can be styled individually
	// the languages are shown below the textarea, the event handlers
	// for the click are installed here
	$.fn.retypeStyled = function(mode, options) {
		var mode = mode || 'on';
		// var options = $.extend({}, $.fn.retype.options, options);

		return this.each(function(){
			$this = $(this);
			
			var number_of_retype_containers_in_dom = $(".retype-container").size();
			var unique_id = "retype-container-no-" + number_of_retype_containers_in_dom;
			
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
							$("#" + unique_id + " *").removeClass("retype-option-selected");
							$("#" + unique_id + " #retype-language-" + options.language[intIndex].name).addClass("retype-option-selected");
							$("#" + options.id).retype("off");
							
							$("#" + options.id).retype("on", options.language[intIndex] );
							
							if (options.language[intIndex].help) {
								$("#" + unique_id + " .retype-help").hide();
								$("#" + unique_id + " .retype-help").html("<p>" + options.language[intIndex].help + "</p>");
								$("#" + unique_id + " .retype-help").fadeIn("fast");								
							}
							
							if (options.language[intIndex].help_url) {
								$("#" + unique_id + " .retype-help").hide();
								$("#" + unique_id + " .retype-help").load(options.language[intIndex].help_url);
								$("#" + unique_id + " .retype-help").fadeIn("fast");								
							}
							
							$("#" + options.id).focus();
						}
					);
				}
			);

			// initial selection
			$("#retype-language-" + options.language[0].name).addClass("retype-option-selected");
			$("#" + options.id).retype("off");

			$("#" + options.id).retype("on", options.language[0] );
			
			// $("#" + options.id).retype("on", { 
			// 	"mapping" : options.language[0].mapping,
			// 	"debug" : options.debug }
			// );
			
			if (options.language[0].help) {
				$("#" + unique_id + " .retype-help").html("<p>" + options.language[0].help + "</p>");
			}
			$("#" + options.id).focus();
			
		});
	}
	
	$.fn.retype = function(mode, options) {
		var mode = mode || 'on';
		
		// this is not particulary useful right now ..
		var options = $.extend({}, $.fn.retype.options, options);
		
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
				$this.keyup(handle_composite);
				// debug
				$this.keydown(retype_debug).keypress(retype_debug);

			} else {
				$this.unbind("keydown");
				$this.unbind("keyup");
				$this.unbind("keypress");
			}
			
			function retype_debug(e) {
				$("#retype-debug").html(
					"KeyCode: " + e.charCode + "\n" +
					"Alt: " + e.altKey + "\n" +
					"Meta: " + e.metaKey + "\n" +
					"Shift: " + e.shiftKey + "\n" +
					"Ctrl: " + e.ctrlKey + "\n"
				);
			}

			// Handle escape separately is ugly, but we need it -- because if we bind it to both
			// keyup and keydown we get doublettes .. 
			function handle_escape(e) {
				if (e.keyCode == 27) {

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
					this.setSelectionRange(caret_position + replacement_length, caret_position + replacement_length);
					// supress default action
					return false;
				}
			}; // end handle_escape
			
			// handle alt+<x> keys...
			// TODO
			function handle_composite(e) {
				var range = $(this).getSelection();
				var current = this.value;
				var prefix = current.substring(0, range.start);
				var suffix = current.substring(range.start, current.length)
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
					var prefix = current.substring(0, range.start - 1);
					
					// get the mapping ...
					if (options.mapping[last_typed]) {
						var replacement_length = options.mapping[last_typed].length;
						var the_new_current = prefix + options.mapping[last_typed] + suffix;
						// ... and update
						this.value = the_new_current;
						this.setSelectionRange(caret_position + replacement_length, caret_position + replacement_length);
						return false;
					} else { return; }
				}
				return false;
			}; // handle_composite

			// updates are for the german umlauts characters, since these are two-byte chars
			// which do not get mapped to keyCodes ...
			// we need to let them write it into the textarea, then replace it with the 
			// desired char; this looks ugly -- you can see it if you watch as you type, echoid ...
			function handle_echoid(e) {
				
				// get the standard data from the textarea
				// range of the selection, the current value of the textarea
				// <prefix> <caret_position> <suffix> 
				var range = $(this).getSelection();
				var current = this.value;
				var prefix = current.substring(0, range.start);
				var suffix = current.substring(range.start, current.length)
				var caret_position = range.start;

				if (e.altKey) {
					var the_key_string = null;

					if (e.shiftKey) {
						the_key_string = "shift+alt+" + String.fromCharCode(e.keyCode);
					} else {
						the_key_string = "alt+" + String.fromCharCode(e.keyCode); 
					}

					if (options.mapping[the_key_string]) {
						var the_new_current = prefix + options.mapping[the_key_string] + suffix;
						// update
						this.value = the_new_current;
						this.setSelectionRange(caret_position + 1, caret_position + 1);
						return false;
					}
				}
				
			}; // handle_echoid
			
			// handle the "normal" alpha keys
			function handle_alpha(e) {
				
				if (!e.ctrlKey && !e.altKey && !e.metaKey) {
					if ( 
						(65 <= e.which && e.which <= 65 + 25)	|| // upcase letters
						(97 <= e.which && e.which <= 97 + 25)	|| // downcase letters
						(42 == e.which)							|| // *
						(43 == e.which)							|| // +
						(35 == e.which)							|| // #
						(39 == e.which)							   // '
				) 
					{
						// get the standard data from the textarea
						// range of the selection, the current value of the textarea
						// <prefix> <caret_position> <suffix> 
						var range = $(this).getSelection();
						var current = this.value;
						var caret_position = range.start;
						var prefix = current.substring(0, range.start);
						var suffix = current.substring(range.start, current.length)
					
						// construct
						var the_key_string = String.fromCharCode(e.charCode); // = String.fromCharCode(e.keyCode); // safari only
						// replace, if we have a mapping
						if (options.mapping[the_key_string]) {
							var replacement_length = options.mapping[the_key_string].length;
							var the_new_current = prefix + options.mapping[the_key_string] + suffix;
							// update
							this.value = the_new_current;
							this.setSelectionRange(caret_position + replacement_length, caret_position + replacement_length);
							return false;
						} else { // or use default action
							return;
						}
					}
				} 
			}; // handle_alpha
		}); // end: iterate and reformat each matched element
	};



// end of closure
})(jQuery);

// EOF
