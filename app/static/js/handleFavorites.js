// Color in fire button for events a user has favorited
var highlightUserFavorites = function () {
	for (var i = 0; i < event_data.length; i++) {
		// Event id
		var eventId = event_data[i]._id;

		// Color in fire button if user has favorited an event
		var fireBtnElement = document.getElementById("resultFireBtn" + (i + 1));
		if (eventIsFav(eventId)) {
			fireBtnElement.classList.toggle("selected");
			fireBtnElement.title = "Unfavorite";
		}
	}
};

// Update the popularity of an event when the fire button is clicked
var updateFireBtn = function (fireBtn, eventNum) {
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
					if ($(fireBtn).hasClass('resultFireBtn'))
						updateSearchResultFireView(fireBtn, eventNum, 1);
					else if($(fireBtn).hasClass('eventFireBtn'))
						updateEventFireView(fireBtn, eventNum, 1);
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
					if ($(fireBtn).hasClass('resultFireBtn'))
						updateSearchResultFireView(fireBtn, eventNum, -1);
					else if($(fireBtn).hasClass('eventFireBtn'))
						updateEventFireView(fireBtn, eventNum, -1);
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

// handle updating fire button on small search result
var updateSearchResultFireView = function(fireBtn, eventNum, change) {
	updateFireNum($("#resultFireNum" + eventNum), eventNum, change);
	toggleFireBtnHighlight(fireBtn, change);
	checkUpdateEventViewFire(eventNum, change);
	checkReloadFavoritePage(eventNum); 
};

// handle updating fire button on event view
var updateEventFireView = function(fireBtn, eventNum, change) {
	updateFireNum($("#eventFireNum"), eventNum, change);
	updateFireNum($("#resultFireNum" + eventNum), eventNum, change);
	toggleFireBtnHighlight(fireBtn, change);
	toggleFireBtnHighlight($("#resultFireBtn" + eventNum), change);
	checkReloadFavoritePage(eventNum);
};

// update favorite number information
var updateFireNum = function(fireNum, eventNum, change) {
	var getFireNum = $(fireNum).text();
	var newFireNum = parseInt(getFireNum) + change;
	$(fireNum).text(newFireNum);
}

// toggle highlighting and title of fire buttons
var toggleFireBtnHighlight = function(fireBtn, change) {
	$(fireBtn).toggleClass('selected');
	 if (change == 1) $(fireBtn).prop('title', 'Unfavorite');
	 else 		$(fireBtn).prop('title', 'Favorite');
};

// if on favorite page, remove an event that has been unfavorited
var checkReloadFavoritePage = function(eventNum) {
	if (window.location.href.indexOf('myfavorites') != -1) {
		$("#smallSearchResult" + eventNum).hide();
		var eventId = event_data[eventNum - 1]._id;
		if (selected_event !== null && selected_event._id == eventId)
			$(".event-view").hide();
	}
};

// update favorite button on event-view if the current event-view is the same as
// the search that's been favorited
var checkUpdateEventViewFire = function(eventNum, change) {
	var eventId = event_data[eventNum - 1]._id;
	if (selected_event !== null && selected_event._id == eventId) {
		toggleFireBtnHighlight($("#eventFireBtn"), change);
		updateFireNum($("#eventFireNum"), eventNum, change);
	}
};

