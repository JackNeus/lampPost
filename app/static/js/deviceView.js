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
    document.isMobile_Master = true;
    viewMobile_Master();
}

// Desktop view layout that applies to all website pages
function viewDesktop_Master() {
}

// Handle the transition to desktop view from mobile view
function viewToDesktop_Master() {
    document.isMobile_Master = false;
    viewDesktop_Master();
}

// Function to handle view changes that apply to entire website on resize
function viewChange_Master() {
    var isMobile = ($(window).width() < WIDTH_THRESHOLD);
    if (document.isMobile_Master && !isMobile) viewToDesktop_Master();
    else if (!document.isMobile_Master && isMobile) viewToMobile_Master();

    // Check if we need to switch the logo even if we didn't switch screen
    if (isMobile) logoRender();
}

// Handle the src svg of the logo
function logoRender() {
    if ($(window).width() < 415) {
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
Event browser
==============================================================================*/

// Mobile view layout that applies to browser webpages
function viewMobile_Browser() {
    // Add slick to the viewport
    $("#browserView").slick({infinite: false, edgeFriction: 0.15, slide: ".slide", initialSlide: 1, touchThreshold: 7});
}

// Handle the transition to mobile view from desktop view
function viewToMobile_Browser() {
    document.isMobile_Browser = true;
    viewMobile_Browser();
}

// Desktop view layout that applies to browser webpages
function viewDesktop_Browser() {
}

// Handle the transition to desktop view from mobile view
function viewToDesktop_Browser() {
    // Remove slick
    $("#browserView").slick("unslick");
    $(".slide").removeAttr("tabindex");
    document.isMobile_Browser = false;
    viewDesktop_Browser();
}

// Function to handle view changes that apply to browser webpages on resize
function viewChange_Browser() {
    var isMobile = ($(window).width() < WIDTH_THRESHOLD);
    if (document.isMobile_Browser && !isMobile) viewToDesktop_Browser();
    else if (!document.isMobile_Browser && isMobile) viewToMobile_Browser();
}
