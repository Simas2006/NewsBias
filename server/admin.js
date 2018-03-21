var CryptoJS = require("./aes");
var express = require("express");
var router = new express.Router();
var manager;
var saltCount = 0;
var MOD_PASSWORD;

router.get("/report",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  manager.databases.reports.push({
    type: qs[0],
    article: qs[1],
    comment: (qs[2] || "").toString() || null
  });
  console.log(`REPORT ${ip} ${qs[0]} ${qs[1]} ${qs[2] || null}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

router.get("/checkreports",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  var result = {};
  qs[1] = CryptoJS.AES.decrypt(qs[1],MOD_PASSWORD).toString(CryptoJS.enc.Utf8).split(",");
  if ( qs[1][0] != "checkreports" || qs[1][1] != saltCount ) {
    console.log(`REJECT nodecrypt ${ip} ${qs[0]} ${qs[1] != "null" ? qs[1] : ""}`);
    response.writeHead(400);
    response.write("err_fail_decrypt");
    response.end();
    return;
  }
  var active = manager.databases.reports.filter(item => item.article == qs[0]);
  for ( var i = 0; i < active.length; i++ ) {
    var id = active[i].comment ? active[i].comment : "article";
    if ( ! result[id] ) result[id] = 0;
    result[id]++;
  }
  saltCount++;
  console.log(`CHECKREPORTS ${ip} ${qs[0]}`);
  response.writeHead(200);
  response.write(JSON.stringify(result));
  response.end();
});

router.get("/delete",function(request,response) {
  function searchTree(chain,id) {
    if ( chain.length == 0 ) return false;
    for ( var i = 0; i < chain.length; i++ ) {
      if ( chain[i].id == id ) {
        chain.splice(i,1);
        return true;
      }
      if ( searchTree(chain[i].replies,id) ) return true;
    }
    return false;
  }
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  qs = CryptoJS.AES.decrypt(qs[0],MOD_PASSWORD).toString(CryptoJS.enc.Utf8).split(",");
  if ( qs[0] == "" || qs[2] != saltCount ) {
    console.log(`REJECT nodecrypt ${ip} ${qs[0]} ${qs[1] != "null" ? qs[1] : ""}`);
    response.writeHead(400);
    response.write("err_fail_decrypt");
    response.end();
    return;
  }
  if ( qs[1] != "null" ) searchTree(manager.databases.comments[qs[0]],qs[1]);
  else delete manager.databases.articles[qs[0]];
  saltCount++;
  console.log(`REMOVE ${ip} ${qs[0]} ${qs[1] != "null" ? qs[1] : ""}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

router.get("/rain",function(request,response) {
  function searchTree(chain,id) {
    if ( chain.length == 0 ) return false;
    for ( var i = 0; i < chain.length; i++ ) {
      if ( chain[i].id == id ) {
        chain[i].votes = 1000000;
        return true;
      }
      if ( searchTree(chain[i].replies,id) ) return true;
    }
    return false;
  }
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  qs = CryptoJS.AES.decrypt(qs[0],MOD_PASSWORD).toString(CryptoJS.enc.Utf8).split(",");
  if ( qs[0] == "" || qs[2] != saltCount ) {
    console.log(`REJECT nodecrypt ${ip} ${qs[0]} ${qs[1] != "null" ? qs[1] : ""}`);
    response.writeHead(400);
    response.write("err_fail_decrypt");
    response.end();
    return;
  }
  searchTree(manager.databases.comments[qs[0]],qs[1]);
  console.log(`RAIN ${ip} ${qs[0]} ${qs[1]}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

router.get("/saltcount",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  response.writeHead(200);
  response.write(saltCount.toString());
  response.end();
});

function arrSum(arr) {
  var sum = 0;
  for ( var i = 0; i < arr.length; i++ ) {
    if ( typeof arr[i] == "object" ) sum += arrSum(arr[i]);
    else sum += arr[i];
  }
  return sum;
}

module.exports = function(result,password) {
  manager = result;
  MOD_PASSWORD = password;
  return router;
}
