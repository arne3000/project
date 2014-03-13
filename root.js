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
var myapp = angular.module('myapp', ["ui.router", "ui.bootstrap", "firebase", "ngRoute"]);



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
                loadLibraries(["helper", "level", "error", "metric", "workerdata", "slots"], function(status) {
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

    //main game loop
    .state('main', {
        url: "/main",
        templateUrl: "page/main/template.html",
        controller: 'Main_Controller',
        resolve: {
            libraries : function($q) {
                var deferred = $q.defer();
                loadLibraries(["helper", "level", "error", "metric", "workerdata", "slots"], function(status) {
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
    SETUP DATABASE FACTORY
************************/
myapp.factory('database', function myService($firebase, $firebaseAuth, $state) {
    var _url = 'https://socialproject.firebaseio.com/';
    var _ref = null;
    var initialised = false;

    var auth = null;
    var data = Helper.DefaultData();
    var relogFunc = null;


    return {
        initialise: function(callback) {
            auth = new FirebaseSimpleLogin(new Firebase(_url), function(error, _user) {
                if (error) {
                    // an error occurred while attempting login
                    console.log(error);
                    callback(3);
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
            auth.logout();
        },

        initialSetup: function(CompanyName) {
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
            data.$remove();
            initialised = false;
            auth.logout();
        },

        //manipulative functions
        addWorker: function(slotid, name, level) {
            data.workers.push(Helper.createWorker(slotid, name, level));
            data.$save("workers");
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
                    ++data.games[gameID].devProgress;
                    data.games[gameID].stats.innovation += Levels.toWorkInnovation(data.workers[id].level);
                    data.games[gameID].stats.optimisation += Levels.toWorkOptimisation(data.workers[id].level);
                    data.games[gameID].stats.quality += Levels.toWorkQuality(data.workers[id].level);
                    
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
                data.games.push(Helper.initGameData(_name, _genre, _concept, _target));
                data.$save("games");
            }
        },
        launchGame: function() {
            for (i = 0; i < data.games.length; ++i) {
                if (data.games[i].state == Helper.gameState.launchReady) {
                    data.games[i].state = Helper.gameState.active;
                    data.games[i].timeLaunched = Helper.getUnixTimestamp();
                    data.games[i].popularity = 1000;
                    data.games[i].peak = 100000;
                    data.games[i].ppu = 0.1;
                    data.games[i].rate = 2;
                }
            }
            data.$save("games");
        },
        profitCollect: function() {
            var output = new Array();

            for (i = 0; i < data.games.length; ++i) {
                if (data.games[i].state == Helper.gameState.active) {
                    if (data.games[i].popularity*data.games[i].rate > data.games[i].peak && data.games[i].rate > 0) {
                        data.games[i].rate = -data.games[i].rate;
                    }
                    var prev_pop = data.games[i].popularity;
                    data.games[i].popularity *= data.games[i].rate;

                    var currency_increase = (data.games[i].popularity * data.games[i].ppu);
                    data.company.currency += currency_increase;

                    output.push({
                        name: data.games[i].name,
                        prev_pop: prev_pop,
                        new_pop: data.games[i].popularity,
                        currency: currency_increase
                    });
                }
            }
            data.company.timestamp = Helper.calculateGameTimestamp(data.company.timestamp);

            data.$save();

            return output;
        }
    };
});


myapp.factory('messagebox', function myMessageboxService($modal) {
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