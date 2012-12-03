
(function ($) {

    // our custom validator
    function requiredFieldValidator(value) {
        if (value === null || value === undefined || !value.length) {
            return {valid: false, msg: "This is a required field"};
        } else {
            return {valid: true, msg: null};
        }
    }

    
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    var currentYear = new Date().getFullYear();


    //
    // Named configuration for the grid
    //
    // Mapping of all the default options that configure the behavior
    // of the grid.
    //
    // If your workflow is to marshall the options
    // from the server encoded as JSON, then this is the place where
    // you can specify those options that contain non-JSON marshallable
    // objects (such as, functions).
    //
    // This data will be looked up from the node where the grid is bound
    // to, and its parent nodes. This allows for multiple configurations
    // inside a project.
    //
    $(document).data('sdi-content-grid', {
        editors: {
            //text: Slick.Editors.Text,
            //date: Slick.Editors.Date
        },
        formatters: {
            icon_label_url: function (row, cell, value, columnDef, dataContext) {
                // an icon and a label. If the url is specified, the label will be a link.
                var fieldName = columnDef.field;
                var iconName = dataContext[fieldName + '_icon'] || '';
                var labelUrl = dataContext[fieldName + '_url'];
                var result = '<i class="' + iconName + '"> </i> ';
                if (labelUrl) {
                    result += '<a href="' + labelUrl + '">' + value + '</a>';
                } else {
                    result += value;
                }
                return result;
            },
            date: function(row, cell, value, columnDef, dataContext) {
                // value is an isodate string.
                var year = value.substring(0, 4);
                var month = value.substring(5, 7);
                var day = value.substring(8, 10);
                monthText = months[Number(month) - 1];
                if (day.charAt(0) == '0') {
                    day = day.substring(1);
                }
                var result = monthText + ' ' + day;
                if ('' + currentYear != year) {
                    // year is only displayed if not the current year
                    result += ', ' + year;
                }
                return result;
            }
        },
        validators: {
            //required: requiredFieldValidator
        },
        handleCreate: function () {
            // Create a simple grid configuration.
            //
            // This handler will run after the options
            // have been preprocessed. It can be overridden by passing
            // the handleCreate option at creation time.
            //
            // Variables you can access from this handler:
            //
            // this:                  will equal to the SlickGrid wrapper object instance
            // this.element:          the element to bind the grid to
            // this.columns:          column definitions (pre-processed)
            // this.wrapperOptions:   options passed to this object at creation
            //
            var columns = this.columns;
            var wrapperOptions = this.wrapperOptions;

            // checkbox column: add it
            var checkboxSelector = new Slick.CheckboxSelectColumn({});
            columns.unshift(checkboxSelector.getColumnDefinition());

            var grid = this.grid = new Slick.Grid(this.element, [], columns, wrapperOptions.slickgridOptions);

            var sortCol = wrapperOptions.sortCol;
            var sortDir = wrapperOptions.sortDir;

            // set the initial sorting to be shown in the header
            if (sortCol !== undefined) {
                grid.setSortColumn(sortCol, sortDir);
            }

            // filtering
            // we define a method on the wrapper instance, callable externally:
            this.setSearchString = function (txt) {
                sdiRemoteModelPlugin.setFilterArgs({
                    filter: txt
                });
            };

            // checkbox column
            grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
            grid.registerPlugin(checkboxSelector);
            //this.grid.onSelectedRowsChanged.subscribe(function (evt) { 
                // ?
            //});

            // autoresize columns
            var responsivenessPlugin = new Slick.Plugins.Responsiveness({
            });
            responsivenessPlugin.onResize.subscribe(function (evt, args) {
                var columns = args.grid.getColumns();
                var isWide = (args.width > 768); // ipad orientation narrow / wide
                /* ... hide or show columns from here ...
                */
                args.grid.setColumns(columns); // XXX why is this needed for the resize?
            });
            grid.registerPlugin(responsivenessPlugin);

            grid.setColumns(columns); // XXX why is this needed for the initial fit?


            var sdiRemoteModelPlugin = new Slick.Data.SdiRemoteModel({
                url: wrapperOptions.url,
                manageQueue: wrapperOptions.manageQueue,
                sortCol: wrapperOptions.sortCol,
                sortDir: wrapperOptions.sortDir,
                extraQuery: {
                    filter: ''    
                },
                minimumLoad: wrapperOptions.minimumLoad
            });
            grid.registerPlugin(sdiRemoteModelPlugin);


            $viewport = this.element.find('.slick-viewport');
            sdiRemoteModelPlugin.onDataLoading.subscribe(function (evt, args) {
                // indicate loading
                $viewport.stop(true, true).animate({
                    opacity: 0.3
                });
            });

            sdiRemoteModelPlugin.onDataLoaded.subscribe(function (evt, args) {
                if (args.from !== undefined) {
                    // XXX TODO restore selections
                }
                // indicate loading finished
                $viewport.stop(true, true).animate({
                    opacity: 1
                });
            });

            // sorting
            grid.onSort.subscribe(function (e, args) {
                sortDir = args.sortAsc;
                sortCol = args.sortCol.field;

                sdiRemoteModelPlugin.setSorting(sortCol, sortDir); 
                ////dataView.sort(comparer, args.sortAsc);
            });



            if (wrapperOptions.items) {
                // load the items
                sdiRemoteModelPlugin.loadData(wrapperOptions.items);
            }
            // provoke first run (will fetch items, if we are not at the
            // top of the grid, initially.)
            grid.onViewportChanged.notify();

        }

    });
})(window.jQuery);
