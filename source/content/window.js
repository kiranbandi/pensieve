// This script runs in the scope of the host page 
// Here we dont do a lot , we just subscribe to the navigation event
// so when the user moves the the tracker on top we can listen to it 
// and forward the message onto the content script

dojo.subscribe("/jbrowse/v1/n/navigate", function(location) {
    window.postMessage({ 'type': 'window_to_content', 'location': location }, '*');
});

// we also listen to navigation events from the content script
// so if a users publishes a "navigate to" message we move the jbrowse tracker to that position
window.addEventListener('message', function(event) {
    var messageData = event.data;
    if (messageData.type && messageData.type == 'content_to_window') {
        JBrowse.navigateToLocation(messageData.location);
    }
});