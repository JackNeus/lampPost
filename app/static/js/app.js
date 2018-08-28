// DEPENDENCIES: displaySearches.js, displayEvent.js, handleUrlParam.js

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

// Event data for currently displayed data.
var event_data = [];
var user_fav_data = [];

// Keep track of previous search query
var prevQuery = null;

// Keep track of the number of search requests currently out.
var search_requests_in_progress = 0;

// Keep track of current week in calendar view
var calWeek = 0;

// Keep track of whether the view mode just changed (to/from calendar view)
var change_view_mode;

// Keep track of whether or not trending has just loaded
// if false, trending has just loaded so the default sort is by popularity
// if true, trending has been loaded so the user can choose their sort
var change_sort = false;

// Keep track of the user's settings.
// This is used in relation to the trending events display.
// When we display trending, we record what sort
// option the user was using, and then switch to popularity.
// When trending events are not displayed, we restore the
// user's settings.
var user_sort_option = "Date";

// Allow for external population of event_data.
// Currently only used for USE_MOCK_DATA flag.
function setData(data) {
	event_data = data;
}

$(document).ready(function(){
	// Setup device view handler
	INITIAL_PANE = 1;
	browserView();
	addSearchButton();

	// Manage welcome "event"
	$("#welcomeDiv").hide();
	var hideWelcome = false;

	/* Setup search bar functionality */
	setupSearch();
	
	/* Handle toggling of the calendar view */
	handleCalendarViewClick();

	/* Check url parameters and update display accordingly */
	// Search url parameter
	var searchQuery = getUrlParameter('search');
	if (searchQuery) {
		$("#search-box").val(searchQuery);
		$("#search-box").keyup();
		prevQuery = searchQuery;
	}
	// Event url parameter
	if (getUrlParameter('event')) {
		// if some event is being displayed, hide welcome
		hideWelcome = true;
	}
	// Calendar url parameter
	if (getUrlParameter('cal')) toggleCalendarView();

	/* Add the trending events */
	if (!inCalendarView() && !$("#search-box").val())
 		addTrendingResults();
	else {
		document.inTrending = false;
	}

	if (!hideWelcome) $("#welcomeDiv").show();
	heightResizeHandler()
});

/*------------------------------- SEARCH -------------------------------------*/

// Sets up sort and filter functionality for search box
var setupSearch = function() {

	/* Initialize datepicker and timepickers */
	$(function() {
		$('#datepicker').datepicker();
	});
	$(function() {
		$('#startTimepicker').timepicker({ timeFormat: 'hh:mm p', interval: 60, scrollbar: true, change: function(time) {trigger_search(force=true);} });
	});
	$(function() {
		$('#endTimepicker').timepicker({ timeFormat: 'hh:mm p', interval: 60, scrollbar: true, change: function(time) {trigger_search(force=true);} });
	});

	/* Toggle visibility/color of the search filters */
	
	// Toggle view of all filters
	$('#filter-btn').click(function() {
		$(".filters").slideToggle(200);
		$( "#filter-btn" ).toggleClass("active");
		// Change tooltip text
		var hideText = "Hide Filters";
		var showText = "Show Filters"
		if ($("#filter-btn")[0].title != hideText) {
			$("#filter-btn")[0].title = hideText;
			$("#filter-btn").attr("data-original-title", hideText).parent().find("tooltip-inner").html(hideText);
		}
		else {
			$("#filter-btn")[0].title = showText;
			$("#filter-btn").attr("data-original-title", showText).parent().find("tooltip-inner").html(showText);
		}
	});
	// Toggle view of time filter
	$('#timeFilterToggle').click(function() {
		$(".timeFilter").slideToggle(200);
	});
	// Toggle view of date filter
	$('#dateFilterToggle').click(function() {
		$(".dateFilter").slideToggle(200);
	});
	// Toggle highlighting of filter options
	$('.filter-btn').click(function() {
		$(this).toggleClass('selected');
	});

	/* Handle specific search and filter events */
	
	// Search box (searches each time a key is typed in search box)
	$("#search-box").keyup(function() {
		trigger_search(force=false);
	});
	
	// All Events filter
	$("#all-events-filter-btn").click(function() {
		if ($('#search-box').val() === "*") {
			$('#search-box').val('');
		}
		else {
			$('#search-box').val('*');
		}
		trigger_search(force=false);
	});
	// My Favorites filter
	$("#favorite-events-filter-btn").click(function() {
		trigger_search(force=true);
	});
	// Tags filter
	$(".form-check-input[name='tags']").change(function() {
		trigger_search(force=true);
	});
	// Sort filter (allow user to sort by date or popularity)
	$("#searchSort").change(function() {
		if (inTrendingView()) change_sort = true;
		user_sort_option = $("#searchSort").val();
		trigger_search(force=true);
	});
	// Sort Direction filter
	$(".sort-direction-btn").click(function() {
		$("#sort-direction-btn-up").toggleClass("hidden");
		$("#sort-direction-btn-down").toggleClass("hidden");
		trigger_search(force=true);
	});
	// Date filter (fetch data after date chosen in datepicker filter)
	$("#datepicker").change(function() {
		if (inCalendarView()) calWeek = 0;
		trigger_search(force=true);
	});
};

/*------------------------------- TRENDING -----------------------------------*/

function addTrendingResults() {
	document.getElementById("browserMsg").innerHTML = "Trending Events";
	document.inTrending = true;

	// Switch sort to popularity.
	if (!change_sort) {
		// Record user's previous sort option.
		user_sort_option = $("#searchSort").val();
		$("#searchSort").val("Popularity");
	}

	search_requests_in_progress += 1;
	$("#loading-spinner").removeClass("hidden");

	var success_callback = function(data){
	    if (data["status"] === "Success") {
	    	// updating this is enough
	    	// other code automatically makes a call to showSearchResults()
			event_data = toJavaEventData(data["data"]);
			// apply tag filters
			event_data = filterByTag(event_data, getSelectedTagFilters());
		}
		else {
			event_data = [];
		}
		setupUserFavorites();
	};
	var cleanup_callback = function() {
		search_requests_in_progress -= 1;
		if (search_requests_in_progress == 0) {
			$("#loading-spinner").addClass("hidden");
		}
	}
	$.ajax({
		url: base_url + '/api/event/trending',
		dataType: 'json',
		headers: {
			'Authorization': ('Token ' + $.cookie('api_token'))
		},
		success: success_callback,
		complete: cleanup_callback
	});
}

var inTrendingView = function() {
	return document.inTrending;
}

/*--------------------------- DATA RETRIEVAL ---------------------------------*/

// searches for events immediately based on search box and datepicker values
var trigger_search = function(force) {
	if (typeof(force) === "undefined") force = false;

	// highlight all events button, if appropriate
	if ($("#search-box").val() === "*") {
		$("#all-events-filter-btn").addClass("selected");
	}
	else if (prevQuery === "*") {
		$("#all-events-filter-btn").removeClass("selected");
	}

	// default search for calendar view: all events since one year ago
	if (inCalendarView() && !$("#search-box").val()) {
		var query = "*/" + java2py_date(daysAgoToDate(365));
	}
	else if ($("#search-box").val()) {
		if (inCalendarView())
			var query = $("#search-box").val() + "/" + java2py_date(daysAgoToDate(365));
		else if ($("#datepicker").val())
			var query = $("#search-box").val() + "/" + java2py_date($("#datepicker").val());
		else
			var query = $("#search-box").val();
	}
	else {
		var query = "";
	}

	// don't make api call if query hasn't changed (unless view mode has changed)
	if (force || (query != prevQuery || change_view_mode)) {
		fetchData(query);

		// update url with search paramter only if search box changes
		updateUrl(addUrlParameter(document.location.search, 'search', $("#search-box").val()));

		prevQuery = query;
		change_view_mode = false;
	}
};

// fetch data given a query string
function fetchData(query) {

	if (query.length == 0 && !inCalendarView()) {
		// then let's just show the trending events
		addTrendingResults();
		return;
	}
	else {
		document.inTrending = false;
	}

	// restore user's sorting options
	$("#searchSort").val(user_sort_option);

	// add tag filters
	var data = {"tags": getSelectedTagFilters()};

	search_requests_in_progress += 1;
	$("#loading-spinner").removeClass("hidden");

	var success_callback = function(data){
	    if (data["status"] === "Success")
			event_data = toJavaEventData(data["data"]);
		else
			event_data = [];
		setupUserFavorites();
	};
	var cleanup_callback = function() {
		search_requests_in_progress -= 1;
		if (search_requests_in_progress == 0) {
			$("#loading-spinner").addClass("hidden");
		}
	}
	$.ajax({
		method: "POST",
		url: base_url + '/api/event/search/' + query,
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(data),
		headers: {
			'Authorization': ('Token ' + $.cookie('api_token'))
		},
		success: success_callback,
		complete: cleanup_callback
	});
}

// Get list of events which user has favorited
var setupUserFavorites = function() {
	var userId = $("#userData").data("uid");

	var success_callback = function(data) {
		if (data["status"] === "Success")
			user_fav_data = toJavaEventData(data["data"]);
		else
			user_fav_data = [];

		// Favorites filter button
		if ($("#favorite-events-filter-btn").hasClass("selected")) {
			event_data = filterByFavorites(event_data, user_fav_data);
		}

		// Time filters
		if ($("#startTimepicker").val() || $("#endTimePicker").val()) {
			event_data = filterEventsByTime($("#startTimepicker").val(),
					 			  $("#endTimepicker").val());
		}

		if (!document.inTrending && !inCalendarView()) addResultCount(event_data.length);
	};

	var updateSearch = function() {
		showSearchResults();
	}

	if (userId === "") {
		updateSearch();
	}
	else {
		$.ajax({
				url: base_url + '/api/user/fav/get/'+ userId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: success_callback,
				complete: updateSearch
		});
	}
}

/* -------------------------------- DISPLAY ----------------------------------*/

function clearReportForm() {
	// clear the elements
	$("#description").val("");
	$('#category-0').prop('checked', false);
	$('#category-1').prop('checked', false);
	$('#category-2').prop('checked', false);
	// there was not an error (this will stop the modal from popping up over and over)
	$("#wasError").remove();
}

function addResultCount(num) {
	var string;
	if (num != 1) string = num + " Search Results";
	else string = num + " Search Result";
	document.getElementById("browserMsg").innerHTML = string;
}

/* ----------------------------- FILTER DATA ---------------------------------*/

// Return list of selected tags to filter by
var getSelectedTagFilters = function() {
	var checked = $("input.form-check-input[type='checkbox']:checked");
	tags = []
	for (var i = 0; i < checked.length; i++) {
		tags.push($(checked[i]).val());
	}
	return tags;
}

// Only include events with at least one of the tags in the
// array tags.
function filterByTag(event_data, tags) {
	// If tags array is empty, don't apply filter.
	if (tags.length == 0) {
		return event_data;
	}
	var new_event_data = [];
	for (var i = 0; i < event_data.length; i++) {
		let event = event_data[i];
		if (event.tags === undefined) continue;
		// For each tag on the event, check if
		// it's in the request list of tags (parameter tags).
		for (var j = 0; j < event.tags.length; j++) {
			let hasTag = false;
			for (var k = 0; k < tags.length; k++) {
				if (event.tags[j].toLowerCase() === tags[k].toLowerCase()) {
					hasTag = true;
					break;
				}
			}
			if (hasTag) {
				new_event_data.push(event);
				break;
			}
		}
	}
	return new_event_data;
}

// Filter event data to only include user favorites
function filterByFavorites(event_data, favorite_data) {
	var favorite_events = [];
	for (var i = 0; i < favorite_data.length; i++) {
		var event_id = favorite_data[i]["_id"];
		var event = getEventInDataById(event_data, event_id);
		if (typeof(event) !== "undefined") {
			favorite_events.push(event);
		}
	}
	return favorite_events;
}

// return all events in event_data that start at or after starttime and end at or before endtime
// starttime and endtime are in format hh:mm AM/PM
var filterEventsByTime = function(starttime, endtime) {
	var filteredEvents = [];

	// if starttime is blank, set start time to midnight
	var starthour = (starttime !== "") ? parseInt(strToMilitaryTime(starttime)) : 0;
	var startminute = (starttime !== "") ? parseInt(starttime.substring(3, 5)) : 0;

	// if endtime is blank, set end time to 11:59pm
	var endhour = (endtime !== "") ? parseInt(strToMilitaryTime(endtime)) : 23;
	var endminute = (endtime !== "") ? parseInt(endtime.substring(3, 5)) : 59;
	
	for (var i = 0; i < event_data.length; i++) {
		var instances = event_data[i].instances;
		for (var j = 0; j < instances.length; j++) {
			var eventStart = new Date(instances[j].start_datetime);
			var eventStarthour = parseInt(eventStart.getHours());
			var eventStartminute = parseInt(eventStart.getMinutes());

			var eventEnd = new Date(instances[j].end_datetime);
			var eventEndhour = parseInt(eventEnd.getHours());
			var eventEndminute = parseInt(eventEnd.getMinutes());

			// return events between starttime and endtime
			if ((compareTimesHHMM(starthour, startminute, eventStarthour, eventStartminute) >= 0) &&
			    (compareTimesHHMM(endhour, endminute, eventEndhour, eventEndminute) <= 0)) {
				filteredEvents.push(event_data[i]);
				break; // make sure events aren't duplicated
			}
		}
	}
	return filteredEvents;
};
