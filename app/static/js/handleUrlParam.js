// Function found online in stack overflow
// given a url parameter, return the value of that parameter
// return undefined if parameter doesn't exist
var getUrlParameter = function(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

// Function found online in stack overflow
/*
* Add a URL parameter (or changing it if it already exists)
* @param {search} string  this is typically document.location.search
* @param {key}    string  the key to set
* @param {val}    string  value 
*/
var addUrlParameter = function(search, key, val){
	key = encodeURIComponent(key); 
	if (val === undefined || val === null) {
		var newParam = key;
	}
	else {
		val = encodeURIComponent(val);
		var newParam = key + '=' + val;
	}
	var params = '?' + newParam;

	// If the "search" string exists, then build params from it
	if (search) {
		// Try to replace an existance instance
		params = search.replace(new RegExp('([\?&])' + key + '[^&]*'), '$1' + newParam);

		// If nothing was replaced, then add the new param to the end
		if (search.indexOf(key) == -1) {
			params += '&' + newParam;
		}
	}

	return params;
};

// Remove the edit parameter from search. 
// This should probably be made more generic in the future.
// TODO: allow removal of parameters with values
// TODO: fix a bug where if the parameter exists anywhere in the url (e.g. as search string), it gets removed
var removeUrlParameter = function(search, parameter) {
	params = search.replace(new RegExp('&?' + parameter + '(=[^&]*)?&?'), '');
	return params;
}

// Update url with given parameters.
var updateUrl = function(params) {
	var newurl = window.location.protocol + "//" + 
			 window.location.host + 
			 window.location.pathname + 
			 params;
	window.history.pushState({ path: newurl }, '', newurl);
}
