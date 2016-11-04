Module.register("MMM-vindsiden",{

	// Default module config.
	defaults: {
		showHeader: false, 				// Set this to true to show header above the journeys (default is false)
		maxItems: 10,					// Number of journeys to display (default is 5)
		serviceReloadInterval: 30000, 	// Refresh rate in MS for how often we call Ruter's web service. NB! Don't set it too low! (default is 30 seconds)
		timeReloadInterval: 1000, 		// Refresh rate how often we check if we need to update the time shown on the mirror (default is every second)
		animationSpeed: 1000, 			// How fast the animation changes when updating mirror (default is 1 second)
		fade: false,					// Set this to true to fade list from light to dark. (default is true)
		fadePoint: 0.25 				// Start on 1/4th of the list.
	},

	getStyles: function () {
		return ["vindsiden.css"];
	},

	getScripts: function() {
		return ["moment.js"];
	},

	getTranslations: function() {
		return {
			en: "translations/en.json",
			nb: "translations/nb.json"
		}
	},

	start: function() {
		console.log(this.translate("STARTINGMODULE") + ": " + this.name);

		this.locations = [];
		this.previousTime = [];

		this.sendSocketNotification("CONFIG", this.config);

		var self = this;

		setInterval(function() {
			self.updateDomIfNeeded();
		}, this.config.timeReloadInterval);

	},

	socketNotificationReceived: function(notification, payload) {
		console.log("socketNotificationReceived UPDATE");
		if (notification === "VINDSIDEN_UPDATE") {
			this.locations = payload;
			console.log("UPDATE with: " + payload);
		}
	},

	getDom: function() {
		console.log("getDom");
		if (this.locations.length > 0) {

			var table = document.createElement("table");
			table.className = "vindsiden small";

			if (this.config.showHeader) {
				table.appendChild(this.getTableHeaderRow());
			}

			for(var i = 0; i < this.locations.length; i++) {

				var tr = this.getTableRow(this.locations[i]);

				// Create fade effect. <-- stolen from default "calendar" module
				if (this.config.fade && this.config.fadePoint < 1) {
					if (this.config.fadePoint < 0) {
						this.config.fadePoint = 0;
					}
					var startingPoint = this.locations.length * this.config.fadePoint;
					var steps = this.locations.length - startingPoint;
					if (i >= startingPoint) {
						var currentStep = i - startingPoint;
						tr.style.opacity = 1 - (1 / steps * currentStep);
					}
				}

				table.appendChild(tr);
			}

			return table;
		} else {
			var wrapper = document.createElement("div");
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "small dimmed";
		}

		return wrapper;
	},

	getTableHeaderRow: function() {
		var thLocation = document.createElement("th");
		thLocation.className = "light";
		thLocation.appendChild(document.createTextNode(this.translate("LOCATIONHEADER")));

		var thWindspeed = document.createElement("th");
		thWindspeed.className = "light";
		thWindspeed.appendChild(document.createTextNode(this.translate("WINDSPEEDHEADER")));

		var thGusts = document.createElement("th");
		thGusts.className = "time light";
		thGusts.appendChild(document.createTextNode(this.translate("GUSTHEADER")));

		var thDirection = document.createElement("th");
		thDirection.className = "light time"
		thDirection.appendChild(document.createTextNode(this.translate("DIRECTIONHEADER")));

		var thead = document.createElement("thead");
		thead.addClass = "xsmall dimmed";
		thead.appendChild(thLocation);
		thead.appendChild(thWindspeed);
		thead.appendChild(thGusts);
		thead.appendChild(thDirection);

		return thead;
	},

	getTableRow: function(location) {
		var tdLocation = document.createElement("td");

		if(location.windspeed >= 6) {
			tdLocation.className = "destination bright yellow";
		} else {
			tdLocation.className = "destination bright";
		}

		var txtLocation = document.createTextNode(location.locationName);

		tdLocation.appendChild(txtLocation);

		var tdWindspeed = document.createElement("td");
		tdWindspeed.className = "time light";
		tdWindspeed.appendChild(document.createTextNode(location.windspeed));

		var tdGust = document.createElement("td");
		tdGust.className = "time light";
		tdGust.appendChild(document.createTextNode(location.windgust));

		var tdDirection = document.createElement("td");
		tdDirection.className = "time light";
		tdDirection.appendChild(document.createTextNode(location.winddirection));

		var tr = document.createElement("tr");
		tr.appendChild(tdLocation);
		tr.appendChild(tdWindspeed);
		tr.appendChild(tdGust);
		tr.appendChild(tdDirection);

		return tr;
	},

	updateDomIfNeeded: function() {
		var needUpdate = false;

		for(var i=0; i < this.locations.length; i++)  {
			var time = this.locations[i].time;
			if (this.previousTime[i] != time) {
				needUpdate = true;
				this.previousTime[i] = time;
			}
		}

		if (needUpdate) {
			this.updateDom(this.config.animationSpeed);
		}
	},


});
