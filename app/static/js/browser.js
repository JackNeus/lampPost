// Given an id of the form 'smallSearchResultX', return X.
function getNum(searchId) {
	return searchId.split("smallSearchResult").pop();
}

// Fetch data from the API.
// TODO: Switch to use /api/event/search endpoint.
function fetchData(title) {
	$.getJSON('http://localhost:5001/api/event/'+title, function(data){
	    event_data = data;
	});
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

	// Populate search result panel with event_data.
	function updateSearchResults() {
		searches = "";
		for (var i = 0; i < event_data.length; i++) {
			searches += "<div class=\"smallSearchResult\" id=\"smallSearchResult" + (i + 1) + "\">";
			searches += "\n" + "<div class=\"resultContents\">";
			searches += "\n" + "<p id=\"resultTitle" + (i + 1) + "\">" + event_data[i].title + "</p>";
			searches += "\n" + "</div>" + "\n" + "</div>" + "\n";
		}
		document.getElementById("searches").innerHTML = searches;
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

	function fetchData(title) {
		$.getJSON('http://localhost:5001/api/event/'+title, function(data){
		    event_data = data;
			updateSearchResults(event_data);
		});
	}

	$("#search-box").keyup(function() {
		fetchData($(this).val());
	});

	// If event_data is intialized, populate page.
	if (event_data) {
		updateSearchResults();
	}
});