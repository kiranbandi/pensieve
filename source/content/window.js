// This script runs in the scope of the host page 
// Here we dont do a lot , we just subscribe to the navigation event
// so when the user moves the the tracker on top we can listen to it 
// and forward the message onto the content script

dojo.subscribe("/jbrowse/v1/n/navigate", function(location) {
    location.left = +document.getElementsByClassName('locationThumb')[0].style.left.split("px")[0];
    location.width = +document.getElementsByClassName('locationThumb')[0].style.width.split("px")[0];
    window.postMessage({ 'type': 'window_to_content_location', 'location': location }, '*');
});

// we also listen to navigation events from the content script
// so if a users publishes a "navigate to" message we move the jbrowse tracker to that position
window.addEventListener('message', function(event) {
    var messageData = event.data;
    if (messageData.type && messageData.type == 'content_to_window') {
        JBrowse.navigateToLocation({ ref: messageData.ref.name, start: messageData.ref.start, end: messageData.ref.end });
    }
});

// As soon as JBrowse is loaded up we send a list of all keys to the content for refernce map
JBrowse.afterMilestone('completely initialized', function() {

    var location = {},
        currentString = JBrowse.config.location.split(":");

    location = {
        'ref': currentString[0],
        'start': currentString[1].split("..")[0],
        'end': currentString[1].split("..")[1],
        'left': +document.getElementsByClassName('locationThumb')[0].style.left.split("px")[0],
        'width': +document.getElementsByClassName('locationThumb')[0].style.width.split("px")[0]
    };

    window.postMessage({ 'type': 'window_to_content_initialize', 'allRefs': Object.keys(JBrowse.allRefs), 'location': location }, '*');

});