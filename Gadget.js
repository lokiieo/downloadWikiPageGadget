$(document).ready(function() {
    var pageName = mw.config.get('wgPageName');
    
    // Target the primary horizontal actions row
    var $navContainer = $('#p-views ul, .vector-page-toolbar ul, #left-navigation ul, #right-navigation ul').first();
    if (!$navContainer.length) {
        return; 
    }

    // Download Icon
    var svgIcon = '<svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor" style="margin-right: 6px; vertical-align: middle;"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>';

    var $li = $('<li>')
        .attr('id', 'ca-download-page')
        .addClass('mw-list-item');

    var $a = $('<a>')
        .attr('href', '#')
        .attr('title', 'Download this page in its true source format')
        .html(svgIcon + '<span>Download file</span>')
        .css({
            'cursor': 'pointer',
            'display': 'inline-flex',
            'align-items': 'center',
            'text-decoration': 'none'
        });

    $li.append($a);
    
    // Insert neatly before the Discussion tab if present
    var $discussionTab = $('#ca-talk, #ca-discussion');
    if ($discussionTab.length) {
        $discussionTab.before($li);
    } else {
        $navContainer.append($li);
    }

    // Safe multi-version API call
    $a.click(function(e) {
        e.preventDefault();
        
        new mw.Api().get({
            action: 'query',
            prop: 'revisions',
            titles: pageName,
            rvprop: 'content|contentmodel', // Safely pulls format model without needing multi-slot syntax
            formatversion: 2
        }).done(function(data) {
            // Check if page records exist safely
            if (data && data.query && data.query.pages && data.query.pages[0]) {
                var page = data.query.pages[0];
                
                if (page.revisions && page.revisions[0]) {
                    var revision = page.revisions[0];
                    var content = '';
                    var contentModel = '';

                    // Fallback check to avoid structural crashes completely
                    if (revision.slots && revision.slots.main) {
                        content = revision.slots.main.content;
                        contentModel = revision.slots.main.contentmodel;
                    } else {
                        // Older MediaWiki layout configuration
                        content = revision.content;
                        contentModel = revision.contentmodel;
                    }
                    
                    var extension = '.wiki';
                    var mimeType = 'text/plain;charset=utf-8';
                    
                    if (contentModel === 'javascript') {
                        extension = '.js';
                        mimeType = 'application/javascript;charset=utf-8';
                    } else if (contentModel === 'css') {
                        extension = '.css';
                        mimeType = 'text/css;charset=utf-8';
                    } else if (contentModel === 'json') {
                        extension = '.json';
                        mimeType = 'application/json;charset=utf-8';
                    }
                    
                    var blob = new Blob([content], { type: mimeType });
                    var url = URL.createObjectURL(blob);
                    var downloadLink = document.createElement('a');
                    
                    var safeFileName = pageName.replace(/:/g, '_');
                    
                    downloadLink.href = url;
                    downloadLink.download = safeFileName + extension; 
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                } else {
                    alert('No revision history found for this page.');
                }
            } else {
                alert('Could not retrieve page content.');
            }
        });
    });
});