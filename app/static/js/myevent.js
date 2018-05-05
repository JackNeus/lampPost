// DEPENDENCIES: displaySearches.js, displayEvent.js, createEventHtml.js

var event_data = [];
var user_fav_data = [];
var currentRows = 0;

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

// code from Stack Overflow
// https://stackoverflow.com/questions/5796718/html-entity-decode
var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();

$(document).ready(function(){
	checkSort();
	loadEvents();
	// hide the form that users would edit events with
	$("#event-form").hide();
	// change the time inputs to be handled by timepicker
	$("input[id*='Time']").timepicker({});
});


// reload events if user selects a sort option
var checkSort = function() {
	// allow user to sort by date or popularity
	$("#searchSort").change(function() {
		if (event_data != []) {
			showMyEvents();
			handleDeletePoster();
			handleDeleteMyEvent();
			handleEditMyEvent();
			var urlParamEventId = checkEventUrlParameter();
			if (urlParamEventId) {
				updateUrlParamEventView(urlParamEventId);
			}
		}
	});
	$(".sort-direction-btn").click(function() {
		$("#sort-direction-btn-up").toggleClass("hidden");
		$("#sort-direction-btn-down").toggleClass("hidden");
		showMyEvents();
		handleDeletePoster();
		handleDeleteMyEvent();
		handleEditMyEvent();
		var urlParamEventId = checkEventUrlParameter();
		if (urlParamEventId) {
			updateUrlParamEventView(urlParamEventId);
		}
	});
};

// Take advantage of a jinja variable to force rendering of
// edit form at page load.
function checkDisplay() {
	let i = $("#displayEventForm").length;
	if (i > 0) {
		$("#event-form").show();

		var eventId = $("#event_id").val();
		var eventNum = event_data.findIndex(function(event){return event._id === eventId;}) + 1;

		// Graphical commands to select event result.
		selectSearchResult(eventNum);
		selectEditBtn($("#editBtn"+eventNum));

		// If the user attempted to edit an event and was unsuccessful,
		// the url parameter will not be set. We need to manually check for this.
		//
		// Usually, we update the DOM according to the value of the URL.
		// Here, we update the URL according to the DOM.
		updateUrl(addUrlParameter(document.location.search, 'event', eventId));
		updateUrl(addUrlParameter(document.location.search, 'edit'));
	}
}

// make all icons not "selected"
function unselectIcons() {
	$(".deleteBtn").removeClass("selectedIcon");
	$(".editBtn").removeClass("selectedIcon");
}

// load user events
var loadEvents = function() {
	var userId = $("#userData").data("uid");

	var callback = function(data) {
		if (data["status"] === "Success") {
			event_data = toJavaEventData(data["data"]);
			setupUserFavorites();
		}
		else {
			event_data = [];
			showNoEvents();
		}
	}
	$.ajax({
		url: base_url + '/api/user/get_events/'+userId,
		dataType: 'json',
		headers: {
			'Authorization': ('Token ' + $.cookie('api_token'))
		},
		success: callback
	});
};

// allow user to delete events
var handleDeleteMyEvent = function() {
	$(".deleteBtn").click( function() {
		// hide the footer
		$(".footer").hide();

		unselectIcons();

		// make the icon "selected"
		eventNum = getNum($(this).attr('id'), "deleteBtn");
		var deleteBtn = $("#deleteBtn"+eventNum);
		deleteBtn.addClass("selectedIcon");

		// toggle highlighting in search results
		selectSearchResult(eventNum);

		// show event
		populateEventViewPanel(eventNum);

		// delete event if user confirms deletion
		$("#smallSearchResult" + eventNum).show(function () {
			var result = confirm("Are you sure you would like to delete this event?");
			if (result) {
				// hide the event display if current event view is the event to be
				// deleted
				if (selected_event !== null && selected_event._id == event_data[eventNum - 1]._id) {
					$(".event-view").hide();
					$("#event-form").hide();
				}

				var eventId = event_data[eventNum - 1]._id;

				var callback = function() {
					loadEvents();
				}
				$.ajax({
					url: base_url + '/api/event/delete/' + eventId,
					method: 'delete',
					dataType: 'json',
					headers: {
						'Authorization': ('Token ' + $.cookie('api_token'))
					},
					success: callback
				});
			} else {
				unselectIcons();
			}
		});
		// Trigger slick action if mobile
		if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickNext");
	});
}

// allow user to change events
var handleEditMyEvent = function() {

	$(".editBtn").click( function(e) {
		var eventNum = getNum($(this).attr('id'), "editBtn");
		var eventId = event_data[eventNum - 1]._id;

		// Add edit parameter to URL.
		if (getUrlParameter('edit') === undefined) {
			updateUrl(addUrlParameter(document.location.search, 'edit'));
		}

		// Update event parameter in URL, if necessary.

		// don't update if click on already selected search result
		if (!($("#smallSearchResult" + eventNum).hasClass("selected"))) {
			// update url with eventid paramter
			updateUrl(addUrlParameter(document.location.search, 'event', eventId));
		}
		renderEditForm(eventNum);
		// Trigger slick action if mobile
		if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickNext");
		e.stopPropagation();
	});
}

var renderEditForm = function(eventNum) {
	var editBtn = $("#editBtn"+eventNum);

	// hide the footer
	$(".footer").hide();

	// make the icon "selected"
	unselectIcons();
	selectEditBtn(editBtn);

	// toggle highlighting in search results
	selectSearchResult(eventNum);

	// hide the event display
	$(".event-view").hide();

	// fill the form with the correct values
	$("#event_id").val(decodeEntities(event_data[eventNum - 1]._id));
	$("#title").val(decodeEntities(event_data[eventNum - 1].title));
	$("#description").val(decodeEntities(event_data[eventNum - 1].description));
	$("#host").val(decodeEntities(event_data[eventNum - 1].host));

	$("#visibility-"+(1-event_data[eventNum-1].visibility)).attr('checked', 'checked');

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

		yearMonDayS = starts[0].split("-")
		yearMonDayE = ends[0].split("-")
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
		$("#current-poster").toggleClass("hidden");
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

var selectEditBtn = function(editBtn) {
	// make the icon "selected"
	editBtn.addClass("selectedIcon");
}

var handleDeletePoster = function() {
	$("#delete-poster-button").click(function() {
		if (confirm("Are you sure you wish to remove the poster?")) {
			$("#deletePoster").attr("value", "delete");
			$("#current-poster").toggleClass("hidden");
		}
	});
}

// Get list of events which user has favorited
var setupUserFavorites = function() {
	var userId = $("#userData").data("uid");
	var callback = function(data) {
		if (data["status"] === "Success")
			user_fav_data = toJavaEventData(data["data"]);
		else
			user_fav_data = [];
		showMyEvents();
		handleDeleteMyEvent();
		handleEditMyEvent();
		var urlParamEventId = checkEventUrlParameter();
		if (urlParamEventId) {
			updateUrlParamEventView(urlParamEventId);
		}
		checkDisplay();
	};
	$.ajax({
			url: base_url + '/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
	});
};

// Writes simple message to user if they have no favorites
// TODO: Figure out if we want to show them this message, or just not show the 'Manage
// my Events' tab at all if they have no events
var showNoEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	currentSearches.innerHTML = `<h5>You have no events :( Go to 'Add Event' to create one!</h5>`;
}

var toJavaEventData = function(data) {
	for (var i = 0; i < data.length; i++) {
		var instances = data[i].instances;
		for (var j = 0; j < instances.length; j++) {
			var javaStartDate = py2java_date(instances[j].start_datetime);
			var javaEndDate = py2java_date(instances[j].end_datetime);
			instances[j].start_datetime = javaStartDate;
			instances[j].end_datetime = javaEndDate;
		}
	}
	data.instances = instances;
	return data;
};

// converts python date string into java date string (yyyy-mm-dd to yyyy/mm/dd)
function py2java_date( date_py ) {
	var date_java = date_py.replace(/-/g, '/');
	return date_java;
}
