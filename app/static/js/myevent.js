$(document).ready(function(){
	updateEventView();
	updateFireBtn();
	changeMyEvents();
});

var changeMyEvents = function() {
	$(".deleteBtn").click( function () {
		var result = confirm("Are you sure you would like to delete this event?");
		if (result) {
			var num = getNum($(this).attr("id"), "deleteBtn");
			var id = event_data[num]._id;
			var callback = function() {
				//showSearchResults();
			}
			$.ajax({
				url: 'http://localhost:5001/api/event/delete/'+id,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: callback
			});
		}
	});
}

// Shows large event view when search result is clicked
var updateEventView = function() {
		$(".smallSearchResult").click( function(){
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

// Update the popularity of an event when the fire button is clicked
var updateFireBtn = function () {
	$(".resultFireBtn").click( function(e) {
		var eventNum = getNum($(this).attr("id"), "resultFireBtn");
		var fireBtn = document.getElementById($(this).attr("id"));
		
		// toggle color/title
		fireBtn.classList.toggle("selected");
		if (fireBtn.classList.contains("selected")) {
			fireBtn.title = "Unfavorite";
			var favChange = 1;
		}
		else {
			fireBtn.title = "Favorite";
			var favChange = -1;
		}
		
		// update favorite information
		var getFavs = document.getElementById("resultFavNum" + eventNum).innerText;
		var newFavs = parseInt(getFavs) + favChange;
		document.getElementById("resultFavNum" + eventNum).innerText = newFavs;
		
		//TODO: send newFavs to backend
		
		// prevents whole search result from being selected when fire button is clicked
		e.stopPropagation();
	});
}

// Populate event view panel with event_data[num] (basic layout)
/*
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
}*/
function populateEventViewPanel(num) {
	document.getElementById("eventTitle").innerHTML = "My Event " + (num + 1);
	document.getElementById("eventHost").innerHTML = "Host: me";
}

// Given an id of the form 'smallSearchResultX', return X.
function getNum(searchId, titleSplit) {
	return searchId.split(titleSplit).pop();
}
