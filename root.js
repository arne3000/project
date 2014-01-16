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
    var login_method = "facebook";

    var auth = null;
    var user = null;
    var data = null;
    var relogFunc = null;

    var login = function() {
        if (auth != null) {
            auth.login(login_method);
        }
    };

    return {
        initialise: function(callback) {
            auth = new FirebaseSimpleLogin(new Firebase(_url), function(error, _user) {
                console.log("Entering...");
                if (error) {
                    console.log("error");
                    // an error occurred while attempting login
                    console.log(error);
                    initialised = false;
                } else if (_user) {
                    console.log("all cool in da hood");
                    // user authenticated with Firebase
                    user = _user;
                    data = $firebase(new Firebase(_url+user.id));
                    data.$on("loaded", function(value) {
                        if (value == null) {
                            callback(false);
                        } else {
                            initialised = true;
                            callback(true);
                        }
                    });
                } else {
                    console.log("need to log you in");
                    // user is logged out
                    login();
                }
            });
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

        user: function() {
            if (initialised == true)
                return user;
            else {
                this.relogFunc();
                return null;
            }
        },

        display: function() {
            console.log(data);
            console.log(user);
            console.log(auth);
            console.log(initialised);
        },
    };
});