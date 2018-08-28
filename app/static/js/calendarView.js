// return true if in calendar view
var inCalendarView = function() {
	return $("#calendarViewBtn").hasClass("calendarMode");
}

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
		$(this).tooltip('hide');
		// update that view mode has changed
		change_view_mode = true;
		toggleCalendarView();
	})
};

// toggle view for calendar and display the correct week calendar results
var toggleCalendarView = function() {
	// toggle column size proportions
	$("#browserView").toggleClass('calendar-view');
	$("#searchSort").toggle();
	$(".select-style").toggle();
	$(".sort-direction").toggle();
	$(".sort-box").toggle();
	$(".calendarBtns").toggle();
	$("#browserMsg").toggle();

	// make sure to update event view
	$("#event-view").hide();
	urlParamEventId = getUrlParameter('event');

	// toggle calendar/list view button
	if ($("#calendarViewBtn").hasClass("calendarMode")) {
		var calendarBtn = `<i class="fas fa-calendar"></i>`;
		$("#calendarViewBtn").html(calendarBtn);
		$("#calendarViewBtn").attr('data-original-title', 'Calendar View');
		$("#calendarViewBtn").prop('title', 'Calendar View');
		$('#weekTitle').text('');
	}
	else {
		var listBtn = `<i class="fas fa-list"></i>`;
		$("#calendarViewBtn").html(listBtn);
		$("#calendarViewBtn").attr('data-original-title', 'List View');
		$("#calendarViewBtn").prop('title', 'List View');
		calWeek = 0; // reset week to 0 (current week)
	}

	$("#searches").html("");
	$("#calendarViewBtn").toggleClass("calendarMode");
	trigger_search(force=false);	// get new search results
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
		calendarViewResizeDates();
	})
};

// handle clicks of previous week arrow
var handlePreviousWeekClick = function() {
	$(".previousWeekBtn").unbind("click");
	$(".previousWeekBtn").click(function() {
		calWeek--;
		showSearchResults();
		calendarViewResizeDates();
	})
};

function calendarViewResizeDates() {
	var maxWidth = 0.0
	var days = document.getElementsByClassName("dayName");
	// Find max
	for (var i = 0; i < 7; i++) {
		if (days[i].clientWidth > maxWidth) {
			maxWidth = days[i].clientWidth;
		}
	}
	// Set max
	for (var i = 0; i < 7; i++) {
		days[i].style.width = maxWidth + "px";
	}
	maxWidth = 0.0
	var dates = document.getElementsByClassName("date");
	// Find max
	for (var i = 0; i < 7; i++) {
		if (dates[i].clientWidth > maxWidth) {
			maxWidth = dates[i].clientWidth;
		}
	}
	// Set max
	for (var i = 0; i < 7; i++) {
		dates[i].style.width = maxWidth + "px";
	}
}
