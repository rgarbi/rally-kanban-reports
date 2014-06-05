Util = function () {

    this.parseDate = function (date) {
        var dateElements = date.split("/");
        return new Date(dateElements[2], dateElements[0] - 1, dateElements[1]);        
    };
    
    //calculate the number of days in progress; if excluding weekends, only Mon-Fri will be included in the calculation
	this.getNumberOfDaysInRange = function (startDate, endDate, excludeWeekends) {
		var numberOfDays = 0;
		
		var start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
		var end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
		
		for (var date = start; date < end; date.setDate(date.getDate() + 1)) {
			//if we are excluding weekends, only count Monday - Friday, otherwise count all days
			if (!excludeWeekends || (date.getDay() > 0 && date.getDay() < 6)) {
				numberOfDays++;
			}
		}			
		return numberOfDays;
	};
};