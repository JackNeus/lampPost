// check if the event url parameter exists. If so, return the event id
var checkEventUrlParameter = function() {
	var eventId = getUrlParameter('event');
	return eventId;
};

// check if the edit event url parameter exists. If so, return true.
var checkEditEventUrlParameter = function() {
	var editMode = getUrlParameter('edit');
	if (editMode === undefined) {
		return false;
	}
	return editMode;
}

// check if the calendar view url parameter exists. If so, return true. 
var checkCalendarParameter = function() {
	var calendarMode = getUrlParameter('cal');
	if (calendarMode === undefined)
		return false;
	return calendarMode;
	
};

// check if the search url parameter exists. If so, fill in the 
// search box with that value
var checkSearchUrlParameter = function() {
	var searchQuery = getUrlParameter('search');
	if (searchQuery) {
		$("#search-box").val(searchQuery);
		$("#search-box").keyup();
		prevQuery = searchQuery; // set previous query variable found in app.js
	}
};

// check if eventId exists in event_data. If so, highlight search result
// and show event view for that event
var updateUrlParamEventView = function(eventId) {
	// get the event data for the given event id
	var event = $.grep(event_data, function(event){return event._id === eventId;})[0];
	
	if (event != undefined) {
		eventNum = event_data.indexOf(event) + 1;
		selected_event = event;
		if (checkEditEventUrlParameter()) {
			renderEditForm(eventNum);
		}
		else {
			populateEventViewPanel(eventNum);
			handleEventFireBtnClick(eventNum);
		}
	}
};

// Function found online in stack overflow
// given a url parameter, return the value of that parameter
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
