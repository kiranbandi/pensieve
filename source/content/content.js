$(function() {

    readWearStore = {};

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.message.indexOf('pensieve') > -1) {
                // remove "pensieve" from the message and pass it on
                pensieveRequestHandler(request.message.slice(9));
            }
        }
    );

    function pensieveRequestHandler(message) {
        if (message.indexOf('start') > -1) {
            attachReadwearBox();
        } else if (message.indexOf('stop') > -1) {
            deattachReadwearBox();
        }

    }

    function attachReadwearBox() {
        var jbrowseContainer = $('.jbrowse');
        // Check if JBrowse has loaded up , if not throw a message 
        //  and ask them to use the extension again.
        if ($(".dragWindow").length > 0) {
            // Also check if there is an existing instance of readwear , if yes ignore the start
            if ($("#readwear-content-root").length == 0) {
                var readwearBox = $("<div/>") // creates a div element
                    .attr("id", "readwear-content-root") // adds the id
                    .css($(".dragWindow").css(['left', 'top', 'width', 'position']))
                    .html("<h2>Readwear Content will appear here</h2>");

                jbrowseContainer.append(readwearBox);
                $('#readwear-content-root').mousedown(attachVerticalDrag);
                // call window scope code
                addWindowScopeCode(chrome.extension.getURL('content/window.js'));
            }
        } else {
            alert('Sorry JBrowse hasnt loaded up yet for the extension to act on, please wait for JBrowse to load up and then click start again.')
        }
    }


    function deattachReadwearBox() {
        $('#readwear-content-root').remove();
    }

    function addWindowScopeCode(file_path) {
        var node = document.getElementsByTagName('div')[0];
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', file_path);
        node.appendChild(script);
    }


    function attachVerticalDrag(e) {
        readWearStore.drag = {};
        readWearStore.drag.pageY0 = e.pageY;
        readWearStore.drag.elem = this;
        readWearStore.drag.offset0 = $(this).offset();

        function handle_dragging(e) {
            var top = readWearStore.drag.offset0.top + (e.pageY - readWearStore.drag.pageY0);
            $(readWearStore.drag.elem)
                .offset({ top: top });
        }
        // remove handlers once the user leaves the mouse
        function handle_mouseup(e) {
            $('#readwear-content-root')
                .off('mousemove', handle_dragging)
                .off('mouseup', handle_mouseup);
        }
        // attach event handlers when mouse is down
        $('#readwear-content-root')
            .on('mouseup', handle_mouseup)
            .on('mousemove', handle_dragging);
    }
})