/************************
	CONTROLLERS
************************/
function Menu_Controller($scope, $state, database, messagebox) { 
	$scope.logout = function() {
		database.logout();
		$state.go('login');
	};
	$scope.removeAccount = function() {
		messagebox.confirmation("Are you sure you want to remove your account, it will not be recoverable?", function() {
			database.removeAccount();
			$state.go('login');
		});
	};
	$scope.takesurvey = function() {
		var surveyurl = "https://www.surveymonkey.com/s/R57XZFX";
		//window.open (surveyurl, 'newwindow', config='height=600,width=600, toolbar=no, menubar=no, scrollbars=no, resizable=yes,location=no, directories=no, status=no');
		//database.addReward();
		//$state.go('main.office');
	};
};

//login
function Login_Controller($scope, $state, $modal, $log, $firebase, libraries, database) { 
	$scope.completed = false;

	$scope.login_btn = function(_service) {
		if ($scope.btnsState != "disabled") {
			$scope.loading = true;
			$scope.btnsState = "disabled";
			database.login(_service);
		}
	};

	$scope.loading = true;
	$scope.btnsState = "disabled";

	database.initialise(function(result) {
		switch (result) {
			case 0: 
				$scope.loading = true;
				$state.go('main.office');
				break;
			case 1:
				if ($scope.completed == false) {
					//must be a new user!
					$scope.completed = true;
					$modal.open({
						templateUrl: 'page/modal/start/template.html',
						controller: Modal_Start_Controller,
						backdrop: 'static',
						keyboard: false
					}).result.then(function(agree) { 
						if (agree === false) {
							database.logout();
							$state.go('exit');
						} else {
							$modal.open({
								templateUrl: 'page/modal/newcompany/template.html',
								controller: Modal_Newcompany_Controller,
								backdrop: 'static',
								keyboard: false
							}).result.then(function(companyname) { 
								if (companyname === "") {
									database.logout();
									$state.go('exit');
								} else {
									//set up account hereeeee
									database.initialSetup(companyname);
									$state.go('main.office');
								}
							});
						}
					});
				}
				break;
			case 2:
				$scope.loading = false;
				$scope.btnsState = "";
				break;
		}
		$scope.$apply();
	});
};

//main game loop
function Main_Controller($scope, $state, $timeout, $modal, $log, $firebase, libraries, database, messagebox, error_service) {
	console.log("Main_Controller");
	$scope.data = database.get();

	$scope.years = 0;
	$scope.months = 0;
	$scope.activeGameState = Helper.gameState.active;
	$scope.ingameyear = Helper.inGamerYear;

	$scope.activegames = function() {
		if (database.gamesActive() > 0)
			return true;
		else
			return false;
	};
	$scope.GetCompanyDate = function() {
		if (typeof $scope.data.company != "undefined") {
			$scope.years = Helper.calculateGameYears($scope.data.company.created);
			$scope.months = Helper.calculateGameMonths($scope.data.company.created);
		}
	};

	$scope.GameClick = function(game) {
		$modal.open({
			templateUrl: 'page/modal/game/template.html',
			controller: Modal_Game_Controller,
			resolve: { data: function() { return game; } }
		});
	};

	$scope.CheckTriggers = function() {
		if ($scope.activegames()) {
			var time = $scope.data.company.timestamp;
			if (time <= 0)
				time = $scope.data.company.created;

			if (Helper.calculateGameYears(time) >= 1) {
				var displaydata = database.profitCollect();
				$modal.open({
					templateUrl: 'page/modal/profit/template.html',
					controller: Modal_Profit_Controller,
					backdrop: 'static',
					resolve: { data: function() { return displaydata; }	}
				});
			}
		}
	};

	$scope.logout = function() {
		database.logout();
		$state.go('login');
	};

	$scope.removeAccount = function() {
		messagebox.confirmation("Are you sure you want to remove your account, it will not be recoverable?", function() {
			database.removeAccount();
			$state.go('login');
		});
	};

	$scope.onTimeout = function(){
		$scope.GetCompanyDate();
    	$scope.CheckTriggers();
        mytimeout = $timeout($scope.onTimeout,10000);
    };

    $scope.CheckTriggers();
    $scope.GetCompanyDate();

	var mytimeout = $timeout($scope.onTimeout,10000);
};

//add a new game
function Main_Addgame_Controller($scope, $state, libraries, database) {
	console.log("Main_Addgame_Controller");
	$scope.data = database.get();

	if (database.gamesInDev() > 0)
		$state.go("main.office");

	$scope.back = function() { $state.go("main.office"); };
	$scope.capitalize = function(s) { return s[0].toUpperCase() + s.slice(1); };

	$scope.genres = Helper.gameData.genres;
	$scope.concepts = Helper.gameData.concepts;
	$scope.target_ages = Helper.gameData.target_ages;

	$scope.game = {
		name: "",
		genre: 0,
		concept: 0,
		target: 0
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
				database.createGame($scope.game.name, $scope.game.genre, $scope.game.concept, $scope.game.target);
				$state.go("main.office");
			}
		}
	};
};

function Main_Office_Controller($scope, $state, $timeout, $modal, $log, $firebase, libraries, database) {
	console.log("Main_Office_Controller");
	$scope.data = database.get();
	$scope.data.$on("change", function() {
		$scope.slots.setWorkers($scope.data.workers);
	});

	$scope.gameSlotActive = function() {
		if (database.gamesInDev() <= 0)
			return false;
		else
			return true;
	};
	$scope.gameSlotLaunchReady = function() {
		var id = database.getGameInDev();
		if (id != null) {
			if ($scope.data.games[id].state == Helper.gameState.launchReady)
				return true;
			else
				return false
		}
	};
	$scope.gameSlotData = function() {
		var id = database.getGameInDev();
		if (id != null) {
			return {
				name: $scope.data.games[id].name,
				progressBarStyle: {right: 100-$scope.data.games[id].devProgress+'%'},
				genre: Helper.gameData.genres[$scope.data.games[id].genre],
				target: Helper.gameData.target_ages[$scope.data.games[id].target],
				concept: Helper.gameData.concepts[$scope.data.games[id].concept]
			};
		}
		else
			return null;
	};
	$scope.addGame = function() {
		if (database.gamesInDev() <= 0)
			$state.go("main.addgame");
	};

	$scope.LaunchGame = function() {
		var id = database.getGameInDev();
		if (id != null) {
			if ($scope.data.games[id].state == Helper.gameState.launchReady)
				database.launchGame();
		}
	};



    $scope.slots = new slots(
    	$scope.data.workers, {
			worker : function(workerid) {
				$state.go("main.worker", {id: workerid});
			},
			worker_completed : function(workerid) {
				database.workerCompleted(workerid);
				$scope.slots.setWorkers($scope.data.workers);
			},
			empty_slot : function(slotid) {
				$modal.open({
					templateUrl: 'page/modal/hireworker/template.html',
					controller: Modal_Hireworker_Controller,
					resolve: { 
						baselevel: function () { 
							var level_sum = 0;
							for (i = 0; i < $scope.data.workers.length; ++i) {
								if (typeof $scope.data.workers[i] != "undefined")
									level_sum += $scope.data.workers[i].level;
							}
							return level_sum / $scope.data.workers.length;
						},
						usercurrency: function () { return $scope.data.company.currency; }
					}
				}).result.then(function (selected) { 
					database.addWorker(slotid, selected.name, selected.level);
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


function Main_Worker_Controller($scope, $state, $timeout, $modal, $log, $stateParams, $firebase, libraries, database, messagebox) {
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
    				messagebox.confirmation("Are you sure you want to fire?", function() {
						database.removeWorker($scope.id);
						$state.go("main.office");
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
					database.workerUpgrade($scope.id, $scope.worker.stats.progress.amount, $scope.worker.stats.progress.cost);
				}
    		}
    	}
	};

	$scope.jobbtn = function() {
    	return {
    		text : function() {
    			if (database.gamesInDev() <= 0)
    				return "No Development";
    			else {
    				if ($scope.worker.state == WorkerData.states.inactive)
						return "Start Job $"+$scope.worker.stats.collect.cost;
					else {
						if ($scope.worker.state == WorkerData.states.completed)
							return "Finish Job"
						else
							return $scope.worker.Text_time();
					}
				}
    		},
    		state : function() {
    			if ($scope.data.company.currency < $scope.worker.stats.collect.cost || $scope.worker.state == WorkerData.states.busy || database.gamesInDev() <= 0)
					return "disabled";
				else
					return "";
    		},
    		click : function() {
    			//start a new job
    			if ($scope.worker.state == WorkerData.states.inactive) {
    				database.workerStartJob($scope.id, $scope.worker.stats.collect.cost);
    			} else if ($scope.worker.state == WorkerData.states.completed) {
					database.workerCompleted($scope.id);
				}

				$scope.worker = WorkerData.construct($scope.id, $scope.data.workers[$scope.id]);
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

var Modal_Hireworker_Controller = function ($scope, $modalInstance, baselevel, usercurrency) {
	$scope.workers = new Array();
	$scope.selected = 0;

	for (i = 0; i < 4; ++i) {
		var _level = Helper.randNum(baselevel, baselevel + 2);
		$scope.workers.push({ name: Helper.randName(), level: _level, cost: Levels.toHireCost(_level)});
	}

	$scope.clickEvent = function(index) { $scope.selected = index; }
	$scope.state = function(index) {
		if ($scope.selected == index) { return "active"; };
	}
	$scope.ok = function() {
		if (usercurrency >= $scope.workers[Number($scope.selected)].cost)
			$modalInstance.close($scope.workers[Number($scope.selected)]);
	};
	$scope.ok_state = function() {
		if (usercurrency >= $scope.workers[Number($scope.selected)].cost)
			return "ready";
		else
			return "disabled";
	};
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
};

var Modal_Newcompany_Controller = function ($scope, $modalInstance) {
	$scope.set_state = function(_nameModel) {
		if (_nameModel == null)
			return "disabled";
		else {
			if (_nameModel == "")
				return "disabled";
			else
				return "";
		}
	};

	$scope.ok = function(_nameModel) {
		if (_nameModel != "") {
			$modalInstance.close(_nameModel);
		}
	};

	$scope.cancel = function() {
		$modalInstance.close("");
	};
};

var Modal_Start_Controller = function ($scope, $modalInstance) {
	$scope.ok = function() {
		$modalInstance.close(true);
	};

	$scope.cancel = function() {
		$modalInstance.close(false);
	};
};

var Modal_Profit_Controller = function ($scope, $modalInstance, data) {
	$scope.data = data;

	$scope.getClass = function(differnce) {
		if (differnce > 0)
			return "glyphicon-plus text-success";
		else
			return "glyphicon-minus text-warning";
	};

	$scope.close = function() {
		$modalInstance.close(true);
	};
};

var Modal_Game_Controller = function ($scope, $modalInstance, data) {
	$scope.data = data;

	$scope.GetTimeActive = function() {

	};

	$scope.close = function() {
		$modalInstance.close(true);
	};
};

