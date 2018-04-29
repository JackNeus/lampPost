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

	  	// add the created html to the "searches" element in browser.html
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
		+	       `<p class="resultTitle">` + event_data[i].title + `</p>`
		+		 `<div id="eventInstances"></div>`
		+	    `</div>`
		+	    `<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+		 `<i class="fas fa-fire"></i>`
		+	    `</div>`
		+		 `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+	    `</div>`
		+       `</div>`
		+   `</div>`
		+ `<div class="d-flex flex-column">`
		+    `<div class="deleteBtn btn ml-auto" title="Delete Event" id="deleteBtn">`
		+  	  `<i class="fas fa-trash-alt"></i>`
		+    `</div>`
		+    `<div class="editBtn btn ml-auto" title="Edit Event" id="editBtn">`
		+       `<i class="fas fa-pencil-alt"></i>`
		+    `</div>`
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
		
		var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", 
					"Thursday", "Friday", "Saturday"];
		
		for (var i = 0; i < daysOfWeek.length; i++) {
			searchResult += 
			  `<div class="flex-container-col dayCol">`
			+  `<div class="dayTitle">` + daysOfWeek[i].substring(0, 3) + `</div>`
			+  `<div class="dayResults" id="` + daysOfWeek[i] + `"></div>`
			+ `</div>`;
		}
		searchResult += `</div>`;
		 
	  	$("#searches").append(searchResult);
	  	
	  	// create html code for each search result
	for (var i = 0; i < event_data.length; i++) {
		var searchResult = "";

		searchResult =
		`<div class="smallSearchResult" id="smallSearchResult">`
		+  `<div class="resultContents">`
		+	   `<h2 class="resultTitle">` + event_data[i].title + `</h2>`
		+	   `<div id="eventInstances"></div>`
		+   `</div>`
	  	+`</div>`;

	  	// add the created html to the "searches" element in myevent.html
	  	$("#Sunday").append(searchResult);
	  	// number the given ids to match the event number so that elements can
	  	// be differentiated
	  	numberIds(["smallSearchResult", "eventInstances"], i);
	      // add in all the event instances (dates and times) to the "eventInstances" div
	  	addEventsByDay(i);
	  }
};

// number the ids given in array elementNames using the event index
var numberIds = function(elementNames, i) {
	for (var j = 0; j < elementNames.length; j++) {
		$("#" + elementNames[j]).attr("id", elementNames[j] + (i+1));
	}
}

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
}

var addEventsByDay = function(i) {
	var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday",
				"Thursday", "Friday", "Saturday"];
	var instances = event_data[i].instances;

	for (var j = 0; j < instances.length; j++) {
		var startDate = new Date(instances[0].start_datetime);
		var endDate =  new Date(instances[0].end_datetime);
		var timeStr = makeTimeStr(startDate, endDate);
		var time = $('<p />').attr({
				class: "resultTime"
			}).append(timeStr);
		$("#eventInstances" + (i+1)).append(time);
	}
	
};
