(function() {
    'use strict';

    angular.module('qrScanner', ["ng"]).directive('qrScanner', ['$interval', '$window', function($interval, $window) {
        return {
            restrict: 'E',
            scope: {
                ngSuccess: '&ngSuccess',
                ngError: '&ngError',
                ngVideoError: '&ngVideoError'
            },
            link: function(scope, element, attrs) {

                window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

                var height = attrs.height || 300;
                var width = attrs.width || 250;

                var video = $window.document.createElement('video');
                video.setAttribute('width', width);
                video.setAttribute('height', height);
                video.setAttribute('autoplay', true);
                video.setAttribute('style', '-moz-transform:rotateY(-180deg);-webkit-transform:rotateY(-180deg);transform:rotateY(-180deg);');

                var canvas = $window.document.createElement('canvas');
                canvas.setAttribute('id', 'qr-canvas');
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                canvas.setAttribute('style', 'display:none;');

                angular.element(element).append(video);
                angular.element(element).append(canvas);
                var context = canvas.getContext('2d');
                var stopScan;

                var scan = function() {
                    if ($window.localMediaStream) {
                        context.drawImage(video, 0, 0, 307,250);
                        try {
                            qrcode2.decode();
                        } catch(e) {
                            scope.ngError({error: e});
                        }
                    }
                }

                var successCallback = function(stream) {
                    video.srcObject = stream;
                    $window.localMediaStream = stream;

                    scope.video = video;

                    video.play();
                    stopScan = $interval(scan, 500);
                }

                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    var constraints = {
                        audio: false,
                        video: {
                            facingMode: { ideal: "environment" }
                        }
                    };

                    navigator.mediaDevices.getUserMedia(constraints)
                    .then(function(stream) {
                      video.srcObject = stream;
                      $window.localMediaStream = stream;

                      scope.video = video;

                      video.play();
                      stopScan = $interval(scan, 500);
                    })
                    .catch(function(error) {
                      scope.ngVideoError({error: error});
                    });
                } else {
                    scope.ngVideoError({error: 'Native web camera streaming (getUserMedia) not supported in this browser.'});
                }

                qrcode2.callback = function(data) {
                    scope.ngSuccess({data: data});
                };

                element.bind('$destroy', function() {
                    if ($window.localMediaStream) {
                        $window.localMediaStream.getVideoTracks()[0].stop();
                    }
                    if (stopScan) {
                        $interval.cancel(stopScan);
                    }
                });
            }
        }
    }]);
})();
