// Given an id of the form 'smallSearchResultX', return X.
function getNum(searchId) {
	return searchId.split("smallSearchResult").pop();
}

// Event data for currently displayed data.
var event_data;

// Allow for external population of event_data.
// Currently only used for USE_MOCK_DATA flag.
function setData(data) {
	event_data = data;
}

$(document).ready(function(){
	// Update event handlers for search results.
	function updateSearchResultEventHanders() {
		$(".smallSearchResult").click( function(){

			// Toggle highlighting in search results.
	    	$(".smallSearchResult").removeClass("selected");
	    	$(this).addClass("selected");
	    	// Populate and display event view.
			$(".event-view").hide();
			var eventNum = getNum($(this).attr("id")) - 1;
			populateEventViewPanel(eventNum);
			$("#event-view").show();
		});
	}
	
	// calculates the number of days between date1 and date2
	Date.daysBetween = function( date1, date2 ) {
	  //Get 1 day in milliseconds
	  var one_day=1000*60*60*24;

	  // Convert both dates to milliseconds
	  var date1_ms = date1.getTime();
	  var date2_ms = date2.getTime();

	  // Calculate the difference in milliseconds
	  var difference_ms = date2_ms - date1_ms;
	    
	  // Convert back to days and return
	  return Math.round(difference_ms/one_day); 
	}
	
	// makes desired date string to be used in the search results
	function makeDate(start, end) {
		var start_date = new Date(start);
		var end_date = new Date(end);
		var today = new Date();
		
		// Special cases for yesterday, today, & tomorrow
		var time_diff = Date.daysBetween(today, start_date);
		if (time_diff == -1)
			var date_str = "Yesterday";
		else if (time_diff == 0)
			var date_str = "Today";
		else if (time_diff == 1)
			var date_str = "Tomorrow";
		else
			var date_str = start_date.getMonth() + '/' + start_date.getDate();
			
		// don't show year unless year is different than current year
		if (start_date.getFullYear() != today.getFullYear()) 
			date_str += "/" + (start_date.getFullYear());
			
		// create time strings in hh:mm format
		start_time = start_date.getHours() + ":" + 
				("0" + start_date.getMinutes()).slice(-2);
		end_time = end_date.getHours() + ":" + 
				("0" + end_date.getMinutes()).slice(-2);
		
		return date_str + " " + start_time + "-" + end_time;
	}

	// Populate search result panel with event_data.
	function updateSearchResults() {
		// clear current searches
		var currentSearches = document.getElementById("searches");
		currentSearches.innerHTML = "";
		
		// create html code for each search result
		for (var i = 0; i < event_data.length; i++) {
			var title = $('<p />').attr({
				class: "resultTitle"
			}).append(event_data[i].title);
			
			var loc = $('<p />').attr({
				class: "resultLocation"
			}).append(event_data[i].location);
			
			var time = $('<p />').attr({
				class: "resultTime"
			}).append(makeDate(event_data[i].start_datetime, event_data[i].end_datetime));
			
			var smallDiv = $('<div >').attr({
				class: "resultContents"
			}).append(title).append(time).append(loc);
			
			var largeDiv = $('<div />').attr({
				class: "smallSearchResult", id: "smallSearchResult" + (i + 1), 
			}).append(smallDiv);
			
			$("#searches").append(largeDiv);
		}
		updateSearchResultEventHanders();
		$(".smallSearchResult").show();
	}

	// Populate event view panel with event_data[num].
	function populateEventViewPanel(num) {
		document.getElementById("eventTitle").innerHTML = event_data[num].title;
		document.getElementById("eventLocation").innerHTML = "Location: " + event_data[num].location;
		document.getElementById("eventGroup").innerHTML = "Creator: " + event_data[num].creator;
		document.getElementById("eventTime").innerHTML = "Time: " + event_data[num].start_datetime;
		document.getElementById("eventDescription").innerHTML = "Description: " + event_data[num].description;
	}
	
	// functions that pick date/time and toggle them
	$(function() {
		$('#datepicker').datepicker();
	});
	$(function() {
		$('#timepicker').timepicker({ 'forceRoundTime': true });
	});
	$('#filterBtn').click(function() {
		$('.datetime').slideToggle(200);
	});

	function fetchData(query) {
		$.getJSON('http://localhost:5001/api/event/search/'+query, function(data){
		    if (data["status"] === "Success") 
				event_data = data["data"];
			else
				event_data = null;
			updateSearchResults();
		});
	}
	
	function java2py_date( date_java ){
		var today = new Date();
		var date_split = date_java.split('/');
		
		var date_py = "";
		if (date_split.length == 3)
			date_py = date_split[2] + "-" + date_split[0] + "-" + date_split[1];
		else return;
		
		return date_py;
	}
	

	$("#search-box").keyup(function() {
		if ($("#datepicker").val()) 
			var query = $(this).val() + "/" + java2py_date($("#datepicker").val());
		else query = $(this).val()
		
		fetchData(query);
	});
	
	
	$( "#datepicker" ).change(function() {
		var date_py = java2py_date($(this).val());
	  	fetchData($("#search-box").val() + "/" + date_py);
	});

	// If event_data is intialized, populate page.
	if (event_data) {
		updateSearchResults();
	}
});
