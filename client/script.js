angular.module('MyApp', ["firebase", "videoplayer", 'ui.router', 'search', 'queue', 'youtube-embed'])

.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/queue');
  $stateProvider
    .state('search', {
      url: '/search',
      controller: 'searchController',
      templateUrl: 'search/search.html'
    })
    .state('videoplayer', {
      url: '/videoplayer',
      controller: 'MyController',
      templateUrl: 'videoplayer/videoplayer.html'
    })
    .state('queue', {
      url: '/queue',
      templateUrl: 'queue/queue.html'
    })
})

.controller('MyController', ['$scope', '$http', '$firebaseArray', 'queueServices', function ($scope, $http, $firebaseArray, queueServices) {
  $scope.decade;
  $scope.year;
  $scope.currentSong;
  $scope.queue = queueServices.queue;
  $scope.theBestVideo = ''

  $scope.playerVars = {
    controls: 0,
    autoplay: 1
  }

  $scope.$on('youtube.player.ready', function ($event, player) {
    // play it again
    console.log('player is ready')
    player.playVideo();
  });

  var tag = document.createElement('script');

  // tag.src = "https://www.youtube.com/iframe_api";
  // var firstScriptTag = document.getElementsByTagName('script')[0];
  // firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  $scope.player;
  $scope.onYouTubeIframeAPIReady = function() {
    $scope.player = new YT.Player('player', {
      height: '418',
      width: '465',
      videoId: 'M7lc1UVf-VE',
      events: {
        // 'onReady': onPlayerReady,
        // 'onStateChange': onPlayerStateChange
      }
    });
  }

  // $scope.onYouTubeIframeAPIReady();



  $('a').on('click', function() {
    $scope.decade = $(this).parent().parent().data('decade');
    $scope.year = $(this).data('year');
    var ref = $firebaseArray(new Firebase("https://peppypossumsripple.firebaseio.com/" + $scope.decade + "/" + $scope.year + "/"));
    ref.$loaded(function(data){
      $scope.songs = {};
      $scope.songs.list = data;
      console.log('just loaded ' + data.length + ' items');
    })
  });

  $('#player').bind('ended', function(){
    $('audio').attr('src', '');
    if (queueServices.queue.length > 0) {
      $scope.playNext();
    } else {
      $scope.$apply(function() {
        $scope.currentSong = null;
      });
    }
  });

  $scope.enqueue = function() {
    var resultsPath = this.songs.youTubeUrl.slice(22);
    var artist = this.songs.artist;
    var songTitle = this.songs.songTitle;
    console.log('adding ' + artist + '\'s song: ' + songTitle);

    queueServices.getSong(resultsPath)
    .success(function(data) {
      console.log($('youtube-video').attr('video-id'));
      console.log('youtubeLink: ' + data[0]);
      var noVideoPlaying = $('youtube-video').attr('video-id') === 'theBestVideo';
      console.log(noVideoPlaying);
      var first = queueServices.addToQueue(artist, songTitle, null, data[0], noVideoPlaying);
      if (first) {
        $scope.currentSong = first;
        $scope.theBestVideo = data[0]+'?autoplay=1';
        // $('iframe').attr('src', 'https://www.youtube.com/embed/'+data[1]+'?autoplay=1');
      }
    })
  };
  
  $scope.dequeue = function() {
    var newQueue = queueServices.remove(this.track.songTitle);
    $scope.$apply(function() {
      queueServices.queue = newQueue;
      console.log('new queue length is ' + queueServices.queue.length);
    })
  };

  $scope.playNext = function(param) {
    var next = queueServices.queue.shift();
    // if(queueServices.queue.length > 0) {

    // }
    if (param){
      $scope.currentSong = next || null; 
      if (!next) {
        $('audio').attr('src', '');
      } else {
        $scope.theBestVideo = next.videoLink
      }
    } else {
      // $apply kickstarts the $digest cycle to update current song and $scope.queue
      // $scope.$apply(function () {
        // $scope.currentSong = next;
        $scope.theBestVideo = next.videoLink
      // });
    }
    $('audio').attr('src', next.source);
  };

}])

.directive('dropdown', function($document) {
  return {
    restrict: "C",
    link: function(scope, elem, attr) {
      elem.bind('click', function() {
        elem.toggleClass('dropdown-active');
        elem.addClass('active-recent');
      });
      $document.bind('click', function() {
        if(!elem.hasClass('active-recent')) {
          elem.removeClass('dropdown-active');
        }
        elem.removeClass('active-recent');
      });
    }
  };
});