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

	// setup search bar functionality
	setupSearch();
	setupDataRetrieval();

	// add the trending events
	if (!checkCalendarParameter() && !$("#search-box").val())
 		addTrendingResults();

	if (!hideWelcome)
		$("#welcomeDiv").show();

});

function addTrendingResults() {
	$("#trendingLabel").show();

	// Switch sort to popularity.
	user_sort_option = $("#searchSort").val();
	$("#searchSort").val("Popularity");

	search_requests_in_progress += 1;
	$("#loading-spinner").removeClass("hidden");

	var success_callback = function(data){
	    if (data["status"] === "Success") {
	    	// updating this is enough
	    	// other code automatically makes a call to showSearchResults()
			event_data = data["data"];
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
		$('#all-events').slideToggle(200);
		$('.datetime').slideToggle(200);
	});

	$("#all-events-filter-btn").click(function() {
		if ($('#search-box').val() === "*") {
			$('#search-box').val('');
		}
		else {
			$('#search-box').val('*');
		}
		$('#search-box').keyup();
	});

	// allow user to sort by date or popularity
	$("#searchSort").change(function() {
		showSearchResults(false);
	});

	handleCalendarView();

	$(".sort-direction-btn").click(function() {
		$("#sort-direction-btn-up").toggleClass("hidden");
		$("#sort-direction-btn-down").toggleClass("hidden");
		showSearchResults();
	});
};

// searches for events immediately based on search box and datepicker values
var trigger_search = function() {
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
	if (query != prevQuery || change_view_mode) {
		fetchData(query);

		// update url with eventid paramter only if search box changes
		if ($("#search-box").val() !== getUrlParameter('search')) {
			updateUrl(addUrlParameter(document.location.search, 'search', $("#search-box").val()));
		}

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
		else
			showSearchResults();
	});
};

// fetch data given a query string
function fetchData(query) {

	if (query.length == 0 && !inCalendarView()) {
		// then let's just show the trending events
		addTrendingResults();
		return;
	}
	// when loading an actual query (length > 0), clear the ``trending events" label
	$("#trendingLabel").hide();
	// restore user's sorting options
	$("#searchSort").val(user_sort_option);

	search_requests_in_progress += 1;
	$("#loading-spinner").removeClass("hidden");

	var success_callback = function(data){
	    if (data["status"] === "Success")
			event_data = data["data"];
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
		url: base_url + '/api/event/search/' + query,
		dataType: 'json',
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
			user_fav_data = data["data"];
		else
			user_fav_data = [];
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

/* -------------------------------UTILITY FUNCTIONS --------------------------*/

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
