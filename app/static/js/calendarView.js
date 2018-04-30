// handle clicks of calendar view/list view button
var handleCalendarView = function() {
	$("#calendarViewBtn").click(function() {
		// Add calendar parameter to URL.
		if (getUrlParameter('calendar') === undefined) {
			updateUrl(addUrlParameter(document.location.search, 'calendar'));
		}
		else {
			updateUrl(removeUrlParameter(document.location.search, 'calendar'));
		}
		
		toggleCalendarView();
	})
};

// toggle view for calendar and display the correct week calendar results
var toggleCalendarView = function() {
	// toggle column size proportions
	$("#bigRow").toggleClass('calendar-view');
		
	// toggle calendar/list view button
	if ($("#calendarViewBtn").hasClass("calendarMode")) {
		var listBtn = `<i class="fas fa-list"></i>`;
		$("#calendarViewBtn").html(listBtn);
		$("#calendarViewBtn").prop('title', 'List View');
	}
	else {
		var calendarBtn = `<i class="fas fa-calendar"></i>`;
		$("#calendarViewBtn").html(calendarBtn);
		$("#calendarViewBtn").prop('title', 'Calendar View');
	}
	
	$("#calendarViewBtn").toggleClass("calendarMode");
	showSearchResults();
	handleNextWeekClick();
	handlePreviousWeekClick();
};

// handle clicks of next week arrow
var handleNextWeekClick = function() {
	$(".nextWeekBtn").click(function() {
		var numWeek = getNum($(".calendarBtns").attr('id'), "calendarBtns");
		$(".calendarBtns").attr('id', 'calendarBtns' + (parseInt(numWeek) + 1));
		showSearchResults();
	})
};

// handle clicks of previous week arrow
var handlePreviousWeekClick = function() {
	$(".previousWeekBtn").click(function() {
		var numWeek = getNum($(".calendarBtns").attr('id'), "calendarBtns");
		// don't show more than two weeks back (could be changed)
		if (parseInt(numWeek) >= -2) {
			$(".calendarBtns").attr('id', 'calendarBtns' + (parseInt(numWeek) - 1));
			showSearchResults();
		}
	})
};

