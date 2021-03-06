// DEPENDENCIES: displaySearches.js, handleFavorites.js

// keep track of current event shown in event view
var selected_event = null;
// keep track of current title shown in event view
var selected_title = "";

var renderedImg;

// puts urls in text with hrefs so they are hyperlinked
// function layout from https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
// regex from https://www.regextester.com/94502
function urlify(text) {
    var urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    })
}

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
			// store currently selected event
			selected_event = event_data[eventNum - 1];

			// populate and display event view
			highlightSearchResult($(this), eventNum);
			populateEventViewPanel(eventNum);
			handleEventFireBtnClick(eventNum);
		}
		else if (!($("#smallSearchResult" + eventNum).hasClass("selected"))) {
			// store currently selected event
			selected_event = event_data[eventNum - 1];

			// populate and display event view
			populateEventViewPanel(eventNum);
			handleEventFireBtnClick(eventNum);
		}
		// Trigger slick action if mobile
		if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickNext");
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


	out_url += "&dates=" + start_date.replace(/-/g, "").replace(/\//g,"") + "T" + start_time.replace(/:/g, "") + "/";
	out_url += end_date.replace(/-/g, "").replace(/\//g,"") + "T" + end_time.replace(/:/g, "") + "";

	out_url += "&ctz=America/New_York";
	out_url += "&location=" + event_data[eventNum].instances[i].location;
	out_url += "&details=" + event_data[eventNum].description.replace(/ /g, "+");
	return out_url;
}

// Toggle highlighting in search results.
function highlightSearchResult(elt, eventNum) {
	var event_id = event_data[eventNum - 1]._id;
	updateUrl(addUrlParameter(document.location.search, 'event', event_id));

	$(".smallSearchResult").removeClass("selected");
	elt.addClass("selected");
}

// Animate selection
function selectSearchResult(eventNum) {
	// Don't allow this to happen if we're in calendar view.
	// Seriously.
	if (!inCalendarView()) {
		var selected_event = $(".smallSearchResult.selected");
		var event_to_select = $("#smallSearchResult" + eventNum);

		highlightSearchResult(event_to_select, eventNum);

		// Close previously selected event, if it's not the one we want to open.
		if (selected_event.length > 0 && selected_event[0] !== event_to_select[0]) {
			selected_event.animate({"margin-right": '12px'});
		}
		event_to_select.animate({"margin-right": '0vw'});
	}
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

	// Remove edit parameter.
	updateUrl(removeUrlParameter(document.location.search, "edit"));
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
	$("#eventSetting").html("");

	// clear tags
	$(".badge-border").remove();

	eventTags = event_data[eventNum-1].tags
	for (var i = 0; i < eventTags.length; i++) {
		$("#titleRow").append("<div class=\"badge-border\">"
			+ "<span class=\"badge badge-primary\" id=\"" + eventTags[i] + "Tag\">" + eventTags[i] + "</span>"
			+ "</div>");
	}

	$("#eventSubtitle").html("");
	// setup dates and times
	var instances = event_data[eventNum-1].instances;
	for (var i = 0; i < instances.length; i++) {
		$("#eventSetting").append("<a class=\"calendar-btn\" target=\"_blank\" href=\" "
		+ getGoogleCalLink(eventNum-1, i) + "\" data-toggle=\"tooltip\" title=\"Add to Google Calendar\">"+
		"<i class=\"fa fa-share-square\"></i> </a>");
		// Location
		$("#eventSetting").append(instances[i].location + "&nbsp|&nbsp;");
		// Time
		$("#eventSetting").append(makeDate(instances[i].start_datetime, instances[i].end_datetime));

		$("#eventSetting").append("<br>");
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
	$("#eventDescription").html(urlify(event_data[eventNum-1].description));

	// If the event has a poster, display that.
	document.getElementById("bannerImage").innerHTML = "";
	document.getElementById("posterImage").innerHTML = "";
	document.getElementById("otherImage").innerHTML = "";
    // Reinstate padding from parent div in case we came from a banner
    document.getElementById("eventWrapper").style.paddingTop = "2vh";
	if ("poster" in event_data[eventNum-1]) {
		renderImage(event_data[eventNum-1].poster);
	}
	else {
		renderedImg = null;
	}

	// If the event has a video, embed it
	if ("trailer" in event_data[eventNum-1]) {
		var videoID = getVidID(event_data[eventNum-1].trailer);
		document.getElementById("eventVideo-data").innerHTML = "<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/"
			+ videoID + "?rel=0&amp;showinfo=0\" frameborder=\"0\" allow=\"autoplay; encrypted-media\" allowfullscreen></iframe>";
		document.getElementById("eventVideo").style.display = "block";
	}
	else {
		document.getElementById("eventVideo-data").innerHTML = "";
		document.getElementById("eventVideo").style.display = "none";
	}

	// highlight fire button if appropriate
	if ($("#resultFireBtn" + eventNum).hasClass("selected")) {
		$("#eventFireBtn").addClass("selected");
	}
	else $("#eventFireBtn").removeClass("selected");

	$("#event-view").show();

	// show tips when hovering
	$('[data-toggle="tooltip"]').tooltip();
    heightResizeHandler();
}

function renderImage(url){
    renderedImg = new Image();
    renderedImg.src = url;
    renderedImg.addEventListener("load", formatImage);
	$(window).resize(formatImage);
	function formatImage() {
		if (renderedImg != null) {
			document.getElementById("bannerImage").innerHTML = "";
			document.getElementById("posterImage").innerHTML = "";
			document.getElementById("otherImage").innerHTML = "";
			// Determine where the image should go based off of its aspect ratio
			// <ratio> gives the aspect ratio of the image
			// <proportion> gives the proportion of the event-view pane that the image
			//              takes up by width
			var ratio = renderedImg.naturalWidth / renderedImg.naturalHeight;
            var eventViewHeight = document.getElementById("event-view-info").clientHeight;
            var eventViewWidth = document.getElementById("event-view-info").clientWidth;
			var scaledWidth = eventViewHeight * ratio;
			var proportion = scaledWidth / eventViewWidth;
			if (2.25 <= ratio) {
				// We put thin and wide images above the description
				document.getElementById("bannerImage").innerHTML =
				"<img class=\"img-fluid\" src=\""+renderedImg.src+"\">";
                // Remove padding from parent div
                document.getElementById("eventWrapper").style.paddingTop = "0px";
			} else if ((proportion < 0.6) && (eventViewWidth * 0.4 > 250)) {
				// We put tall images next to the description if the screen is wide enough
				document.getElementById("posterImage").innerHTML =
				"<img id=\"posterImageSrc\" class=\"img-cover\" src=\""+renderedImg.src+"\">";
                document.getElementById("posterImageSrc").style.height = eventViewHeight + "px";
			} else {
				// Otherwise, we put the image below the description
				document.getElementById("otherImage").innerHTML =
				"<img id=\"otherImageSrc\" class=\"img-fluid\" src=\""+renderedImg.src+"\">";
                if ((scaledWidth * 3.0/4.0) < eventViewWidth) {
                    document.getElementById("otherImageSrc").style.height = (eventViewHeight * 3.0/4.0) + "px";
                }
                else {
                    document.getElementById("otherImageSrc").style.width = "100%";
                    document.getElementById("otherImageSrc").style.height = "auto";
                }
			}
		}
	}
}

// A function to extract the unique youtube video ID from an arbitrary Youtube
// video link. Regex coverage credit to https://gist.github.com/ghalusa/6c7f3a00fd2383e5ef33
function getVidID(url) {
	var regex = new RegExp('(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})', 'i');
	return url.match(regex)[1];
}
