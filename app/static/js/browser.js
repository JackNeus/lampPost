function getNum(searchId) {
	return searchId.split("smallSearchResult").pop();
}
// don't run jQuery until page is loaded
$(document).ready(function(){
	var event_data;

	function updateSearchResultEventHanders() {
		$(".smallSearchResult").click( function(){
	    	console.log("Here");
	    	$(".smallSearchResult").removeClass("selected");
	    	$(this).addClass("selected");
			$(".event-view").hide();
			console.log($(this).attr("id"));
			$(".event-view").hide();
			setValues(getNum( $(this).attr("id")) - 1);
			$("#event-view").show();
		});
	}

	function addSearchResults(data) {
		searches = "";
		for (var i = 0; i < data.length; i++) {
			searches += "<div class=\"smallSearchResult\" id=\"smallSearchResult" + (i + 1) + "\">";
			searches += "\n" + "<div class=\"resultContents\">";
			searches += "\n" + "<p id=\"resultTitle" + (i + 1) + "\">" + data[i].title + "</p>";
			searches += "\n" + "</div>" + "\n" + "</div>" + "\n";
		}
		document.getElementById("searches").innerHTML = searches;
		updateSearchResultEventHanders();
		$(".smallSearchResult").show();
	}

	// set information for event results panel
	function setValues(num) {
		document.getElementById("eventTitle").innerHTML = event_data[num].title;
		document.getElementById("eventLocation").innerHTML = "Location: " + event_data[num].location;
		document.getElementById("eventGroup").innerHTML = "Creator: " + event_data[num].creator;
		document.getElementById("eventTime").innerHTML = "Time: " + event_data[num].start_datetime;
		document.getElementById("eventDescription").innerHTML = "Description: " + event_data[num].description;
	}

	function fetchData(title) {
		$.getJSON('http://localhost:5001/api/event/'+title, function(data){
		    event_data = data;
		});
	}

	$("#search-box").keyup(function() {
		var data = fetchData($(this).val());
		console.log("Event data: " + event_data);
		addSearchResults(event_data)
	});
});