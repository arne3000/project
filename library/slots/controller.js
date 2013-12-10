/************************
	SLOTS
************************/
function slots(event_completed, event_empty, event_else) {
	this.size = 9; 
	this.data = new Array();
	this.states = {
		inactive : 0,
		busy : 1,
		completed : 2
	}

	//construct blank slot data
	this.construct = function() {
		this.data = new Array();
		for (i = 0; i < this.size; ++i) {
			this.data.push({state: this.states.inactive, workerid: -1, timeleft: 0, timemax: 0 });
		};
	};

	//run constructor
	this.construct();

	this.setWorkers = function(workerArray) {
		this.construct();
		for (i = 0; i < workerArray.length; ++i) {
			if (typeof workerArray[i] != "undefined") {
				this.data[workerArray[i].slotid].workerid = i;
				if (workerArray[i].timestamp > 0) {
					this.data[workerArray[i].slotid].timemax = Levels.toCollectTime(workerArray[i].level);
					var timeleft = Helper.calculateTimeleft(workerArray[i].timestamp, this.data[workerArray[i].slotid].timemax);
					if (timeleft > 0) {
						this.data[workerArray[i].slotid].state = this.states.busy;
						this.data[workerArray[i].slotid].timeleft = timeleft;
					} else {
						this.data[workerArray[i].slotid].state = this.states.completed;
					}				
				}
			}
		}
	};

	this.getSlots = function() {
		return this.data;
	};

	this.getBar_style = function(id) {
		if (this.data[id].workerid != -1 && this.data[id].state == this.states.busy) {
			var cent = this.data[id].timemax / 100;
			var percent = this.data[id].timeleft / cent;
			return {right: (percent)+'%'};
		} else
			return {display: "none"};
	};

	this.getBar_text = function(id) {
		if (this.data[id].workerid != -1 && this.data[id].state == this.states.busy) {
			return Helper.formatUnixTimestamp(this.data[id].timeleft);
		} else
			return "";
	};

	this.getSlot_class = function(id) {
		if (this.data[id].workerid == -1)
			return "slot_empty";

		switch (this.data[id].state) {
			case this.states.inactive: return "slot_inactive";
			case this.states.busy: return "slot_busy";
			case this.states.completed: return "slot_completed";
		}
	};

	this.update = function() {
		for (i = 0; i < this.data.length; ++i) {
			if (this.data[i].workerid != -1 && this.data[i].state == this.states.busy) {
				--this.data[i].timeleft;
				if (this.data[i].timeleft <= 0) {
					this.data[i].state = this.states.completed;
				}
			}
		}
	};

	this.clickevent = function(id) {
		if (this.data[id].workerid == -1) {
			event_empty(id);
		} else if (this.data[id].state == this.states.completed) {
			event_completed(this.data[id].workerid);
		} else {
			event_else(this.data[id].workerid);
		}
	};
};