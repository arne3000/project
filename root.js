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
                loadLibraries(["helper", "level", "error", "metric", "slots"], function(status) {
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
                loadLibraries(["helper", "level", "error", "metric", "slots"], function(status) {
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
    SETUP DATABASE SERVICE
************************/
myapp.factory('database', function myService($firebase, $firebaseAuth, $q) {
    var _url = 'https://socialproject.firebaseio.com/';
    var _ref = null;
    var initialised = false;
    var login_method = "facebook";
    var auth = null;
    var user = null;

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
                    initialised = true;
                    user = _user;
                    callback(_user);
                } else {
                    console.log("need to log you in");
                    // user is logged out
                    login();
                }
            });
        },

        get: function(fallback) {
            //user.id
            var data = $firebase(new Firebase(_url));
            
            var keys = data.$child(user.id).$child('company').$child('currency');
            console.log(keys);
            if (keys == null)
                console.log('data not set');
            else
                console.log('data set');
        },

        getData: function(fallback) {
            if (initialised == true) {
                return $firebase(new Firebase(_url+user.id));
            } else {
                fallback();
            }
        }
    };
});

