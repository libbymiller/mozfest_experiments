var http = require('http');
var fs = require('fs');
var crypto = require('crypto');
var faye = require('faye');

var faye_host = null;
var my_id = null;

if(process.argv[2]==null || process.argv[3]==null){
  console.log("Usage: node wifi.js fayeHostIP host");
  return 0;
}else{
  faye_host = process.argv[2];
  my_id = process.argv[3];
}

console.log("faye_host is "+faye_host+" host is "+my_id);

var client = new faye.Client('http://'+faye_host+':9292/faye');

fs.watch("moz", function (event, filename) {

  if(filename!=null && filename.match(/moz-0\d\.csv/)){

    console.log(filename);

    fs.readFile('moz/'+filename, 'utf8', function (err,data) {
      if (err) {
       return console.log(err);
      }
      arr = data.split("\r\n");
      arr2 = arr.slice(6,arr.length-2)
      var data = {};
      data["host"] = my_id;
      if(arr2){
        for(var a in arr2){
          arr3 = arr2[a].split(",");
          var mac_addr = arr3[0];
          var shasum = crypto.createHash('sha1');
          shasum.update(mac_addr);
          var id = shasum.digest('hex');
          var power = parseInt(arr3[3]);
          console.log("ID is "+id+" POWER is "+power);
          data[id] = power;
//        client.publish('/foo', {id: id, power: power});
        }
        console.log(data);
        client.publish('/foo', data);

      }

    });

  }

});




var make_http_call = function(id, power){

      var path = '/set_rssi/'+id+'/'+Math.abs(parseInt(power))
      console.log("path "+path);
      var options = {
        host: faye_host,
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
      };
      http.request(options, callback).end();


}

