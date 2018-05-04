// handle clicks of calendar view/list view button
var handleCalendarView = function() {
	$("#calendarViewBtn").click(function() {
		// Add calendar parameter to URL.
		if (getUrlParameter('cal') === undefined) {
			updateUrl(addUrlParameter(document.location.search, 'cal'));
		}
		else {
			updateUrl(removeUrlParameter(document.location.search, 'cal'));
		}
		
		// update that view mode has changed
		change_view_mode = true;
		toggleCalendarView();
	})
};

// toggle view for calendar and display the correct week calendar results
var toggleCalendarView = function() {
	// toggle column size proportions
	$("#bigRow").toggleClass('calendar-view');
	$("#searchSort").toggle();
	$(".select-style").toggle();
	$(".sort-direction").toggle();
	$(".sort-box").toggle();
	$(".calendarBtns").toggle();
	
	// make sure to update event view and recheck event url paramater
	$("#event-view").hide();
	urlParamEventId = checkEventUrlParameter();
		
	// toggle calendar/list view button
	if ($("#calendarViewBtn").hasClass("calendarMode")) {
		var calendarBtn = `<i class="fas fa-calendar"></i>`;
		$("#calendarViewBtn").html(calendarBtn);
		$("#calendarViewBtn").prop('title', 'Calendar View');
		
	}
	else {
		var listBtn = `<i class="fas fa-list"></i>`;
		$("#calendarViewBtn").html(listBtn);
		$("#calendarViewBtn").prop('title', 'List View');
		calWeek = 0; // reset week to 0 (current week)
	}
	
	$("#searches").html("");
	trigger_search();	// get new search results
	
	$("#calendarViewBtn").toggleClass("calendarMode");
	handleNextWeekClick();
	handlePreviousWeekClick();
};

// handle clicks of next week arrow
// TODO: make date update in datepicker
var handleNextWeekClick = function() {
	$(".nextWeekBtn").unbind("click");
	$(".nextWeekBtn").click(function() {
		calWeek++;
		showSearchResults();
	})
};

// handle clicks of previous week arrow
var handlePreviousWeekClick = function() {
	$(".previousWeekBtn").unbind("click");
	$(".previousWeekBtn").click(function() {
		calWeek--;
		showSearchResults();
	})
};
