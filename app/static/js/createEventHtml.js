// create the html for the search results
var createSearchResults = function() {
	for (var i = 0; i < event_data.length; i++) {
		var searchResult = "";
		
		searchResult = 
		`<div class="smallSearchResult" id="smallSearchResult">`
		+  `<div class="resultContents">`
		+	`<div class="d-flex flex-row align-items-start">`
		+	   `<div class="p-2 mr-auto">`
		+	      `<p class="resultTitle">` + event_data[i].title + `</p>`
		+	      `<div id="allTimes"></div>`
		+	   `</div>`
		+	   `<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+	      `<i class="fas fa-fire"></i>`
		+	   `</div>`
		+	   `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+	 `</div>`
		+   `</div>`
	  	+`</div>`;
	  	
	  	$("#searches").append(searchResult);
	  	numberIds(["smallSearchResult", "resultFireBtn", "resultFireNum", 
	  			"allTimes"], i); 	// number the important ids
	  	addInstances(i);			// add in all the event instances
	
	}
};

// create the html for my events
var createMyEventResults = function() {
	// create html code for each search result
	for (var i = 0; i < event_data.length; i++) {
		var searchResult = "";
		
		searchResult = 
		 `<div class="d-flex flex-row align-items-stretch" style="flex-grow:1000; flex-shrink:0;">`
		+ `<div class="smallSearchResult" id="smallSearchResult" style="flex-grow:1000; margin-right: 0;">`
		+   `<div class="resultContents">`
		+	 `<div class="d-flex flex-row align-items-start">`
		+	    `<div class="p-2 mr-auto">`
		+	       `<p class="resultTitle">` + event_data[i].title + `</p>`
		+		 `<div id="allTimes"></div>`
		+	    `</div>`
		+	    `<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+		 `<i class="fas fa-fire"></i>`
		+	    `</div>`
		+		 `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+	    `</div>`
		+       `</div>`
		+   `</div>`
		+ `<div class="d-flex flex-column">`
		+    `<div class="deleteBtn btn ml-auto" title="Delete Event" id="deleteBtn" style="padding-top: 0; padding-bottom: 0;">`
		+  	  `<i class="fas fa-trash-alt"></i>`
		+    `</div>`
		+    `<div class="editBtn btn ml-auto" title="Edit Event" id="editBtn" style="padding-top: 0; padding-bottom: 0;">`
		+       `<i class="fas fa-pencil-alt"></i>`
		+    `</div>`
	  	+  `</div>`
	  	+ `</div>`;
	  	
	  	$("#searches").append(searchResult);
	  	numberIds(["smallSearchResult", "resultFireBtn", "resultFireNum", 
	  			"allTimes", "deleteBtn", "editBtn"], i); 	// number the important ids
	  	addInstances(i);	    						// add in all the event instances
	  }
};

// number the ids given in array elementNames using the event index
var numberIds = function(elementNames, i) {
	for (var j = 0; j < elementNames.length; j++) {
		$("#" + elementNames[j]).attr("id", elementNames[j] + (i+1));
	}
}

// append the event data/time to the appropriate my event result
var addInstances = function(i) {
	var instances = event_data[i].instances;
	
	for (var j = 0; j < instances.length; j++) {
		var time = $('<p />').attr({
				class: "resultTime"
			}).append(makeDate(instances[j].start_datetime, 
					       instances[j].end_datetime));
		$("#allTimes" + (i+1)).append(time);
	}
}
