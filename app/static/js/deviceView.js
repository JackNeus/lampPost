// Mobile view screen width
const WIDTH_THRESHOLD = 768;

// Mobile view layout that applies to all website pages
function viewMobile_Master() {
    console.log("Mobile View!");
}

// Handle the transition to mobile view from desktop view
function viewToMobile_Master() {
    document.isMobile = true;
    viewMobile_Master();
}

// Desktop view layout that applies to all website pages
function viewDesktop_Master() {
    console.log("Desktop View!");
}

// Handle the transition to desktop view from mobile view
function viewToDesktop_Master() {
    document.isMobile = false;
    viewDesktop_Master();
}

// Function to handle view changes that apply to entire website on resize
function viewChange_Master() {
    console.log("resizing...");
    var width = $(window).width();
    var isMobile = (width < WIDTH_THRESHOLD);
    if (document.isMobile && !isMobile) viewToDesktop_Master();
    else if (!document.isMobile && isMobile) viewToMobile_Master();
}
