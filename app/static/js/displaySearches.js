// DEPENDENCIES: displayEvent.js, createEventHtml.js, handleFavorites.js

// Populate search result panel with event_data sorted by date.
var showSearchResults = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 			// sort by date or popularity
	createSearchResults();		// create html code for each search result and display them
	checkHighlightEventInUrl();	// highlight the event in url if exists
	highlightUserFavorites(); 	// highlight user favorites on load
	handleFireBtnClick(); 		// handle clicks of fire button
	handleEventViewClick(); 	// handle click of event
}

// Populate search result panel with event_data sorted by date.
var showMyEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 			// sort events by date
	createMyEventResults(); 	// create html code for each created event and display them
	highlightUserFavorites(); 	// highlight user favorites on load
	handleFireBtnClick(); 		// handle clicks of fire button
	handleEventViewClick(); 	// handle click of event
}

// Update the popularity of an event when the fire button is clicked
var handleFireBtnClick = function () {
	$(".resultFireBtn").click(function(e) {
		var eventNum = getNum($(this).attr("id"), "resultFireBtn");
		updateFireBtn(this, eventNum);
		e.stopPropagation();
	});
};

// Highlight the event in the url
// TODO: Make the length of the small search result not shrink
var checkHighlightEventInUrl = function() {
	var eventId = getUrlParameter('event');
	if (eventId) {
		var event = $.grep(event_data, function(event){return event._id === eventId;})[0];
		if (event != undefined) {
			eventNum = event_data.indexOf(event) + 1;
			selected_event = event;
			$("#smallSearchResult" + eventNum).addClass("selected");
		}
	}
};

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
};

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
	if (units == 'days') {
		// make sure to round down correctly
		return Math.floor(difference_ms/one_day);
	}
	else return (difference_ms/1000);
}

// makes desired date string to be used in the search results
function makeDate(start, end) {
	var start_date = new Date(start);
	var end_date = new Date(end);
	
	var start_date_str = makeDayOfWeekString(start_date) + makeDayMonthYearString(start_date);
	if ((start_date.getDate() != end_date.getDate()))
		var end_date_str = makeDayOfWeekString(end_date) + makeDayMonthYearString(end_date);

	// create time strings in hh:mm format
	var start_hour = start_date.getHours();
	var end_hour = end_date.getHours();

	// Convert from military hours to a more readable format
	var end_suffix = "am";
	var start_suffix = "am";
	if (start_hour == 0) {
		start_hour = 12;
	}
	if (start_hour > 12) {
		start_hour -= 12;
		start_suffix = "pm";
	}
	if (end_hour == 0) {
		end_hour = 12;
	}
	else if (end_hour == 12) {
		end_suffix = "pm";
	}
	else if (end_hour > 12) {
		end_hour -= 12;
		end_suffix = "pm";
	}
	// minutes
	start_time = start_hour + ":" +
			("0" + start_date.getMinutes()).slice(-2);
	end_time = end_hour + ":" +
			("0" + end_date.getMinutes()).slice(-2);

	// create date string in correct format for different cases
	if (end_date_str) {
		var firstDay = start_date_str + " " + start_time + start_suffix;
		var secondDay = end_date_str + " " + end_time + end_suffix;
		return firstDay + "-" + secondDay;
	}
	else if ((start_time + start_suffix) === (end_time + end_suffix)) 
		return start_date_str + " @" + start_time + start_suffix;
	else if (start_suffix === end_suffix)
		return start_date_str + " " + start_time + "-" + end_time + end_suffix;
	else
		return start_date_str + " " + start_time + start_suffix + "-" + end_time + end_suffix;
}

// returns date in mm/dd or mm/dd/yyyy format
function makeDayMonthYearString(start_date, include_year) {
	var today = new Date();
	
	var date_str = (start_date.getMonth() + 1) + '/' + start_date.getDate();
	// don't show year unless year is different than current year
	if (start_date.getFullYear() != today.getFullYear() || include_year)
		date_str += "/" + (start_date.getFullYear());
	return date_str;
}

// creates date string in format 'dayName mm/dd' or 'dayName mm/dd/yyyy'
function makeDayOfWeekString(date) {
	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);
	
	var weekdays = ["Sun", "Mon", "Tue", "Wed",
			    "Thu", "Fri", "Sat"];
	var time_diff = Date.timeBetween(today, date, 'days');

	var date_str = weekdays[date.getDay()] += " ";

	if (time_diff == -1)
		date_str += " (Yesterday) ";
	else if (time_diff == 0)
		date_str += " (Today) ";
	else if (time_diff == 1)
		date_str += " (Tomorrow) ";
		
	return date_str;
}
