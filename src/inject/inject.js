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


let video;
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
			default:
				console.log('no action defined for message type')
		}
	}
);

function initialSetup(){
	video = document.querySelector('video') || document.querySelector('audio');

	if(video == null){
		chrome.extension.sendMessage({type: 'noVideo', video: false}, function(response) {})
		return
	}
	
	if(context){
		startAnalyzer()
		return
	}

	context = new AudioContext();
    src = context.createMediaElementSource(video);
	analyser = context.createAnalyser();

	src.connect(analyser);
	analyser.connect(context.destination);

	analyser.fftSize = 32;
	analyser.smoothingTimeConstant = 0.2;

	let bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);

	startAnalyzer()
}

function startAnalyzer(){

	function analyseDbLevels(){
		analyser.getByteFrequencyData(dataArray)

		let silenceThreshold = 90
		let slicedArray = dataArray.slice(3)
		let peak = Math.max(...slicedArray)
		if(peak < silenceThreshold){
			let k = 0.02 * ((3 - basePlaybackRate)/2);
			let newRate = basePlaybackRate + Math.min( (silenceThreshold - peak)*k, 1);
			video.playbackRate = newRate
			console.log("newRate set to ", newRate)
		}else{
			video.playbackRate = basePlaybackRate
		}

	}
	
	intervalId = setInterval(analyseDbLevels, 100)

	video.onpause = function(){
		console.log("onPause")

		clearInterval(intervalId)
	}

	video.onplay = function(){
		clearInterval(intervalId)
		console.log("onPlay")
		intervalId = setInterval(analyseDbLevels, 100)
	}

}

function setNewPlaybackRate(targetRate, video){
	var newplaybackRate;
	var currentRate = video.playbackRate
	
	if(targetRate == currentRate)
		return
	else if(targetRate > currentRate){
		newplaybackRate = currentRate + Math.min(.1, targetRate - currentRate);
	} else{
		newplaybackRate = currentRate - Math.min(.1, currentRate - targetRate)
	}

	console.log("speed set to: ", newplaybackRate)
	video.playbackRate = newplaybackRate
}