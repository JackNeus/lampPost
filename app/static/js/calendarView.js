var handleCalendarView = function() {
	$("#calendarViewBtn").click(function() {
		$("#bigRow").toggleClass('calendar-view');
		
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
	})
};

