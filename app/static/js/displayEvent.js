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


			// populate and display event view.
			$(".event-view").hide();
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
	$(".smallSearchResult.selected").animate({"margin-right": '4vh'});
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
		$("#eventSubtitle").append("<br>");
		console.log("TEST");
		document.getElementById("eventSubtitle").innerHTML +=
			"<a class=\"btn btn-primary\" target=\"_blank\" href=\"" + getGoogleCalLink(eventNum-1, i) + "\"> <i class=\"fa fa-calendar-alt\"></i> Add to 	Google Calendar! </a>";
	}

	// setup host and description
	$("#eventHost").html("by " + event_data[eventNum-1].host);
	$("#eventDescription").html(event_data[eventNum-1].description);

	// If the event has a poster, display that.
	if ("poster" in event_data[eventNum-1]) {
		document.getElementById("eventPhoto").innerHTML =
		"<img class=\"mx-auto d-block\" src=\""+event_data[eventNum].poster+"\" id=\"poster\">";
	}
	// good for testing:
	else {
		// Add C&H image
		var photoNum = Math.floor(Math.random() * 81) + 1;
		document.getElementById("eventPhoto").innerHTML =
			"<img class=\"mx-auto d-block\" src=\"../../static/graphics/images/CH/"
			+ photoNum + ".png\" id=\"poster\">";
	}

	// highlight fire button if appropriate
	if ($("#resultFireBtn" + eventNum).hasClass("selected")) {
		$("#eventFireBtn").addClass("selected");
	}
	else $("#eventFireBtn").removeClass("selected");

	$("#event-view").show();
	// handle clicks of fire button
	updateEventFireBtn(eventNum);
}

// Update the popularity of an event when the fire button is clicked
var updateEventFireBtn = function (eventNum) {
	$("#eventFireBtn").click( function(e) {
		if ($(this).hasClass("disabled")) return;
		$(this).addClass("disabled");

		// get event id and user id
		var eventId = event_data[eventNum]._id;
		var userId = $("#userData").data("uid");

		// update database after favoriting event
		var favoriteEvent = function() {
			var callback = function(data) {
				if (data["status"] === "Success") {
					// toggle view of fire button
					if (!checkReloadFavoritePage()) {
						eventFireBtn.classList.toggle("selected");
						resultFireBtn.classList.toggle("selected");
						eventFireBtn.title = "Unfavorite";
						resultFireBtn.title = "Unfavorite";
						updateFireNum(1);
					}
				}
				eventFireBtn.classList.toggle("disabled");
			};
			$.ajax({
				url: base_url + '/api/user/fav/add/'+ userId + "/" + eventId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: callback
			});
		};

		// update database after unfavoriting event
		var unfavoriteEvent = function() {
			var callback = function(data) {
				if (data["status"] === "Success") {
					// toggle view of fire button
					if (!checkReloadFavoritePage()) {
						eventFireBtn.classList.toggle("selected");
						resultFireBtn.classList.toggle("selected");
						eventFireBtn.title = "Favorite";
						resultFireBtn.title = "Favorite";
						updateFireNum(-1);
					}
				}
				eventFireBtn.classList.toggle("disabled");
			};
			$.ajax({
				url: base_url + '/api/user/fav/remove/'+ userId + "/" + eventId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: callback
			});
		};

		// update favorite number information
		var updateFireNum = function(change) {
			var getFireNum = $("#resultFireNum" + (eventNum + 1)).text();
			var newFireNum = parseInt(getFireNum) + change;
			$("#eventFireNum").text(newFireNum);
			$("#resultFireNum" + (eventNum + 1)).text(newFireNum);
		};

		// remove smallSearchResult and corresponding eventView from page if
		// on 'my favorites' page
		var checkReloadFavoritePage = function() {
			if (window.location.href.indexOf('myfavorites') != -1) {
				$(".event-view").hide();
				$("#smallSearchResult" + (eventNum+1)).hide();
				return 1;
			}
			return 0;
		};

		// update database with new favorite
		var eventFireBtn = document.getElementById("eventFireBtn");
		var resultFireBtn = document.getElementById("resultFireBtn" + (eventNum + 1));
		if (eventFireBtn.classList.contains("selected")) unfavoriteEvent();
		else favoriteEvent();

		// prevents whole search result from being selected when fire button is clicked
		e.stopPropagation();
	});
};
