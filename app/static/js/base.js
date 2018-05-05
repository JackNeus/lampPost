// Global javascript that is always loaded
$(document).ready(function() {
	// initialize layout
	document.isMobile_Master = ($(window).width() < WIDTH_THRESHOLD);
	if (document.isMobile_Master) {
		viewMobile_Master();
	}
	else viewDesktop_Master();

	// Dynamically reformat the website based on window pane width
	$(window).resize(viewChange_Master);

	// Render the proper logo
	logoRender();
});
