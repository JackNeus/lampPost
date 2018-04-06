// DEPENDENCIES: displaySearches.js, displayEvent.js

// Event data for currently displayed data.
var event_data;

// Allow for external population of event_data.
// Currently only used for USE_MOCK_DATA flag.
function setData(data) {
	event_data = data;
}

$(document).ready(function(){
	// setup search bar functionality
	setupSearch();
	setupDataRetrieval();
	
	// populate page if event data is initialized
	if (event_data) {
		showSearchResults();
	}
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
}

// Updates search results after input to search box or change in filters
var setupDataRetrieval = function() {
	// searches each time a key is typed in search box
	$("#search-box").keyup(function() {
		if ($("#datepicker").val()) 
			var query = $(this).val() + "/" + java2py_date($("#datepicker").val());
		else query = $(this).val()
		
		fetchData(query);
	});
	
	// fetch data after date chosen in datepicker filter
	$("#datepicker").change(function() {
		var date_py = java2py_date($(this).val());
	  	fetchData($("#search-box").val() + "/" + date_py);
	});
	
	// fetch data given a query string
	function fetchData(query) {
		var callback = function(data){
		    if (data["status"] === "Success") 
				event_data = data["data"];
			else
				event_data = null;
			showSearchResults();
		};
		$.ajax({
			url: 'http://localhost:5001/api/event/search/'+query,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
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