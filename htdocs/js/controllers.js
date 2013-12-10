/************************
	CONTROLLERS
************************/
//login
function Login_Controller($scope, $state, libraries, database) { 
	database.initialise($scope, "user", "data");
	$scope.$watch('data', function() {
	    if (typeof $scope.data != "undefined") {
		    if (typeof $scope.data.userdata === "undefined") {
		    	$state.go('new');
		    } else {
		    	$state.go('main');
		    }
		}
	});
};

//new user
function New_Controller($scope, libraries) {
	console.log("new");
	//$rootscope.userdata = Helper.initUserData();
};


//add a new game
function Add_Controller($scope, libraries) {
	console.log("add");

};


//worker settings
function Worker_Controller($scope, libraries) {
	/*var modalInstance = $modal.open({
			templateUrl: 'page/modal/worker/template.html',
			controller: Modal_Worker_Controller,
			resolve: {
				worker: function () { return $rootscope.userdata.workers[workerid]; },
				usermoney: function () { return $rootscope.userdata.company.currency; },
				isLastWorker: function () { 
					if ($rootscope.userdata.workers.length > 1)
						return false;
					else
						return true;
				}
			}
		});
		modalInstance.result.then(function (data) { 
			switch (data.action) {
				case 0:
					$rootscope.userdata.workers[workerid] = data.worker;
					$rootscope.userdata.company.currency = data.money;
					break;
				case 1: 
					$rootscope.userdata.workers = Helper.removeWorker(workerid, $rootscope.userdata.workers);
					break;
				case 2:
					$rootscope.userdata.workers[workerid].timestamp = Helper.getUnixTimestamp();
					$rootscope.userdata.company.currency = data.money;
					break;
			}

			$scope.slots.setWorkers($rootscope.userdata.workers);
		});

		$scope.worker = worker;
	$scope.money = usermoney;

	$scope.getData = function() {
		$scope.getCCost = Levels.toCollectCost($scope.worker.level); 
		$scope.getCTime = Helper.readableTimestamp(Levels.toCollectTime($scope.worker.level));
		$scope.getCAmount = Levels.toCollectAmount();
		$scope.getCPrem = Levels.toCollectPrem($scope.worker.level);
		$scope.getLRel = Levels.toRelevance($scope.worker.level);
		$scope.getPCost = Levels.toProgressCost($scope.worker.level);

		$scope.getStats = [
			{ name: "Innovation", style: {top: (100-Levels.toWorkInnovation($scope.worker.level))+"%"}},
			{ name: "Optimisation", style: {top: (100-Levels.toWorkOptimisation($scope.worker.level))+"%"}},
			{ name: "Quality", style: {top: (100-Levels.toWorkQuality($scope.worker.level))+"%"}}
		];
	}

	$scope.getData();

	$scope.getBar = function() {
		var percent = $scope.worker.progress;
		if (percent <= 0) percent = 1;
			return {right: (100-percent)+'%'};
	}

	$scope.firebtnstate = function() {
		if (isLastWorker == true) 
			return "disabled";
		else
			return "";
	}
	$scope.startbtnstate = function() {
		if ($scope.money < Levels.toCollectCost($scope.worker.level) && $scope.worker.timestamp > 0)
			return "disabled";
		else
			return "";
	}
	$scope.learnbtnstate = function() {
		if ($scope.money < Levels.toProgressCost($scope.worker.level))
			return "disabled";
		else
			return "";
	}

	$scope.close = function() {
		$modalInstance.close({action: 0, worker: $scope.worker, money: $scope.money});
	};

	$scope.fire = function() {
		if (isLastWorker == false)
			$modalInstance.close({action: 1, worker: $scope.worker, money: $scope.money});
	};

	$scope.startjob = function() {
		if ($scope.money >= Levels.toCollectCost($scope.worker.level)) {
			$scope.money -= Levels.toCollectCost($scope.worker.level);
			$modalInstance.close({action: 2, worker: $scope.worker, money: $scope.money});
		}
	};

	$scope.learn = function() {
		if ($scope.money >= Levels.toProgressCost($scope.worker.level)) {
			$scope.worker.progress += Levels.toProgressAmount();
			$scope.money -= Levels.toProgressCost($scope.worker.level);
			if ($scope.worker.progress >= 100) {
				++$scope.worker.level;
				$scope.worker.progress = 0;
				$scope.getData();
			}
		}
	};*/
};


//main game loop
function Main_Controller($scope, $state, $timeout, $modal, $log, libraries, database) {
	database.bind($scope, "data", function() { $state.go('login'); });

	console.log(libraries);
	var mytimeout = $timeout($scope.onTimeout,1000);
	$scope.slots.setWorkers($scope.data.userdata.workers);

	$scope.slot_completed = function(workerid) {
		$scope.data.userdata.workers[workerid].timestamp = 0;
		$scope.slots.setWorkers($scope.data.userdata.workers);
	};
	$scope.slot_empty = function(slotid) {
		var modalInstance = $modal.open({
			templateUrl: 'page/modal/hireworker/template.html',
			controller: Modal_Hireworker_Controller,
			resolve: { userlevel: function () { return $scope.data.userdata.company.level; } }
		});
		modalInstance.result.then(function (selected) { 
			$scope.data.userdata.workers.push(Helper.createWorker(slotid, selected.name, selected.level));
			$scope.slots.setWorkers($scope.data.userdata.workers);
		});
	};
	$scope.slots = new slots($scope.slot_completed, $scope.slot_empty, function(id) {
		$state.go("worker/"+id);
	});

	$scope.onTimeout = function(){
    	$scope.slots.update();
        mytimeout = $timeout($scope.onTimeout,1000);
    };
};



var Modal_Confirmation_Controller = function ($scope, $modalInstance, text) {
	$scope.text = text;
	$scope.yes = function () {
		$modalInstance.close(true);
	};
	$scope.no = function () {
		$modalInstance.close(false);
	};
};

var Modal_Hireworker_Controller = function ($scope, $modalInstance, userlevel) {
	$scope.workers = new Array();
	$scope.selected = 0;

	for (i = 0; i < 4; ++i) {
		$scope.workers.push({ name: Helper.randName(), level: Helper.randNum(userlevel, userlevel + 2)});
	}

	$scope.clickEvent = function(index) { $scope.selected = index; }
	$scope.state = function(index) {
		if ($scope.selected == index) { return "active"; };
	}
	$scope.ok = function() {
		$modalInstance.close($scope.workers[Number($scope.selected)]);
	};
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
};



/************************
	MESSAGE BOX
************************/
ConfirmationBox = function($modal, _text, confirmevent) {
	var modalInstance = $modal.open({
		templateUrl: 'page/modal/confirmation/template.html',
		controller: Modal_Confirmation_Controller,
		resolve : { text: function() { return _text; } }
	});
	modalInstance.result.then(function (confrim) {
		if (confrim == true) { 
			confirmevent();
		}
	});
};

