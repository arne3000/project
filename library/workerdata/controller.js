/***********************
	WORKER
************************/
var WorkerData = { 
	states : {
		inactive : 0,
		busy : 1,
		completed : 2
	},

	construct : function(_id, data) {
		console.log(data);
		var output = {
			workerid : _id,
			state : WorkerData.states.inactive,
			timeleft : 0,
			//stats
			stats : Levels.generateData(data.level),
			//db data
			slotid : data.slotid,
			name : data.name,
			level : data.level,
			progress : data.progress,
			timestamp : data.timestamp,
			//style functions
			BarStyle_time : function() {
				if (this.state == WorkerData.states.busy) {
					var percent = this.timeleft / (this.stats.collect.time / 100);
					return {right: (percent)+'%'};
				} else
					return {display: "none"};
			},
			BarStyle_progress : function() {
				return {right: (100-this.progress)+'%'};
			},
			BarStyle_statsI : function() {
				return {top: (100-this.stats.work.innovation)+'%'};
			},
			BarStyle_statsO : function() {
				return {top: (100-this.stats.work.optimisation)+'%'};
			},
			BarStyle_statsQ : function() {
				return {top: (100-this.stats.work.quality)+'%'};
			},
			Text_time : function() {
				if (this.state == WorkerData.states.busy) {
					return Helper.formatUnixTimestamp(this.timeleft);
				} else
					return "";
			},
			Text_collectTime : function() {
				return Helper.readableTimestamp(this.stats.collect.time);
			},
			//update time left
			update : function() {
				if (this.state == WorkerData.states.busy) {
					--this.timeleft;
					if (this.timeleft <= 0) {
						this.state = WorkerData.states.completed;
					}
				}
			}
		};

		if (output.timestamp > 0) {
			var timeleft = Helper.calculateTimeleft(output.timestamp, output.stats.collect.time);
			if (timeleft > 0) {
				output.state = WorkerData.states.busy;
				output.timeleft = timeleft;
			} else {
				output.state = WorkerData.states.completed;
			}				
		}

		return output;
	}
};