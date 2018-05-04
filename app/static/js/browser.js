// TODO: Refactor javascript to fill out this file

// Initializes the handling of mobile view for pages that feature a browser
$(document).ready(function() {
	// initialize layout
	document.isMobile_Browser = ($(window).width() < WIDTH_THRESHOLD);
	if (document.isMobile_Browser) {
		viewMobile_Browser();
	}
	else viewDesktop_Browser();

	// Dynamically reformat the website based on window pane width
	$(window).resize(viewChange_Browser);

    // Add search button for mobile view
    $("#navbarLogo").after("<button class=\"mobile-search-button navbar-toggler ml-auto\" "
        + "id=\"mobileSearchButton\" type=\"button\"> <i class=\"fas fa-search\"></i></button>");

    $("#mobileSearchButton").click(mobileClick);
});

function mobileClick() {
    // Handle clicking of the search button if in mobile view
    if ($(window).width() < WIDTH_THRESHOLD) $('#browserView').slick("slickPrev");
}
