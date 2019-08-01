$(function() {

    readWearStore = {};

    var readHistory = {};
    var currentStore = {};
    var resetTime = 5000;
    var markReadWearTimer;

    // socket instance
    var socket = false;
    var socket = io('http://localhost:8080');

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
            if (message.indexOf('checked') > -1) {
                // also start tracking user movement and send to the socket
                socket = io('http://localhost:8080');
            }
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
                    .css($(".dragWindow").css(['left', 'top', 'width']));

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
            $('body')
                .off('mousemove', handle_dragging)
                .off('mouseup', handle_mouseup);
        }
        // attach event handlers when mouse is down
        $('body')
            .on('mouseup', handle_mouseup)
            .on('mousemove', handle_dragging);
    }



    window.addEventListener('message', function(event) {

        var messageData = event.data;

        if (messageData.type) {

            if (messageData.type == 'window_to_content_location') {
                var location = messageData.location;
                // reset read wear tracking with new position by passing width and left position
                resetReadwearTimer(location.width, location.left, { name: location.ref, start: location.start, end: location.end });
            }

            if (messageData.type == 'window_to_content_initialize') {

                // reset read history
                readHistory = {};
                currentStore = {};

                // get location information
                var location = messageData.location;

                // populate read history with all the reference sequences the Jbrowse instance has
                messageData.allRefs.map((refSeqID) => {
                    readHistory[refSeqID] = Array.apply(null, Array(5)).map(() => ({ 'width': 0, 'left': 0, 'duration': 0, 'ref': {} }))
                });


                // create readwear-blocks on the readwear pane
                readHistory[location.ref].map(function(readwearBlock, iterator) {


                    var readwearMarker = $("<div/>")
                        .attr("id", "store-" + iterator)
                        .attr("class", "readwear-block")
                        .css({
                            'width': readwearBlock.width + 'px',
                            'left': readwearBlock.left + 'px',
                            'top': (((+iterator) * 12) + 2.5) + 'px'
                        })
                        .on('click', function() {
                            var historyTag = readHistory[currentStore.refName][this.id.split("-")[1]];
                            window.postMessage({ 'type': 'content_to_window', 'ref': historyTag.ref }, '*');
                        });


                    $("#readwear-content-root").append(readwearMarker);

                });

                // Initialize the timer
                markReadWearTimer = new Timer(() => {
                    // add a new readwear marker by pushing a clone of the object 
                    // objects are copied by refernce in javascript :-D
                    if (currentStore.refName) {
                        var lastElement = readHistory[currentStore.refName][readHistory[currentStore.refName].length - 1];
                        if (currentStore.width < 400 && (lastElement.width != currentStore.width || lastElement.left != currentStore.left)) {
                            // shallow clone again
                            readHistory[currentStore.refName].push(JSON.parse(JSON.stringify(currentStore)));
                            //  remove the oldest marker
                            readHistory[currentStore.refName] = readHistory[currentStore.refName].slice(1, 6);
                            // trigger change on DOM
                            updateReadwearBlocks();
                        }
                    }
                    markReadWearTimer.stop();
                }, resetTime);

                // Start the timer
                resetReadwearTimer(location.width, location.left, { name: location.ref, start: location.start, end: location.end });

            }

        }

    });


    var resetReadwearTimer = function(width, left, ref) {

        // if refname has changed then trigger an update ,
        // because this means user has switched sequences
        if (ref.name != currentStore.refName) {
            currentStore.refName = ref.name;
            currentStore.width = width;
            currentStore.left = left;
            // shallow cloning by value
            currentStore.ref = JSON.parse(JSON.stringify(ref));
            updateReadwearBlocks();
        }

        markReadWearTimer.reset(resetTime);
        currentStore.width = width;
        currentStore.left = left;
        // shallow cloning by value
        currentStore.ref = JSON.parse(JSON.stringify(ref));
        currentStore.refName = ref.name;
    }

    var updateReadwearBlocks = function() {
        document.querySelectorAll('#readwear-content-root .readwear-block').forEach((element, iterator) => {
            element.style.width = readHistory[currentStore.refName][iterator].width + 'px';
            element.style.left = readHistory[currentStore.refName][iterator].left + 'px';
        });
    }

    var socketSend = function(tag, data) {

        // if the connection is open then send the message if not skip
        if (socket) {


        }
    }
})







//  code sourced from stackoverflow - https://stackoverflow.com/questions/8126466/how-do-i-reset-the-setinterval-timer
function Timer(fn, t) {
    var timerObj = setInterval(fn, t);

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }

    // start timer using current settings (if it's not already running)
    this.start = function() {
        if (!timerObj) {
            this.stop();
            timerObj = setInterval(fn, t);
        }
        return this;
    }

    // start with new interval, stop current interval
    this.reset = function() { return this.stop().start() };
}