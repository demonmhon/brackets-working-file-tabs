define( function ( require, exports, module ) {
    "use strict";

    var CommandManager     = brackets.getModule( 'command/CommandManager' ),
        Menus              = brackets.getModule( 'command/Menus' ),
        ProjectManager     = brackets.getModule( 'project/ProjectManager' ),
        PreferencesManager = brackets.getModule( 'preferences/PreferencesManager' ),
        MainViewManager    = brackets.getModule( 'view/MainViewManager' ),
        WorkspaceManager   = brackets.getModule( 'view/WorkspaceManager' ),
        ExtensionUtils     = brackets.getModule( 'utils/ExtensionUtils' ),
        config             = {
            scrollSize:     30,   // Scroll moving length
            scrollContinue: null, // Flag for continue scrolling by holding mouse click
            scrollSpeed:    50,   // Speed for continue scrolling
            scrolling:      false // Scrolling flag
        };

    // Load Extension StyleShhet
    ExtensionUtils.loadStyleSheet( module, 'less/main.less' );
    ExtensionUtils.loadStyleSheet( module, 'css/font-awesome.min.css' );

    // Add menu item
    var MENU_TEXT        = 'Show Working Files as Tabs';
    var WORKING_FILE_TAB = 'brackets-view.working-file-tabs';
    CommandManager.register( MENU_TEXT, WORKING_FILE_TAB, toggleView );
    Menus.getMenu( Menus.AppMenuBar.VIEW_MENU ).addMenuItem( WORKING_FILE_TAB );
    
    // Preferences
    var preference = PreferencesManager.getExtensionPrefs( 'brackets-working-file-tabs' );
    preference.definePreference( 'enabled', 'boolean', false );
    CommandManager.get(WORKING_FILE_TAB).setChecked(preference.get('enabled'));

    // Toggle view handler
    function toggleView () {
        preference.set( 'enabled', !preference.get('enabled') );
        preference.save();
        CommandManager.get(WORKING_FILE_TAB).setChecked(preference.get('enabled'));
        setView();
    }

    // Set View: List or Tab
    function setView () {
        if ( preference.get( 'enabled' ) ) {
            createTabView();
        } else {
            removeTabView();
        }
    }

    // Set View: Tab
    // Create Tab
    function createTabView () {
        if ( !$( '#working-file-tabs-container' ).length ) {
            var tabContainer = $( '<div>', {
                'id':    'working-file-tabs-container',
                'class': 'working-file-tabs-container end-left',
            } );
            var tabScroll = $( '<div>', {
                'id':    'working-file-tabs-scroll-container',
                'class': 'working-file-tabs-scroll-container',
            } );
            tabContainer.append( tabScroll );

            var workingFileList = $( '#working-set-list-container' );
            workingFileList.appendTo( tabScroll );
            var sidebar         = $( '#sidebar' );
            var btnSplitView    = sidebar.find( '.working-set-splitview-btn' );
            var btnOption       = sidebar.find( '.working-set-option-btn' );
            btnSplitView.appendTo( tabContainer );
            btnOption.appendTo( tabContainer );

            var tabButtonLeft = $( '<div>', {
                'class': 'btn-alt-quiet working-file-tabs-scroll left',
                'title' : 'Scroll to left tab',
                'html': '<i class="fa fa-chevron-left"></i>'
            } );
            var tabButtonRight = $( '<div>', {
                'class': 'btn-alt-quiet working-file-tabs-scroll right',
                'title' : 'Scroll to right tab',
                'html': '<i class="fa fa-chevron-right"></i>'
            } );
            tabContainer.append( tabButtonLeft );
            tabContainer.append( tabButtonRight );
            var editor = $( '#editor-holder' );
            editor.before( tabContainer );

            resizeTab();
        }
    }

    // Set View: List
    // Remove Tab, restore list
    function removeTabView () {
        if ( $('#working-file-tabs-container').length ) {
            var workingFileList = $( '#working-set-list-container' );
            var tabGroup        = workingFileList.find('.working-set-view');
            var workingFileTab  = $( '#working-file-tabs-container' );
            var projectFiles    = $( '#project-files-header' );
            var sidebar         = $( '#sidebar' );
            var btnSplitView    = workingFileTab.find( '.working-set-splitview-btn' );
            var btnOption       = workingFileTab.find( '.working-set-option-btn' );
            projectFiles.before( workingFileList );
            workingFileList.removeAttr( 'style' );
            tabGroup.removeAttr( 'style' );
            workingFileList.before( btnSplitView );
            workingFileList.before( btnOption );
            workingFileTab.remove();
        }
    }
    
    function resizeTab ( callback ) {
        if ( !preference.get('enabled') ) {
            return;
        }
        var workingFileList = $( '#working-set-list-container' );
        var tabGroup        = workingFileList.find('.working-set-view');
        var tabGroupWidth   = 0;
        var total           = 0;
        $.each( tabGroup, function( index, tab ) {
            var tabContainer = $( tab );
            var tabWidth     = 0;
            var tabItem      = tabContainer.find('li');
            $.each( tabItem, function( index, tab ) {
                tabWidth      += $( tab ).outerWidth( true );
                tabGroupWidth += $( tab ).outerWidth( true );
                total         += 1;
            } );
            tabContainer.css( 'width', tabWidth + 1 );
        });
        workingFileList.css( 'width', tabGroupWidth + 10 );
        if ( total < 1 ) {
            workingFileList.css( 'left', 0 ).css( 'right', 'auto' );
        }
        var tabContainer       = $( '#working-file-tabs-container' );
        var tabScrollContainer = $( '#working-file-tabs-scroll-container' );
        if ( tabScrollContainer.width() < workingFileList.width() ) {
            tabContainer.addClass( 'scroll' );
        } else {
            tabContainer.removeClass( 'scroll' );
        }
        if ( typeof( callback ) != 'undefined' ) {
            callback( );
        }
    }

    function scrollTab ( direction ) {
        if ( !preference.get('enabled') ) {
            return;
        }
        var tabContainer       = $( '#working-file-tabs-container' );
        var tabScrollContainer = $( '#working-file-tabs-scroll-container' );
        var scrollable         = ( tabContainer.hasClass('scroll') ) ? true : false;
        if ( scrollable ) {
            var workingFileList   = $( '#working-set-list-container' );
            var scrollLimit       = tabScrollContainer.outerWidth() -  $( '#working-set-list-container' ).outerWidth();
            var currentOffset     = parseInt( workingFileList.css( 'left' ), 10 );
            tabContainer.removeClass( 'end-left' ).removeClass( 'end-right' );
            switch ( direction ) {
                case 'left':
                    if ( currentOffset + config.scrollSize < 0 ) {
                        workingFileList.css( 'left', ( currentOffset + config.scrollSize ) + 'px' );
                    } else {
                        workingFileList.css( 'left', 0 );
                        tabContainer.addClass( 'end-left' );
                    }
                    break;
                case 'right':
                    if ( ( currentOffset - config.scrollSize ) >= scrollLimit ) {
                        workingFileList.css( 'left', ( currentOffset - config.scrollSize ) + 'px' );
                    } else {
                        workingFileList.css( 'left', scrollLimit );
                        tabContainer.addClass( 'end-right' );
                    }
                    break;
                case 'active':
                    var activeTab      = workingFileList.find( '.selected' ).last()[0];
                    var activePosition = $( activeTab ).position();
                    var scroll         = activePosition.left * (-1);
                    if ( scroll >= scrollLimit ) {
                        workingFileList.css( 'left', scroll );
                    } else {
                        workingFileList.css( 'left', scrollLimit );
                        tabContainer.addClass( 'end-right' );
                    }
                    break;
                case 'last':
                    workingFileList.css( 'left', scrollLimit );
                    tabContainer.addClass( 'end-right' );
                    break;
            }
        }
    };

    $( ProjectManager ).on( 'projectOpen projectRefresh' , setView );

    MainViewManager
        // Event on Pane layout changed: Split Panel
        .on( 'paneLayoutChange', function( e, orientation ) {
            $( '#working-file-tabs-container' ).addClass( orientation.toLowerCase() );
        } )
        // Event on file list changed
        .on( 'workingSetAdd', function( ) {
            resizeTab( function() { scrollTab( 'last' ) } );
            config.scrolling = true;
        } )
        .on( 'workingSetRemove', function( ) {
            resizeTab( function() { scrollTab( 'active' ) } );
            config.scrolling = true;
        } )

    // Event on layout changed 
    WorkspaceManager.on( 'workspaceUpdateLayout', function( e, height, recomputeLayout ) {
        if ( !config.scrolling ) {
            resizeTab( function() {  scrollTab( 'active' ) } );
        }
        config.scrolling = false;
    } );
    
    // Tab scroll
    $('body')
        .on('mousedown', '.working-file-tabs-scroll', function( e ) {
            var button    = $( this );
            var direction = ( button.hasClass('left') ) ? 'left' : 'right';
            config.scrollContinue = setInterval( function(){
                scrollTab( direction );
            }, config.scrollSpeed );
        } )
        .bind('mouseup mouseleave', '.working-file-tabs-scroll', function( e ) {
            clearInterval( config.scrollContinue );
            config.scrollContinue = null;
        } )

    // Disable context menu when clicking on tab container area
    $('body').on('mousedown', '.working-file-tabs-container', function( e ) {
        if ( $( e.target ).hasClass('.working-file-tabs-container') ) {
            return false;
        }
    } );
} );