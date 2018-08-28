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
  
	highlightUserFavorites(); 	// highlight user favorites on load
	checkHighlightEventInUrl();	// highlight the event in url if exists
	handleFireBtnClick(); 		// handle clicks of fire button
	handleSearchResultClick(); 	// handle click of event
};

// Populate search result panel with event_data sorted by date.
var showMyEvents = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";

	sortResults(); 			// sort events by date
	createMyEventResults(); 	// create html code for each created event and display them
	highlightUserFavorites(); 	// highlight user favorites on load
	checkHighlightEventInUrl();	// highlight the event in url if exists
	handleFireBtnClick(); 		// handle clicks of fire button
	handleSearchResultClick(); 	// handle click of event
};

// Handle clicks of a search result
var handleSearchResultClick = function() {
	$(".smallSearchResult").click(function() {
		// Get event info
		var eventNum = getNum($(this).attr("id"), "smallSearchResult");
		selected_event = event_data[eventNum - 1]; // store currently selected event
		var eventId = selected_event._id;
	
		// Update display if clicking on new search result or if in calendar view
		if (!($(this).hasClass("selected")) || inCalendarView()) {
			selectSearchResult($(this));		// highlight search result
			updateEventView(eventNum); 		// populate and display event view
		}
		
		// Update display if changing from edit event view to normal event view
		if (eventViewIsEditEvent()) {
			// deselect all icons
			$(".editBtn").removeClass("selectedIcon");
			$(".fa-pencil-alt").removeClass("fa-inverse");
			$(".deleteBtn").removeClass("selectedIcon");
			$(".fa-trash-alt").removeClass("fa-inverse");
		
			updateEventView(eventNum);	// populate and display event view
		}
		
		// Get rid of the edit parameter, if it exists.
		updateUrl(removeUrlParameter(document.location.search, 'edit'));
		// Update event url parameter
		updateUrl(addUrlParameter(document.location.search, 'event', eventId));
		
		// Trigger slick action if mobile
		if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickNext");
	});
};

// Highlight the event in the url
var checkHighlightEventInUrl = function() {
	var eventId = getUrlParameter('event');
	if (eventId) {
		var event = $.grep(event_data, function(event){return event._id === eventId;})[0];
		if (event != undefined) {
			// select the search result
			eventNum = event_data.indexOf(event) + 1;
			selected_event = event;
			selectSearchResult($("#smallSearchResult" + eventNum));
			
			// display the event view or edit event form if appropriate
			if (getUrlParameter('edit')) 
				renderEditForm(eventNum);
			else
				updateEventView(eventNum);
		}
	}
};

// Highlight/animate selection of a search result
function selectSearchResult(elt_to_select) {
	// Previously selected event
	var selected_event = $(".smallSearchResult.selected");
	
	// Highlight selected event
	$(".smallSearchResult").removeClass("selected");
	elt_to_select.addClass("selected");
	
	// Animate selection if not in calendar view
	if (!inCalendarView()) {
		// Close previously selected event, if it's not the one we want to open.
		if (selected_event.length > 0 && selected_event[0] !== elt_to_select[0]) {
			selected_event.animate({"margin-right": '12px'});
		}
		elt_to_select.animate({"margin-right": '0vw'});
	}
}

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

/*----------------------------- UTILITY FUNCTIONS ----------------------------*/

function getEventNum(event_data, id) {
	for (var i = 0; i < event_data.length; i++) {
		if (event_data[i]._id === id) {
			return (i + 1);
		}
	}
	return -1;
}

// Given an id of the form 'smallSearchResultX', return X.
function getNum(searchId, titleSplit) {
	return searchId.split(titleSplit).pop();
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
