// DEPENDENCIES: handleFavorites.js

// keep track of current event shown in event view
var selected_event = null;
// keep track of current title shown in event view
var selected_title = "";

// Shows large event view when search result is clicked
var handleEventViewClick = function() {
	$(".smallSearchResult").click( function(){
		// hide welcome message
		$("#welcomeDiv").hide();

		// hide any footer
		$(".footer").hide();
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

		// Get rid of the edit parameter, if it exists.
		updateUrl(removeUrlParameter(document.location.search, 'edit'));
		
		// change view/handling if in calendar view mode
		var calendarMode = checkCalendarParameter();
		if (calendarMode) {
			// update url with eventid paramter if event is different than 
			// event currently in url
			if (getUrlParameter('event') !== eventId)
				updateUrl(addUrlParameter(document.location.search, 'event', eventId));

			// store currently selected event
			selected_event = event_data[eventNum - 1];

			// populate and display event view
			populateEventViewPanel(eventNum);
			handleEventFireBtnClick(eventNum);
		}
		else if (!($("#smallSearchResult" + eventNum).hasClass("selected"))) {
			// update url with eventid paramter if event is different than 
			// event currently in url
			if (getUrlParameter('event') !== eventId)
				updateUrl(addUrlParameter(document.location.search, 'event', eventId));

			// store currently selected event
			selected_event = event_data[eventNum - 1];

			// populate and display event view
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

// Animate selection
function selectSearchResult(eventNum) {
	var selected_event = $(".smallSearchResult.selected");
	var event_to_select = $("#smallSearchResult" + eventNum);

	// toggle highlighting in search results.
	$(".smallSearchResult").removeClass("selected");
	event_to_select.addClass("selected");

	// Close previously selected event, if it's not the one we want to open.
	if (selected_event.length > 0 && selected_event[0] !== event_to_select[0]) {
		selected_event.animate({"margin-right": '2vh'});
	}
	// Open new events.
	event_to_select.animate({"margin-right": '0vh'});
}

// Update the popularity of an event when the fire button is clicked
var handleEventFireBtnClick = function (eventNum) {
	$(".eventFireBtn").unbind("click");
	$(".eventFireBtn").click(function(e) {
		updateFireBtn(this, eventNum);
		e.stopPropagation();
	});
};

// set title of report popup
function setTitle(title) {
	$("#reportPopupTitle").html("\"" + title + "\"");
}

// Populate event view panel with event_data[eventNum-1] (basic layout)
function populateEventViewPanel(eventNum) {
	$(".event-view").hide();

	// Search pane stuff.
	selectSearchResult(eventNum);

	// Clickable fire button that displays "Favorite" when hovered over
	var fireBtn = $("#eventFireBtn");


	// Number of favorites
	var fireNum = $("#eventFireNum");
	var fireCount = $("#resultFireNum" + eventNum).text();
	fireNum.html(fireCount);

	// hide welcome image
	$("#welcome").css("display", "none");

	// setup event main header
	$("#eventTitle").html(event_data[eventNum-1].title);
	$("#eventSubtitle").html("");

	// setup dates and times
	var instances = event_data[eventNum-1].instances;
	for (var i = 0; i < instances.length; i++) {
		$("#eventSubtitle").append("<a class=\"calendar-btn\" target=\"_blank\" href=\""
			+ getGoogleCalLink(eventNum-1, i) + "\"> <i class=\"fa fa-calendar-alt\"></i> </a>");
		// Location
		$("#eventSubtitle").append(instances[i].location + "&nbsp|&nbsp;");
		// Time
		$("#eventSubtitle").append(makeDate(instances[i].start_datetime, instances[i].end_datetime));

		$("#eventSubtitle").append("<br>");
	}

	selected_title = event_data[eventNum-1].title;

	// upon clicking report button, clear elements and fill id
	$("#reportBtn").click(function() {
		// fill this element of the form with the correct value
		$("#event_id").val(event_data[eventNum - 1]._id);
		// clear the other elements
		$("#description").val("");
		$("#category-0").attr("checked", false);
		$("#category-1").attr("checked", false);
		$("#category-2").attr("checked", false);
	});

	// if there was an error in submitting report, then show modal
	if ($('#wasError').length) {
		setTitle(selected_title);
		$('#myModal').modal('show');
	}

	// setup host and description
	$("#eventHost").html("by " + event_data[eventNum-1].host);
	$("#eventDescription").html(event_data[eventNum-1].description);

	// If the event has a poster, display that.
	document.getElementById("bannerImage").innerHTML = "";
	document.getElementById("posterImage").innerHTML = "";
	document.getElementById("otherImage").innerHTML = "";
	if ("poster" in event_data[eventNum-1]) {
		renderImage(event_data[eventNum-1].poster);
	}

	// highlight fire button if appropriate
	if ($("#resultFireBtn" + eventNum).hasClass("selected")) {
		$("#eventFireBtn").addClass("selected");
	}
	else $("#eventFireBtn").removeClass("selected");

	$("#event-view").show();
}

function renderImage(url){
    var img = new Image();
    img.src = url;
    img.addEventListener("load", function(){
		// Determine where the image should go based off of its aspect ratio
		// <ratio> gives the aspect ratio of the image
		// <proportion> gives the proportion of the event-view pane that the image
		//              takes up by width
		var ratio = this.naturalWidth / this.naturalHeight;
		var scaledWidth = document.getElementById("event-view-info").clientHeight
						  * ratio;
		var proportion = scaledWidth
						 / document.getElementById("event-view-info").clientWidth;
		if (2.5 <= ratio) {
			// We put thin and wide images above the description
			document.getElementById("bannerImage").innerHTML =
			"<img class=\"img-fluid\" src=\""+img.src+"\">";
		} else if (proportion < 0.6) {
			// We put tall images next to the description if the screen is wide enough
			document.getElementById("posterImage").innerHTML =
			"<img class=\"img-cover\" src=\""+img.src+"\">";
		} else {
			// Otherwise, we put the image below the description
			document.getElementById("otherImage").innerHTML =
			"<img class=\"img-fluid\" src=\""+img.src+"\">";
		}
    });
}
