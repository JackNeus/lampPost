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

// Keep track of eventId in url if it exists
var urlParamEventId = null;

// Keep track of the number of search requests currently out.
var search_requests_in_progress = 0;

// Keep track of current week in calendar view
var calWeek = 0;

// Keep track of whether the view mode just changed (to/from calendar view)
var change_view_mode;

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

	// Manage welcome "event""
	$("#welcomeDiv").hide();
	var hideWelcome = false;

	// setup search bar functionality
	setupSearch();
	setupDataRetrieval();

	// fill in search box with search url parameter if it exists
	checkSearchUrlParameter();
	urlParamEventId = checkEventUrlParameter();
	if (checkCalendarParameter()) toggleCalendarView();

	// if some event is being displayed, hide welcome
	if (urlParamEventId) {
		hideWelcome = true;
	}

	// show search results for the search url parameter if it exists
	if ($("#search-box").val()) fetchData($("#search-box").val());


	// add the trending events
	if (!checkCalendarParameter() && !$("#search-box").val())
 		addTrendingResults();

	if (!hideWelcome)
		$("#welcomeDiv").show();
	heightResizeHandler()
});

function addTrendingResults() {	
	$("#trendingLabel").show();

	$("#search-container").css("padding-bottom", "0vh");

	// Switch sort to popularity.
	user_sort_option = $("#searchSort").val();
	$("#searchSort").val("Popularity");

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

// Sets up sort and filter functionality for search box
var setupSearch = function() {
	// allow user to pick start date and toggle the filter
	$(function() {
		$('#datepicker').datepicker();
	});

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

	$('.filter-btn').click(function() {
		$(this).toggleClass('selected');
	});

	// All events filter
	$("#all-events-filter-btn").click(function() {
		if ($('#search-box').val() === "*") {
			$('#search-box').val('');
			$(this).removeClass('selected');
		}
		else {
			$('#search-box').val('*');
			$(this).addClass('selected');
		}
		$('#search-box').keyup();
	});

	// My favorites filter
	$("#favorite-events-filter-btn").click(function() {
		trigger_search(true);
	});

	// Tags filter
	$(".form-check-input[name='tags']").change(function() {
		trigger_search(true);
	});

	// allow user to sort by date or popularity
	$("#searchSort").change(function() {
		trigger_search(true);
	});

	handleCalendarView();

	$(".sort-direction-btn").click(function() {
		$("#sort-direction-btn-up").toggleClass("hidden");
		$("#sort-direction-btn-down").toggleClass("hidden");
		trigger_search(true);
	});
};

var getSelectedTagFilters = function() {
	var checked = $("input.form-check-input[type='checkbox']:checked");
	tags = []
	for (var i = 0; i < checked.length; i++) {
		tags.push($(checked[i]).val());
	}
	return tags;
}

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
		var query = "*/" + java2py_date(getDaysAgo(365));
	}
	else if ($("#search-box").val()) {
		if (inCalendarView())
			var query = $("#search-box").val() + "/" + java2py_date(getDaysAgo(365));
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

		// update url with eventid paramter only if search box changes
		updateUrl(addUrlParameter(document.location.search, 'search', $("#search-box").val()));

		prevQuery = query;
		change_view_mode = false;
	}
};

// Updates search results after input to search box or change in filters
var setupDataRetrieval = function() {

	// searches each time a key is typed in search box
	$("#search-box").keyup(trigger_search);

	// fetch data after date chosen in datepicker filter
	$("#datepicker").change(function() {
		if (!inCalendarView()) {
			if ($(this).val() !== "") {
				var date_py = java2py_date($(this).val());
				if ($("#search-box").val() !== "")
			  		fetchData($("#search-box").val() + "/" + date_py);
		  	}
		  	else fetchData($("#search-box").val());
		}
		else {
			calWeek = 0;
			showSearchResults();
		}
	});
};

// fetch data given a query string
function fetchData(query) {

	if (query.length == 0 && !inCalendarView()) {
		// then let's just show the trending events
		addTrendingResults();
		return;
	}

	$("#trendingLabel").hide();
	$("#search-container").css("padding-bottom", "1vh");

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

		// Filter button
		if ($("#favorite-events-filter-btn").hasClass("selected")) {
			event_data = getFavoritesOnly(event_data, user_fav_data);
		}
	};

	var updateSearch = function() {
		showSearchResults();

		// update event view if url has eventId
		if (urlParamEventId) {
			updateUrlParamEventView(urlParamEventId);
			urlParamEventId = null;
		}

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

function clearReportForm() {
	// clear the elements
	$("#description").val("");
	$('#category-0').prop('checked', false);
	$('#category-1').prop('checked', false);
	$('#category-2').prop('checked', false);
	// there was not an error (this will stop the modal from popping up over and over)
	$("#wasError").remove();
}

/* -------------------------------UTILITY FUNCTIONS --------------------------*/

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

function getEvent(event_data, id) {
	var event = $.grep(event_data, function(event){return event._id === id;})[0];
	return event;
}

function getFavoritesOnly(event_data, favorite_data) {
	var favorite_events = [];
	for (var i = 0; i < favorite_data.length; i++) {
		var event_id = favorite_data[i]["_id"];
		var event = getEvent(event_data, event_id);
		if (typeof(event) !== "undefined") {
			favorite_events.push(event);
		}
	}
	return favorite_events;
}

// converts java date string into python date string (mm/dd/yy to yy-mm-dd)
function java2py_date( date_java ){
	var today = new Date();
	var date_split = date_java.split('/');

	var date_py = "";
	if (date_split.length == 3)
		date_py = date_split[2] + "-" + date_split[0] + "-" + date_split[1];
	else return;

	return date_py;
}

// return date in mm/dd/yyyy format n days ago
var getDaysAgo = function(n) {
	var today = new Date();
	var timeAgo = new Date();
	timeAgo.setDate(today.getDate() - n);
	var dateStr = makeDayMonthYearString(timeAgo, true);
	return dateStr;
};

var toJavaEventData = function(data) {
	for (var i = 0; i < data.length; i++) {
		var instances = data[i].instances;
		for (var j = 0; j < instances.length; j++) {
			var javaStartDate = py2java_date(instances[j].start_datetime);
			var javaEndDate = py2java_date(instances[j].end_datetime);
			instances[j].start_datetime = javaStartDate;
			instances[j].end_datetime = javaEndDate;
		}
	}
	data.instances = instances;
	return data;
};

// converts python date string into java date string (yyyy-mm-dd to yyyy/mm/dd)
function py2java_date( date_py ) {
	var date_java = date_py.replace(/-/g, '/');
	return date_java;
}
