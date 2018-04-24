// DEPENDENCIES: displaySearches.js, displayEvent.js, handleUrlParam.js

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

// Event data for currently displayed data.
var event_data = [];
var user_fav_data = [];

// Allow for external population of event_data.
// Currently only used for USE_MOCK_DATA flag.
function setData(data) {
	event_data = data;
}

$(document).ready(function(){
	// setup search bar functionality
	checkSearchParameter();
	if ($("#search-box").val()) fetchData($("#search-box").val());
	setupSearch();
	setupUserFavorites();
	setupDataRetrieval();
});

// Sets up sort and filter functionality for search box
var setupSearch = function() {
	// allow user to pick start date and toggle the filter
	$(function() {
		$('#datepicker').datepicker();
	});
	$('#filter-btn').click(function() {
		$('.datetime').slideToggle(200);
	});

	// allow user to sort by date or popularity
	$("#searchSort").change(function() {
		showSearchResults();
	});
};

// Updates search results after input to search box or change in filters
var setupDataRetrieval = function() {
	// searches each time a key is typed in search box
	$("#search-box").keyup(function() {
		if ($("#datepicker").val())
			var query = $(this).val() + "/" + java2py_date($("#datepicker").val());
		else query = $(this).val();

		fetchData(query);
	});

	// fetch data after date chosen in datepicker filter
	$("#datepicker").change(function() {
		var date_py = java2py_date($(this).val());
	  	fetchData($("#search-box").val() + "/" + date_py);
	});
};

// fetch data given a query string
function fetchData(query) {
	var callback = function(data){
	    	if (data["status"] === "Success")
			event_data = data["data"];
		else
			event_data = [];
		setupUserFavorites();
		var url = window.location.href;
		// update url with eventid paramter
		//var newurl = window.location.protocol + "//" + 
		//		 window.location.host + 
		//		 window.location.pathname + 
		//		 addUrlParameter(document.location.search, 'search', query);
		var newurl = addUrlParameter(url, 'search', query);
		console.log(addUrlParameter(document.location.search, 'search', query));
		window.history.pushState({ path: newurl }, '', newurl);
	};
	$.ajax({
		url: base_url + '/api/event/search/' + query,
		dataType: 'json',
		headers: {
			'Authorization': ('Token ' + $.cookie('api_token'))
		},
		success: callback
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
		showSearchResults();
		checkEventParameter();
	};
	$.ajax({
			url: base_url + '/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
	});
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
