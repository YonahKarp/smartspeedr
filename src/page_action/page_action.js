let slider = document.getElementById('speedSlidr');
let labels = document.getElementById('speedLabels');
let activateSwitch = document.getElementById('activate');
let mediaList = document.getElementById('mediaList');
let rate = document.getElementById('rate')

let valMap = [1.1, 1.15, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3]
let bgPage = chrome.extension.getBackgroundPage();

// let status = bgPage.getLicenseStatus()

// if(status == "EXPIRED" || true){
//     document.body.className = '';
//     document.body.classList.add('expired')
// }
    

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log('page_action recieve message: ', request)

        switch(request.type){
            case 'noVideo':
                document.body.className = '';
                document.body.classList.add('noVideo')
                break;
            case 'multipleMedia':
                document.body.className = '';
                document.body.classList.add('mutipleMedia')
                createMediaList(request)
                break;
            case 'newRate':
                rate.innerHTML = setRate(request.value)
                break;
            default:
                ;
        }

        sendResponse()
    }
);

//get back page's previous state
let msg = {
    type: 'popupOpened'
}
sendMessageToInject(msg, function(response){
    activateSwitch.checked = response.active
    slider.value = response.baseSpeed ? valMap.indexOf(response.baseSpeed) : 0;
    rate.innerHTML = setRate(response.baseSpeed || 1);

    if(response.active)
        document.body.classList.add('showSlider')
})


slider.addEventListener("input", function(e) {
    let value = e.target.value
    for(element of labels.children) {
        element.classList.remove('active')
    };

    labels.children[value].classList.add('active')

    let message = {
        type: 'setBaseSpeed',
        value: valMap[value]
    }

    rate.innerHTML = setRate(valMap[value]);

    chrome.extension.sendMessage(message, function(response) {})
    sendMessageToInject(message)
});

activateSwitch.addEventListener('change', function(e){
    if(e.target.checked){
        document.body.classList.add('showSlider')
    }else{
        document.body.className = '';
        mediaList.innerHTML = ''
    }

    let message = {
        type: 'activateSmartSpeed',
        value: e.target.checked
    }

    chrome.extension.sendMessage(message, function(response) {})
    sendMessageToInject(message)
})

function createMediaList(request){
    mediaList.innerHTML = ''
    request.mediaList.forEach((el,i) => {
         let mediaElement = document.createElement("div");

         mediaElement.classList.add('mediaElement');
         if(i == 0)
             mediaElement.classList.add('active');

         mediaElement.onmouseenter = function(ev){
             let message = {
                 type: 'mediaOver',
                 value: el.index
             }

             sendMessageToInject(message)
         }
         mediaElement.onmouseleave = function(ev){

            let message = {
                type: 'mediaOut',
                value: el.index
            }

            sendMessageToInject(message)
        }

        mediaElement.onclick = function(ev){

            let message = {
                type: 'mediaSelect',
                value: el.index
            }

            for(el of mediaList.children) {
                el.classList.remove('active')
            };

            mediaElement.classList.add('active')

            sendMessageToInject(message)
        }


         mediaElement.innerHTML = `
            ${el.poster ? `<img class="posterImg" src="${el.poster}">` : ''}
            <div class="mediaLabel">${el.label ? el.label : ''}: ${el.src}</div>
         `

         mediaList.append(mediaElement)
    })
}

function setRate(value){
    return (+value).toPrecision(3)
}

function sendMessageToInject(message, callback = function(){}){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, message, callback);  
    })
}

//authorization
// let authButton = document.getElementById('authButton');

// authButton.addEventListener('click', function(e){
//     e.target.classList.add('disable')
//     bgPage.getLicense(function(licenseStatus){
//         console.log(licenseStatus)
//     })
// })

