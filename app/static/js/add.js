// code for the date
$(document).ready(function(){
	// selects from all fields with name containing the substring "Date"
    var date_input=$('input[name*="Date"]'); 
    var container=$('.bootstrap-iso form').length>0 ? $('.bootstrap-iso form').parent() : "body";
    var options={
      	format: 'mm/dd/yyyy',
    	container: container,
      	todayHighlight: true,
      	autoclose: true,
    };
	date_input.datepicker(options);
	});

// where we don't have a textarea, ignore the enter key (don't let users submit)
$(document).on("keypress", ":input:not(textarea)", function(event) {
	return event.keyCode != 13;
});


var currentNumShowing = 1;
var maxShowings = 4;

// add numbers to first showing (e.g. "Location" -> "Location 1")
function numberFirstShowing() {
	$("label[for='locations-0']").text("Location 1");
	$("label[for='startDates-0']").text("Start Date 1");
	$("label[for='endDates-0']").text("End Date 1");
	$("label[for='startTimes-0']").text("Start Time 1");
	$("label[for='endTimes-0']").text("End Time 1");
}

// remove numbers from first showing (e.g. "Location 1" -> "Location")
function unNumberFirstShowing() {
	$("label[for='locations-0']").text("Location");
	$("label[for='startDates-0']").text("Start Date");
	$("label[for='endDates-0']").text("End Date");
	$("label[for='startTimes-0']").text("Start Time");
	$("label[for='endTimes-0']").text("End Time");
}

function processClick( num ) {
	// this is a special case, because we need to introduce numbering
	if (currentNumShowing == 1) {
		numberFirstShowing();
	}
	// another special case, because then we need we need to remove numbering
	if (num == 1) {
		unNumberFirstShowing();
	}

	// remove the bigger ones instantly
	for (i = num + 1; i <= maxShowings; i++) {
		$("#form-row-" + i.toString()).slideUp("slow");
	}
	// slide down relevant ones
	for (i = currentNumShowing + 1; i <= num; i++) {
		$("#form-row-" + i.toString()).slideDown("slow");
	}
	// change currentNumShowing
	currentNumShowing = num;
}

$(document).ready(function(){
	// initialize the first radio option (for number of showings) to be checked
	$("#numShowings-0").attr("checked", "checked");

	// number all our labels
	// as far as I know, there is no good way to do this with wtforms (although it seems there should be)
	$(".numbered").each(function(){
		$(this).append(" " + (parseInt($(this).attr("for").substr(-1))+1).toString());
	});

	// now, let's unnumber the first row of the form (since we start w/ one row showing)
	unNumberFirstShowing();

	// make title, description, and host required
	$("#title").prop("required", true);
	$("#description").prop("required", true);
	$("#host").prop("required", true);
	// make first row of location/datetimes required
	$("#locations-0").prop("required", true);
	$("#startDates-0").prop("required", true);
	$("#startTimes-0").prop("required", true);
	$("#endDates-0").prop("required", true);
	$("#endTimes-0").prop("required", true);

	// have endDate automatically update to the value in startDate when startDate is changed
	$("input[name^='startDate']").change(function(){
		var id = "#endDates-" + $(this).attr("name").substr(-1);
		$(id).val($(this).val());
	});


	// make the forms visible
	$("#form-row-2").removeClass("invisible");
	$("#form-row-3").removeClass("invisible");
	$("#form-row-4").removeClass("invisible");

	// slide these forms (which are currently invisible) up, to make
	// compatible with the slideDown's needed later
	$("#form-row-2").slideUp(0);
	$("#form-row-3").slideUp(0);
	$("#form-row-4").slideUp(0);

	
	// when we click the circle for x showings, slide up all the forms instantly
	// then, slide down the relevant ones slowly
	$("#numShowings-0").click(function() {
		processClick(1);
	});
	$("#numShowings-1").click(function() {
		processClick(2);
	});
	$("#numShowings-2").click(function() {
		processClick(3);
	});
	$("#numShowings-3").click(function() {
		processClick(4);
	});
});

	