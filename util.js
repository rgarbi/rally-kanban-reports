Util = function () {

    this.parseDate = function (date) {
        var dateElements = date.split("/");
        return new Date(dateElements[2], dateElements[0] - 1, dateElements[1]);        
    };
};