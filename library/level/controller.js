/************************
	LEVEL
************************/
var Levels = {
	data : {
		level: { min: 1, max: 30 },
		collect : { 
			amount : 1,
			cost : { min: 5, max: 1000 },
			prem : { min: 1, max: 30 },
			time : { min: 10, max: 600 }
		},
		progress : { 
			amount : 10,
			cost : { min: 50, max: 1000 }
		},
		work : { 
			innovation : { min: 10, max: 92 },
			optimisation : { min: 6, max: 89 },
			quality : { min: 2, max: 97 }
		}
	},

	calculate : function(level, value) {
		return Math.floor((value.max / Levels.data.level.max) * level + value.min);
	},

	isValid: function(level) {
		if (level < Levels.data.level.min || level > Levels.data.level.max)
			return false;
		else
			return true;
	},

	toRelevance : function(level) {
		var top = ((Levels.data.level.max - Levels.data.level.min)/2);
		if (level < top*0.5) { //50%
			if (level < top*0.25) { //25%
				if (level < top*0.125)  //12.5%
					return "horrendous";
				else
					return "abysmal";
			} else {
				if (level < top*0.375)  //37.5%
					return "reasonable";
				else
					return "mediocre";
			}
		} else {
			if (level < top*0.75) { //75%
				if (level < top*0.625)  //62.5%
					return "unexceptional";
				else
					return "tolerable";
			} else {
				if (level < top*0.875)  //87.5%
					return "decent";
				else
					return "smashing";
			}
		}
	},

	toCollectAmount : function() {
		return Levels.data.collect.amount;
	},
	toCollectCost : function(level) {
		return Levels.calculate(level, Levels.data.collect.cost);
	},
	toCollectPrem : function(level) {
		return Levels.calculate(level, Levels.data.collect.prem);
	},

	//needs to be oppisite way round, so the higher level the shorter the time
	toCollectTime : function(level) {
		return Levels.data.collect.time.max - Levels.calculate(level, Levels.data.collect.time);
	},

	toProgressAmount : function() {
		return Levels.data.progress.amount;
	},
	toProgressCost : function(level) {
		return Levels.calculate(level, Levels.data.progress.cost);
	},

	toWorkInnovation : function(level) {
		return Levels.calculate(level, Levels.data.work.innovation);
	},
	toWorkOptimisation : function(level) {
		return Levels.calculate(level, Levels.data.work.optimisation);
	},
	toWorkQuality : function(level) {
		return Levels.calculate(level, Levels.data.work.quality);
	},


	generateData : function(worker_level) {
		return {
			relevance: Levels.toRelevance(worker_level),
			collect : { 
				amount: Levels.toCollectAmount(),
				cost : Levels.toCollectCost(worker_level),
				prem : Levels.toCollectPrem(worker_level),
				time : Levels.toCollectTime(worker_level)
			},
			progress : {
				amount: Levels.toProgressAmount(),
				cost: Levels.toProgressCost(worker_level)
			},
			work : { 
				innovation : Levels.toWorkInnovation(worker_level),
				optimisation : Levels.toWorkOptimisation(worker_level),
				quality : Levels.toWorkQuality(worker_level)
			}
		};
	}
};