// create the html for the search results
var createSearchResults = function() {
	for (var i = 0; i < event_data.length; i++) {
		var searchResult = "";

		searchResult =
		`<div class="smallSearchResult" id="smallSearchResult">`
		+  `<div class="resultContents">`
		+	`<div class="d-flex flex-row align-items-start">`
		+	   `<div class="p-2 mr-auto">`
		+	      `<h2 class="resultTitle">` + event_data[i].title + `</h2>`
		+	      `<div id="eventInstances"></div>`
		+	   `</div>`
		+	   `<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+	      `<i class="fas fa-fire"></i>`
		+	   `</div>`
		+	   `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+	 `</div>`
		+   `</div>`
	  	+`</div>`;

	  	// add the created html to the "searches" element in browser.html if it is from searches
	  	// otherwise add it to the trending section
	  	$("#searches").append(searchResult);

	  	// number the given ids to match the event number so that the elements
	  	// can be differentiated
	  	numberIds(["smallSearchResult", "resultFireBtn", "resultFireNum",
	  			"eventInstances"], i);
	  	// add in all the event instances (dates and times) to the "eventInstances" div
	  	addEventInstances(i);
	}
};

// create the html for my events
var createMyEventResults = function() {
	// create html code for each search result
	for (var i = 0; i < event_data.length; i++) {
		var searchResult = "";

		searchResult =
		 `<div class="d-flex flex-row align-items-stretch">`
		+ `<div class="smallSearchResult" id="smallSearchResult">`
		+   `<div class="resultContents">`
		+	 `<div class="d-flex flex-row align-items-start">`
		+	    `<div class="p-2 mr-auto">`
		+	       `<h2 class="resultTitle">` + event_data[i].title + `</h2>`
		+		 `<div id="eventInstances"></div>`
		+	    `</div>`
		+		`<div class="d-flex flex-column align-items-start justify-content-start">`
		+			`<div class="d-flex flex-row ml-auto">`
		+	    	  `<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+		 	  `<i class="fas fa-fire"></i>`
		+	    	  `</div>`
		+			  `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+			`</div>`
		+    	  	`<div class="deleteBtn btn ml-auto" title="Delete Event" id="deleteBtn">`
		+  	  		  `<i class="fas fa-trash-alt"></i>`
		+   	 	`</div>`
		+    		`<div class="editBtn btn ml-auto" title="Edit Event" id="editBtn">`
		+       	  `<i class="fas fa-pencil-alt"></i>`
		+    		`</div>`
		+		`</div>`
		+	    `</div>`
		+       `</div>`
		+   `</div>`
		+ `<div class="d-flex flex-column">`
	  	+  `</div>`
	  	+ `</div>`;

	  	// add the created html to the "searches" element in myevent.html
	  	$("#searches").append(searchResult);
	  	// number the given ids to match the event number so that elements can
	  	// be differentiated
	  	numberIds(["smallSearchResult", "resultFireBtn", "resultFireNum",
	  			"eventInstances", "deleteBtn", "editBtn"], i);
	      // add in all the event instances (dates and times) to the "eventInstances" div
	  	addEventInstances(i);
	  }
};

// create the html for my events
var createCalenderViewResults = function() {
	// create html code for each search result
	var searchResult = "";
	searchResult += `<div class="calendar-view-row">`;
	
	var daysInWeek = 7;
	
	// figure out first date of calendar week view
	var today = new Date();
	var firstDay = new Date();
	firstDay.setDate(today.getDate() + (calWeek * 7));
	firstDay.setHours(0);
	firstDay.setMinutes(0);
	firstDay.setSeconds(0);
	firstDay.setMilliseconds(0);
	
	// day of week string of first day of calendar view
	var firstDayStr = firstDay.getDay();
	
	// stores number of search results
	count = 1;
	
	// create html for each day of week, starting from firstDay
	var currentDate = new Date(firstDay);
	for (var i = firstDayStr; i < daysInWeek; i++) {
		searchResult += createDayColumn(currentDate, i, count);
		currentDate.setDate(currentDate.getDate() + 1);
		count++;
	}
	for (var i = 0; i < firstDayStr; i++) {
		searchResult += createDayColumn(currentDate, i, count);
		currentDate.setDate(currentDate.getDate() + 1);
		count++;
	}
	searchResult += `</div>`;
	 
	// add html to "searches" div
  	$("#searches").append(searchResult);
  	
  	// create html code for each search result
	var count = 0;
	for (var i = 0; i < event_data.length; i++) {
		var instances = event_data[i].instances;
		for (var j = 0; j < instances.length; j++) { 
			var searchResult = "";

			searchResult =
			`<div class="smallSearchResult" id="smallSearchResult">`
			+  `<div class="resultContents">`
			+	   `<h2 class="resultTitle">` + event_data[i].title + `</h2>`
			+	   `<div id="eventInstances"></div>`
			+	   `<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
			+	      `<i class="fas fa-fire"></i>`
			+	   `</div>`
			+	   `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
			+   `</div>`
		  	+`</div>`;
		  	
		  	var startDate = new Date(instances[j].start_datetime);
			var endDate =  new Date(instances[j].end_datetime);

		  	// add the created html to the correct day of week element in myevent.html
		  	var seconds_in_week = 7*24*3600;
		  	var time_diff = Date.timeBetween(firstDay, startDate, 'seconds');
		  	if (time_diff >= 0 && time_diff < seconds_in_week) {
		  		$("#" + getDayOfWeek(startDate)).append(searchResult);
		  	}
		  	
		  	// number the given ids to match the event number so that elements can
		  	// be differentiated
		  	numberIds(["smallSearchResult", "resultFireNum", "resultFireBtn"], i);
		  	numberIds(["eventInstances"], count);
			
			// add in all the event instances (dates and times) to the "eventInstances" div
		  	var timeElement = getEventTimeElement(startDate, endDate);
		  	$("#eventInstances" + (count+1)).append(timeElement);
		  	count++;
	  	}
	  }
};

// create html for date column
var createDayColumn = function(currentDate, i, count) {
	var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday",
				"Thursday", "Friday", "Saturday"];
			
	var dateCol = "";	
	dateCol += 
	`<div class="flex-container-col dayCol">`
	+  `<div class="dayTitle" id="dayTitle` + count + `">` 
	+ 	`<div class="dayName">` + daysOfWeek[i].substring(0, 3) + `</div>`
	+ 	`<div class="date" id="date` + count + `">` + makeDayMonthYearString(currentDate) + `</div>`
	+   `</div>`
	+  `<div class="dayResults" id="` + daysOfWeek[i] + `"></div>`
	+ `</div>`;
	
	return dateCol;
};

// number the ids given in array elementNames using the event index
var numberIds = function(elementNames, i) {
	for (var j = 0; j < elementNames.length; j++) {
		$("#" + elementNames[j]).attr("id", elementNames[j] + (i+1));
	}
};

// append the event data/time to the appropriate my event result
var addEventInstances = function(i) {
	var instances = event_data[i].instances;

	for (var j = 0; j < instances.length; j++) {
		var time = $('<p />').attr({
				class: "resultTime"
			}).append(makeDate(instances[j].start_datetime,
					       instances[j].end_datetime));
		$("#eventInstances" + (i+1)).append(time);
	}
};

// return a time element for a given instance
var getEventTimeElement = function(startDate, endDate) {
	var timeStr = makeDate(startDate, endDate);
	var timeElement = $('<p />').attr({
			class: "resultTime"
		}).append(timeStr);
	return timeElement;
	
};

// return the day of the week of the a given instance
var getDayOfWeek = function(startDate) {
	var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday",
				"Thursday", "Friday", "Saturday"];
	
	var dayIndex = startDate.getDay();
	return daysOfWeek[dayIndex];
};
