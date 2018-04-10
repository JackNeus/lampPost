// create the html for the search results
var createSearchResults = function() {
	// create html code for each search result
	for (var i = 0; i < event_data.length; i++) {
		// Title of event
		var title = $('<p />').attr({
			class: "resultTitle"
		}).append(event_data[i].title);
		
		// Fire icon
		var fireIcon = $('<i />').attr({
			class: "fas fa-fire",
		});
		
		// Clickable fire button that displays "Favorite" when hovered over
		var fireBtn = $('<div />').attr({
			class: "resultFireBtn btn",
			title: "Favorite",
			id: "resultFireBtn" + (i + 1)
		}).append(fireIcon);
		
		// number of favorites
		var getFire = event_data[i].favorites;
		var fireNum = $('<p />').attr({
			class: "resultFireNum",
			id: "resultFireNum" + (i + 1)
		}).append(getFire);

		// All dates/times of an event
		var instances = event_data[i].instances;
		var allTimes = $('<div />');
		for (var j = 0; j < instances.length; j++) {
			var time = $('<p />').attr({
				class: "resultTime"
			}).append(makeDate(instances[j].start_datetime, 
					       instances[j].end_datetime));
			allTimes.append(time);
		}
		
		// Title/dates are left aligned
		var leftColumn = $('<div />').attr({
			class: "p-2 mr-auto"
		}).append(title).append(allTimes);
		
		// Fire button and number of favorites are inlined with event title
		var firstRow = $('<div />').attr({
			class: "d-flex flex-row align-items-start"
		}).append(leftColumn).append(fireBtn).append(fireNum);
		
		// Container holding the result contents
		var smallDiv = $('<div >').attr({
			class: "resultContents"
		}).append(firstRow);
		
		// Container holding all event infor and the id of the event
		var largeDiv = $('<div />').attr({
			class: "smallSearchResult", id: "smallSearchResult" + (i + 1), 
		}).append(smallDiv);
		
		// Add the list of search results
		$("#searches").append(largeDiv);
	}
};

// create the html for my events
// I know this is in a different style than the previous function, but I think this may be easier
// to read and change. I might update the above function later to follow the same format
var createMyEventResults = function() {
	// create html code for each search result
	for (var i = 0; i < event_data.length; i++) {
		var searchResult = "";
		
		searchResult = 
		`<div class="d-flex flex-row align-items-stretch">`
		+ `<div class="smallSearchResult" id="smallSearchResult" style="flex-grow:1000; margin-right: 0;">`
		+	`<div class="resultContents">`
		+		`<div class="d-flex flex-row align-items-start">`
		+			`<div class="mr-auto">`
		+				`<p class="resultTitle">` + event_data[i].title + `</p>`
		+				`<div id="allTimes"></div>`
		+			`</div>`
		+			`<div class="resultFireBtn btn" title="Favorite" id="resultFireBtn">`
		+				`<i class="fas fa-fire"></i>`
		+			`</div>`
		+		     `<p class="resultFireNum" id="resultFireNum">` + event_data[i].favorites + `</p>`
		+	     `</div>`
		+      `</div>`
		+ `</div>`
		+ `<div class="d-flex flex-column">`
		+  	`<div class="deleteBtn btn ml-auto" title="Delete Event" id="deleteBtn" >`
		+  		`<i class="fas fa-trash-alt"></i>`
		+  	`</div>`
		+  	`<div class="editBtn btn ml-auto" title="Edit Event" id="editBtn" >`
		+  		`<i class="fas fa-pencil-alt"></i>`
		+  	`</div>`
	  	+ `</div>`
	  	+ `</div>`;
	  	
	  	$("#searches").append(searchResult);
	  	numberIds(i); 	// number the important ids
	  	addInstances(i);	// add in all the event instances
	  }
};

// number the ids using the event index
var numberIds = function(i) {
	$("#smallSearchResult").attr("id", "smallSearchResult" + (i+1));
	$("#resultFireBtn").attr("id", "resultFireBtn" + (i+1));
	$("#allTimes").attr("id", "allTimes" + (i+1));
	$("#resultFireNum").attr("id", "resultFireNum" + (i+1));
	$("#deleteBtn").attr("id", "deleteBtn" + (i+1));
	$("#editBtn").attr("id", "editBtn" + (i+1));
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
