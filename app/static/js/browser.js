// TODO: Refactor javascript to fill out this file

// Initializes the handling of mobile view for pages that feature a browser
function browserView() {
	// initialize layout
	document.isMobile_Browser = ($(window).width() < WIDTH_THRESHOLD);
	if (document.isMobile_Browser) {
		viewMobile_Browser();
	}
	else viewDesktop_Browser();

	// Dynamically reformat the website based on window pane width
	$(window).resize(viewChange_Browser);
	// Dynamically reformat event-view-info height
	$(window).resize(heightResizeHandler);
}

// Add search button for mobile view of browser
function addSearchButton() {
    $("#navbarLogo").after("<button class=\"mobile-search-button navbar-toggler ml-auto\" "
        + "id=\"mobileSearchButton\" type=\"button\"> <i class=\"fas fa-search\"></i></button>");

    $("#mobileSearchButton").click(mobileClick);
	$("#mobileSearchButton").click(function() {document.getElementById("search-box").focus();});
}

// Add view button for mobile view of add
function addViewButton() {
    $("#navbarLogo").after("<button class=\"mobile-search-button navbar-toggler ml-auto\" "
        + "id=\"mobileSearchButton\" type=\"button\"> <i class=\"fas fa-eye\"></i>");

    $("#mobileSearchButton").click(mobileClick);
}

function mobileClick() {
    // Handle clicking of the search button if in mobile view
    if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickPrev");
}

/*==============================================================================
Resize Handlers
==============================================================================*/

function heightResizeHandler() {
	eventViewResizeText();
	var colHeight = columnResize();
	eventViewResizeHeight(colHeight);
}

function columnResize() {
	var totalHeight = $(window).height();
	var navbarHeight = document.getElementById("id_navbar").clientHeight;
	var newHeight = totalHeight - navbarHeight;
	document.getElementById("leftCol").style.height = newHeight + "px";
	document.getElementById("rightCol").style.height = newHeight + "px";
	// format welcome message
	if (document.getElementById("welcomeDiv") != null) {
		document.getElementById("welcomeDiv").style.height = newHeight + "px";
		if ($(window).width() < WIDTH_THRESHOLD) {
			document.getElementById("mobileImageSrc").style.height = (0.75*newHeight) + "px";
		}
	}
	return newHeight;
}

function eventViewResizeHeight(colHeight) {
	var headerHeight = document.getElementById("event-view-header").clientHeight;
	var newHeight = colHeight - headerHeight;
	if (newHeight > 0) {
		document.getElementById("event-view-info").style.height = newHeight + "px";
	}
}
function eventViewResizeText() {
	// Event Title
	var fontsize = 36;
	var lowerLimit = 20;
	var pad = 13.0;
	if ($(window).width() < WIDTH_THRESHOLD) {
		fontsize = 32;
		lowerLimit = 16;
	}
	document.getElementById("eventTitle").style.fontSize = fontsize + "px";
	var titleHeight = document.getElementById("titleRow").clientHeight;
	var tags = document.getElementsByClassName("badge-border");
	for (var i = 0; i < tags.length; i++) {
		tags[i].style.paddingTop = pad + "px";
	}
	// Try to fit it on one line (within reason)
	while ((titleHeight > 50) && (fontsize >= lowerLimit)) {
		document.getElementById("eventTitle").style.fontSize = fontsize + "px";
		//document.getElementById("eventTitle").style.paddingTop = pad + "px";
		fontsize -= 2;
		//pad += 1.5;
		for (var i = 0; i < tags.length; i++) {
			tags[i].style.paddingTop = pad + "px";
		}
		pad -= 1.5;
		titleHeight = document.getElementById("titleRow").clientHeight;
	}
	fontsize += 2;
	// Event subtitle
	var subfontsize = 20;
	lowerLimit = 12;
	if ($(window).width() < WIDTH_THRESHOLD) {
		subfontsize = 16;
		lowerLimit = 8;
	}
	document.getElementById("eventHost").style.fontSize = subfontsize + "px";
	var subtitleHeight = document.getElementById("eventHost").clientHeight;
	// Try to fit it onto one line and keep it smaller than title
	while (((subtitleHeight > 28) || (fontsize - subfontsize) < 8)
			&& (subfontsize >= lowerLimit)) {
		document.getElementById("eventHost").style.fontSize = subfontsize + "px";
		subfontsize -= 2;
		subtitleHeight = document.getElementById("eventHost").clientHeight;
	}
}
