// DEPENDENCIES: displaySearches.js, createEventHtml.js

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

var event_data = [];
var user_fav_data = [];
var currentRows = 0;

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

$(document).ready(function(){
	setupUserFavorites();
	loadEvents();
	// hide the form that users would edit events with
	$("#event-form").hide();
	// slide up all the rows of locations/times
	// $("[id ^= 'form-row']").slideUp();
	checkDisplay();
});

function checkDisplay() {
	var i = $("#displayEventForm").length
	if (i > 0) {
		$("#event-form").show();
	}
}

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
		// hide the footer
		$(".footer").hide();

		// toggle highlighting in search results
		eventNum = getNum($(this).attr('id'), "deleteBtn");
		highlightSelectedSearchResult(eventNum);
		
		// delete event if user confirms deletion
		$("#smallSearchResult" + eventNum).show(function () {
			var result = confirm("Are you sure you would like to delete this event?");
			if (result) {
				// hide the event display if current event view is the event to be
				// deleted
				if (selected_event._id == event_data[eventNum - 1]._id)
					$(".event-view").hide();
			
				var eventId = event_data[eventNum - 1]._id;
			
				var callback = function() {
					loadEvents();
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
	});
}

// allow user to change events
var editMyEvents = function() {

	$(".editBtn").click( function() { 

		// hide the footer
		$(".footer").hide();

		// toggle highlighting in search results
		eventNum = getNum($(this).attr('id'), "editBtn");
		highlightSelectedSearchResult(eventNum);

		// hide the event display
		$(".event-view").hide();

		// fill the form with the correct values
		$("#event-id").val(event_data[eventNum - 1]._id);
		$("#title").val(event_data[eventNum - 1].title);
		$("#description").val(event_data[eventNum - 1].description);
		$("#host").val(event_data[eventNum - 1].host);
		var numShowings = event_data[eventNum - 1].instances.length;
		$("#numShowings-" + (numShowings - 1)).prop("checked", true);

		// to avoid flickering, if we haven't loaded anything yet, do this special case
		if (currentRows == 0) {
			for (var i = 1; i <= numShowings; i++) {
				$("#form-row-" + i).show();
			}
			currentRows = numShowings;
		}
		// otherwise, do the standard
		else {
			// show the correct number of form rows, by sliding down any extra we might need
			for (var i = currentRows; i <= numShowings; i++) {
				$("#form-row-" + i).slideDown();
			}

			currentRows = numShowings;

			// slide up any extra form rows
			for (var i = numShowings + 1; i <= 4; i++) {
				$("#form-row-" + i).slideUp();
			}
		}

		// fill in correct values in any relevant form rows
		for (var i = 1; i <= numShowings; i++) {
			$("#locations-" + i).val(event_data[eventNum - 1].instances[i - 1]["location"]);
			starts = event_data[eventNum - 1].instances[i - 1]["start_datetime"].split(" ");
			ends = event_data[eventNum - 1].instances[i - 1]["end_datetime"].split(" ");

			yearMonDayS = starts[0].split("-")
			yearMonDayE = ends[0].split("-")
			$("#startDates-" + i).val(yearMonDayS[1] + "/" + yearMonDayS[2] + "/" + yearMonDayS[0]);
			$("#endDates-" + i).val(yearMonDayE[1] + "/" + yearMonDayE[2] + "/" + yearMonDayE[0]);

			timeS = starts[1];
			timeE = ends[1];
			$("#startTimes-" + i).val(timeS);
			$("#endTimes-" + i).val(timeE);
		}

		// empty the values in all the other form rows
		for (var i = numShowings + 1; i <= 4; i++) {
			$("#locations-" + i).val("");
			$("#startDates-" + i).val("");
			$("#endDates-" + i).val("");
			$("#startTimes-" + i).val("");
			$("#endTimes-" + i).val("");
		}
		
		$("#link").val(event_data[eventNum - 1].trailer);


		// display the form
		$("#event-form").show();

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
