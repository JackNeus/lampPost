// Update the popularity of an event when the fire button is clicked
var handleFireBtnClick = function () {
	$(".fireBtn").click(function(e) {
		var eventNum;
		
		// check if this is the result fire button or the event view button
		if ($(this).hasClass("resultFireBtn")) 
			eventNum = getNum($(this).attr("id"), "resultFireBtn");
		else 
			eventNum = event_data.indexOf(selected_event) + 1;
		
		// update the database and the button display
		updateEventFavorite($(this), eventNum);
		
		// stop button click from selecting the whole search result
		e.stopPropagation();
	});
};

// Update the popularity of an event when the fire button is clicked
var updateEventFavorite = function (fireBtn, eventNum) {
		// make sure api request for favoriting goes through before making
		// another one
		if ($(fireBtn).hasClass("disabled")) return;
		$(fireBtn).addClass("disabled");
		
		// get event id and user id
		var eventId = event_data[eventNum-1]._id;
		var userId = $("#userData").data("uid");

		// update database after favoriting event
		var favoriteEvent = function() {
			var callback = function(data) {
				$(fireBtn).toggleClass("disabled");
				if (data["status"] === "Success") {
					updateFireButtons(eventNum, favoriting=true);
				}
			};
			$.ajax({
				url: base_url + '/api/user/fav/add/'+ userId + "/" + eventId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: callback
			});
		};

		// update database after unfavoriting event
		var unfavoriteEvent = function() {
			var callback = function(data) {
				$(fireBtn).toggleClass("disabled");
				if (data["status"] === "Success") {
					updateFireButtons(eventNum, favoriting=false);
				}
			};
			$.ajax({
				url: base_url + '/api/user/fav/remove/'+ userId + "/" + eventId,
				dataType: 'json',
				headers: {
					'Authorization': ('Token ' + $.cookie('api_token'))
				},
				success: callback
			});
		};
		
		// update database with new favorite
		if ($(fireBtn).hasClass("selected")) unfavoriteEvent();
		else favoriteEvent();
};

// Highlights and toggles the tooltip for the given fire button
var selectFireButton = function(fireBtn) {
	$(fireBtn).addClass("selected");
	var newTooltip = "Unfavorite";
	$(fireBtn).prop('title', newTooltip);
	$(fireBtn).attr("data-original-title", newTooltip).parent().find("tooltip-inner").html(newTooltip);
}

// Unhighlights and toggles the tooltip for the given fire button
var deselectFireButton = function(fireBtn) {
	$(fireBtn).removeClass("selected");
	var newTooltip = "Favorite";
	$(fireBtn).prop('title', newTooltip);
	$(fireBtn).attr("data-original-title", newTooltip).parent().find("tooltip-inner").html(newTooltip);
}

// Update the relevant fire buttons' statuses
var updateFireButtons = function(eventNum, favoriting) {
	/* Update search result fire button */
	if (favoriting) {
		var newFavCount = parseInt($("#resultFireNum" + eventNum).text()) + 1;
		$("#resultFireNum" + eventNum).text(newFavCount);
		selectFireButton($("#resultFireBtn" + eventNum));
	}
	else {
		var newFavCount = parseInt($("#resultFireNum" + eventNum).text()) - 1;
		$("#resultFireNum" + eventNum).text(newFavCount);
		deselectFireButton($("#resultFireBtn" + eventNum));
	}
	
	// Update event view fire button if it matches the favorited/unfavorited event
	if (selected_event === event_data[eventNum - 1]) {
		if (favoriting) 
			{
			var newFavCount = parseInt($("#eventFireNum").text()) + 1;
			$("#eventFireNum").text(newFavCount);
			selectFireButton($("#eventFireBtn"));
			}
		else {
			var newFavCount = parseInt($("#eventFireNum").text()) - 1;
			$("#eventFireNum").text(newFavCount);
			deselectFireButton($("#eventFireBtn"));
			}
	}
}

// Color in fire button in search results for events a user has favorited
var highlightUserFavorites = function () {
	for (var i = 0; i < event_data.length; i++) {
		// Event id
		var eventId = event_data[i]._id;

		// Color in fire button if user has favorited an event
		var fireBtn = $("#resultFireBtn" + (i + 1));
		if (eventIsUserFavorite(eventId)) selectFireButton(fireBtn);
	}
};

// Returns true if event is in list of user favorites, false otherwise
var eventIsUserFavorite = function(eventId) {
	for (var i = 0; i < user_fav_data.length; i++) {
		if (eventId == user_fav_data[i]._id) return true;
	}
	return false;
};
