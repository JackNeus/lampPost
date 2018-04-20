// DEPENDENCIES: displayEvent.js, createEventHtml.js

// Populate search result panel with event_data sorted by date.
var showSearchResults = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 		// sort by date or popularity
	createSearchResults();	// create html code for each search result and display them
	highlightUserFavorites(); 	// highlight user favorites
	// declare event handlers for "fireBtn" and "smallSearchResult"
	updateFireBtn(); 		// handle clicks of fire button
	updateEventView(); 	// handle click of event
}

// Populate search result panel with event_data sorted by date.
var showMyEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 	// sort events by date
	createMyEventResults(); // create html code for each created event and display them
	highlightUserFavorites(); 	// highlight user favorites
	// declare event handlers for "fireBtn" and "smallSearchResult"
	updateFireBtn(); 		// handle clicks of fire button
	updateEventView(); 	// handle click of event
}

// Color in fire button for events a user has favorited
var highlightUserFavorites = function () {
	for (var i = 0; i < event_data.length; i++) {
		// Event id
		var eventId = event_data[i]._id;

		// Color in fire button if user has favorited an event
		var fireBtnElement = document.getElementById("resultFireBtn" + (i + 1));
		if (eventIsFav(eventId)) fireBtnElement.classList.toggle("selected");
	}
};

// Update the popularity of an event when the fire button is clicked
var updateFireBtn = function () {
	$(".resultFireBtn").click( function(e) {
		// get event id and user id
		var eventNum = getNum($(this).attr("id"), "resultFireBtn");
		var eventId = event_data[eventNum-1]._id
		var userId = $("#userData").data("uid");

		// update database after favoriting event
		var favoriteEvent = function() {
			var callback = function(data) {
				if (data["status"] === "Success") {
					// toggle view of fire button
					fireBtn.classList.toggle("selected");
					fireBtn.title = "Unfavorite";
					updateFireNum(1);
					updateEventViewFire(1);
					checkReloadFavoritePage();
				}
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
					fireBtn.classList.toggle("selected");
					fireBtn.title = "Favorite";
					updateFireNum(-1);
					updateEventViewFire(-1);
					checkReloadFavoritePage();
				}
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
		
		// update database with new favorite
		var fireBtn = document.getElementById($(this).attr("id"));
		if (fireBtn.classList.contains("selected")) unfavoriteEvent();
		else favoriteEvent();
		
		// update favorite number information
		var updateFireNum = function(change) {
			var getFireNum = $("#resultFireNum" + eventNum).text();
			var newFireNum = parseInt(getFireNum) + change;
			$("#resultFireNum" + eventNum).text(newFireNum);
		}
		
		// if on favorite page, reload the page
		var checkReloadFavoritePage = function() {
			if (window.location.href.indexOf('myfavorites') != -1) {
				$("#smallSearchResult" + eventNum).hide();
				if (selected_event !== null && !fireBtn.classList.contains("selected") && selected_event._id == eventId)
					$(".event-view").hide();
			}
		};
		
		// update favorite button on event-view if the current event-view is the same as
		// the search that's been favorited
		var updateEventViewFire = function(change) {
			if (selected_event !== null && selected_event._id == eventId) {
				// toggle color/highlighting
				var eventFireBtn = document.getElementById("eventFireBtn");
				eventFireBtn.classList.toggle("selected");
				if (eventFireBtn.classList.contains("selected")) {
					eventFireBtn.title = "Unfavorite";
				}
				else {
					eventFireBtn.title = "Favorite";
				}
				// update favorite number information
				var getFireNum = $("#eventFireNum").text();
				var newFireNum = parseInt(getFireNum) + change;
				$("#eventFireNum").text(newFireNum);
			}
		};

		// prevents whole search result from being selected when fire button is clicked
		e.stopPropagation();
	});
}

// Sort results by popularity or date
var sortResults = function () {
	// check which sort is selected
	if ($("#searchSort option:selected").text() == "Sort By Date")
		sortByDate = true;
	else  sortByDate = false;

	// sort all instances of the event by date
	for (var i = 0; i < event_data.length; i++) {
		event_data[i].instances.sort(function(a, b) {
			return Date.timeBetween(new Date(b.start_datetime),
							new Date(a.start_datetime),
							'seconds');
		});
	}

	if (sortByDate) 	sortEventsByDate();
	else 			sortEventsByPopularity();
}

/*----------------------------- UTILITY FUNCTIONS ----------------------------*/

// Given an id of the form 'smallSearchResultX', return X.
function getNum(searchId, titleSplit) {
	return searchId.split(titleSplit).pop();
}

// Returns true if event is in list of user favorites, false otherwise
function eventIsFav(eventId) {
	for (var i = 0; i < user_fav_data.length; i++) {
		if (eventId == user_fav_data[i]._id) return true;
	}
	return false;
}

// sort the events by date (using the first instance of the event)
function sortEventsByDate() {
	event_data.sort(function (a, b) {
		return Date.timeBetween(new Date(b.instances[0].start_datetime),
						new Date(a.instances[0].start_datetime),
						'seconds');
	});
}

// sort the events by popularity
function sortEventsByPopularity() {
	event_data.sort(function (a, b) {
		return parseInt(b.favorites) - parseInt(a.favorites);
	});
}

// calculates the difference between date1 and date2 in ms, with an
// option to return the difference in a unit of days
Date.timeBetween = function( date1, date2, units ) {
	// Get 1 day in milliseconds
	var one_day = 1000*60*60*24;

	// Convert both dates to milliseconds
	var date1_ms = date1.getTime();
	var date2_ms = date2.getTime();
	var difference_ms = date2_ms - date1_ms;

	// Return difference in days or seconds
	if (units == 'days') return Math.round(difference_ms/one_day);
	else return difference_ms/1000;
}

// makes desired date string to be used in the search results
function makeDate(start, end) {
	var start_date = new Date(start);
	var end_date = new Date(end);
	var today = new Date();

	// Special cases for dates within a week of current date
	var weekdays = ["Sun", "Mon", "Tue", "Wed",
			    "Thu", "Fri", "Sat"];
	var time_diff = Date.timeBetween(today, start_date, 'days');

	var date_str = weekdays[start_date.getDay()] += " ";
	date_str += (start_date.getMonth() + 1) + '/' + start_date.getDate();

	if (time_diff == -1)
		date_str += " (Yesterday) ";
	else if (time_diff == 0)
		date_str += " (Today) ";
	else if (time_diff == 1)
		date_str += " (Tomorrow) ";


	// don't show year unless year is different than current year
	if (start_date.getFullYear() != today.getFullYear())
		date_str += "/" + (start_date.getFullYear());

	// create time strings in hh:mm format
	var start_hour = start_date.getHours();
	var end_hour = end_date.getHours();

	// Convert from military hours to a more readable format
	var suffix = "am";
	if (start_hour == 0) {
		start_hour = 12;
	}
	if (start_hour > 12) {
		start_hour -= 12;
	}
	if (end_hour == 0) {
		end_hour = 12;
	}
	else if (end_hour == 12) {
		suffix = "pm";
	}
	else if (end_hour > 12) {
		suffix = "pm";
		end_hour -= 12;
	}
	// minutes
	start_time = start_hour + ":" +
			("0" + start_date.getMinutes()).slice(-2);
	end_time = end_hour + ":" +
			("0" + end_date.getMinutes()).slice(-2);

	if (start_time === end_time) {
		return date_str + " @" + start_time + suffix;
	}
	else {
		return date_str + " " + start_time + "-" + end_time + suffix;
	}
}
