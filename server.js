var fs = require("fs");
var CryptoJS = require("./aes");
var express = require("express");
var app = express();
var MOD_PASSWORD = process.argv[2];
var PORT = process.argv[3] || 8000;
var WAIT_BETWEEN_VOTES = 15 * 60 * 1000;
var COOLDOWN_UNIT = 15000;
var VOTE_MODIFIER = 0.25;
var SEARCH_THRESHOLD = 0.66;
var recentVotes = {};
var ipCooldown = {};
var articles,comments,reports;
var saltCount = 0;

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

app.use("/api/vote",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( ! articles[qs[0]] ) {
    console.log(`REJECT notfound ${ip} ${qs[0]}`);
    response.writeHead(404);
    response.write("err_no_article");
    response.end();
    return;
  }
  if ( ! recentVotes[ip] ) recentVotes[ip] = [];
  var item = recentVotes[ip].filter(item => item.article == qs[0] && item.comment == null)[0];
  if ( item ) {
    if ( item.expires <= new Date().getTime() ) {
      recentVotes[ip].splice(recentVotes[ip].indexOf(item),1);
    } else {
      console.log(`REJECT expire ${ip} ${qs[0]}`);
      response.writeHead(400);
      response.write("err_no_expire");
      response.end();
      return;
    }
  }
  recentVotes[ip].push({
    article: qs[0],
    comment: null,
    expires: new Date().getTime() + WAIT_BETWEEN_VOTES
  });
  articles[qs[0]].votes[qs[1]][qs[2]]++;
  console.log(`VOTE ${ip} ${qs[0]} ${qs[1]} ${qs[2]}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/commentVote",function(request,response) {
  function searchTree(chain,id,move) {
    if ( chain.length == 0 ) return false;
    for ( var i = 0; i < chain.length; i++ ) {
      if ( chain[i].id == id ) {
        chain[i].votes += move;
        return true;
      }
      if ( searchTree(chain[i].replies,id,move) ) return true;
    }
    return false;
  }
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( ! articles[qs[0]] ) {
    console.log(`REJECT notfound ${ip} ${qs[0]}`);
    response.writeHead(404);
    response.write("err_no_article");
    response.end();
    return;
  }
  if ( ["up","down"].indexOf(qs[2]) == -1 ) {
    console.log(`REJECT nooption ${ip} ${qs[0]} ${qs[1]}`);
    response.writeHead(400);
    response.write("err_no_option");
    response.end();
    return;
  }
  if ( ! recentVotes[ip] ) recentVotes[ip] = [];
  var item = recentVotes[ip].filter(item => item.article == qs[0] && item.comment == qs[1])[0];
  if ( item ) {
    if ( item.expires <= new Date().getTime() ) {
      recentVotes[ip].splice(recentVotes[ip].indexOf(item),1);
    } else {
      console.log(`REJECT expire ${ip} ${qs[0]} ${qs[1]}`);
      response.writeHead(400);
      response.write("err_no_expire");
      response.end();
      return;
    }
  }
  recentVotes[ip].push({
    article: qs[0],
    comment: qs[1],
    expires: new Date().getTime() + WAIT_BETWEEN_VOTES
  });
  var ret = searchTree(comments[qs[0]],qs[1],qs[2] == "up" ? 1 : -1);
  if ( ! ret ) {
    if ( ! articles[qs[0]] ) {
      console.log(`REJECT notfound ${ip} ${qs[0]} ${qs[1]}`);
      response.writeHead(404);
      response.write("err_no_article");
      response.end();
      return;
    }
  }
  console.log(`COMMENTVOTE ${ip} ${qs[0]} ${qs[1]} ${qs[2]}`)
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/create",function(request,response) {
  request.url = decodeURI(request.url);
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  var id = Math.floor(Math.random() * 10e5).toString();
  articles[id] = {
    id: id,
    url: qs[0],
    title: qs[1],
    author: qs[2],
    category: qs[3],
    votes: [
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0]
    ]
  }
  comments[id] = [];
  console.log(`CREATE ${ip} ${qs[0]} ${qs[1]}`);
  response.writeHead(200);
  response.write(id);
  response.end();
});

app.use("/api/info",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  var data = [];
  for ( var i = 0; i < qs.length; i++ ) {
    if ( ! articles[qs[i]] ) {
      response.writeHead(404);
      response.write("err_no_article");
      response.end();
      console.log(`REJECT notfound ${ip} ${qs[i]}`);
      return;
    }
    var item = articles[qs[i]];
    data.push({
      id: item.id,
      url: item.url,
      title: item.title,
      author: item.author,
      comments: comments[qs[i]],
      votes: calculateVotes(item.votes,true)
    });
  }
  console.log(`INFO ${ip} ${qs[0]}`);
  response.writeHead(200);
  if ( qs.length > 1 ) response.write(JSON.stringify(data));
  else response.write(JSON.stringify(data[0]));
  response.end();
});

app.post("/api/comment",function(request,response) {
  function searchTree(chain,id,name,opinion,comment) {
    if ( chain.length == 0 ) return false;
    for ( var i = 0; i < chain.length; i++ ) {
      if ( chain[i].id == id ) {
        chain[i].replies.push({
          id: Math.floor(Math.random() * 10e6),
          name: name,
          votes: 0,
          opinion: opinion,
          comment: comment,
          replies: []
        });
        return true;
      }
      if ( searchTree(chain[i].replies,id,name,opinion,comment) ) return true;
    }
    return false;
  }
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( ! articles[qs[0]] ) {
    response.writeHead(404);
    response.write("err_no_article");
    response.end();
    console.log(`REJECT notfound ${ip} ${qs[0]}`);
    return;
  }
  if ( qs[2] == -1 ) {
    comments[qs[0]].push({
      id: Math.floor(Math.random() * 10e6),
      name: qs[1],
      votes: 0,
      opinion: qs[3],
      comment: encodeURI(request.body.comment),
      replies: []
    });
  } else {
    searchTree(comments[qs[0]],qs[2],qs[1],qs[3],request.body.comment);
  }
  console.log(`COMMENT ${ip} ${qs[0]} ${qs[2]}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/search",function(request,response) {
  /*
    - Hot Topic (lots of votes)
    - Controversial (overall 0% biased,passionate)
    - Not Passionate (overall 0% biased,not passionate)
    - Decided (overall 100% biased,both sides)
    - One-Sided (overall 75% biased,one side only)
    - You Decide (new articles/no votes)
  */
  function applyMatrix(votes,matrix) {
    var sum = 0;
    for ( var i = 0; i < votes.length; i++ ) {
      for ( var j = 0; j < votes[i].length; j++ ) {
        sum += votes[i][j] * matrix[j];
      }
    }
    return sum;
  }
  function sortOnMatrix(items,matrix,type) {
    var arr = [];
    var keys = Object.keys(items);
    for ( var i = 0; i < keys.length; i++ ) {
      arr.push(items[keys[i]]);
    }
    if ( type != -1 ) arr = arr.filter(item => item.category == type);
    return arr.sort(function(a,b) {
      return applyMatrix(b.votes,matrix) - applyMatrix(a.votes,matrix);
    }).map(function(item) {
      return {
        id: item.id,
        url: item.url,
        title: item.title,
        author: item.author,
        comments: comments[item.id],
        rating: calculateVotes(item.votes)
      }
    });
  }
  function sortOnDualMatrix(items,matrixa,matrixb,multiplier,type) {
    var arr = [];
    var keys = Object.keys(items);
    for ( var i = 0; i < keys.length; i++ ) {
      arr.push(items[keys[i]]);
    }
    if ( type != -1 ) arr = arr.filter(item => item.category == type);
    return arr.sort(function(a,b) {
      var vala = Math.abs(applyMatrix(a.votes,matrixa) - applyMatrix(a.votes,matrixb)) * multiplier;
      var valb = Math.abs(applyMatrix(b.votes,matrixa) - applyMatrix(b.votes,matrixb)) * multiplier;
      return valb - vala;
    }).map(function(item) {
      return {
        id: item.id,
        url: item.url,
        title: item.title,
        author: item.author,
        comments: comments[item.id],
        rating: calculateVotes(item.votes)
      }
    });
  }
  function calculatePoints(string,item) {
    var points = 0;
    for ( var j = 0; j < string.length; j++ ) {
      if ( item.url.toLowerCase().indexOf(string[j].toLowerCase()) > -1 ) points++;
      if ( item.title.toLowerCase().indexOf(string[j].toLowerCase()) > -1 ) points++;
    }
    return points / string.length;
  }
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  if ( qs[0] == "retr" ) {
    var results = [
      sortOnMatrix(articles,[1,1,1,1,1,1,1],qs[1]).slice(0,3),
      sortOnMatrix(articles,[4,2,1,1,1,2,4],qs[1]).slice(0,3),
      sortOnMatrix(articles,[1,2,4,6,4,2,1],qs[1]).slice(0,3),
      sortOnDualMatrix(articles,[1,1,1,0,0,0,0],[0,0,0,0,1,1,1],-1,qs[1]).slice(0,3),
      sortOnDualMatrix(articles,[1,1,1,0,0,0,0],[0,0,0,0,1,1,1],1,qs[1]).slice(0,3),
      sortOnMatrix(articles,[-1,-1,-1,-1,-1,-1,-1],qs[1]).slice(0,3)
    ];
    response.writeHead(200);
    response.write(JSON.stringify(results));
    response.end();
  } else {
    qs[0] = qs.slice(0,-1).join(",");
    var keys = Object.keys(articles);
    var string = qs[0].split("%20").map(item => decodeURIComponent(item));
    var arr = [];
    var keys = Object.keys(articles);
    for ( var i = 0; i < keys.length; i++ ) {
      arr.push(articles[keys[i]]);
    }
    var type = qs[qs.length - 1];
    if ( type != -1 ) arr = arr.filter(item => item.category == type);
    var sorted = arr.sort((a,b) => {
      var pointsa = calculatePoints(string,a);
      var pointsb = calculatePoints(string,b);
      return pointsb - pointsa;
    });
    sorted = sorted.filter(item => string[0] != "" && calculatePoints(string,item) >= SEARCH_THRESHOLD).map(function(item) {
      return {
        id: item.id,
        url: item.url,
        title: item.title,
        author: item.author,
        comments: comments[item.id],
        rating: calculateVotes(item.votes)
      }
    });
    response.writeHead(200);
    response.write(JSON.stringify(sorted));
    response.end();
  }
  console.log(`SEARCH ${ip} ${qs[0]}`);
});

app.use("/api/random",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  var keys = Object.keys(articles);
  var id = Math.floor(Math.random() * keys.length);
  response.writeHead(200);
  response.write(`<!DOCTYPE html><html><body><script>location.href = "/web/article/index.html?${keys[id]}"</script></body></html>`);
  response.end();
});

app.use("/api/stats",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  response.writeHead(200);
  var text = JSON.stringify(articles[qs[0]].votes);
  if ( qs[1] == "csv" ) text = articles[qs[0]].votes.map(item => item.join(",")).join("\n");
  response.write(text);
  response.end();
});

app.use("/api/admin/report",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  reports.push({
    type: qs[0],
    article: qs[1],
    comment: (qs[2] || "").toString() || null
  });
  console.log(`REPORT ${ip} ${qs[0]} ${qs[1]} ${qs[2] || null}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/admin/checkreports",function(request,response) {
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
  var active = reports.filter(item => item.article == qs[0]);
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

app.use("/api/admin/delete",function(request,response) {
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
  if ( qs[1] != "null" ) searchTree(comments[qs[0]],qs[1]);
  else delete articles[qs[0]];
  saltCount++;
  console.log(`REMOVE ${ip} ${qs[0]} ${qs[1] != "null" ? qs[1] : ""}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/admin/rain",function(request,response) {
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
  searchTree(comments[qs[0]],qs[1]);
  console.log(`RAIN ${ip} ${qs[0]} ${qs[1]}`);
  response.writeHead(200);
  response.write("ok");
  response.end();
});

app.use("/api/admin/saltcount",function(request,response) {
  var url = request.url.split("?")[0];
  var qs = request.url.split("?").slice(1).join("?").split(",");
  var ip = request.connection.remoteAddress || request.headers["x-forwarded-for"];
  response.writeHead(200);
  response.write(saltCount.toString());
  response.end();
});

app.use("/web",express.static("web"));

app.get("/",function(request,response) {
  response.writeHead(200);
  response.write(`<!DOCTYPE html><html><body><script>location.href = "/web/home/index.html"</script></body></html>`);
  response.end();
});

function calculateVotes(votes,full) {
  var matrix = [
    [1,2,3,3,3,2,1],
    [2,1,2,2,2,1,2],
    [3,2,1,1,1,2,3],
    [3,2,1,1,1,2,3],
    [2,1,2,2,2,1,2],
    [1,2,3,3,3,2,1]
  ]
  var left = 0;
  var right = 0;
  var middle = 0;
  for ( var i = 0; i < votes.length; i++ ) {
    for ( var j = 0; j < votes[i].length; j++ ) {
      var val = votes[i][j] * matrix[i][j];
      if ( j < 3 ) left += val;
      else if ( j > 3 ) right += val;
      else middle += val;
    }
  }
  var result = 0;
  if ( left > right ) result = Math.round(left / (left + right + middle) * 100) * -1;
  else if ( right > left ) result = Math.round(right / (left + right + middle) * 100);
  if ( ! full ) return result;
  var copy = [];
  var sum = arrSum(votes);
  for ( var i = 0; i < votes.length; i++ ) {
    copy.push([]);
    for ( var j = 0; j < votes[i].length; j++ ) {
      copy[i].push(Math.round(votes[i][j] / sum * 100));
    }
  }
  return {
    rating: result,
    matrix: copy
  }
}

function arrSum(arr) {
  var sum = 0;
  for ( var i = 0; i < arr.length; i++ ) {
    if ( typeof arr[i] == "object" ) sum += arrSum(arr[i]);
    else sum += arr[i];
  }
  return sum;
}

app.listen(PORT,function() {
  fs.readFile(__dirname + "/articles.json",function(err,data) {
    if ( err ) throw err;
    articles = JSON.parse(data.toString());
    fs.readFile(__dirname + "/comments.json",function(err,data) {
      comments = JSON.parse(data.toString());
      fs.readFile(__dirname + "/reports.json",function(err,data) {
        reports = JSON.parse(data.toString());
        setInterval(function() {
          fs.writeFile(__dirname + "/articles.json",JSON.stringify(articles),function(err) {
            if ( err ) throw err;
            fs.writeFile(__dirname + "/comments.json",JSON.stringify(comments),function(err) {
              if ( err ) throw err;
              fs.writeFile(__dirname + "/reports.json",JSON.stringify(reports),function(err) {
                if ( err ) throw err;
              });
            });
          });
        },20000);
      });
    });
  });
  console.log("Listening on port " + PORT);
});
