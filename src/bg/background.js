// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

//TO:DO implement timeSaved
let settings = new Store("settings", {
  timeSaved: 0,
  isFullMember: false
});

if(!settings.get('installDate')){
  settings.set('installDate', new Date())
}

// this.hasLicense = !!settings.get('license')


chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(sender.tab)
      chrome.pageAction.show(sender.tab.id);
    console.log('background recieve message: ', request)
    sendResponse();

    switch(request.type){
      case 'newRate':
          settings.set('timeSaved', settings.get('timeSaved') + (request.value - request.basePlaybackRate)*.1)

          break;
      default:
    }
});

/**
this.verifyAndSaveLicense = function(license){
  settings.set('license', license)
  if(license.accessLevel === "FULL")
    settings.set('isFullMember', true)
}

this.getLicense = function(callback = function(){}){
  // let msThirtyDays = 30*24*60*60*1000
  // let timeDiff = new Date() - +license.createdTime

  if(settings.get('isFullMember'))
    return callback("FULL")

  // let msSinceLastCheck = new Date() - settings.get('lastLicenseRetreval');
  // if(!this.hasLicense || msOneDay < msSinceLastCheck ){
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      try{

      let params = {
        method: 'GET',
        async: true,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        'contentType': 'json'
      };
      fetch(
          'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/',
          params)
          .then((response) => response.json())
          .then(function(data) {
              var license = data
              bgPage.verifyAndSaveLicense(license);
              console.log(data)

              let licenseStatus = getLicense(license)
              callback(licenseStatus)
          });
        } catch(err){
          console.log(err)
          callback("ERR")
        }
    });
  // }

}

this.getLicenseStatus = function(){

  let license = settings.get('license') || {}

  if(license.accessLevel === "FULL")
    return "FULL"
  else{
    let installDate = settings.get('installDate');
    let msThirtyDays = 30*24*60*60*1000;
    let timeDiff = new Date() - installDate;

    return timeDiff > msThirtyDays ? "EXPIRED" : "TRIAL"
  
  } 
}
**/