// TODO: add all of Reilly's code pertaining to the large event layout here

// Shows large event view when search result is clicked
var updateEventView = function() {
		$(".smallSearchResult").click( function(){
			// hide the form view
			$("#event-form").hide();
			// toggle highlighting in search results.
		    $(".smallSearchResult").removeClass("selected");
		    $(this).addClass("selected");
		    	
		    // populate and display event view.
			$(".event-view").hide();
			var eventNum = getNum($(this).attr("id"), "smallSearchResult") - 1;
			populateEventViewPanel(eventNum);
			$("#event-view").show();

		});
}

// Populate event view panel with event_data[num] (basic layout)
function populateEventViewPanel(num) {
	document.getElementById("eventTitle").innerHTML = 
		event_data[num].title;
	document.getElementById("eventLocation").innerHTML = 
		"Location: " + event_data[num]["instances"][0].location;
	document.getElementById("eventHost").innerHTML = 
		"Host: " + event_data[num].host;
	document.getElementById("eventTime").innerHTML = 
		"Time: " + event_data[num]["instances"][0].start_datetime;
	document.getElementById("eventDescription").innerHTML = 
		"Description: " + event_data[num].description;
}
