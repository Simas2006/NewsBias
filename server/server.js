var fs = require("fs");
var CryptoJS = require("./aes");
var express = require("express");
var app = express();
var MOD_PASSWORD = process.argv[2];
var PORT = process.argv[3] || 8000;
var COOLDOWN_UNIT = 15000;
var TIME_BETWEEN_SAVE = 20000;
var ipCooldown = {};
var saltCount = 0;
var manager;

class IOManager {
  constructor() {
    var t = this;
    function loadDatabases(callback,index) {
      if ( ! index ) index = 0;
      fs.readFile(`${__dirname}/databases/${t.databaseNames[index]}.json`,function(err,data) {
        if ( err ) throw err;
        t.databases[t.databaseNames[index]] = JSON.parse(data);
        if ( index + 1 >= t.databaseNames.length ) callback();
        else loadDatabases(callback,index + 1);
      });
    }
    this.databaseNames = ["articles","comments","reports"];
    this.databases = {};
    loadDatabases(function() {
      setInterval(function() {
        t.saveData(t);
      },TIME_BETWEEN_SAVE);
    });
  }
  saveData(t) {
    function saveDatabases(callback,index) {
      if ( ! index ) index = 0;
      fs.writeFile(`${__dirname}/databases/${t.databaseNames[index]}.json`,JSON.stringify(t.databases[t.databaseNames[index]]),function(err,data) {
        if ( err ) throw err;
        if ( index + 1 >= t.databaseNames.length ) callback();
        else saveDatabases(callback,index + 1);
      });
    }
    saveDatabases(Function.prototype);
  }
}

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use("/api",function(request,response,next) {
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( ! ipCooldown[ip] ) ipCooldown[ip] = {
    recentRequests: 0,
    timestamp: new Date().getTime()
  }
  var remove = Math.floor((new Date().getTime() - ipCooldown[ip].timestamp) / COOLDOWN_UNIT);
  ipCooldown[ip].recentRequests = Math.max(ipCooldown[ip].recentRequests - remove,0);
  ipCooldown[ip].timestamp = new Date().getTime();
  if ( ipCooldown[ip].recentRequests >= 100 ) {
    console.log(`REJECT manyrequests ${ip}`);
    response.writeHead(429);
    response.write("err_many_requests");
    response.end();
  } else {
    ipCooldown[ip].recentRequests++;
    next();
  }
});

manager = new IOManager();

app.use("/api",require("./standard")(manager));
app.use("/api/admin",require("./admin")(manager,MOD_PASSWORD));

app.use("/web",express.static(__dirname + "/../web"));

app.get("/",function(request,response) {
  response.writeHead(200);
  response.write(`<!DOCTYPE html><html><body><script>location.href = "/web/home/index.html"</script></body></html>`);
  response.end();
});

app.listen(PORT,function() {
  console.log("Listening on port " + PORT);
});
