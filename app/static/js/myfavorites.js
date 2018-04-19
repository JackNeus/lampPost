// DEPENDENCIES: displaySearches.js, createEventHtml.js

var event_data = [];
var user_fav_data = [];

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

$(document).ready(function(){
	setupUserFavorites();
});

// Get list of events which user has favorited
var setupUserFavorites = function() {
	user_fav_data = [];
	var userId = $("#userData").data("uid");
	var callback = function(data) {
		if (data["status"] === "Success") {
			user_fav_data = data["data"];
			event_data = data["data"]
		}
		else {
			user_fav_data = [];
			event_data = [];
		}
		// only show favorites if user has any
		if (user_fav_data.length != 0) 
			showSearchResults();
		else 
			showNoFavorites();
	};
	$.ajax({
			url: base_url + '/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
	});
};

// Writes simple message to user if they have no favorites
// TODO: Format the message in a nicer way
var showNoFavorites = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";
	
	currentSearches.innerHTML = `<h5>You have no favorites :( Search for events
						    to favorite some!</h5>`;
}
