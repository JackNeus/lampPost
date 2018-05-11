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
	var colHeight = columnResize();
	eventViewResizeHeight(colHeight);
}

function columnResize() {
	var totalHeight = $(window).height();
	var navbarHeight = document.getElementById("id_navbar").clientHeight;
	var newHeight = totalHeight - navbarHeight;
	document.getElementById("leftCol").style.height = newHeight + "px";
	document.getElementById("rightCol").style.height = newHeight + "px";
	return newHeight;
}

function eventViewResizeHeight(colHeight) {
	var headerHeight = document.getElementById("event-view-header").clientHeight;
	var newHeight = colHeight - headerHeight;
	if (newHeight > 0) {
		document.getElementById("event-view-info").style.height = newHeight + "px";
	}
}
