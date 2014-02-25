/************************
	HELPER
************************/
var Helper = {
	btnState : {
		active: 0,
		disabled: 1,
		inactive: 2
	},

	gameState : {
		development: 0,
		launchReady: 1,
		active: 2,
		inactive: 3
	},

	btnClass : function (state) {
		switch (state) {
			case Helper.btnState.active: return "state_active";
			case Helper.btnState.disabled: return "disabled"; //for bootstrap
			case Helper.btnState.inactive: return "state_inactive";
		}
	},

	gameData : {
		genres : ["adventure", "stratergy", "arcade", "clicking", "shooter", "educational", "simulation"],
		concepts : ["tetris", "age of empires", "chess"],
		target_ages : ["0 to 10", "10 to 20", "20 to 30", "30 to 5000"]
	},

	randNum : function(min, max) {
		return Math.floor((Math.random()*max)+min);
	},

	initGameData : function(_name, _genre, _concept, _target) {
		var output = {
			state: Helper.gameState.development,
	        name : _name,
	        genre : _genre,
	        concept : _concept,
	        target : _target,
	        stats : {
	            innovation : 1,
	            optimisation : 1,
	            quality : 1
	        },
	        timeCreated : Helper.getUnixTimestamp(),
	        timeLaunched : 0,
	        timeLastCollected: 0,
	        devProgress : 1,
	        popularity : 1, 
	        peak : 0,
	        rate : 0,
	        ppu : 0
	    };
	    return output;
    },

	initUserData : function(companyname) {
		var output = {
			company : {
				name : companyname,
				currency: 1000,
				prem_currency: 50,
				xp: 1,
				level: 1,
				timestamp: 0,
				created: Helper.getUnixTimestamp()
			},
			workers : [Helper.createWorker(4, Helper.randName(), 1)],
		};

		return output;
	},

	DefaultData : function() {
		var output = {
			company : {
				name : "",
				currency: 0,
				prem_currency: 0,
				xp: 1,
				level: 1,
				timestamp: 0,
				created: 0
			},
			workers : new Array(),
			games: new Array(),
		};

		return output;
	},

	removeWorker : function(index, oldArray) {
		var output = new Array();
		for (i = 0; i < oldArray.length; ++i) {
			if (i != index) 
				output.push(oldArray[i]);
		}
		return output;
	},

	createWorker : function(_slotid, _name, _level) {
		return { slotid: _slotid, name: _name, level: _level, progress: 0, timestamp: 0 }
	},

	calculateTimeleft : function(timestamp, wait_period) {
		var target_time = timestamp + wait_period;
		var timenow = Helper.getUnixTimestamp();

		if (target_time > timenow)
			return (target_time - timenow);
		else 
			return 0;
	},

	getUnixTimestamp : function() {
		//get time and convert it to unix (seconds)
		var milliseconds = new Date().getTime();
		return Math.round(milliseconds/1000);
	},

	getPercentage : function(val, max) {
		var percent = max / 100;
		return (percent * val);
	},

	createPercentage : function(val, max) {
		var percent = 100 / max;
		return (percent * val);
	},

	readableTimestamp : function(timestamp) {
		var date = new Date(timestamp * 1000);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();

		if (hours <= 0) {
			if (minutes <= 0)
				return seconds + " seconds";
			else
				return minutes + " minutes and " + seconds + " seconds";
		}
		else
			return hours + " hours " + minutes + " minutes and " + seconds + " seconds";
	},

	get_vbar_style : function(value) {
		return {top: (100-value)+"%"};
	},

	get_hbar_style : function(value) {
		return {right: (100-value)+'%'};
	},

	inGameYear : 4000, //86400

	calculateGameYears: function(timestamp) {
		var diff = Helper.getUnixTimestamp() - timestamp;
		var multiple = diff / Helper.inGameYear;
		return Math.floor(multiple);
	},

	calculateGameMonths: function(timestamp) {
		var diff = Helper.getUnixTimestamp() - timestamp;
		var multiple = diff / Helper.inGameYear;
		var year = Math.floor(multiple);
		return Math.floor((multiple - year) * 12);
	},

	calculateGameTimestamp: function(timestamp) {
		var diff = Helper.getUnixTimestamp() - timestamp;
		var years = Helper.calculateGameYears(timestamp);
		var years_stamp = years * Helper.inGameYear;
		var remaining = diff - years_stamp;
		return Helper.getUnixTimestamp() - remaining;
	},

	formatUnixTimestamp : function(timestamp) {
		var date = new Date(timestamp * 1000);
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();

		if (hours <= 0) {
			if (minutes <= 0) {
				return Helper.DD(seconds) + "s";
			}
			else {
				return Helper.DD(minutes) + ":" + Helper.DD(seconds);
			}
		}
		else {
			return Helper.DD(hours) + ":" + Helper.DD(minutes) + ":" + Helper.DD(seconds);
		}
	},

	DD : function(number) {
		if (number < 10) {
			return "0" + number;
		} else {
			return number;
		}
	},

	randName : function() {
		switch (Helper.randNum(1, 25)) {
			case 1: return "Darby Bagley";
			case 2: return "Marti Mello";
			case 3: return "Frieda Swan";
			case 4: return "Elza Quinones";
			case 5: return "Carlena Mccurdy";
			case 6: return "Deja Spangler";
			case 7: return "Doloris Agee";
			case 8: return "Buffy Aleman";
			case 9: return "Merrie Mccutcheon";
			case 10: return "Lenora Heinz";
			case 11: return "Karma Houghton";
			case 12: return "Merrilee Easterling";
			case 13: return "Alida Middleton";
			case 14: return "Vernita Lovelace";
			case 15: return "James Ezell";
			case 16: return "Shayne Spangler";
			case 17: return "Lane Agee";
			case 18: return "Kyra Bagley";
			case 19: return "Hyo Bagley";
			case 20: return "Lisha Bagley";
			case 21: return "Devon Bagley";
			case 22: return "Eustolia Mello";
			case 23: return "Khadijah Swan";
			case 24: return "Layne Quinones";
			case 25: return "Arne Ubelhor";
		};
	}
};