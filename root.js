jQuery.cachedScript = function( url, options ) {
    // Allow user to set any option except for dataType, cache, and url
    options = $.extend( options || {}, {
        dataType: "script",
        cache: true,
        url: url
    });

    // Use $.ajax() since it is more flexible than $.getScript
    // Return the jqXHR object so we can chain callbacks
    return jQuery.ajax( options );
};

function loadLibraries(libsToLoad, callback) {
    var counter = 0;
    
    for (i = 0; i < libsToLoad.length; ++i) {
        $.cachedScript( "library/"+libsToLoad[i]+"/controller.js" )
            .done(function( script, textStatus ){
                ++counter;
                if (counter >= libsToLoad.length)
                    callback(true);
            })
            .fail(function( jqxhr, settings, exception ) {
                console.log("error: "+settings+" exception: "+exception);
                callback("error: "+settings+" exception: "+exception);
            });
    };        
}


/************************
	DECLARATION
************************/
var myapp = angular.module('myapp', ["ui.router", "ui.bootstrap", "firebase", "ngRoute", "googlechart"]);



/************************
	CONFIG
************************/
myapp.config(function($stateProvider, $urlRouterProvider){
  $urlRouterProvider.otherwise("/login")
  
  $stateProvider
    //Login
    .state('login', {
        url: "/login",
        templateUrl: "page/login/template.html",
        controller: 'Login_Controller',
        resolve: {
            libraries : function($q) {
                var deferred = $q.defer();
                loadLibraries(["helper", "level", "workerdata", "slots"], function(status) {
                    deferred.resolve(status);
                });
                return deferred.promise;
            }
        }
    })
    .state('exit', {
        url: "/exit",
        templateUrl: "page/exit/template.html"
    })
    .state('about', {
        url: "/about",
        templateUrl: "page/about/template.html", 
        controller: 'Menu_Controller'
    })
    .state('help', {
        url: "/help",
        templateUrl: "page/help/template.html", 
        controller: 'Menu_Controller'
    })
    .state('terms', {
        url: "/terms",
        templateUrl: "page/terms/template.html", 
        controller: 'Menu_Controller'
    })
    .state('shop', {
        url: "/shop",
        templateUrl: "page/shop/template.html", 
        controller: 'Menu_Controller'
    })
    .state('test', {
        url: "/test",
        templateUrl: "page/test/template.html", 
        controller: 'Test_Controller',
        resolve: {
            libraries : function($q) {
                var deferred = $q.defer();
                loadLibraries(["helper", "level", "workerdata", "slots"], function(status) {
                    deferred.resolve(status);
                });
                return deferred.promise;
            }
        }
    })

    //main game loop
    .state('main', {
        url: "/main",
        templateUrl: "page/main/template.html",
        controller: 'Main_Controller',
        resolve: {
            libraries : function($q) {
                var deferred = $q.defer();
                loadLibraries(["helper", "level", "workerdata", "slots"], function(status) {
                    deferred.resolve(status);
                });
                return deferred.promise;
            }
        }
    })
    .state('main.office', {
        templateUrl: "page/main/office/template.html",
        controller: 'Main_Office_Controller'
    })
    .state('main.addgame', {
        templateUrl: "page/main/addgame/template.html",
        controller: 'Main_Addgame_Controller'
    })
    .state('main.worker', {
        url: "/worker/{id}",
        templateUrl: "page/main/worker/template.html",
        controller: 'Main_Worker_Controller'
    })
});



/************************
    SETUP ERROR FACTORY
************************/
myapp.factory('error_service', function ErrorService($firebase) {
    var _url = 'https://socialproject.firebaseio.com/';
    var data = $firebase(new Firebase(_url+"ERRORS"));

    return {
        log: function(_code, _message) {
            data.push({time: Helper.getUnixTimestamp(), code: _code, message: _message});
            data.$save();
        }
    };
});

/************************
    SETUP METRICS FACTORY
************************/
myapp.factory('metric_service', function MetricService($firebase) {
    var _url = 'https://socialproject.firebaseio.com/';
    var data = $firebase(new Firebase(_url+"METRICS"));

    return {
        NewUser: function() {
            data.users += 1;
            data.$save('users');
        },
        RemoveUser: function() {
            data.users -= 1;
            data.$save('users');
        },
        MoneySpent: function(amount) {
            data.money_used += amount;
            data.$save('money_used');
        }
    };
});




/************************
    SETUP DATABASE FACTORY
************************/
myapp.factory('database', function DatabaseService($firebase, $state, error_service, metric_service) {
    var _url = 'https://socialproject.firebaseio.com/';
    var _ref = null;
    var initialised = false;

    var auth = null;
    var data = null;
    var relogFunc = null;


    return {
        initialise: function(callback) {
            auth = new FirebaseSimpleLogin(new Firebase(_url), function(error, _user) {
                if (error) {
                    // an error occurred while attempting login
                    
                    if (error.code == 'USER_DENIED') {
                        callback(2); // resets the page
                    } else {
                        error_service.log(0, error.code + ' - ' +error.message);
                        callback(3);
                    }
                    
                    initialised = false;
                } else if (_user) {
                    data = $firebase(new Firebase(_url+_user.id));

                    //check if its a new user
                    data.$on("loaded", function(value) {
                        if (value == null) {
                            callback(1);
                        } else {
                            initialised = true;
                            callback(0);
                        }
                    });
                } else {
                    callback(2);
                }
            });
        },

        login: function(method) {
            auth.login(method);
        },

        logout: function() {
            initialised = false;
            data.$off();
            auth.logout();
            data = null;
            auth = null;
        },

        initialSetup: function(CompanyName) {
            metric_service.NewUser();
            initialised = true;
            data.$set(Helper.initUserData(CompanyName));
        },

        relogFunc: function() {
            $state.go('login');
        },

        get: function() {
            if (initialised == true)
                return data;
            else {
                this.relogFunc();
                return null;
            }
        },

        removeAccount: function() {
            metric_service.RemoveUser();
            data.$remove();
            initialised = false;
            auth.logout();
        },

        //manipulative functions
        addWorker: function(slotid, name, level) {
            cost = Levels.toHireCost(level);
            if (data.company.currency >= cost) {
                data.company.currency -= cost;
                metric_service.MoneySpent(cost);
                data.workers.push(Helper.createWorker(slotid, name, level));
                data.$save("workers");
            }
        },
        removeWorker: function(slotid) {
            data.$child("workers").$remove(slotid);
        },
        gamesInDev: function() {
            if (typeof data.games === "undefined")
                return 0;

            var noGames = 0;
            for (i = 0; i < data.games.length; ++i) {
                if (data.games[i].state == Helper.gameState.development || data.games[i].state == Helper.gameState.launchReady)
                    ++noGames;
            }
            return noGames;
        },
        gamesActive: function() {
            if (initialised == false || data == null)
                return 0;

            if (typeof data.games === "undefined")
                return 0;

            var noGames = 0;
            for (i = 0; i < data.games.length; ++i) {
                if (data.games[i].state == Helper.gameState.active)
                    ++noGames;
            }
            return noGames;
        },
        getGameInDev: function() {
            if (typeof data.games === "undefined")
                return null;

            for (i = 0; i < data.games.length; ++i) {
                if (data.games[i].state == Helper.gameState.development || data.games[i].state == Helper.gameState.launchReady)
                    return i;
            }
        },
        workerCompleted: function(id) {
            if (this.gamesInDev() > 0) {
                var gameID = this.getGameInDev();

                if (data.games[gameID].state == Helper.gameState.development) {
                    data.games[gameID].devProgress += Levels.toCollectAmount(data.workers[id].level);
                    data.games[gameID].stats.innovation += Levels.toWorkInnovation(data.workers[id].level);
                    data.games[gameID].stats.optimisation += Levels.toWorkOptimisation(data.workers[id].level);
                    data.games[gameID].stats.quality += Levels.toWorkQuality(data.workers[id].level);
                    
                    if (data.games[gameID].devProgress > 100)
                        data.games[gameID].devProgress = 100;

                    if (data.games[gameID].devProgress >= 100) {
                        data.games[gameID].state = Helper.gameState.launchReady;
                    }
                    data.workers[id].timestamp = 0;
                    data.$save();
                }
            }
        },
        workerUpgrade: function(id, amount, cost) {
            if (data.company.currency >= cost && Levels.isValid(data.workers[id].level) == true) {
                data.workers[id].progress += amount;
                data.company.currency -= cost;
                metric_service.MoneySpent(cost);
                //automatically level up
                if (data.workers[id].progress >= 100) {
                    ++data.workers[id].level;
                    data.workers[id].progress = 0;
                }
                data.$save();
            }
        },
        workerStartJob: function(id, cost) {
            if (data.company.currency >= cost && data.workers[id].timestamp <= 0 && this.gamesInDev() > 0) {
                data.company.currency -= cost;
                metric_service.MoneySpent(cost);
                data.workers[id].timestamp = Helper.getUnixTimestamp();
                data.$save();
            }
        },
        addReward: function() {
            data.company.currency += 10000;
            data.company.prem_currency += 20;
            data.$save();
        },

        createGame: function(_name, _genre, _concept, _target) {
            if (typeof data.games == "undefined")
                data.games = new Array();

            if (this.gamesInDev() <= 0) {
                data.games.push(Helper.initGameData(data.games.length, _name, _genre, _concept, _target));
                data.$save("games");
            }
        },
        removeGame: function(id) {
            if (typeof data.games === "undefined")
                return;

            for (i = 0; i < data.games.length; ++i) {
                if (typeof data.games[i].id != "undefined") {
                    if (data.games[i].state == Helper.gameState.active && data.games[i].id == id) {
                        data.games[i].state = Helper.gameState.inactive;
                        data.$save("games");
                    }
                }
            }
        },
        launchGame: function() {
            for (i = 0; i < data.games.length; ++i) {
                if (data.games[i].state == Helper.gameState.launchReady) {
                    var new_pop = Helper.GenerateGameStat(30000, 1000, (Levels.data.work.innovation.max * Levels.data.collect.amount), data.games[i].stats.innovation);
                    var new_ppu = Helper.GenerateGameStat(0.4, 0.1, (Levels.data.work.optimisation.max * Levels.data.collect.amount), data.games[i].stats.optimisation);
                    var new_peak = Helper.GenerateGameStat(10000000, 10000, (Levels.data.work.quality.max * Levels.data.collect.amount), data.games[i].stats.quality);
                    var increases = Helper.GetGameGenreIncrease(data.games[i].genre) + Helper.GetGameConceptIncrease(data.games[i].concept) + Helper.GetGameTargettIncrease(data.games[i].target);

                    console.log(new_pop);
                    console.log(new_peak);

                    data.games[i].state = Helper.gameState.active;
                    data.games[i].timeLaunched = Helper.getUnixTimestamp();
                    data.games[i].popularity = Math.floor(new_pop + (new_pop * increases));
                    data.games[i].peak = Math.floor(new_peak + (new_peak * increases));
                    data.games[i].ppu = new_ppu.toFixed(2);;
                    data.games[i].rate = 1.5;

                    console.log(data.games[i]);
                }
            }
            data.$save("games");
        },
        profitCollect: function() {
            var created_date = Helper.GetGameDate(data.company.created);
            var years_collecting = created_date.year - data.company.timestamp;

            var rows = new Array();
            var columns = new Array();
            var col_data = new Array();
            var stats = new Array(data.games.length);
            var overall_profit = 0;

            columns.push({"id": "year", "label": "Year", "type": "string"});

            col_data.push({ v: "Last Year" });
            for (i = 0; i < data.games.length; ++i) {
                stats[i] = {active : false};

                if (data.games[i].state == Helper.gameState.active) {
                    
                    //set up column names
                    columns.push({
                        "id": "game"+i,
                        "label": data.games[i].name,
                        "type": "number"
                    });

                    //get all data for last years entries
                    col_data.push({ v: data.games[i].popularity });

                    stats[i].active = true;
                    stats[i].name = data.games[i].name;
                    stats[i].popularity = -data.games[i].popularity; // so we can see the difference
                    stats[i].profit = 0;
                }
            }
            rows.push({ c: col_data});

            for (x = 0; x < years_collecting; ++x) {
                var col_data = new Array();
                col_data.push({ v: "Year "+(x+1) });

                for (i = 0; i < data.games.length; ++i) {
                    if (data.games[i].state == Helper.gameState.active) {

                        var new_pop = Math.floor((data.games[i].peak / Helper.randNum(10, 20)) * data.games[i].rate + data.games[i].popularity);
                        
                        if (new_pop > data.games[i].peak && data.games[i].rate > 0) 
                            data.games[i].rate = -data.games[i].rate;
                        
                        data.games[i].popularity = new_pop;

                        col_data.push({ v: data.games[i].popularity });
                        var game_profit = Math.ceil(data.games[i].popularity * data.games[i].ppu);
                        overall_profit += game_profit;

                        stats[i].popularity += data.games[i].popularity;
                        stats[i].profit += game_profit;
                    }
                }

                rows.push({ c: col_data});
            }

            data.company.currency += overall_profit;
            data.company.timestamp = created_date.year;
            data.$save();
            
            return {
                profit: overall_profit,
                collected: years_collecting,
                gamestats: stats,
                chartdata: {
                    "cols": columns, 
                    "rows": rows
                }
            };
        }
    };
});



myapp.factory('messagebox', function MessageboxService($modal) {
    return {
        confirmation: function(_text, _event) {
            var modalInstance = $modal.open({
                templateUrl: 'page/modal/confirmation/template.html',
                controller: Modal_Confirmation_Controller,
                resolve : { text: function() { return _text; } }
            });
            modalInstance.result.then(function (confrim) {
                if (confrim == true) { 
                    _event();
                }
            });
        }
    };
});