Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    setAutoScroll: true,
    //TODO: Style the Date Fields. Start the start date a month in the past...
    items: [
        {
            xtype: 'rallydatefield',
            fieldLabel: 'Start Sate',
            itemid: 'startDate',
            value: new Date()
        },
        {
            xtype: 'rallydatefield',
            fieldLabel: 'End Sate',
            itemid: 'endDate',
            value: new Date()
        },
        {
            xtype: 'rallybutton',
            itemId: 'getReport',
            text: 'Get Report'
        },
        {
            xtype: 'container',
            itemId: 'pieChart',
            height: '50',
            style: {
                float: 'right',
                'vertical-align': 'top',
                'margin-top': '-65px',
                display: 'inline-block'
            }
        },
        {
            xtype: 'container',
            itemId: 'grid',
            setAutoScroll: true,
            style: {
                display: 'inline-block',
                'vertical-align': 'bottom',
                width: '100%'
            }
        }
    ],

    launch: function () {
        this.down('#getReport').addListener("click", this._vlaidateQuery, this);
    },

    _vlaidateQuery: function () {
        //Get start Date
        var startDate, endDate;
        var compArray = Ext.ComponentQuery.query('rallydatefield');
        //TODO: refactor this out into common code.
        for (var item in compArray) {
            var id = compArray[item].itemid;

            if (id === "startDate") {
                startDate = compArray[item].rawValue
            }

            if (id === "endDate") {
                endDate = compArray[item].rawValue
            }
        }

        this.startDate = new Date(new Util().parseDate(startDate));
        this.endDate = new Date(new Util().parseDate(endDate));
        this._queryForStories(startDate, endDate);

    },

    _queryForStories: function (startDate, endDate) {
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            autoLoad: true,
            limit: 9999999,
            fetch: ['Rank', 'FormattedID', 'Name', 'AcceptedDate', 'InProgressDate', 'RevisionHistory'],
            filters: [
                {
                    property: 'ScheduleState',
                    operator: '=',
                    value: 'Accepted'
                }
            ],
            sorters: [
                {
                    property: 'FormattedID',
                    direction: 'ASC'
                }
            ],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        });
    },

    reportObj: '',

    _onDataLoaded: function (store, data) {
        var records = [], rankIndex = 1, userStories = new Array();
        var _endDate = this.endDate;
        var _startDate = this.startDate;
        console.log(store);
        console.log(data);
        Ext.Array.each(data, function (record) {
            //TODO: InProgressDate parsing from the revision history
            console.log(record.get('AcceptedDate'))
            if (record.get('AcceptedDate') <= _endDate && record.get('InProgressDate') >= _startDate) {

                records.push({
                    Ranking: rankIndex++,
                    FormattedID: record.get('FormattedID'),
                    Name: record.get('Name'),
                    AcceptedDate: record.get('AcceptedDate'),
                    InProgressDate: record.get('InProgressDate'),
                    RevisionHistory: record.get('RevisionHistory')
                });

                userStories.push(new UserStory(rankIndex++, record.get('FormattedID'), record.get('AcceptedDate'), record.get('InProgressDate'), record.get('RevisionHistory')));
            }
        });

        var customStore = Ext.create('Rally.data.custom.Store', {
            data: records
        });

        if (!this.grid) {
            this.grid = this.down('#grid').add({
                xtype: 'rallygrid',
                store: customStore,
                columnCfgs: [
                    { text: 'Ranking', dataIndex: 'Ranking' },
                    { text: 'ID', dataIndex: 'FormattedID' },
                    { text: 'Name', dataIndex: 'Name', flex: 1 },
                    { text: 'Accepted Date', dataIndex: 'AcceptedDate' },
                    { text: 'InProgressDate', dataIndex: 'InProgressDate' },
                    { text: 'RevisionHistory', dataIndex: 'RevisionHistory' }
                ]
            });
        } else {
            this.grid.reconfigure(customStore);
        }

        console.log(records.length);
        if (records.length > 0) {
            this.reportObj = new ReportObj(this.startDate, this.endDate, userStories);
            this.reportObj.calculateDaysInProgress();
            this.reportObj.displayChart();
        }
        else {
            //Display message

            //Remove Pie Chart if it exists
            new ReportObj('', '', '').removeChart();
        }

    }
});
