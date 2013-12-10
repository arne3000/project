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
    //new user
    .state('newuser', { 
        url: "/new",
        templateUrl: "page/newuser/template.html",
        controller: 'Newuser_Controller',
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
    //add a game
    .state('addgame', {
        url: "/add",
        templateUrl: "page/addgame/template.html",
        controller: 'Addgame_Controller',
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
    //goto the worker settings
    .state('worker', {
        url: "/worker/:id",
        templateUrl: "page/worker/template.html",
        controller: 'Worker_Controller',
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
});


/************************
    SETUP DATABASE SERVICE
************************/
myapp.factory('database', function myService(angularFire, angularFireAuth) {
    var _url = 'https://socialproject.firebaseio.com/';
    var _ref = new Firebase(_url);
    var verified = false;

    return {
        initialise: function(_scope, localVar, localData) {
            angularFireAuth.initialize(_ref, { 
                scope: _scope, name: localVar,
                callback: function(err, user) {
                    // Called whenever there is a change in authentication state.
                    if (user.verified == true) {
                        verified = true;
                        angularFire(_ref, _scope, localData);
                    } else {
                        verified = false;
                        angularFireAuth.login("facebook", { rememberMe: true });
                    }
                    console.log(user.name+": "+err);
                }
            });
        },
        bind: function(_scope, localVar, callback) {
            if (verified == true)
                angularFire(_ref, _scope, localVar);
            else
                callback();
        }
    };
});

