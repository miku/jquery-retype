Notes on Keyboard mappings
==========================

Here are basic comments and descriptions for the mapping files.
They are put here separate from the mappings, because as of version 1.6, 
jQuery has become stricter with parsing JSON input. Comments are not
accepted any more in JSON data.

int.json
--------

Adds diacritics to selected characters.
Possible diacritics are:

	`~^"'

Blocks in the mappings file are organized as follows:

	- Block 1: Accented vowels
	- Block 2: Other stuff
	- Block 3: Esperanto Letters; not that accent is reversed for u and U

dvorak.json
-----------
Dvorak Simplified Keyboard Layout

Author: Wim Rijnders 
Mail  : wim at axizo.nl

For the keys which originally generate punctuation characters, the 
Caps-Lock will output the lower case of the mapped letter. This is a
limitation of javascript, since there is no way of determining the
state of the Caps-Lock key. This can not be helped.

If Caps-Lock is not set to upper case. Shift-<letter> works as expected.


intl_ru_standard.json
---------------------
Keyboard mapping for standard Russian layout.

Author: Wim Rijnders 
Mail  : wim at axizo.nl

This is the standard layout for a US-101 keyboard.

Only writing characters are translated; special characters under the number on the top line
are not handled.
