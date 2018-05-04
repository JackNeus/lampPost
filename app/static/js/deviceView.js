/* This file handles the mobile/desktop layout. As with the rest of the project,
   this page was heavily influenced by Princeton Courses */

/*==============================================================================
Constants
==============================================================================*/

// Mobile view screen width
const WIDTH_THRESHOLD = 768;

/*==============================================================================
MASTER
==============================================================================*/

// Mobile view layout that applies to all website pages
function viewMobile_Master() {
    logoRender();
}

// Handle the transition to mobile view from desktop view
function viewToMobile_Master() {
    document.isMobile = true;
    viewMobile_Master();
}

// Desktop view layout that applies to all website pages
function viewDesktop_Master() {
}

// Handle the transition to desktop view from mobile view
function viewToDesktop_Master() {
    document.isMobile = false;
    viewDesktop_Master();
}

// Function to handle view changes that apply to entire website on resize
function viewChange_Master() {
    var width = $(window).width();
    var isMobile = (width < WIDTH_THRESHOLD);
    if (document.isMobile && !isMobile) viewToDesktop_Master();
    else if (!document.isMobile && isMobile) viewToMobile_Master();

    // Check if we need to switch the logo even if we didn't switch screen
    if (isMobile) logoRender();
}

// Handle the src svg of the logo
function logoRender() {
    if ($(window).width() < 400) {
        document.getElementById("navbarLogo").innerHTML =
            "<img class=\"image-fluid logo\" id=\"navbarLogo\" "
            + "src = \"../../static/graphics/logoMobileWhite.svg\">";
    } else {
        document.getElementById("navbarLogo").innerHTML =
            "<img class=\"image-fluid logo\" id=\"navbarLogo\" "
            + "src = \"../../static/graphics/logoWhite.svg\">";
    }
}

/*============================================================================

==============================================================================*/
