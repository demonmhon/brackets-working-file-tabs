define( function ( require, exports, module ) {
    "use strict";

    var CommandManager     = brackets.getModule( 'command/CommandManager' ),
        Menus              = brackets.getModule( 'command/Menus' ),
        ProjectManager     = brackets.getModule( 'project/ProjectManager' ),
        PreferencesManager = brackets.getModule( 'preferences/PreferencesManager' ),
        MainViewManager    = brackets.getModule( 'view/MainViewManager' ),
        WorkspaceManager   = brackets.getModule( 'view/WorkspaceManager' ),
        ExtensionUtils     = brackets.getModule( 'utils/ExtensionUtils' );

    // Load Extension StyleShhet
    ExtensionUtils.loadStyleSheet( module, 'less/main.less' );

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
        preference.set( 'enabled', !preference.get('enabled'));
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
                'class': 'working-file-tabs-container'
            });
            var editor = $( '#editor-holder' );
            editor.before( tabContainer );
        }
        
        var workingFileList = $( '#working-set-list-container' );
        workingFileList.appendTo( tabContainer );
        var sidebar         = $( '#sidebar' );
        var btnSplitView    = sidebar.find( '.working-set-splitview-btn' );
        var btnOption       = sidebar.find( '.working-set-option-btn' );
        btnSplitView.appendTo( tabContainer );
        btnOption.appendTo( tabContainer );
    }

    // Set View: List
    // Remove Tab, restore list
    function removeTabView () {
        if ( $('#working-file-tabs-container').length ) {
            var workingFileList = $( '#working-set-list-container' );
            var workingFileTab  = $( '#working-file-tabs-container' );
            var projectFiles    = $( '#project-files-header' );
            var sidebar         = $( '#sidebar' );
            var btnSplitView    = workingFileTab.find( '.working-set-splitview-btn' );
            var btnOption       = workingFileTab.find( '.working-set-option-btn' );
            projectFiles.before( workingFileList );
            workingFileList.before( btnSplitView );
            workingFileList.before( btnOption );
            workingFileTab.remove();
        }
    }

    $( ProjectManager ).on( 'projectOpen projectRefresh' , setView );

    // Event on Pane layout changed: Split Panel
    MainViewManager.on( 'paneLayoutChange', function( e, orientation ) {
        $( '#working-file-tabs-container' ).addClass( orientation.toLowerCase() );
    } );

    // Disable context menu when clicking on tab container area
    $('body').on('mousedown', '.working-file-tabs-container', function( e ) {
        if ( $( e.target ).hasClass('.working-file-tabs-container') ) {
            return false;
        }
    } );
} );