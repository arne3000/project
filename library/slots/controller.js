/************************
	SLOTS
************************/
function slots(init_data, _events) {
	this.events = _events;
	this.size = 9; 
	this.data = new Array();


	//construct blank slot data
	this.construct = function() {
		this.data = new Array();
		for (i = 0; i < this.size; ++i) {
			this.data.push(null);
		};
	};

	this.setWorkers = function(workerArray) {
		this.construct();
		if (typeof workerArray != "undefined") {
			for (i = 0; i < workerArray.length; ++i) {
				if (typeof workerArray[i] != "undefined") {
					this.data[workerArray[i].slotid] = WorkerData.construct(i, workerArray[i]);
					//console.log(this.data[workerArray[i].slotid].data());
				}
			}
		}
	};

	this.getWorker = function(id) {
		return this.data[id];
	};

	this.getSlots = function() {
		return this.data;
	};

	this.getClass = function(id) {
		if (this.data[id] == null)
			return "slot_empty";

		switch (this.data[id].state) {
			case WorkerData.states.inactive: return "slot_inactive";
			case WorkerData.states.busy: return "slot_busy";
			case WorkerData.states.completed: return "slot_completed";
		}
	};

	this.update = function() {
		for (i = 0; i < this.data.length; ++i) {
			if (this.data[i] != null) {
				this.data[i].update();
			}
		}
	};

	this.clickevent = function(id) {
		if (this.data[id] == null) {
			this.events.empty_slot(id);
		} else if (this.data[id].state == WorkerData.states.completed) {
			this.events.worker_completed(this.data[id].workerid);
		} else {
			this.events.worker(this.data[id].workerid);
		}
	};

	//constructor
	this.setWorkers(init_data);
};
