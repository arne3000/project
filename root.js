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
    var data = null;
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

        createAdmin: function() {
            var _data = $firebase(new Firebase(_url));

            _data.admin = {
                user : {
                    intial_currency : 1000,
                    intial_premium : 50
                },
                game : {
                    progress_amount : 1,
                    genres : ["adventure", "stratergy", "arcade", "clicking", "shooter", "educational", "simulation"],
                    concepts : ["tetris", "chess"],
                    target_ages : ["10 or less", "10 to 20", "20 to 30", "30 and above"]
                },
                worker : {
                    names : [
                        "Darby Bagley", "Marti Mello", "Frieda Swan", "Elza Quinones", "Carlena Mccurdy", "Deja Spangler", "Doloris Agee", "Buffy Aleman", "Merrie Mccutcheon", "Lenora Heinz",
                        "Karma Houghton", "Merrilee Easterling", "Alida Middleton", "Vernita Lovelace", "James Ezell", "Shayne Spangler", "Lane Agee", "Kyra Bagley", "Hyo Bagley", "Lisha Bagley", 
                        "Devon Bagley", "Eustolia Mello", "Khadijah Swan", "Layne Quinones"
                        ],
                    levels : {
                        level: { min: 1, max: 30 },
                        collect : { 
                            amount : 1,
                            cost : { min: 5, max: 1000 },
                            prem : { min: 1, max: 30 },
                            time : { min: 30, max: 3600 }
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
                    }
                }
            };

            _data.$save('admin');
        },

        //manipulative functions
        addWorker: function(slotid, name, level) {
            data.workers.push(Helper.createWorker(slotid, name, level));
            data.$save("workers");
        },
        removeWorker: function(slotid) {
            data.$child("workers").$remove(slotid);
        },
        workerCompleted: function(id) {
            ++data.development.progress;
            data.development.stats.innovation += Levels.toWorkInnovation(data.workers[id].level);
            data.development.stats.optimisation += Levels.toWorkOptimisation(data.workers[id].level);
            data.development.stats.quality += Levels.toWorkQuality(data.workers[id].level);
            
            if (data.development.progress >= 100) {
                //transfer data to the games history
                this.launchGame();
            }
            data.workers[id].timestamp = 0;
            data.$save();
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
            if (data.company.currency >= cost && data.workers[id].timestamp <= 0 && typeof data.development != "undefined") {
                data.company.currency -= cost;
                data.workers[id].timestamp = Helper.getUnixTimestamp();
                data.$save();
            }
        },
        createDevelopment: function(_name, _genre, _concept, _target) {
            data.development = {
                name : _name,
                genre : _genre,
                concept : _concept,
                target : _target,
                progress : 1,
                timestamp : Helper.getUnixTimestamp(),
                stats : {
                    innovation : 1,
                    optimisation : 1,
                    quality : 1
                }
            };
            data.$save("development");
        },
        launchGame: function() {
            if (typeof data.development != "undefined") {
                if (data.development.progress >= 100) {
                    //need to figure out how these will be calculated
                    var _peak = 1000000;
                    var _rate = 50;
                    var _ppu = 0.2;

                    data.launched.push({
                        active: true,
                        //data from game dev, saved for visual display
                        name : data.development.name,
                        genre : data.development.genre,
                        concept : data.development.concept,
                        target : data.development.target,
                        stats : {
                            innovation : data.development.stats.innovation,
                            optimisation : data.development.stats.optimisation,
                            quality : data.development.stats.quality
                        },
                        created : Helper.getUnixTimestamp(),
                        timestamp : Helper.getUnixTimestamp(), //calculated on game launch
                        popularity : 1000, 
                        peak : _peak,
                        initrate : _rate,
                        rate : _rate,
                        ppu : _ppu
                    });
                    delete data.development;
                    data.$save();
                }
            }
        }
    };
});