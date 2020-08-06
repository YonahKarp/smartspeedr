Object.defineProperty(HTMLMediaElement.prototype, 'isPlaying', {
    get: function(){
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})

chrome.extension.sendMessage({}, function(response) {
	let readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hello. This message was sent from scripts/inject.js");
		// ----------------------------------------------------------		
	}
	}, 100);
});

let mediaNodeList
let overlayNode

let media;
let context;
let src;
let analyser;
let dataArray;

let basePlaybackRate = 1;
let intervalId;


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log('inject recieved message:', JSON.stringify(request))
		
		switch (request.type){
			case 'activateSmartSpeed':
				if(request.value)
					initialSetup();
				else
					clearInterval(intervalId);
				break;
			case 'setBaseSpeed':
				basePlaybackRate = request.value
				break;
			case 'mediaOver':
				overlaySVG(mediaNodeList[request.value])
				break;
			case 'mediaOut':
				document.body.removeChild(overlayNode)
				break;
			default:
				console.log('no action defined for message type')
		}
	}
);

function initialSetup(){
	mediaNodeList = document.querySelectorAll('video, audio');

	if(mediaNodeList.length == 0){
		chrome.extension.sendMessage({type: 'noVideo', video: false}, function(response) {})
		return
	} else if (mediaNodeList.length > 1){
		let mediaList = [...mediaNodeList].map((media, i)=>{ return {
			index: i,
			poster: media.poster,
			src: media.src,
			label: media.ariaLabel
		}})
		chrome.extension.sendMessage({type: 'multipleMedia', mediaList}, function(response) {})
		return
	}else{
		media = mediaNodeList[0];
	}
	
	if(context){
		if(media.isPlaying)
			startAnalyzer()
		return
	}

	//To:do handle volume scaling
	context = new AudioContext();
    src = context.createMediaElementSource(media);
	analyser = context.createAnalyser();

	src.connect(analyser);
	analyser.connect(context.destination);

	analyser.fftSize = 32;
	analyser.smoothingTimeConstant = 0.2;

	let bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);

	if(media.isPlaying)
		startAnalyzer()
}

function startAnalyzer(){

	function analyseDbLevels(){
		analyser.getByteFrequencyData(dataArray)

		let volumeMultiplier = media.isMuted ? 0 : media.volume 

		let silenceThreshold = 90*volumeMultiplier
		let slicedArray = dataArray.slice(3)
		let peak = Math.max(...slicedArray)
		//TO:DO adjust for volume
		if(peak < silenceThreshold){
			let k = 0.02 * ((3 - basePlaybackRate)/2);
			let newRate = basePlaybackRate + Math.min( (silenceThreshold - peak)*k, 1);
			media.playbackRate = newRate
			console.log("newRate set to ", newRate)
			chrome.extension.sendMessage({type: 'newRate', value: newRate}, function(response) {})
		}else{
			if(media.playbackRate != basePlaybackRate){
				media.playbackRate = basePlaybackRate
				chrome.extension.sendMessage({type: 'newRate', value: basePlaybackRate}, function(response) {})
			}
		}
	}
	
	intervalId = setInterval(analyseDbLevels, 100)

	media.onpause = function(){clearInterval(intervalId)}
	media.onended = function(){clearInterval(intervalId)}

	media.onplay = function(){
		clearInterval(intervalId)
		console.log("onPlay")
		intervalId = setInterval(analyseDbLevels, 100)
	}

}

function overlaySVG(el){
	if(overlayNode && overlayNode.parent)
		document.body.removeChild(overlayNode)

	let rect = el.getBoundingClientRect()
	//TO:DO fetch new if all zeros

	overlayNode = document.createElement('div');
	overlayNode.style = `height: ${rect.height}px; width: ${rect.width}px; position: fixed; z-index: 1; top: ${rect.top}px; left: ${rect.left}px; background: rgba(20,20,120, .5);`

	document.body.prepend(overlayNode)
}


// function setNewPlaybackRate(targetRate, media){
// 	var newplaybackRate;
// 	var currentRate = media.playbackRate
	
// 	if(targetRate == currentRate)
// 		return
// 	else if(targetRate > currentRate){
// 		newplaybackRate = currentRate + Math.min(.1, targetRate - currentRate);
// 	} else{
// 		newplaybackRate = currentRate - Math.min(.1, currentRate - targetRate)
// 	}

// 	console.log("speed set to: ", newplaybackRate)
// 	media.playbackRate = newplaybackRate
// }