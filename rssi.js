//see https://github.com/sandeepmistry/noble
//experiment with noble to call a url under certain rssi states
//npm nstall noble

var noble = require('noble');
var http = require("http");

//var noble = require('./index');
noble.on('stateChange', function(state) {
  if (state === 'poweredOn' ) {
    noble.startScanning([],false);
    console.log('Started Scanning');
  } else {
    noble.stopScanning();
  }
});

var known_peripherals = {};
var peripheral_disconnects = {};

noble.on('discover', function(peripheral) {
    console.log('Discovered Peripheral : ' + peripheral.uuid + ' RSSI:' + peripheral.rssi);
    peripheral_disconnects[peripheral.uuid] = 0;

    do_connect(peripheral);

    peripheral.on('disconnect', function() {
      var disconnects = peripheral_disconnects[peripheral.uuid];
      var d = disconnects+1;
      peripheral_disconnects[peripheral.uuid] = d;

      var the_interval = known_peripherals[peripheral.uuid];
      clearInterval(the_interval);
      if(d > 2){

//tell the api we're out of range
        var path = '/set_rssi/'+peripheral.uuid+'/200';
        console.log("path "+path);

        var options = {
          host: 'localhost',
          port: 3030,
          path: path
        };
        console.log("about to make request");

        callback = function(response) {
          var str = '';

          //another chunk of data has been recieved, so append it to `str`
          response.on('data', function (chunk) {
           str += chunk;
          });

          response.on('error', function(e) {
            console.log("Got error: " + e.message);
          });

          //the whole response has been recieved, so we just print it out here
          response.on('end', function () {
             console.log(str);
          });
        }
        http.request(options, callback).end();

      }


      setTimeout(function() {
        console.log('reconnecting');
        do_connect(peripheral);
      }, 2000);

    });


});


function do_connect(peripheral){

  peripheral.connect(function(error){  


    var interval = setInterval(function(){
      peripheral.updateRssi();
      console.log(peripheral.uuid + ' RSSI:' + peripheral.rssi);

      var path = '/set_rssi/'+peripheral.uuid+'/'+Math.abs(peripheral.rssi);
      console.log("path "+path);
      var options = {
        host: 'localhost',
        port: 3030,
        path: path
      };
      console.log("about to make request (2)");

      callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
         str += chunk;
        });

        response.on('error', function(e) {
         console.log("Got error: " + e.message);
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
           console.log(str);
        });
      }
      http.request(options, callback).end();

    },2000);

    known_peripherals[peripheral.uuid] = interval;

  });

}

