var checkEventParameter = function() {
	var eventId = getUrlParameter('event');
	if (eventId) {
		var event = $.grep(event_data, function(event){return event._id === eventId;})[0];
		if (event != undefined) {
			eventNum = event_data.indexOf(event) + 1;
			selected_event = event;
			highlightSelectedSearchResult(eventNum);
			populateEventViewPanel(eventNum);
			updateEventFireBtn(eventNum);
		}
	}
};

var checkSearchParameter = function() {
	var searchQuery = getUrlParameter('search');
	if (searchQuery) {
		$("#search-box").val(searchQuery);
	}
};


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

/*
* Add a URL parameter (or changing it if it already exists)
* @param {search} string  this is typically document.location.search
* @param {key}    string  the key to set
* @param {val}    string  value 
*/
var addUrlParameter = function(search, key, val){
  var newParam = key + '=' + val,
      params = '?' + newParam;

  // If the "search" string exists, then build params from it
  if (search) {
    // Try to replace an existance instance
    params = search.replace(new RegExp('([?&])' + key + '[^&]*'), '$1' + newParam);

    // If nothing was replaced, then add the new param to the end
    if (params === search) {
      params += '&' + newParam;
    }
  }

  return params;
};
