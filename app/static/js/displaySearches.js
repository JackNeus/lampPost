// DEPENDENCIES: displayEvent.js

// Populate search result panel with event_data sorted by date.
var showSearchResults = function() {
	// clear previous search results
	var currentSearches = document.getElementById("searches");
	currentSearches.innerHTML = "";
	
	// sort events by either date or popularity
	sortResults();
	
	// create html code for each search result
	for (var i = 0; i < event_data.length; i++) {
		// Title of event
		var title = $('<p />').attr({
			class: "resultTitle"
		}).append(event_data[i].title);
		
		// Fire icon
		var fireIcon = $('<i />').attr({
			class: "fas fa-fire",
		});
		
		// Clickable fire button that displays "Favorite" when hovered over
		var fireBtn = $('<div />').attr({
			class: "resultFireBtn btn",
			title: "Favorite",
			id: "resultFireBtn" + (i + 1)
		}).append(fireIcon);
		
		// TODO: get 'getFav' from backend
		// var getFav = event_data[i].favorites;
		// Number of favorites an event has
		var getFire = Math.floor(Math.random() * 100);
		var fireNum = $('<p />').attr({
			class: "resultFireNum",
			id: "resultFireNum" + (i + 1)
		}).append(getFav);
		
		// All dates/times of an event
		var instances = event_data[i].instances;
		var allTimes = $('<div />');
		for (var j = 0; j < instances.length; j++) {
			var time = $('<p />').attr({
				class: "resultTime"
			}).append(makeDate(instances[j].start_datetime, 
					       instances[j].end_datetime));
			allTimes.append(time);
		}
		
		// Title/dates are left aligned
		var leftColumn = $('<div />').attr({
			class: "p-2 mr-auto"
		}).append(title).append(allTimes);
		
		// Fire button and number of favorites are inlined with event title
		var firstRow = $('<div />').attr({
			class: "d-flex flex-row align-items-start"
		}).append(leftColumn).append(fireBtn).append(favNum);
		
		// Container holding the result contents
		var smallDiv = $('<div >').attr({
			class: "resultContents"
		}).append(firstRow);
		
		// Container holding all event infor and the id of the event
		var largeDiv = $('<div />').attr({
			class: "smallSearchResult", id: "smallSearchResult" + (i + 1), 
		}).append(smallDiv);
		
		// Add the list of search results
		$("#searches").append(largeDiv);
	}
	
	// handle clicks of fire button
	updateFireBtn();
	// handle click of event
	updateEventView();
}

// Update the popularity of an event when the fire button is clicked
var updateFireBtn = function () {
	$(".resultFireBtn").click( function(e) {
		var eventNum = getNum($(this).attr("id"), "resultFireBtn");
		var fireBtn = document.getElementById($(this).attr("id"));
		
		// toggle color/title
		fireBtn.classList.toggle("selected");
		if (fireBtn.classList.contains("selected")) {
			fireBtn.title = "Unfavorite";
			var change = 1;
		}
		else {
			fireBtn.title = "Favorite";
			var change = -1;
		}
		
		// update favorite information
		var getFireNum = document.getElementById("resultFireNum" + eventNum).innerText;
		var newFireNum = parseInt(getFireNum) + change;
		document.getElementById("resultFireNum" + eventNum).innerText = newFireNum;
		
		//TODO: send newFavs to backend
		
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
	
	if (sortByDate) {
		// sort the events by date (using the first instance of the event)
		event_data.sort(function (a, b) {
			return Date.timeBetween(new Date(b.instances[0].start_datetime), 
							new Date(a.instances[0].start_datetime), 
							'seconds');
		});
	}
	else {
		// TODO: Make sure this works with backend
		// sort the events by popularity
		event_data.sort(function (a, b) {
			return a.favorites - b.favorites;
		});
	}
}

/*----------------------------- UTILITY FUNCTIONS ----------------------------*/

// Given an id of the form 'smallSearchResultX', return X.
function getNum(searchId, titleSplit) {
	return searchId.split(titleSplit).pop();
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
	var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", 
			    "Thursday", "Friday", "Saturday"];
	var time_diff = Date.timeBetween(today, start_date, 'days');
	
	if (time_diff == -1)
		var date_str = "Yesterday";
	else if (time_diff == 0)
		var date_str = "Today";
	else if (time_diff == 1)
		var date_str = "Tomorrow";
	else if (1 < time_diff && time_diff < 7) 
		var date_str = weekdays[start_date.getDay()];
	else
		var date_str = (start_date.getMonth() + 1) + '/' + start_date.getDate();
		
	// don't show year unless year is different than current year
	if (start_date.getFullYear() != today.getFullYear()) 
		date_str += "/" + (start_date.getFullYear());
		
	// create time strings in hh:mm format
	start_time = start_date.getHours() + ":" + 
			("0" + start_date.getMinutes()).slice(-2);
	end_time = end_date.getHours() + ":" + 
			("0" + end_date.getMinutes()).slice(-2);
	
	return date_str + " " + start_time + "-" + end_time;
}
