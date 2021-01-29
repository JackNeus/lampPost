// DEPENDENCIES: displaySearches.js, displayEvent.js, createEventHtml.js, handleUrlParam.js

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
	addViewButton();
	// hide the form that users would edit events with
	$("#event-form").hide();
	// change the time inputs to be handled by timepicker
	$("input[id*='Time']").timepicker({});
	// Setup device view handler
	INITIAL_PANE = 0;
	browserView()
	heightResizeHandler();
});

/*--------------------------- DATA RETRIEVAL ---------------------------------*/

// Load user events
var loadEvents = function() {
	var userId = $("#userData").data("uid");
	var callback = function(data) {
		if (data["status"] === "Success" && data["data"].length > 0) {
			event_data = toJavaEventData(data["data"]);
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

// Reload events if user selects a sort option
var checkSort = function() {
	// allow user to sort by date or popularity
	$("#searchSort").change(function() {
		if (event_data != []) {
			loadEvents();
		}
	});
	$(".sort-direction-btn").click(function() {
		$("#sort-direction-btn-up").toggleClass("hidden");
		$("#sort-direction-btn-down").toggleClass("hidden");
		loadEvents();
	});
};

// Get list of events which user has favorited
var setupUserFavorites = function() {
	var userId = $("#userData").data("uid");
	var callback = function(data) {
		if (data["status"] === "Success")
			user_fav_data = toJavaEventData(data["data"]);
		else
			user_fav_data = [];
	};
	var updateSearch = function() {
		showMyEvents();
		handleDeleteMyEvent();
		handleEditMyEvent();
		
		// TODO: do we need to call this function?
		//checkDisplay();
	};
	$.ajax({
			url: base_url + '/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback,
			complete: updateSearch
	});
};

/* -------------------------- HANDLE ICON CLICKS -----------------------------*/

// Allow user to delete their event
var handleDeleteMyEvent = function() {
	$(".deleteBtn").click( function(e) {
		eventNum = getEventNumberFromID($(this).attr('id'), "deleteBtn");
		selected_event = event_data[eventNum - 1];
		var eventId = selected_event._id;

		// select the delete icon
		deselectIcons();
		selectIcon($(this));

		// toggle highlighting in search results
		selectSearchResult($("#smallSearchResult" + eventNum));

		// populate and display event view
		updateEventView(eventNum);
		
		// update the url
		updateUrl(removeUrlParameter(document.location.search, 'edit'));
		updateUrl(addUrlParameter(document.location.search, 'event', eventId));

		// delete event if user confirms deletion
		$("#smallSearchResult" + eventNum).show(function () {
			var result = confirm("Are you sure you would like to delete this event?");
			if (result) {
				var callback = function() {
					// clear the event display (since event view will always show event to be deleted)
					clearEventViewPanel();
				
					// remove event url parameter
					updateUrl(removeUrlParameter(document.location.search, "event"));
					
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
			else {
				deselectIcons();
			}
		});
		
		// Trigger slick action if mobile
		if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickNext");
		e.stopPropagation();
	});
}

// Allow user to edit their event
var handleEditMyEvent = function() {
	$(".editBtn").click( function(e) {
		var eventNum = getEventNumberFromID($(this).attr('id'), "editBtn");
		selected_event = event_data[eventNum - 1];
		var eventId = selected_event._id;
		
		// make the edit icon "selected"
		deselectIcons();
		selectIcon($(this));

		// toggle highlighting in search results
		selectSearchResult($("#smallSearchResult" + eventNum));

		// populate and display event edit form
		updateEventViewEditForm(eventNum);
		
		// update the url
		updateUrl(addUrlParameter(document.location.search, 'edit'));
		updateUrl(addUrlParameter(document.location.search, 'event', eventId));
		
		// Trigger slick action if mobile
		if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickNext");
		e.stopPropagation();
	});
}

// Allow user to delete the poster for an event
var handleDeletePoster = function() {
	$("#delete-poster-button").click(function() {
		if (confirm("Are you sure you wish to remove the poster?")) {
			$("#deletePoster").attr("value", "delete");
			$("#current-poster").toggleClass("hidden");
		}
	});
}

/* -------------------------------- DISPLAY ----------------------------------*/

// Select the the given icon (edit or delete)
var selectIcon = function(icon) {
	$(icon).addClass("selectedIcon");
}

// Deselect edit and delete icons
function deselectIcons() {
	$(".deleteBtn").removeClass("selectedIcon");
	$(".editBtn").removeClass("selectedIcon");
	$(".fa-pencil-alt").removeClass("fa-inverse");
	$(".fa-trash-alt").removeClass("fa-inverse");
}

// Writes simple message to user if they have no events
var showNoEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	currentSearches.innerHTML = "<div class=\"no-event align-items-center\">"
		+ "It seems there's nothing here yet! When you next want to publicize an event, navigate to the 'Add Event' form linked above, post the event, and then your new event will show up here!</div>";
}

// Take advantage of a jinja variable to force rendering of
// edit form at page load.
function checkDisplay() {
	let i = $("#displayEventForm").length;
	if (i > 0) {
		$("#event-form").show();

		var eventId = $("#event_id").val();
		var eventNum = event_data.findIndex(function(event){return event._id === eventId;}) + 1;

		// Graphical commands to select event result.
		selectSearchResult($("#smallSearchResult" + eventNum));
		selectIcon($("#editBtn" + eventNum));

		// If the user attempted to edit an event and was unsuccessful,
		// the url parameter will not be set. We need to manually check for this.
		//
		// Usually, we update the DOM according to the value of the URL.
		// Here, we update the URL according to the DOM.
		updateUrl(addUrlParameter(document.location.search, 'event', eventId));
		updateUrl(addUrlParameter(document.location.search, 'edit'));
	}
}
