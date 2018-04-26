// DEPENDENCIES: displaySearches.js, createEventHtml.js

var event_data = [];
var user_fav_data = [];
var currentRows = 0;

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

$(document).ready(function(){
	checkSort();
	loadEvents();
	// hide the form that users would edit events with
	$("#event-form").hide();
	checkDisplay();
	// change the time inputs to be handled by timepicker
	$("input[id*='Time']").timepicker({});
});


// reload events if user selects a sort option
var checkSort = function() {
	// allow user to sort by date or popularity
	$("#searchSort").change(function() {
		if (event_data != [])
			showMyEvents();
	});
};

function checkDisplay() {
	var i = $("#displayEventForm").length
	if (i > 0) {
		$("#event-form").show();
	}
}

// make all icons not "selected"
function unselectIcons() {
	$(".deleteBtn").removeClass("selectedIcon");
	$(".fa-trash-alt").removeClass("fa-inverse");
	$(".editBtn").removeClass("selectedIcon");
	$(".fa-pencil-alt").removeClass("fa-inverse");
}

// load user events
var loadEvents = function() {
	var userId = $("#userData").data("uid");
	
	var callback = function(data) {
		if (data["status"] === "Success") {
			event_data = data["data"];
			setupUserFavorites();
		}
		else {
			event_data = [];
			showNoEvents();
		}
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
var handleDeleteMyEvent = function() {
	$(".deleteBtn").click( function() {
		// hide the footer
		$(".footer").hide();

		unselectIcons();

		// make the icon "selected"
		$(this).addClass("selectedIcon");
		$(this).find(".fa-trash-alt").addClass("fa-inverse");

		// toggle highlighting in search results
		eventNum = getNum($(this).attr('id'), "deleteBtn");
		if (!($("#smallSearchResult" + eventNum).hasClass("selected")))
			highlightSelectedSearchResult(eventNum);
		
		// delete event if user confirms deletion
		$("#smallSearchResult" + eventNum).show(function () {
			var result = confirm("Are you sure you would like to delete this event?");
			if (result) {
				// hide the event display if current event view is the event to be
				// deleted
				if (selected_event !== null && selected_event._id == event_data[eventNum - 1]._id) {
					$(".event-view").hide();
					$("#event-form").hide();
				}
			
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
			} else {
				unselectIcons();
			}
		});
	});
}

// allow user to change events
var handleEditMyEvent = function() {

	$(".editBtn").click( function() { 
		// Add edit parameter to URL.
		if (getUrlParameter('edit') === undefined) {
			updateUrl(addUrlParameter(document.location.search, 'edit'));
		}

		var eventNum = getNum($(this).attr('id'), "editBtn");
		renderEditForm(eventNum);
	});
}


var renderEditForm = function(eventNum) {
	var editBtn = $("#editBtn"+eventNum);

	// hide the footer
	$(".footer").hide();

	unselectIcons();

	// make the icon "selected"
	editBtn.addClass("selectedIcon");
	editBtn.find(".fa-pencil-alt").addClass("fa-inverse");

	// toggle highlighting in search results
	if (!($("#smallSearchResult" + eventNum).hasClass("selected")))
		highlightSelectedSearchResult(eventNum);

	// hide the event display
	$(".event-view").hide();

	// fill the form with the correct values
	$("#event-id").val(event_data[eventNum - 1]._id);
	$("#title").val(event_data[eventNum - 1].title);
	$("#description").val(event_data[eventNum - 1].description);
	$("#host").val(event_data[eventNum - 1].host);

	$("#visibility-"+event_data[eventNum - 1].visibility).attr('checked', 'checked')

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
	for (var i = 0; i < numShowings; i++) {
		$("#locations-" + i).val(event_data[eventNum - 1].instances[i]["location"]);
		starts = event_data[eventNum - 1].instances[i]["start_datetime"].split(" ");
		ends = event_data[eventNum - 1].instances[i]["end_datetime"].split(" ");

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
	for (var i = numShowings; i < 4; i++) {
		$("#locations-" + i).val("");
		$("#startDates-" + i).val("");
		$("#endDates-" + i).val("");
		$("#startTimes-" + i).val("");
		$("#endTimes-" + i).val("");
	}
	if (event_data[eventNum - 1].poster !== undefined) {
		$("#poster-link").attr('href', event_data[eventNum - 1].poster);
		$("#current-poster").toggleClass("hidden");
	}
	$("#link").val(event_data[eventNum - 1].trailer);


	// display the form
	$("#event-form").show();
}

var handleDeletePoster = function() {
	$("#delete-poster-button").click(function() {
		if (confirm("Are you sure you wish to remove the poster?")) {
			$("#deletePoster").attr("value", "delete");
			$("#current-poster").toggleClass("hidden");
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
			user_fav_data = [];
		showMyEvents();
		handleDeletePoster();
		handleDeleteMyEvent();
		handleEditMyEvent();
		var urlParamEventId = checkEventUrlParameter();
		if (urlParamEventId) {
			updateUrlParamEventView(urlParamEventId);
		}
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
// TODO: Figure out if we want to show them this message, or just not show the 'Manage
// my Events' tab at all if they have no events
var showNoEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";
	
	currentSearches.innerHTML = `<h5>You have no events :( Go to 'Add Event' to create one!</h5>`;
}
