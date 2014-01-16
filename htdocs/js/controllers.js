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
	console.log("Login_Controller");
	$scope.state = "state_notloaded";
	$scope.completed = false;

	database.initialise(function(isUserNew) {
		console.log("initialising");
		if (isUserNew == true) {
			$state.go('main.office');
		} else {
			if ($scope.completed == false) {
				//must be a new user!
				$scope.state = "";
				$scope.completed = true;
				$modal.open({
					templateUrl: 'page/modal/newcompany/template.html',
					controller: Modal_Newcompany_Controller,
					backdrop: 'static',
					keyboard: false,
					resolve: { user: function () { return database.user(); } }
				}).result.then(function(companyname) { 
					if (companyname === "") {
						$state.go('exit');
					} else {
						//set up account hereeeee
						database.initialSetup(companyname);
						$state.go('main.office');
					}
				});
			}
		}
	});
};

//main game loop
function Main_Controller($scope, $state, $timeout, $modal, $log, $firebase, libraries, database) {
	console.log("Main_Controller");
	$scope.data = database.get();

	$scope.isGameSlotEmpty = function() {
		if (typeof $scope.data.development === "undefined")
			return true;
		else
			return false;
	}

	$scope.addGame = function() {
		if (typeof $scope.data.development === "undefined")
			$state.go("main.addgame");
	};
};

//add a new game
function Main_Addgame_Controller($scope, $state, libraries, database) {
	console.log("Main_Addgame_Controller");
	$scope.data = database.get();

	if (typeof $scope.data.development != "undefined")
		$state.go("main.office");

	$scope.back = function() { $state.go("main.office"); };
	$scope.capitalize = function(s) { return s[0].toUpperCase() + s.slice(1); };

	$scope.genres = Helper.gameData.genres;
	$scope.concepts = Helper.gameData.concepts;
	$scope.target_ages = Helper.gameData.target_ages;

	$scope.game = {
		name: "",
		genre: $scope.capitalize($scope.genres[0]),
		concept: $scope.capitalize($scope.concepts[0]),
		target: $scope.capitalize($scope.target_ages[0])
	};

	$scope.isReady = function() {
		if (typeof $scope.game.name === "undefined")
			return "disabled";
		else {
			if ($scope.game.name == "")
				return "disabled";
			else
				return "";
		}
	};

	$scope.createGame = function() {
		if (typeof $scope.game.name != "undefined") {
			if ($scope.game.name != "") {
				$scope.game.progress = 1;
				$scope.game.timestamp = Helper.getUnixTimestamp();
				$scope.game.stats = {
					innovation : 1,
					optimisation : 1,
					quality : 1
				};
				$scope.data.development = $scope.game;
				$scope.data.$save("development");
				$state.go("main.office");
			}
		}
	}

	/*name : "",
	genre : 0, //id to a genre
	progress : 0,
	timestamp : 0,
	target_age : 0,
	controversial : 0*/
};

function Main_Office_Controller($scope, $state, $timeout, $modal, $log, $firebase, libraries, database) {
	console.log("Main_Office_Controller");
	$scope.data = database.get();
	$scope.data.$on("change", function() {
		$scope.slots.setWorkers($scope.data.workers);
	});

    $scope.slots = new slots(
    	$scope.data.workers, {
			worker : function(workerid) {
				$state.go("main.worker", {id: workerid});
			},
			worker_completed : function(workerid) {
				//NEED TO ADD: add to progress of current game
				++$scope.data.development.progress;
				if ($scope.data.development.progress) {
					//transfer data to the games history
				}
				$scope.data.workers[workerid].timestamp = 0;
				$scope.data.$save();
				$scope.slots.setWorkers($scope.data.workers);
			},
			empty_slot : function(slotid) {
				$modal.open({
					templateUrl: 'page/modal/hireworker/template.html',
					controller: Modal_Hireworker_Controller,
					resolve: { userlevel: function () { return $scope.data.company.level; } }
				}).result.then(function (selected) { 
					$scope.data.workers.push(Helper.createWorker(slotid, selected.name, selected.level));
					$scope.data.$save("workers");
					$scope.slots.setWorkers($scope.data.workers);
				});
			}
		});

    $scope.onTimeout = function(){
    	$scope.slots.update();
        mytimeout = $timeout($scope.onTimeout,1000);
    };

	var mytimeout = $timeout($scope.onTimeout,1000);
};


function Main_Worker_Controller($scope, $state, $timeout, $modal, $log, $stateParams, $firebase, libraries, database) {
	console.log("Main_Worker_Controller");
	$scope.data = database.get();
	$scope.id = $stateParams.id;
	$scope.worker = WorkerData.construct($scope.id, $scope.data.workers[$scope.id]);

	//actions taken will reflect display
	$scope.data.$on("change", function() {
		$scope.worker = WorkerData.construct($scope.id, $scope.data.workers[$scope.id]);
	});

	console.log($scope.worker);

	$scope.back = function() { $state.go("main.office"); };

    $scope.firebtn = function() {
    	return {
    		text : function() {
    			return "Fire";
    		},
    		state : function() {
    			if ($scope.data.workers.length <= 1 || $scope.worker.state != WorkerData.states.inactive)
					return "disabled";
				else
					return "";
    		},
    		click : function() {
    			if ($scope.data.workers.length > 1 && $scope.worker.state == WorkerData.states.inactive) {
					$modal.open({
						templateUrl: 'page/modal/confirmation/template.html',
						controller: Modal_Confirmation_Controller,
						resolve: { text: function () { return "Are you sure you want to fire?"; } }
					}).result.then(function (confirm) { 
						if(confirm == true) {
							$scope.data.$child("workers").$remove($scope.id);
							$state.go("main.office");
						}
					});
		    	}
    		}
    	}
	};

	$scope.learnbtn = function() {
    	return {
    		text : function() {
    			return "Teach";
    		},
    		state : function() {
    			if ($scope.data.company.currency < $scope.worker.stats.progress.cost || $scope.worker.state != WorkerData.states.inactive)
					return "disabled";
				else
					return "";
    		},
    		click : function() {
    			//make sure player can afford to buy progress and also isn't in progress of a job
				if ($scope.data.company.currency  >= $scope.worker.stats.progress.cost && $scope.worker.state == WorkerData.states.inactive) {
					$scope.data.workers[$scope.id].progress += $scope.worker.stats.progress.amount;
					$scope.data.company.currency -= $scope.worker.stats.progress.cost;
					//automatically level up
					if ($scope.data.workers[$scope.id].progress >= 100) {
						++$scope.data.workers[$scope.id].level;
						$scope.data.workers[$scope.id].progress = 0;
					}
					$scope.data.$save();
				}
    		}
    	}
	};

	$scope.jobbtn = function() {
    	return {
    		text : function() {
    			if ($scope.worker.state == WorkerData.states.inactive)
					return "Start Job $"+$scope.worker.stats.collect.cost;
				else {
					if ($scope.worker.state == WorkerData.states.completed)
						return "Finish Job"
					else
						return $scope.worker.Text_time();
				}
    		},
    		state : function() {
    			if ($scope.data.company.currency < $scope.worker.stats.collect.cost || $scope.worker.state == WorkerData.states.busy)
					return "disabled";
				else
					return "";
    		},
    		click : function() {
    			//start a new job
    			if ($scope.worker.state == WorkerData.states.inactive) {
    				if ($scope.data.company.currency >= $scope.worker.stats.progress.cost && $scope.worker.timestamp <= 0) {
						$scope.data.company.currency -= $scope.worker.stats.collect.cost;
						$scope.data.workers[$scope.id].timestamp = Helper.getUnixTimestamp();
						$scope.data.$save();
					}
    			} else {
    				//collect a job thats been completed
    				if ($scope.worker.state == WorkerData.states.completed) {
    					//NEED TO ADD: add to progress of current game
    					$scope.data.workers[$scope.id].timestamp = 0;
						$scope.data.$save();
    				}
    			}
    		}
    	}
	};
	
	$scope.onTimeout = function(){
		$scope.worker.update();
        mytimeout = $timeout($scope.onTimeout,1000);
    };
    var mytimeout = $timeout($scope.onTimeout,1000);
};


/************************
	MODAL CONTROLLERS
************************/
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

