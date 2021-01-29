// DEPENDENCIES: displaySearches.js, handleFavorites.js

// keep track of current event shown in event view
var selected_event = null;
// keep track of current title shown in event view
var selected_title = "";

var renderedImg;

/*------------------------ DISPLAY EVENT VIEW --------------------------------*/

// Update the event view panel
function updateEventView(eventNum) {
	clearEventViewPanel();
	populateEventViewPanel(eventNum);
	handleEventViewReportBtnClick(eventNum);
}

// Clears previous event view panel
function clearEventViewPanel() {
	// hide welcome image if it exists
	$("#welcomeDiv").hide();
	$("#welcome").css("display", "none");
	
	// hide event form if it exists
	$("#event-form").hide();
	
	// clear previous event view
	$(".event-view").hide();
	$("#eventSetting").html("");
	$("#eventSubtitle").html("");
	$(".badge-border").remove();	// clear previous event tags
	$("#bannerImage").html("");
	$("#posterImage").html("");
	$("#otherImage").html("");
	
	// hide footer if it exists
	$(".footer").hide();
}

// Populate event view panel with event_data[eventNum-1] (basic layout)
function populateEventViewPanel(eventNum) {

	// setup event main header
	selected_title = event_data[eventNum-1].title;
	$("#eventTitle").html(selected_title);
	$("#eventHost").html("by " + event_data[eventNum-1].host);
	$("#eventDescription").html(urlify(event_data[eventNum-1].description));

	// set new event tags
	eventTags = event_data[eventNum-1].tags
	for (var i = 0; i < eventTags.length; i++) {
		$("#titleRow").append("<div class=\"badge-border\">"
			+ "<span class=\"badge badge-primary\" id=\"" + eventTags[i] + "Tag\">" + eventTags[i] + "</span>"
			+ "</div>");
	}

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
	
	// setup fire button
	// if search result fire button exists, make the event view fire button match it
	if ($("#resultFireBtn" + eventNum).length) {
		var eventIsFavorite = $("#resultFireBtn" + eventNum).hasClass("selected");
		var eventFireCount = $("#resultFireNum" + eventNum).text();
	}
	// otherwise, get the actual favorite data
	else {
		var eventIsFavorite = eventIsUserFavorite(event_data[eventNum - 1]._id);
		var eventFireCount = event_data[eventNum - 1].favorites;
	}
	// update the event view fire button with the count and selection
	if (eventIsFavorite) selectFireButton($("#eventFireBtn"));
	else deselectFireButton($("#eventFireBtn"));
	$("#eventFireNum").html(eventFireCount);

	// If the event has a poster, display that.
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

	$("#event-view").show();

	// show tips when hovering
	$('[data-toggle="tooltip"]').tooltip();
    	heightResizeHandler();
}

// Upon clicking report button, clear elements and fill id
function handleEventViewReportBtnClick(eventNum) {
	$("#reportBtn").click(function() {
		// set title of report popup
		$("#reportPopupTitle").html("\"" + selected_title + "\"");
		
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
		// set title of report popup
		$("#reportPopupTitle").html("\"" + selected_title + "\"");
		
		// show report form
		$('#myModal').modal('show');
	}
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

function renderImage(url){
    renderedImg = new Image();
    renderedImg.src = url;
    renderedImg.addEventListener("load", formatImage);
	$(window).resize(formatImage);
	function formatImage() {
		if (renderedImg != null) {
			$("#bannerImage").html("");
			$("#posterImage").html("");
			$("#otherImage").html("");
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
			} 
			else if ((proportion < 0.6) && (eventViewWidth * 0.4 > 250)) {
				// We put tall images next to the description if the screen is wide enough
				document.getElementById("posterImage").innerHTML =
				"<img id=\"posterImageSrc\" class=\"img-cover\" src=\""+renderedImg.src+"\">";
                		document.getElementById("posterImageSrc").style.height = eventViewHeight + "px";
			} 
			else {
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

/*-------------------------- EDIT EVENT VIEW ---------------------------------*/

// Return true if current event view is in edit mode, false otherwise
function eventViewIsEditEvent() {
	return $(".eventFormView").css("display") == "block";
}

// Update the event view panel
function updateEventViewEditForm(eventNum) {
	clearEventViewPanel();
	populateEventViewEditForm(eventNum);
}

// Populate event view panel with an event edit form for event_data[eventNum-1]
var populateEventViewEditForm = function(eventNum) {
	// fill the form with the correct values
	$("#event_id").val(decodeEntities(event_data[eventNum - 1]._id));
	$("#title").val(decodeEntities(event_data[eventNum - 1].title));
	$("#description").val(decodeEntities(event_data[eventNum - 1].description));
	$("#host").val(decodeEntities(event_data[eventNum - 1].host));

	$("#visibility-"+(event_data[eventNum-1].visibility)).attr('checked', 'checked');

	var numShowings = event_data[eventNum - 1].instances.length;
	$("#numShowings-" + (numShowings - 1)).prop("checked", true);

	// to avoid flickering, if we haven't loaded anything yet, do this special case
	if (currentRows == 0) {
		for (var i = 1; i <= numShowings; i++) {
			$("#form-row-" + i).show();
		}
		currentRows = numShowings;
	}
	// otherwise, do the standard
	else {
		// show the correct number of form rows, by sliding down any extra we might need
		for (var i = currentRows; i <= numShowings; i++) {
			$("#form-row-" + i).slideDown();
		}

		currentRows = numShowings;

		// slide up any extra form rows
		for (var i = numShowings + 1; i <= 4; i++) {
			$("#form-row-" + i).slideUp();
		}
	}

	// fill in correct values in any relevant form rows
	for (var i = 0; i < numShowings; i++) {
		$("#locations-" + i).val(decodeEntities(event_data[eventNum - 1].instances[i]["location"]));
		starts = event_data[eventNum - 1].instances[i]["start_datetime"].split(" ");
		ends = event_data[eventNum - 1].instances[i]["end_datetime"].split(" ");

		yearMonDayS = starts[0].split("/")
		yearMonDayE = ends[0].split("/")
		$("#startDates-" + i).val(yearMonDayS[1] + "/" + yearMonDayS[2] + "/" + yearMonDayS[0]);
		$("#endDates-" + i).val(yearMonDayE[1] + "/" + yearMonDayE[2] + "/" + yearMonDayE[0]);

		timeS = starts[1];
		timeE = ends[1];
		$("#startTimes-" + i).val(timeS);
		$("#endTimes-" + i).val(timeE);
	}

	// empty the values in all the other form rows
	for (var i = numShowings; i < 4; i++) {
		$("#locations-" + i).val("");
		$("#startDates-" + i).val("");
		$("#endDates-" + i).val("");
		$("#startTimes-" + i).val("");
		$("#endTimes-" + i).val("");
	}
	if (event_data[eventNum - 1].poster !== undefined) {
		$("#poster-link").attr('href', event_data[eventNum - 1].poster);
		$("#current-poster").removeClass("hidden");
		handleDeletePoster();
	}
	else {
		$("#current-poster").addClass("hidden");
	}

	$("#link").val(decodeEntities(event_data[eventNum - 1].trailer));

	// make sure everything is unchecked to begin with
	$("input[name='tags'").prop("checked", false);

	// check appropriate tags
	eventTags = event_data[eventNum - 1].tags;
	for (var i = 0; i < eventTags.length; i++) {
		$("input[value=\'" + eventTags[i] + "\']").prop("checked", true);
	}
	// display the form
	$("#event-form").show();
}
