'use strict';

var config = {
    apiKey: "AIzaSyD2CzxFepq5uLIxH49dBAFIbSy6XEygxpY",
    authDomain: "real-time-clip-board.firebaseapp.com",
    databaseURL: "https://real-time-clip-board.firebaseio.com",
    projectId: "real-time-clip-board",
    storageBucket: "real-time-clip-board.appspot.com",
    messagingSenderId: "723020002704"
};
firebase.initializeApp(config);


angular.module('realtime_clipboard', ['ngAnimate', 'ui.router', 'ngMaterial', 'firebase'])
    .run(['$transitions', '$state', function ($transitions, $state) {
        $transitions.onError({}, function ($transition$) {
            if ($transition$.error().detail === "AUTH_REQUIRED") {
                $state.go('login');
            }
        });
    }])
    .config(function ($urlRouterProvider, $stateProvider) {
        $stateProvider
            .state({
                name: 'login',
                url: '/',
                templateUrl: 'pages/login.html',
                controller: 'LoginController',
                resolve: {
                    'CurrentAuth': ['Auth', function (Auth) {
                        return Auth.$waitForSignIn();
                    }]
                }
            })
            .state({
                name: 'clipboard',
                url: '/clipboard',
                templateUrl: 'pages/clipboard.html',
                controller: 'ClipboardController',
                resolve: {
                    'CurrentAuth': ['Auth', function (Auth) {
                        return Auth.$requireSignIn();
                    }]
                }
            });
        $urlRouterProvider.otherwise('/');
    });

//CONTROLLERS
angular.module('realtime_clipboard')
    .controller('AppController', ['$scope', '$state', '$document', 'Auth', function ($scope, $state, $document, Auth) {
        Auth.$onAuthStateChanged(function (firebaseUser) {
            if (firebaseUser) {
                $state.go('clipboard');
            } else {
                $state.go('login');
            }
        });
    }])


    .controller('ClipboardController', ['$scope', 'CurrentAuth', '$state', 'Auth', '$mdSidenav', '$mdDialog', '$firebaseArray', function ($scope, CurrentAuth, $state, Auth, $mdSidenav, $mdDialog, $firebaseArray) {
		console.log(CurrentAuth);
        $scope.photo = CurrentAuth.photoURL;
        $scope.name = CurrentAuth.displayName;
        $scope.email = CurrentAuth.email;
        $scope.signout = function () {
            Auth.$signOut();
        }

        var dbref = firebase.database().ref().child('clips');
        $scope.clips = $firebaseArray(dbref);

        $scope.toggleSidenav = function () {
            $mdSidenav('left').toggle();
        }

        $scope.openMenu = function ($mdMenu, ev) {
            $mdMenu.open(ev);
        };

        $scope.deleteClip = function (clip) {
            $scope.clips.$remove(clip);
        }

        $scope.showPrompt = function (ev) {
            var enterNewClip = $mdDialog.prompt()
                .title('Paste in the text box.')
                .placeholder('Paste here')
                .ariaLabel('Paste here')
                .initialValue('')
                .targetEvent(ev)
                .ok('Save')
                .cancel('Cancel');

            $mdDialog.show(enterNewClip).then(function (result) {
                console.log(firebase.database.ServerValue.TIMESTAMP);
                var newClip = {
                    datecreated: firebase.database.ServerValue.TIMESTAMP,
                    cliptext: result
                };
                $scope.clips.$add(newClip).then(function (ref) {
                    console.log(ref);
                });
            }, function () {
                console.log('Cancelled');
            });
        };
    }])


    .controller('LoginController', ['$scope', 'CurrentAuth', '$state', 'Auth', function ($scope, CurrentAuth, $state, Auth) {
        $scope.login = function () {
            Auth.$signInWithPopup("google").then(function (result) {
                console.log("Signed in as:", result.user.uid);
            }).catch(function (error) {
                console.error("Authentication failed:", error);
            });
        }
    }]);

//SERVICES
angular.module('realtime_clipboard')
    .factory('Auth', ['$firebaseAuth', function ($firebaseAuth) {
        return $firebaseAuth();
}]);
