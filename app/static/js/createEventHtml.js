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
	  	+ `</div>`;

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
		+	       `<h2 class="resultTitle">` + event_data[i].title + `</h2>`
		+		 `<div id="eventInstances"></div>`
		+	    `</div>`
		+ 		`<div class="d-flex flex-column">`
		+			`<div class="d-flex flex-row">`
		+	    		`<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+		 			`<i class="fas fa-fire"></i>`
		+	    		`</div>`
		+			 	`<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+	    	`</div>`
		+    		`<div class="deleteBtn btn ml-auto" title="Delete Event" id="deleteBtn">`
		+  	  			`<i class="fas fa-trash-alt"></i>`
		+    		`</div>`
		+    		`<div class="editBtn btn ml-auto" title="Edit Event" id="editBtn">`
		+       		`<i class="fas fa-pencil-alt"></i>`
		+    		`</div>`
		+       `</div>`
		+ 	  `</div>`
	  	+  	`</div>`
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
