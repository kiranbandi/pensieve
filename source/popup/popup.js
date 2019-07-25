$(function() {
    $('#start').click({ 'message': 'pensieve start' }, sendMessageToContent);
    $('#stop').click({ 'message': 'pensieve stop' }, sendMessageToContent);
})

function sendMessageToContent(event) {
    // if the record checkbox is on send record along with all messages
    event.data.message += $("#datacheck").is(':checked') ? ' record' : '';
    //  send message here to activate the extension on the page 
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { "message": event.data.message });
    });
}