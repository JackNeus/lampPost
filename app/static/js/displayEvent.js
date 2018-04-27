// DEPENDENCIES: handleFavorites.js

// keep track of current event shown in event view
var selected_event = null;

// Shows large event view when search result is clicked
var handleEventViewClick = function() {
	$(".smallSearchResult").click( function(){
		var eventNum = getNum($(this).attr("id"), "smallSearchResult");
		var eventId = event_data[eventNum - 1]._id;
		
		// if currently showing the event edit form, don't animate
		// highlight again
		if ($(".eventFormView").css("display") == "block") {
		
			// hide the form view
			$("#event-form").hide();

			//hide the footer if it exists
			$(".footer").hide();

			// make all icons not "selected"
			$(".editBtn").removeClass("selectedIcon");
			$(".fa-pencil-alt").removeClass("fa-inverse");
			$(".deleteBtn").removeClass("selectedIcon");
			$(".fa-trash-alt").removeClass("fa-inverse");
			
			populateEventViewPanel(eventNum);
			handleEventFireBtnClick(eventNum);
		}
		
		// don't update if click on already selected search result
		if (!($("#smallSearchResult" + eventNum).hasClass("selected"))) {
		
			// update url with eventid paramter
			var newurl = window.location.protocol + "//" + 
					 window.location.host + 
					 window.location.pathname + 
					 addUrlParameter(document.location.search, 'event', eventId);
			window.history.pushState({ path: newurl }, '', newurl);
		
			// store currently selected event
			selected_event = event_data[eventNum - 1];
			
			// populate and display event view
			highlightSelectedSearchResult(eventNum);
			populateEventViewPanel(eventNum);
			handleEventFireBtnClick(eventNum);
		}
	});
}

// Get link to Google Calendar event for ith instance of event_data[eventNum]
function getGoogleCalLink(eventNum, i) {
	out_url = "https://www.google.com/calendar/render?action=TEMPLATE";
	out_url += "&text=" + event_data[eventNum].title.replace(/ /g, "+");

	start_dt = event_data[eventNum].instances[i].start_datetime;
	start_date = start_dt.split(" ")[0];
	start_time = start_dt.split(" ")[1];

	end_dt = event_data[eventNum].instances[i].end_datetime;
	end_date = end_dt.split(" ")[0];
	end_time = end_dt.split(" ")[1];


	out_url += "&dates=" + start_date.replace(/-/g, "") + "T" + start_time.replace(/:/g, "") + "/"; 
	out_url += end_date.replace(/-/g, "") + "T" + end_time.replace(/:/g, "") + ""; 

	out_url += "&ctz=America/New_York";
	out_url += "&location=" + event_data[eventNum].instances[i].location;
	out_url += "&details=" + event_data[eventNum].description.replace(/ /g, "+");
	return out_url;
}

// highlight search result that's been selected and display event view
function highlightSelectedSearchResult(eventNum) {
	// toggle highlighting in search results.
	$(".smallSearchResult.selected").animate({"margin-right": '2vh'});
	$(".smallSearchResult").removeClass("selected");
	$("#smallSearchResult" + eventNum).addClass("selected");

	// Animate selection
	$("#smallSearchResult" + eventNum).animate({"margin-right": '0vh'});
}

// Update the popularity of an event when the fire button is clicked
var handleEventFireBtnClick = function (eventNum) {
	$(".eventFireBtn").click(function(e) {
		updateFireBtn(this, eventNum);
		e.stopPropagation();
	});
};

// Populate event view panel with event_data[eventNum-1] (basic layout)
function populateEventViewPanel(eventNum) {

	$(".event-view").hide();

	// Clickable fire button that displays "Favorite" when hovered over
	var fireBtn = 
		`<div class="eventFireBtn btn" id="eventFireBtn">`
	    +		`<i class="fas fa-fire"></i>`
	    + `</div>`;
	  
	// Number of favorites
	var fireNum = 
		`<p class="eventFireNum" id="eventFireNum">`
	    + 	$("#resultFireNum" + eventNum).text()
	    + `</p>`;
	
	// hide welcome image
	$("#welcome").css("display", "none");
	
	// setup event main header
	$("#eventTitle").html(event_data[eventNum-1].title);
	$("#eventSubtitle").html("");
	$("#eventFireBtn").remove();
	$("#eventFireNum").remove();
	$("#mainHeaderLine").append(fireBtn).append(fireNum);
	
	// setup dates and times
	var instances = event_data[eventNum-1].instances;
	for (var i = 0; i < instances.length; i++) {
		// Locatiom
		$("#eventSubtitle").append(instances[i].location + "&nbsp|&nbsp;");
		// Time
		$("#eventSubtitle").append(makeDate(instances[i].start_datetime, instances[i].end_datetime));
		
		document.getElementById("eventSubtitle").innerHTML +=
			"<a class=\"calendar-btn\" target=\"_blank\" href=\"" + getGoogleCalLink(eventNum-1, i) + "\"> <i class=\"fa fa-calendar-alt\"></i> </a>";
		$("#eventSubtitle").append("<br>");
	}
	
	// setup host and description
	$("#eventHost").html("by " + event_data[eventNum-1].host);
	$("#eventDescription").html(event_data[eventNum-1].description);

	// If the event has a poster, display that.
	if ("poster" in event_data[eventNum-1]) {
		document.getElementById("eventPhoto").innerHTML =
		"<img class=\"img-fluid fit\" src=\""+event_data[eventNum-1].poster+"\">";
	}
	else {
		// Add C&H image
		var photoNum = Math.floor(Math.random() * 81); + 1;
		document.getElementById("eventPhoto").innerHTML =
			"<img class=\"img-fluid fit\" src=\"../../static/graphics/images/CH/"
			+ photoNum + ".png\">";
	}
	
	// highlight fire button if appropriate
	if ($("#resultFireBtn" + eventNum).hasClass("selected")) {
		$("#eventFireBtn").addClass("selected");
	}
	else $("#eventFireBtn").removeClass("selected");
	
	$("#event-view").show();
}
