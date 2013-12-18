/************************
	SLOTS
************************/
function worker(jobend_e, jobstart_e, teach_e, fire_e) { 
	this.data = null;
	this.stats = null;
	this.lastWorker = true;
	this.money = 0;

	this.states = {
		inactive : 0,
		busy : 1,
		completed : 2
	};

	//construct blank slot data
	this.construct = function() {
		this.data = {
			state: this.states.inactive, 
			workerid: -1,
			timeleft: 0
		};
		this.stats = null;
		this.lastWorker = true;
		this.money = 0;
	};

	//run constructor
	this.construct();

	this.setWorker = function(id, userdata) {
		this.construct();
		var workers = userdata.workers;
		this.money = userdata.company.currency;

		if (typeof workers != "undefined") {
			if (workers.length > 1)
				this.lastWorker = false;

			this.data.workerid = id;
			this.stats = Levels.generateData(workers[id].level);

			if (workers[id].timestamp > 0) {
				var timeleft = Helper.calculateTimeleft(workers[id].timestamp, this.stats.collect.time);

				if (timeleft > 0) {
					this.data.state = this.states.busy;
					this.data.timeleft = timeleft;
				} else {
					this.data.state = this.states.completed;
				}				
			}
		}
	};

	this.getData = function() {
		return this.data;
	};

	this.getStats = function() {
		return this.stats;
	};

	this.getBar_level = function() {
		var value = 
		if (value <= 0) 
			value = 1;

		return {right: (100-value)+'%'};
	};

	this.getBar_stat_quality = function() {
		return {top: (100-value)+"%"};
	};


	this.update = function() {
		if (this.data.workerid != -1 && this.data.state == this.states.busy) {
			--this.data.timeleft;
			if (this.data.timeleft <= 0) {
				this.data.state = this.states.completed;
			}
		}
	};



	this.clickevent = function(id) {
		if (this.data.workerid != -1) {
			event_empty(id);
		} else if (this.data[id].state == this.states.completed) {
			event_completed(this.data[id].workerid);
		} else {
			event_else(this.data[id].workerid);
		}
	};
};