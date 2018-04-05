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
	  // Get 1 day in milliseconds
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
		
		// Special cases for dates within a week of current date
		var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", 
				    "Thursday", "Friday", "Saturday"];
		var time_diff = Date.daysBetween(today, start_date);
		
		if (time_diff == -1)
			var date_str = "Yesterday";
		else if (time_diff == 0)
			var date_str = "Today";
		else if (time_diff == 1)
			var date_str = "Tomorrow";
		else if (1 < time_diff && time_diff < 7) 
			var date_str = weekdays[start_date.getDay()];
		else
			var date_str = (start_date.getMonth() + 1) + '/' + start_date.getDate();
			
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

	// Populate search result panel with event_data sorted by date.
	function updateSearchResults() {
		// clear current searches
		var currentSearches = document.getElementById("searches");
		currentSearches.innerHTML = "";
		
		// sort all instances of the event by date
		for (var i = 0; i < event_data.length; i++) {
			event_data[i].instances.sort(function(a, b) {
				return Date.daysBetween(new Date(b.start_datetime), 
								new Date(a.start_datetime));
			});
		}
		// sort the events by date (using the first instance of the event)
		event_data.sort(function (a, b) {
			return Date.daysBetween(new Date(b.instances[0].start_datetime), 
						      new Date(a.instances[0].start_datetime));
		});
		
		// create html code for each search result
		for (var i = 0; i < event_data.length; i++) {
			var title = $('<p />').attr({
				class: "resultTitle"
			}).append(event_data[i].title);
			
			var loc = $('<p />').attr({
				class: "resultLocation"
			}).append(event_data[i].location);
			
			// print multiple instances
			var instances = event_data[i].instances;
			var allTimes = $('<div />');
			for (var j = 0; j < instances.length; j++) {
				var time = $('<p />').attr({
					class: "resultTime"
				}).append(makeDate(instances[j].start_datetime, 
						       instances[j].end_datetime));
				allTimes.append(time);
			}
			
			var smallDiv = $('<div >').attr({
				class: "resultContents"
			}).append(title).append(allTimes).append(loc);
			
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
		document.getElementById("eventLocation").innerHTML = "Location: " + event_data[num]["instances"][0].location;
		document.getElementById("eventHost").innerHTML = "Host: " + event_data[num].host;
		document.getElementById("eventTime").innerHTML = "Time: " + event_data[num]["instances"][0].start_datetime;
		document.getElementById("eventDescription").innerHTML = "Description: " + event_data[num].description;
	}
	
	// functions that pick date and toggle the filter for date
	$(function() {
		$('#datepicker').datepicker();
	});
	$('#filter-btn').click(function() {
		$('.datetime').slideToggle(200);
	});

	function fetchData(query) {
		var callback = function(data){
		    if (data["status"] === "Success") 
				event_data = data["data"];
			else
				event_data = null;
			updateSearchResults();
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
