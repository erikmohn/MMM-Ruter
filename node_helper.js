/* Magic Mirror
 * Node Helper: Vindsiden
 *
 * By Erik Mohn
 *
 * Forked from https://github.com/CatoAntonsen/MMM-Ruter
 *
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var http = require("http");
var async = require("async");
var crypto = require("crypto");
var moment = require("moment");

module.exports = NodeHelper.create({
	start: function() {
		console.log("Starting module: " + this.name);
	},

	socketNotificationReceived: function(notification, config) {
		if (notification === "CONFIG") {
			this.config = config;
			this.allLocations = [];
			this.lastMD5 = [];
			this.initPolling();
			return;
		}
	},

	initPolling: function() {
		var self = this;

		for(var i=0; i < this.config.locations.length; i++) {
			this.allLocations.push(this.config.locations[i]);
		}
		
		this.startPolling();
		
		setInterval(function() {
			self.startPolling();
		}, this.config.serviceReloadInterval);
	},
	
	startPolling: function() {
		var self = this;

		async.map(this.allLocations, this.getLocationInfo, function(err, result) {
			var locations = [];
			for(var i=0; i < result.length; i++) {
				locations = locations.concat(result[i]);
			}

			locations = locations.slice(0, self.config.maxItems);

			if (self.hasChanged("locations", locations)) {
				self.sendSocketNotification("VINDSIDEN_UPDATE", locations);
			}
		});
	},
	
	hasChanged: function(key, value) {
		var md5sum = crypto.createHash("md5");
		md5sum.update(JSON.stringify(value));
		var md5Hash = md5sum.digest("hex");
		if (md5Hash != this.lastMD5[key]) {
			this.lastMD5[key] = md5Hash;
			return true;
		} else {
			return false;
		}
	},
	
	getLocationInfo: function(locationItem, callback) {
		var str = "";

		var responseCallback = function(response) {
			response.on("data", function(chunk) {
				str += chunk;
			});
			
			response.on("end", function() {

			var locations = JSON.parse(str);

			var allLocationItems = new Array();

			var location = locations;
			//if (location.Data[0] != null) {
				allLocationItems.push({
					locationId: locationItem.locationId,
					locationName: location.Name,
					time: location.LastMeasurementTime,
					windspeed: Math.round(location.Data[0].WindAvg),
					windgust: Math.round(location.Data[0].WindMax),
					winddirection: degreesToDirection(location.Data[0].DirectionAvg)
				});
				callback(null, allLocationItems);
			//}

			});

			response.on("error", function(error) {
				console.error("------------->" + error)
			});
		}

		var dateParam = ""

		//http://vindsiden.no/api/stations/1?n=10
		var options = {
			host: "vindsiden.no",
			path: "/api/stations/" + locationItem.locationId + "?n=1"
		};
		http.request(options, responseCallback).end();	
	}
});

function degreesToDirection(num) {
	var val = Math.floor((num / 22.5) + 0.5);
	var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
	return arr[(val % 16)];
}