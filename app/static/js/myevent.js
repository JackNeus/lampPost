// DEPENDENCIES: displaySearches.js, createEventHtml.js

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

var event_data = [];
var user_fav_data = [];

$(document).ready(function(){
	setupUserFavorites();
	loadEvents();
});


// load user events
var loadEvents = function() {
	var userId = $("#userData").data("uid");
	
	var callback = function(data) {
		if (data["status"] === "Success") 
			event_data = data["data"];
		else
			event_data = null;
		setupUserFavorites();
		showMyEvents();
		changeMyEvents();
	}
	$.ajax({
		url: base_url + '/api/user/get_events/'+userId,
		dataType: 'json',
		headers: {
			'Authorization': ('Token ' + $.cookie('api_token'))
		},
		success: callback
	});
};

// allow user to delete events
var changeMyEvents = function() {
	$(".deleteBtn").click( function() {
		var result = confirm("Are you sure you would like to delete this event?");
		if (result) {
			var eventNum = getNum($(this).attr("id"), "deleteBtn");
			var eventId = event_data[eventNum - 1]._id;
			
			var callback = function() {
				loadEvents();
				// If the event is selected, hide the view after it is deleted.
				var selected_event = getSelectedEvent();
				if (selected_event !== null && selected_event._id == eventId) {
					hideEventViewPanel();
				}
			}
			$.ajax({
				url: base_url + '/api/event/delete/' + eventId,
				method: 'delete',
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: callback
			});
		}
	});
}

// Get list of events which user has favorited
var setupUserFavorites = function() {
	var userId = $("#userData").data("uid");
	var callback = function(data) {
		if (data["status"] === "Success") 
			user_fav_data = data["data"];
		else
			user_fav_data = null;
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
