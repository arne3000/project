/************************
	CONTROLLERS
************************/
//login
function Login_Controller($scope, $state, $modal, $log, $firebase, libraries, database) { 
	/*
			NEED TO MAKE IT SO USERS ARE INFORMED THAT THIS IS AN EXPERIMENT AND MADE AWARE OF THE FOLLOWING THINGS
			 -metric data is kept
			 -no personal information is stored

			HAVE AN OPTION TO EITHER CONTINUE TO GAME OR EXIT
	*/

	$scope.state = "state_notloaded";
	$scope.completed = false;
	$scope.user = null;

	database.initialise(function(_user){
		console.log("initialising");
		$scope.user = _user;

		$scope.data = database.getData(function(){
			console.log('fail');
		});

		$scope.data.$on("loaded", function(value) {
			console.log(value);
	    	if ($scope.completed == false) {
	    		if (value == null) {
					//must be a new user!
					$scope.state = "";
					$scope.completed = true;
					var modalInstance = $modal.open({
						templateUrl: 'page/modal/newcompany/template.html',
						controller: Modal_Newcompany_Controller,
						backdrop: 'static',
						keyboard: false,
						resolve: { user: function () { return $scope.user; } }
					});
					modalInstance.result.then(function(companyname) { 
						if (companyname === "") {
							$state.go('exit');
						} else {
							//set up account hereeeee
							$scope.data.$set(Helper.initUserData(companyname));
							$state.go('main.office');
						}
					});
				} else {
					$state.go('main.office');
				}
			}
		});
	});
};

//main game loop
function Main_Controller($scope, $state, $timeout, $modal, $log, $firebase, libraries, database) {
	$scope.data = database.getData(function() { $state.go('login'); });


	$scope.game_slot_state = function() {
		if (typeof $scope.data != "undefined") {
			if (typeof $scope.data.current === "undefined")
				return "state_empty";
			else
				return "state_active";
		}
	};
	$scope.game_slot_click = function() {
		if (typeof $scope.data != "undefined") {
			if (typeof $scope.data.current === "undefined")
				$state.go("addgame");
		}
	};
};

//add a new game
function Main_Addgame_Controller($scope, libraries) {
	console.log("add");

};

function Main_Office_Controller($scope, $state, $timeout, $modal, $log, $firebase, libraries, database) {
	$scope.data = database.getData(function() { $state.go('login'); });
	$scope.active = false;

	$scope.slot_completed = function(workerid) {
		//$scope.data.workers[workerid].timestamp = 0;
		$scope.slots.setWorkers($scope.data.workers);
	};
	$scope.slot_empty = function(slotid) {
		var modalInstance = $modal.open({
			templateUrl: 'page/modal/hireworker/template.html',
			controller: Modal_Hireworker_Controller,
			resolve: { userlevel: function () { return $scope.data.company.level; } }
		});
		modalInstance.result.then(function (selected) { 
			//$scope.data.workers.push(Helper.createWorker(slotid, selected.name, selected.level));
			$scope.slots.setWorkers($scope.data.workers);
		});
	};
	$scope.onTimeout = function(){
    	$scope.slots.update();
        mytimeout = $timeout($scope.onTimeout,1000);
    };

    $scope.initialise = function() {
    	$scope.active = true;
    	var mytimeout = $timeout($scope.onTimeout,1000);
    	$scope.slots = new slots($scope.slot_completed, $scope.slot_empty, function(workerid) {
			$state.go("main.worker", {id: workerid});
		});
    };

    $scope.data.$on("change", function() {
    	if (typeof $scope.data != "undefined") {
			if ($scope.active == false)
				$scope.initialise();
			$scope.slots.setWorkers($scope.data.workers);
		}
    });
};


function Main_Worker_Controller($scope, $state, $timeout, $modal, $log, $stateParams, $firebase, libraries, database) {
	$scope.data = database.getData(function() { $state.go('login'); });
	$scope.active = false;
	$scope.id = $stateParams.id;

	$scope.back = function() {
		$state.go("main.office");
	};
	$scope.getReadableTime = function(time) {
		return Helper.readableTimestamp(time);
	};


	$scope.fire_state = function() {
		if ($scope.active == true) {
			if ($scope.data.workers.length <= 1)
				return "disabled";
			else
				return "";
		}
	};
    $scope.fire_event = function() {
    	if ($scope.active == true) {
	    	if ($scope.data.workers.length > 1) {
				var modalInstance = $modal.open({
					templateUrl: 'page/modal/confirmation/template.html',
					controller: Modal_Confirmation_Controller,
					resolve: { text: function () { return "Are you sure you want to fire?"; } }
				});
				modalInstance.result.then(function (confirm) { 
					if(confirm == true) {
						$scope.data.workers[$scope.id].$remove();
						$state.go("main.office");
					}
				});
	    	}
	    }
	};

	$scope.initialise = function() {
		$scope.active = true;
	};

	$scope.data.$on("change", function() {
    	if (typeof $scope.data != "undefined") {
			if ($scope.active == false)
				$scope.initialise();

			$scope.stats = Levels.generateData($scope.data.workers[$scope.id].level);
		}
    });

	/*$scope.id = $stateParams.id;
	$scope.active = false;
	$scope.lastWorker = true;
	$scope.monies = 0;
	$scope.action = 0;
	$scope.start_text = "Start";
	$scope.timeleft = 0;

	$scope.$watch('data', function() { //if we change any data recalculate tings
		if (typeof $scope.data != 'undefined') {
			if ($scope.action == 0) {
				if ($scope.data.userdata.workers[$scope.id] != null) {
					$scope.worker = $scope.data.userdata.workers[$scope.id];
					$scope.stats = Levels.generateData($scope.worker.level);
					$scope.monies = $scope.data.userdata.company.currency;
					if ($scope.data.userdata.workers[$scope.id].timestamp > 0) {
			    		$scope.timeleft = Helper.calculateTimeleft($scope.worker.timestamp, $scope.stats.collect.time);
			    		$scope.start_text = Helper.formatUnixTimestamp($scope.timeleft);
			    	}
					if ($scope.data.userdata.workers.length > 1)
						$scope.lastWorker = false;
					if ($scope.active == false)
						var mytimeout = $timeout($scope.onTimeout,1000);

					$scope.active = true;
				}
			} else if ($scope.action == 1) {
				$state.go("main.office");
			}
		}
	});

	$scope.onTimeout = function(){
		--$scope.timeleft;
    	if ($scope.worker.timestamp > 0)
    		$scope.start_text = Helper.formatUnixTimestamp($scope.timeleft);
    	else
    		$scope.start_text = "Start";
        mytimeout = $timeout($scope.onTimeout,1000);
    };
	
	$scope.getClass = function(isactive) {
		if ($scope.active == false)
			return "disabled";
		else {
			if (isactive == true) 
				return "";
			else 
				return "disabled";
		}
	};
	
	
	$scope.fire_state = function() {
		if ($scope.lastWorker == false && $scope.active == true)
			return $scope.getClass(true);
		else
			return $scope.getClass(false);
	};
	$scope.fire_event = function() {
		if ($scope.lastWorker == false && $scope.active == true) {
			var modalInstance = $modal.open({
				templateUrl: 'page/modal/confirmation/template.html',
				controller: Modal_Confirmation_Controller,
				resolve: { text: function () { return "Are you sure you want to fire?"; } }
			});
			modalInstance.result.then(function (confirm) { 
				if(confirm == true) {
					$scope.active = false;
					$scope.data.userdata.workers = Helper.removeWorker($scope.id, $scope.data.userdata.workers);
					$scope.action = 1;
				}
			});
		}
	};
	$scope.learn_state = function() {
		if ($scope.active == true) {
			if ($scope.monies < $scope.stats.progress.cost)
				return $scope.getClass(false);
			else
				return $scope.getClass(true);
		}
	};
	$scope.learn_event = function() {
		if ($scope.active == true) {
			if ($scope.monies >= $scope.stats.progress.cost) {
				$scope.data.userdata.workers[$scope.id].progress += $scope.stats.progress.amount;
				$scope.data.userdata.company.currency -= $scope.stats.progress.cost;
				if ($scope.worker.progress >= 100) {
					++$scope.data.userdata.workers[$scope.id].level;
					$scope.data.userdata.workers[$scope.id].progress = 0;
				}
			}
		}
	};
	$scope.start_state = function() {
		if ($scope.active == true) {
			if ($scope.monies < $scope.stats.collect.cost && $scope.worker.timestamp <= 0)
				return $scope.getClass(false);
			else
				return $scope.getClass(true);
		}
	};
	$scope.start_event = function() {
		if ($scope.active == true) {
			if ($scope.monies >= $scope.stats.collect.cost && $scope.worker.timestamp <= 0) {
				$scope.data.userdata.company.currency -= $scope.stats.collect.cost;
				$scope.data.userdata.workers[$scope.id].timestamp = Helper.getUnixTimestamp();
			}
		}
	};*/
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

var Modal_Newcompany_Controller = function ($scope, $modalInstance, user) {
	$scope.username = user.name;
	$scope.set_state = function(_nameModel, _checkModel) {
		if (_nameModel == null || _checkModel == null)
			return "disabled";
		else {
			if (_nameModel == "" || _checkModel == 0)
				return "disabled";
			else
				return "";
		}
	};

	$scope.ok = function(_nameModel, _checkModel) {
		if (_nameModel != "" && _checkModel == 1) {
			$modalInstance.close(_nameModel);
		}
	};

	$scope.cancel = function() {
		$modalInstance.close("");
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

