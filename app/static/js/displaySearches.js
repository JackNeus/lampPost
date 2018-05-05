// DEPENDENCIES: displayEvent.js, createEventHtml.js, handleFavorites.js

// Populate search result panel with event_data sorted by date.
var showSearchResults = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";
	
	// create html code for each search result and display them
	// show results differently for calendar view
	if (inCalendarView()) {
		sortEventsByDate();	// sort by date
		createCalenderViewResults();
	}
	else {
		sortResults(); 		// sort by date or popularity
		createSearchResults();
	}
  
	checkHighlightEventInUrl();	// highlight the event in url if exists
	highlightUserFavorites(); 	// highlight user favorites on load
	handleFireBtnClick(); 		// handle clicks of fire button
	handleEventViewClick(); 	// handle click of event
};

// Populate search result panel with event_data sorted by date.
var showMyEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 				// sort events by date
	createMyEventResults(); 	// create html code for each created event and display them
	highlightUserFavorites(); 	// highlight user favorites on load
	handleFireBtnClick(); 		// handle clicks of fire button
	handleEventViewClick(); 	// handle click of event
};

// Populate search result panel with event_data sorted by date.
var showMyFavorites = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 			// sort by date or popularity
	createSearchResults();		// create html code for each search result and display them
	checkHighlightEventInUrl();	// highlight the event in url if exists
	highlightUserFavorites(); 	// highlight user favorites on load
	handleFireBtnClick(); 		// handle clicks of fire button
	handleEventViewClick(); 	// handle click of event
};

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
			selectSearchResult(eventNum);
		}
	}
};

// Sort results by popularity or date
var sortResults = function () {
	// check which sort is selected
	if ($("#searchSort option:selected").text() == "Sort By Date")
		sortByDate = true;
	else  sortByDate = false;

	if (sortByDate) {
		sortEventsByDate();
	}
	else { 
		sortEventsByPopularity();
	}
};

// Return True if descending, False if ascending.
function getSortDirection() {
	if ($("#sort-direction-btn-down").is(":visible")) {
		return true;
	} 
	else {
		return false;
	}
}

// return true if in calendar view
function inCalendarView() {
	return $("#calendarViewBtn").hasClass("calendarMode");
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
		let time_between = Date.timeBetween(new Date(b.instances[0].start_datetime),
						new Date(a.instances[0].start_datetime),
						'seconds');
		if (time_between === 0) {
			return a.title < b.title;
		}
		return time_between;
	});
	if (!getSortDirection() && !inCalendarView()) {
		event_data.reverse();
	}
}

// sort the events by popularity
function sortEventsByPopularity() {
	event_data.sort(function (a, b) {
		var fav_diff = parseInt(b.favorites) - parseInt(a.favorites);		
		if (fav_diff === 0) {
			return a.title < b.title;
		}
		return fav_diff;
	});
	if (!getSortDirection()) {
		event_data.reverse();
	}
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
function makeDate(start, end, time_only) {
	var start_date = new Date(start);
	var end_date = new Date(end);
	
	var start_date_str = makeDayOfWeekString(start_date) + makeDayMonthYearString(start_date);
	if ((start_date.getDate() != end_date.getDate()) || 
	    (start_date.getMonth() != end_date.getMonth()))
		var end_date_str = makeDayOfWeekString(end_date) + makeDayMonthYearString(end_date);

	// Convert from military hours to a more readable format
	start_time = makeHourMinuteString(start_date);
	end_time = makeHourMinuteString(end_date);
	var start_suffix = getSuffix(start_date);
	var end_suffix = getSuffix(end_date);

	// create date string in correct format for different cases
	if (end_date_str) {
		var firstDay = start_date_str + " " + start_time + start_suffix;
		var secondDay = end_date_str + " " + end_time + end_suffix;
		return firstDay + "-" + secondDay;
	}
	
	// don't show start date if time_only option is true
	if (time_only === true) start_date_str = "";
	else start_date_str += " ";
	
	if ((start_time + start_suffix) === (end_time + end_suffix)) 
		return start_date_str + "@" + start_time + start_suffix;
	if (start_suffix === end_suffix)
		return start_date_str + start_time + "-" + end_time + end_suffix;
	
	return start_date_str + start_time + start_suffix + "-" + end_time + end_suffix;
}

// returns date in mm/dd or mm/dd/yyyy format
function makeDayMonthYearString(date, include_year) {
	var today = new Date();
	
	var date_str = (date.getMonth() + 1) + '/' + date.getDate();
	// don't show year unless year is different than current year
	if (include_year === false)
		return date_str;
	if (date.getFullYear() != today.getFullYear() || include_year)
		date_str += "/" + (date.getFullYear());
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

// make time string in hh:mm format
function makeHourMinuteString(date) {
	return getStandardHour(date) + ":" +
		("0" + date.getMinutes()).slice(-2);
}

// figure out if date is am or pm
function getSuffix(date) {
	var hour = date.getHours();
	var suffix = (hour >= 12) ? "pm" : "am";
	return suffix;
}

// figure out if date is am or pm
function getStandardHour(date) {
	var hour = date.getHours();
	if (hour > 12) return hour - 12;
	if (hour == 0) return 12;
	return hour;
}
