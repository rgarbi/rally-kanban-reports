ReportObj = function (startDate, endDate, userStories) {

    this.startDate = startDate;
    this.endDate = endDate;
    this.userStories = userStories;
    this.dayRange = [];

    this.totalStories = userStories.size;
    this.averageDaysInProgress = 0;

    this.calculateDaysInProgress = function (excludeWeekends) {

        for (var us in this.userStories) {
            var userStory = this.userStories[us];

            var startedDate = new Date(userStory.inProgressDate);
            var doneDate = new Date(userStory.acceptedDate);

            var timeInProgress = new Util().getNumberOfDaysInRange(startedDate, doneDate, excludeWeekends);
            if (timeInProgress === 0) {
                timeInProgress = 1;
            }
            this.dayRange.push(timeInProgress);
        }
    };

    this.getStoriesInRange = function (lowNum, highNum) {
        var count = 0;
        for (var i in this.dayRange) {
            var inProgLength = this.dayRange[i];
            if (inProgLength > lowNum && inProgLength <= highNum) {
                count = count + 1;
            }
        }
        return count;
    };

    this.displayChart = function () {

        var piePlace = Ext.ComponentQuery.query('#pieChart')[0];

        if (piePlace.items.length === 0) {
            Ext.ComponentQuery.query('#pieChart')[0].add(this.getChart());
        } else {
            Ext.ComponentQuery.query('#pieChart')[0].removeAll(true);
            this.getChart().bindStore(this.buildChartDataStore(false));
            Ext.ComponentQuery.query('#pieChart')[0].add(this.getChart());
        }

    };

    this.removeChart = function () {

        var piePlace = Ext.ComponentQuery.query('#pieChart')[0];

        if (piePlace.items.length === 0) {
            //Do nothing
        } else {
            Ext.ComponentQuery.query('#pieChart')[0].removeAll(true);
        }

    };

    this.buildChartData = function (isSummary) {
        var start = 5;
        var end = 10;
        var bound = 31;
        var data = [];

        var range = this.getStoriesInRange(0, 5);
        if (range > 0) {
            data.push(
                {
                    'name': 'Stories 0 to 5',
                    'data': range
                }
            );
        }

        while (end < bound) {
            var range = this.getStoriesInRange(start, end);
            if (range > 0) {
                data.push(
                    {
                        'name': 'Stories ' + start + ' to ' + end,
                        'data': range
                    }
                );
            }
            start = start + 5;
            end = end + 5;
        }

        var range = this.getStoriesInRange(bound, 99999);
        if (range > 0) {
            data.push({
                'name': 'Stories ' + bound + '+',
                'data': range
            });
        }

        if (isSummary) {
            data.push({
                'name': 'Total Stories Completed',
                'data': this.userStories.length
            });

            var totalDays = 0;
            for (var i in this.dayRange) {
                totalDays = totalDays + this.dayRange[i];                
            }

            data.push({
                'name': 'Average Numer of Days In Progress',
                'data': Math.round(totalDays/this.userStories.length)
            });
        }

        return data;

    };

    this.buildChartDataStore = function (isSummary) {
        var store = Ext.create('Ext.data.JsonStore', {
            fields: ['name', 'data'],
            data: this.buildChartData(isSummary)
        });

        return store;
    };

    this.getChart = function () {
        var store = this.buildChartDataStore(false);

        var chart = Ext.create('Ext.chart.Chart', {            
            id: 'storyPieChart',
            title: 'User Story Cycle Time',
            width: 600,
            height: 300,
            animate: true,
            style: {
                float: 'right',
                'margin-top': '-65px',
                display: 'inline-block'
            },
            store: store,
            theme: 'Base:gradients',            
            showInLegend: true,
            legend: {
                position: 'left'
            },
            series: [{
                type: 'pie',
                field: 'data',                
                showInLegend: true,
                tips: {
                    trackMouse: true,
                    width: 140,
                    height: 20,
                    renderer: function (storeItem, item) {
                        // calculate and display percentage on hover
                        var total = 0;
                        store.each(function (rec) {
                            total += rec.get('data');
                        });
                        this.setTitle(storeItem.get('name') + ': ' + Math.round(storeItem.get('data') / total * 100) + '%');
                    }
                },
                highlight: {
                    segment: {
                        margin: 20
                    }
                },
                label: {
                    field: 'name',
                    display: 'rotate',
                    contrast: true,
                    font: '12px Arial'
                }
            }]
        });

        return chart;
    };



};