// code from Stack Overflow
// https://stackoverflow.com/questions/5796718/html-entity-decode
var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();

/* ------------------------- URL UTILITIES -----------------------------------*/

// puts urls in text with hrefs so they are hyperlinked
// function layout from https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
// regex from https://www.regextester.com/94502
function urlify(text) {
    var urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    })
}

// Function found online in stack overflow
// given a url parameter, return the value of that parameter
// return undefined if parameter doesn't exist
var getUrlParameter = function(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

// Function found online in stack overflow
/*
* Add a URL parameter (or changing it if it already exists)
* @param {search} string  this is typically document.location.search
* @param {key}    string  the key to set
* @param {val}    string  value 
*/
var addUrlParameter = function(search, key, val){
	key = encodeURIComponent(key); 
	if (val === undefined || val === null) {
		var newParam = key;
	}
	else {
		val = encodeURIComponent(val);
		var newParam = key + '=' + val;
	}
	var params = '?' + newParam;

	// If the "search" string exists, then build params from it
	if (search) {
		// Try to replace an existance instance
		params = search.replace(new RegExp('([\?&])' + key + '[^&]*'), '$1' + newParam);

		// If nothing was replaced, then add the new param to the end
		if (search.indexOf(key) == -1) {
			params += '&' + newParam;
		}
	}

	return params;
};

// Remove the edit parameter from search. 
// This should probably be made more generic in the future.
// TODO: allow removal of parameters with values
// TODO: fix a bug where if the parameter exists anywhere in the url (e.g. as search string), it gets removed
var removeUrlParameter = function(search, parameter) {
	params = search.replace(new RegExp('&?' + parameter + '(=[^&]*)?&?'), '');
	return params;
}

// Update url with given parameters.
var updateUrl = function(params) {
	var newurl = window.location.protocol + "//" + 
			 window.location.host + 
			 window.location.pathname + 
			 params;
	window.history.pushState({ path: newurl }, '', newurl);
}

/* ------------------------ EVENT INDEXING -----------------------------------*/

// Given an id of the form 'smallSearchResultX', return X.
function getEventNumberFromID(searchId, titleSplit) {
	return searchId.split(titleSplit).pop();
}

// return the event in data which matches the given id
function getEventInDataById(data, id) {
	var event = $.grep(data, function(event){return event._id === id;})[0];
	return event;
}

/* ------------------- DATE CONVERSION (Javascript/Python) -------------------*/

// convert all dates in data (array of events) to javascript format
var toJavaEventData = function(data) {
	for (var i = 0; i < data.length; i++) {
		var instances = data[i].instances;
		for (var j = 0; j < instances.length; j++) {
			var javaStartDate = py2java_date(instances[j].start_datetime);
			var javaEndDate = py2java_date(instances[j].end_datetime);
			instances[j].start_datetime = javaStartDate;
			instances[j].end_datetime = javaEndDate;
		}
	}
	data.instances = instances;
	return data;
};

// converts python date string into java date string (yyyy-mm-dd to yyyy/mm/dd)
function py2java_date( date_py ) {
	var date_java = date_py.replace(/-/g, '/');
	return date_java;
}

// converts java date string into python date string (mm/dd/yy to yy-mm-dd)
function java2py_date( date_java ){
	var today = new Date();
	var date_split = date_java.split('/');

	var date_py = "";
	if (date_split.length == 3)
		date_py = date_split[2] + "-" + date_split[0] + "-" + date_split[1];
	else return;

	return date_py;
}

/* --------------------------- DATE UTILITIES --------------------------------*/

// calculates the difference between date1 and date2 in ms, with an
// option to return the difference in a unit of days
Date.timeBetween = function( date1, date2, units ) {
	// Get 1 day in milliseconds
	var one_day = 1000*60*60*24;

	// Convert both dates to milliseconds
	var date1_ms = date1.getTime();
	var date2_ms = date2.getTime();
	var difference_ms = date2_ms - date1_ms;

	// Return difference in days or seconds
	if (units == 'days') {
		// make sure to round down correctly
		return Math.floor(difference_ms/one_day);
	}
	else return (difference_ms/1000);
}

// makes desired date string to be used in the search results
function makeDate(start, end, time_only) {
	var start_date = new Date(start);
	var end_date = new Date(end);
	
	var start_date_str = makeDayOfWeekString(start_date) + makeDayMonthYearString(start_date);
	if ((start_date.getDate() != end_date.getDate()) || 
	    (start_date.getMonth() != end_date.getMonth()))
		var end_date_str = makeDayOfWeekString(end_date) + makeDayMonthYearString(end_date);

	// Convert from military hours to a more readable format
	var start_time = militaryTimeToStr(start_date);
	var end_time = militaryTimeToStr(end_date);
	
	// create date string in correct format for different cases
	if (end_date_str) {
		var firstDay = start_date_str + " " + start_time;
		var secondDay = end_date_str + " " + end_time;
		return firstDay + "-" + secondDay;
	}
	
	// don't show start date if time_only option is true
	if (time_only === true) start_date_str = "";
	else start_date_str += " ";
	
	if (start_time === end_time) 
		return start_date_str + "@" + start_time;
	if (start_time.slice(-2) === end_time.slice(-2))
		return start_date_str + start_time.slice(0, -2) + "-" + end_time;
	
	return start_date_str + start_time + "-" + end_time;
}

// returns date in mm/dd or mm/dd/yyyy format
function makeDayMonthYearString(date, include_year) {
	var today = new Date();
	
	var date_str = (date.getMonth() + 1) + '/' + date.getDate();
	// don't show year unless year is different than current year
	if (include_year === false)
		return date_str;
	if (date.getFullYear() != today.getFullYear() || include_year)
		date_str += "/" + (date.getFullYear());
	return date_str;
}

// creates date string in format 'dayName mm/dd' or 'dayName mm/dd/yyyy'
function makeDayOfWeekString(date) {
	var today = new Date();
	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);
	
	var weekdays = ["Sun", "Mon", "Tue", "Wed",
			    "Thu", "Fri", "Sat"];
	var time_diff = Date.timeBetween(today, date, 'days');

	var date_str = weekdays[date.getDay()] += " ";

	if (time_diff == -1)
		date_str += " (Yesterday) ";
	else if (time_diff == 0)
		date_str += " (Today) ";
	else if (time_diff == 1)
		date_str += " (Tomorrow) ";
		
	return date_str;
}

// convert from military time (hh:mm) to standard time (hh:mm am/pm)
function militaryTimeToStr(date) {
	var hour = date.getHours();
	
	if (hour > 12) // afternoon
		return (hour - 12) + ":" + ("0" + date.getMinutes()).slice(-2) + "pm";
	if (hour == 12) // noon
		return (hour) + ":" + ("0" + date.getMinutes()).slice(-2) + "pm";
	if (hour == 0) // midnight
		return (hour + 12) + ":" + ("0" + date.getMinutes()).slice(-2) + "am";
	
	// morning
	return (hour) + ":" + ("0" + date.getMinutes()).slice(-2) + "am";
}

// convert from standard format (hh:mm AM/PM) to military time hour
function strToMilitaryTime(time) {
	var am_pm = time.splice(-2);
	var hour = parseInt(time.substring(0, 2));
	if (am_pm === "AM") {
		if (hour === 12) return 0; // case for 12:00 AM
		return hour;
	}
	if (hour < 12) return hour + 12;
	return hour; // case for 12:00 PM
}

// return date in mm/dd/yyyy format n days ago
var daysAgoToDate = function(n) {
	var today = new Date();
	var timeAgo = new Date();
	timeAgo.setDate(today.getDate() - n);
	var dateStr = makeDayMonthYearString(timeAgo, true);
	return dateStr;
};

// compares two times h1:m1 and h2:m2
function compareTimesHHMM(h1, m1, h2, m2) {
	if (h1 == h2) return m2 - m1;
	return h2 - h1;
}

// return the day of the week of the a given instance
var getDayOfWeekStr = function(startDate) {
	var daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday",
				"Thursday", "Friday", "Saturday"];

	var dayIndex = startDate.getDay();
	return daysOfWeek[dayIndex];
};
