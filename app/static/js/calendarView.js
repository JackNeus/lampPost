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
		removeSearchFromDate();
		$("#searches").html("");
		fetchData($("#search-box").val());
	}
	else {
		var listBtn = `<i class="fas fa-list"></i>`;
		$("#calendarViewBtn").html(listBtn);
		$("#calendarViewBtn").prop('title', 'List View');
		calWeek = 0; // reset week to 0 (current week)
		addSearchFromDate();
		
		// fetch data again since searching from an earlier date by default
		if ($("#search-box").val())
			var query = $("#search-box").val() + "/" + java2py_date($("#datepicker").val());
		else
			var query = "*/" + java2py_date($("#datepicker").val());
		$("#searches").html("");
		fetchData(query);
	}
	
	$("#calendarViewBtn").toggleClass("calendarMode");
	
	handleNextWeekClick();
	handlePreviousWeekClick();
};

// handle clicks of next week arrow
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

// adds the date a year prior to today to the datepicker
var addSearchFromDate = function() {
	var today = new Date();
	var timeAgo = new Date();
	timeAgo.setDate(today.getDate() - 12*7);
	var dateStr = makeDateStr(timeAgo, true);
	$("#datepicker").val(dateStr);
};

// removes the date from the datepicker
var removeSearchFromDate = function() {
	$("#datepicker").val("");
};

