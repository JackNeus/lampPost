// DEPENDENCIES: displaySearches.js, createEventHtml.js

var event_data = [];
var user_fav_data = [];
var currentRows = 0;

var base_url;
function setBaseUrl(url) {
	base_url = url;
}

$(document).ready(function(){
	setupUserFavorites();
	loadEvents();
});

// load user events
var loadEvents = function() {
	setupUserFavorites();
	var userId = $("#userData").data("uid");
	
	var callback = function(data) {
		if (data["status"] === "Success") 
			event_data = data["data"];
		else
			event_data = null;
		setupUserFavorites();
		console.log(user_fav_data);
		showMyEvents();
	}
	$.ajax({
		url: base_url + '/api/user/get_events/'+userId,
		dataType: 'json',
		headers: {
			'Authorization': ('Token ' + $.cookie('api_token'))
		},
		success: callback
	});
};


// Get list of events which user has favorited
var setupUserFavorites = function() {
	var userId = $("#userData").data("uid");
	var callback = function(data) {
		if (data["status"] === "Success") 
			user_fav_data = data["data"];
		else
			user_fav_data = null;
	};
	$.ajax({
			url: base_url + '/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
	});
};

/*
var base_url;
function setBaseUrl(url) {
	base_url = url;
}

var event_data = [];
var user_fav_data = [];

$(document).ready(function(){
	setupUserFavorites();
	loadEvents();
});

// load user events
var loadEvents = function() {
	console.log(user_fav_data);
	for (var i = 0; i < user_fav_data.length; i++) {
		eventId = user_fav_data[i];
		
		var callback = function(data) {
			if (data["status"] === "Success") 
				event_data[i] = data["data"];
			else
				event_data = null;
		}
		$.ajax({
			url: base_url + '/api/event/get' + eventId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
		});
	}
	setupUserFavorites();
	showMyEvents();
};

// Get list of events which user has favorited
var setupUserFavorites = function() {
	var userId = $("#userData").data("uid");
	
	var callback = function(data) {
		if (data["status"] === "Success") 
			user_fav_data = data["data"];
		else
			user_fav_data = null;
	};
	$.ajax({
			url: base_url + '/api/user/fav/get/'+ userId,
			dataType: 'json',
			headers: {
				'Authorization': ('Token ' + $.cookie('api_token'))
			},
			success: callback
	});
};
*/
