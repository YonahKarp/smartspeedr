// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

this.state = {
  activated: false,
  baseSpeed: 1,
  video: true
}

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(sender.tab)
      chrome.pageAction.show(sender.tab.id);
    console.log('background recieve message: ', request)
    sendResponse("ollo");

    setState(request)
});

function setState(request){
  switch (request.type){
    case 'activateSmartSpeed':
      this.state.activated = request.value
      if(!this.state.activated)
        this.state.video = true;
      break;
    case 'setBaseSpeed':
      this.state.baseSpeed = request.value
      break;
    case 'noVideo':
      this.state.video = false;
    default:
      console.log('no state defined for message type')
  }
}

