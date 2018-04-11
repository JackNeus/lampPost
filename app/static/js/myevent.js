// DEPENDENCIES: displaySearches.js, createEventHtml.js

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
		url: 'http://localhost:5001/api/user/get_events/'+userId,
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
			}
			$.ajax({
				url: 'http://localhost:5001/api/event/delete/' + eventId,
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
		user_fav_data = data;
	};
	$.ajax({
			url: 'http://localhost:5001/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
	});
};
