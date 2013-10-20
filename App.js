Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    setAutoScroll: false,
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
            style: {
                float: 'right',
                width: '75%',
                'vertical-align': 'top'                
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
        Ext.Array.each(data, function (record) {
            //TODO: InProgressDate parsing from the revision history            
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
                    { text: 'Ranking', dataIndex: 'Ranking', width: '5%' },
                    { text: 'ID', dataIndex: 'FormattedID', width: '5%'  },
                    { text: 'Name', dataIndex: 'Name', flex: 1, width: '50%' },
                    { text: 'In Progress Date', dataIndex: 'InProgressDate', width: '20%'  },
                    { text: 'Accepted Date', dataIndex: 'AcceptedDate', width: '20%'  }                    
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
            
            this.chartGrid = this.down('#pieChart').add({                    
                xtype: 'rallygrid',
                store: this.reportObj.buildChartDataStore(),                    
                header: false,                    
                bodyBorder: false,
                hideHeaders: true,
                tbar: false,
                hideMode: 'visibility',
                showPagingToolbar: false,
                style: {
                    float: 'right',
                    height: '100%',
                    width: '25%'
                },
                columnCfgs: [
                    { text: '', dataIndex: 'name' },
                    { text: 'Days In Progress', dataIndex: 'data' }
                ]
            });
         

        }
        else {            
            //Remove Pie Chart if it exists
            new ReportObj('', '', '').removeChart();
            
        }

    }
});
