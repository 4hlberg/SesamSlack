
var http = require('http');
var url = require('url');

var host = "0.0.0.0";
var port = "5000";

function start(route, handle) {
  function onRequest(request, response) {
    var pathName = url.parse(request.url).pathname;
    console.log('Request for ' + pathName + ' received.');
    route(handle, pathName, response, request);
  }
  
  var port = 8000;
  http.createServer(onRequest).listen(port);
  console.log("Server running at http://" +host +":" +port);

}

exports.start = start;