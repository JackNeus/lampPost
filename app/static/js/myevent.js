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
		editMyEvents();
	}
	$.ajax({
		url: 'http://localhost:5001/api/user/get/created/'+userId,
		method: 'get',
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

// allow user to change events
var editMyEvents = function() {
	$(".editBtn").click( function() { 

		// toggle highlighting in search results
		// when the user clicks the edit button, we'll highlight that event
		$(".smallSearchResult").removeClass("selected");
		num = $(this).attr('id').substr("editBtn".length, );
		$("#smallSearchResult"+num).addClass("selected");

		// display the form, prefilled with the relevant values
		populateForm()

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
