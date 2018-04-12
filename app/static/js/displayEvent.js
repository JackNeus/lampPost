// TODO: add all of Reilly's code pertaining to the large event layout here

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

// Populate event view panel with event_data[num] (basic layout)
function populateEventViewPanel(num) {
	// Fire icon
	var fireIcon = $('<i />').attr({
		class: "fas fa-fire",
	});

	// Clickable fire button that displays "Favorite" when hovered over
	var fireBtn = $('<div />').attr({
		class: "eventFireBtn btn",
		title: "Favorite",
		id: "eventFireBtn"
	}).append(fireIcon);

	// TODO: get 'getFire' from backend
	// var getFire = event_data[i].favorites;
	// Number of favorites an event has
	var getFire = Math.floor(Math.random() * 100);
	var fireNum = $('<p />').attr({
		class: "eventFireNum",
		id: "eventFireNum"
	}).append(getFire);
	document.getElementById("welcome").style.display="none";
	document.getElementById("eventTitle").innerHTML =
		event_data[num].title;
	$("#eventFireBtn").remove();
	$("#eventFireNum").remove();
	$("#mainHeaderLine").append(fireBtn).append(fireNum);
	document.getElementById("eventSubtitle").innerHTML = "";
	var instances = event_data[num].instances;
	for (var i = 0; i < instances.length; i++) {
		// Locatiom
		document.getElementById("eventSubtitle").innerHTML +=
			instances[i].location + "&nbsp|&nbsp";
		// Time
		document.getElementById("eventSubtitle").innerHTML +=
			makeDate(instances[i].start_datetime, instances[i].end_datetime);
		document.getElementById("eventSubtitle").innerHTML += "<br>";
	}
	document.getElementById("eventHost").innerHTML =
		"by " + event_data[num].host;
	document.getElementById("eventDescription").innerHTML =
		event_data[num].description;

	// handle clicks of fire button
	updateEventFireBtn();
}
// Update the popularity of an event when the fire button is clicked
var updateEventFireBtn = function () {
	$(".eventFireBtn").click( function(e) {
		var fireBtn = this;

		// toggle color/title
		fireBtn.classList.toggle("selected");
		if (fireBtn.classList.contains("selected")) {
			fireBtn.title = "Unfavorite";
			var change = 1;
		}
		else {
			fireBtn.title = "Favorite";
			var change = -1;
		}

		// update favorite information
		var getFireNum = document.getElementById("eventFireNum").innerText;
		var newFireNum = parseInt(getFireNum) + change;
		document.getElementById("eventFireNum").innerText = newFireNum;

		//TODO: send newFavs to backend

		// prevents whole search result from being selected when fire button is clicked
		e.stopPropagation();
	});
}
