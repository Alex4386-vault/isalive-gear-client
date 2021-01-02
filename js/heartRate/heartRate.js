var gotPermission = false;
var currentHeartRate = 87;
var heartRateDisplay = document.getElementById("heart-rate");
var webSocket = null;

var lastUpdate = new Date();
var enableWebsocket = document.getElementById("enable-websocket");
var battery = navigator.getBattery();

function getBattery() {
	return navigator.battery || navigator.webkitBattery || navigator.mozBattery;
}

function requestPermission(onSuccess, onError) {
	tizen.ppm.requestPermission("http://tizen.org/privilege/healthinfo", function(e) {
		gotPermission = true;
		onSuccess(e);
	}, onError);	
}

function onInit() {
	requestPermission(
		function () {
		},
		function () {
			alert("Failed to obtain permission, Exiting...");
			tizen.application.getCurrentApplication().exit();
		}
	);	
}

function triggerHeartRateUpdate(hrmData) {
	tizen.humanactivitymonitor.stop('HRM');
	heartRateUpdate(hrmData.heartRate);
}

function updateWebSocket() {
	if (enableWebsocket.checked) {
		if (webSocket === null) {
			webSocket = new WebSocket(document.getElementById("websocket-host").value);
			webSocket.onclose = function() {
				webSocket = null;
			};
		} else {
			if (webSocket.readyState === 1 && new Date().getTime() - lastUpdate.getTime() >= 1000) {
				lastUpdate = new Date();
				battery = getBattery();
				webSocket.send(JSON.stringify({
					heartRate: currentHeartRate,
					battery: {
						charging: battery.charging,
						level: battery.level
					},
					update: lastUpdate
				}));
			}
		}
	}
}

function heartRateUpdate(heartRate) {
	currentHeartRate = heartRate;
	
	updateWebSocket();
	
	if (currentHeartRate <= 0) {
		heartRateDisplay.innerHTML = "inactive";
	} else {
		heartRateDisplay.innerHTML = currentHeartRate;
	}
}

function getHeartRate() {
	tizen.humanactivitymonitor.getHumanActivityData(
		'HRM', 
		function(hrmInfo) {
			console.log(hrmInfo.heartRate);
		}, 
		function(error) {
			console.error(error);
		}
	);
}

onInit();

setInterval(function() {
	if (!battery.charging) {
		tizen.humanactivitymonitor.start('HRM', triggerHeartRateUpdate);
	}
	updateWebSocket();
}, 1000);






