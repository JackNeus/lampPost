// TODO: add all of Reilly's code pertaining to the large event layout here

var selected_event = null;

// Shows large event view when search result is clicked
var updateEventView = function() {
		$(".smallSearchResult").click( function(){
			// hide the form view
			$("#event-form").hide();

			//hide the footer if it exists
			$(".footer").hide();
			
			var eventNum = getNum($(this).attr("id"), "smallSearchResult");
			highlightSelectedSearchResult(eventNum);
			
			// populate and display event view.
			$(".event-view").hide();
			selected_event = event_data[eventNum - 1];
			populateEventViewPanel(eventNum - 1);
			$("#event-view").show();
		});
}

// highlight search result that's been selected and display event view
function highlightSelectedSearchResult(eventNum) {
	// toggle highlighting in search results.
	$(".smallSearchResult.selected").animate({"margin-right": '2vh'});
	$(".smallSearchResult").removeClass("selected");
	$("#smallSearchResult" + (eventNum)).addClass("selected");

	// Animate selection
	$("#smallSearchResult" + (eventNum)).animate({"margin-right": '0vh'});
}

// Populate event view panel with event_data[eventNum] (basic layout)
function populateEventViewPanel(eventNum) {
	// Fire icon
	var fireIcon = $('<i />').attr({
		class: "fas fa-fire",
	});

	// Clickable fire button that displays "Favorite" when hovered over
	//document.getElementById("eventFireBtn").innerHTML = "";
	var fireBtn = $('<div />').attr({
		class: "eventFireBtn btn",
		title: "Favorite",
		id: "eventFireBtn"
	}).append(fireIcon);

	// Number of favorites an event has
	var getFire = event_data[eventNum].favorites;
	var fireNum = $('<p />').attr({
		class: "eventFireNum",
		id: "eventFireNum"
	}).append(getFire);
	
	document.getElementById("welcome").style.display="none";
	document.getElementById("eventTitle").innerHTML = event_data[eventNum].title;
	$("#eventFireBtn").remove();
	$("#eventFireNum").remove();
	$("#mainHeaderLine").append(fireBtn).append(fireNum);
	document.getElementById("eventSubtitle").innerHTML = "";
	var instances = event_data[eventNum].instances;
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
		"by " + event_data[eventNum].host;
	document.getElementById("eventDescription").innerHTML =
		event_data[eventNum].description;

	// Add C&H image
	var photoNum = Math.floor(Math.random() * 81); + 1;
	document.getElementById("eventPhoto").innerHTML =
		"<img class=\"img-fluid fit\" src=\"../../static/graphics/images/CH/"
		+ photoNum + ".png\">";
	
	// Color in fire button if user has favorited an event
	var eventId = event_data[eventNum]._id;
	var eventFireBtnElement = document.getElementById("eventFireBtn");
	if (eventIsFav(eventId)) {
		eventFireBtnElement.classList.toggle("selected");
	}
	
	// handle clicks of fire button
	updateEventFireBtn(eventNum);
}
// Update the popularity of an event when the fire button is clicked
var updateEventFireBtn = function (eventNum) {
	$(".eventFireBtn").click( function(e) {
		// get event id and user id
		var eventId = event_data[eventNum]._id;
		var userId = $("#userData").data("uid");

		// update database after favoriting event
		var favoriteEvent = function() {
			$.ajax({
				url: base_url + '/api/user/fav/add/'+ userId + "/" + eventId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				}
			});
		};

		// update database after unfavoriting event
		var unfavoriteEvent = function() {
			$.ajax({
				url: base_url + '/api/user/fav/remove/'+ userId + "/" + eventId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				}
			});
		};
		// toggle color/title
		var eventFireBtn = document.getElementById($(this).attr("id"));
		var resultFireBtn = document.getElementById("resultFireBtn" + (eventNum + 1));
		eventFireBtn.classList.toggle("selected");
		resultFireBtn.classList.toggle("selected");
		if (eventFireBtn.classList.contains("selected")) {
			eventFireBtn.title = "Unfavorite";
			resultFireBtn.title = "Unfavorite";
			var change = 1;
			favoriteEvent();
		}
		else {
			eventFireBtn.title = "Favorite";
			resultFireBtn.title = "Favorite";
			var change = -1;
			unfavoriteEvent();
		}

		// update favorite number information
		var getFireNum = document.getElementById("eventFireNum").innerText;
		var newFireNum = parseInt(getFireNum) + change;
		document.getElementById("eventFireNum").innerText = newFireNum;
		document.getElementById("resultFireNum" + (eventNum + 1)).innerText = newFireNum;

		// prevents whole search result from being selected when fire button is clicked
		e.stopPropagation();
	});
}
