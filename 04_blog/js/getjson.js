//getJSON from http://youmightnotneedjquery.com/
function getJSON(url, successCallback) {
	var request = new XMLHttpRequest();
	request.open("GET", url, true);

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) {
			// Success!
			var data = JSON.parse(request.responseText);
			successCallback(data)
		} else {
			// We reached our target server, but it returned an error
			console.log("getJSON '" + url + "' failed")
			console.log(request)
		}
	};

	request.onerror = function() {
		// There was a connection error of some sort
		console.log("getJSON '" + url + "' error")
		console.log(request)
	};

	request.send();
}
