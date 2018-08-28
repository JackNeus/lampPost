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
		var eventNum = getEventNumberFromID($(this).attr("id"), "smallSearchResult");
		selected_event = event_data[eventNum - 1]; // store currently selected event
		var eventId = selected_event._id;
		
		// Update display if changing from edit event view to normal event view
		if (eventViewIsEditEvent()) {
			deselectIcons();			// deselect all icons (edit and delete)
			selectSearchResult($(this));	// highlight search result
			updateEventView(eventNum);	// populate and display event view
		}
		// Update display if clicking on new search result or if in calendar view
		else if (!($(this).hasClass("selected")) || inCalendarView()) {
			selectSearchResult($(this));	// highlight search result
			updateEventView(eventNum); 	// populate and display event view
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
				{
				selectIcon($("#editBtn" + eventNum))
				updateEventViewEditForm(eventNum);
				}
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


/*-------------------------------- SORTING -----------------------------------*/

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

// Return True if descending, False if ascending.
function getSortDirection() {
	if ($("#sort-direction-btn-down").is(":visible")) {
		return true;
	} 
	else {
		return false;
	}
}
