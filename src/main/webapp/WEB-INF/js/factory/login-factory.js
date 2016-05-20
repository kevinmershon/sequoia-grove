'use strict';

// Factory to inject authorization token with each request sent
angular.module('sequoiaGroveApp').factory('loginFactory', function ( $log, localStorageService, $q, $http, $rootScope, $timeout) {
  var service = {};
  var observerCallbacks = [];

  var user = {};
  var loggedIn = false;

  // call this to notify observers
  var notifyObservers = function(){
    angular.forEach(observerCallbacks, function(callback){
      callback();
    });
  };

  // User initialized login
  function appSignIn(gapi) {
    var deferred = $q.defer();
    $http.post("/sequoiagrove/auth/login/", {'email':user.email, 'idtoken':user.token}).
      then(function(success){
        if (success.status === 200) {
          if (success.data.loginFailed) {
            deferred.resolve(success.data);
          }
          // TODO get more explicit permissions for UI control
          user.isManager = parseInt(success.data.user.classificationId) !== 1;
          user.id = success.data.user.id;
          deferred.resolve(user.isManager);
        }
        else {
          deferred.reject(success.data.message);
          loggedIn = false;
          user = {};
          signOut(gapi);
        }
      }
    );
    return deferred.promise;
  }

  // cleanup data, remove session, and logout
  function destructData() {
    var deferred = $q.defer();
    // remove session
    $http({ url: '/sequoiagrove/auth/logout', method: "POST" }).
      then( function(success) {
        deferred.resolve(success);
      }
    );
    return deferred.promise;
  }

  // sign in this app with google, then send to verify signing and get user in db
  function googleSignIn(googleUser, gapi) {
    var deferred = $q.defer();
    var auth2 = gapi.auth2.getAuthInstance();
    var profile = googleUser.getBasicProfile();
    user = {
      'google_id':profile.getId(),
      'email': profile.getEmail(),
      'name': profile.getName(),
      'firstname': profile.getGivenName(),
      'lastname': profile.getFamilyName(),
      'profile_photo':profile.getImageUrl(),
      'token':googleUser.getAuthResponse().id_token,
      'is_manager':false,
      'id':'',
    };
    deferred.resolve();
    return deferred.promise;
  }

  // signout google with this application
  function signOut(gapi) {
    var deferred = $q.defer();
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      deferred.resolve();
    });
    return deferred.promise;
  }

  // log user out and redirect to google to sign out of their account
  function switchUser(gapi) {
    var deferred = $q.defer();
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      deferred.resolve();
    });
    return deferred.promise;
  }

/* Exposed service functions*/

  // sign in - first calls google then this app
  service.signIn = function(googleUser, gapi) {
    var deferred = $q.defer();
    googleSignIn(googleUser, gapi).
      then(function() {
        appSignIn(gapi).
          then(function(success) {
            loggedIn = true;
            notifyObservers();
            deferred.resolve(success);
          });
      });
    return deferred.promise;
  };

  // sign out - first calls google then this app
  service.signOut = function(gapi) {
    var deferred = $q.defer();
    signOut(gapi).
      then(function() {
        destructData().
        then(function() {
          user = {};
          loggedIn = false;
          notifyObservers();
          deferred.resolve();
        });
      });
    return deferred.promise;
  };

  // sign out entire google account first, then this app
  service.switchUser = function() {
    var deferred = $q.defer();
    switchUser(gapi).
      then(function(success) {
        destructData().
        then(function() {
          user = {};
          loggedIn = false;
          notifyObservers();
          deferred.resolve();
        });
      })
    return deferred.promise;
  };

  // get logged in user
  service.getUser = function() {
    return user;
  };

  // determine login status
  service.isLoggedIn = function() {
    return loggedIn;
  }

  // register observers
  service.registerObserverCallback = function(callback){
    observerCallbacks.push(callback);
  };

  return service
});
