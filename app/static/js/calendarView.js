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
	$(".calendarBtns").toggle();
		
	// toggle calendar/list view button
	if ($("#calendarViewBtn").hasClass("calendarMode")) {
		var listBtn = `<i class="fas fa-list"></i>`;
		$("#calendarViewBtn").html(listBtn);
		$("#calendarViewBtn").prop('title', 'List View');
		$(".calendarBtns").attr('id', 'calendarBtns0');
		addSearchFromDate();
	}
	else {
		var calendarBtn = `<i class="fas fa-calendar"></i>`;
		$("#calendarViewBtn").html(calendarBtn);
		$("#calendarViewBtn").prop('title', 'Calendar View');
		removeSearchFromDate();
	}
	
	$("#calendarViewBtn").toggleClass("calendarMode");
	
	// fetch data again since searching from an earlier date by default
	if ($("#search-box").val()) {
		if ($("#datepicker").val())
			var query = $("#search-box").val() + "/" + java2py_date($("#datepicker").val());
		else query = $("#search-box").val();
		$("#searches").html("");
		fetchData(query);
	}
	//showSearchResults();
	handleNextWeekClick();
	handlePreviousWeekClick();
};

// handle clicks of next week arrow
var handleNextWeekClick = function() {
	$(".nextWeekBtn").unbind("click");
	$(".nextWeekBtn").click(function() {
		var numWeek = getNum($(".calendarBtns").attr('id'), "calendarBtns");
		console.log(numWeek);
		$(".calendarBtns").attr('id', 'calendarBtns' + (parseInt(numWeek) + 1));
		showSearchResults();
	})
};

// handle clicks of previous week arrow
var handlePreviousWeekClick = function() {
	$(".previousWeekBtn").unbind("click");
	$(".previousWeekBtn").click(function() {
		var numWeek = getNum($(".calendarBtns").attr('id'), "calendarBtns");
		// don't show more than two weeks back (could be changed)
		if (parseInt(numWeek) >= -2) {
			$(".calendarBtns").attr('id', 'calendarBtns' + (parseInt(numWeek) - 1));
			showSearchResults();
		}
	})
};

// adds the date three weeks prior to today to the datepicker
var addSearchFromDate = function() {
	var today = new Date();
	var twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(today.getDate() - 3*7);
	var dateStr = makeDateStr(twoWeeksAgo, true);
	$("#datepicker").val(dateStr);
};

// removes the date from the datepicker
var removeSearchFromDate = function() {
	$("#datepicker").val("");
};

