var data;
var commentType;
var dialogSelected;

function simpleAJAX(url,callback) {
  var req = new XMLHttpRequest();
  req.open("GET",url);
  req.onload = function() {
    callback(this.responseText);
  }
  req.send();
}

function renderAll() {
  function renderCommentChain(chain,right) {
    if ( ! right ) right = 0;
    if ( chain.length == 0 ) return;
    chain.sort((a,b) => b.votes - a.votes);
    var comments = document.getElementById("comments");
    for ( var i = 0; i < chain.length; i++ ) {
      var row = document.createElement("tr");
      var votes = document.createElement("td");
      var upvote = document.createElement("button");
      upvote.innerHTML = "&#8593;";
      upvote.className = "tiny upvote";
      upvote.setAttribute("comment_id",chain[i].id);
      upvote.onclick = function() {
        simpleAJAX(`/api/commentvote${location.search},${this.getAttribute("comment_id")},up`,function() {
          simpleAJAX(`/api/info${location.search}`,function(result) {
            data = JSON.parse(result);
            renderAll();
          });
        });
      }
      votes.appendChild(upvote);
      votes.appendChild(document.createElement("br"));
      var value = document.createElement("button");
      value.innerText = chain[i].votes;
      value.className = "tiny";
      votes.appendChild(value);
      var options = document.createElement("button");
      options.innerHTML = "	&#8226; &#8226; &#8226;";
      options.className = "tiny wide";
      options.setAttribute("comment_id",chain[i].id);
      options.onclick = function() {
        var dropdown = document.getElementById("dropdown");
        if ( dialogSelected != this.getAttribute("comment_id") ) {
          var position = this.getBoundingClientRect();
          var bodyPosition = document.body.getBoundingClientRect();
          dropdown.style.position = "absolute";
          dropdown.style.left = (position.left - bodyPosition.left + position.width * 0.5) + "px";
          dropdown.style.top = (position.top - bodyPosition.top + position.height * 0.5) + "px";
          dropdown.style.display = "block";
          dialogSelected = this.getAttribute("comment_id");
        } else {
          dropdown.style.display = "none";
          dialogSelected = null;
        }
      }
      votes.appendChild(options);
      votes.appendChild(document.createElement("br"));
      var downvote = document.createElement("button");
      downvote.innerHTML = "&#8595;";
      downvote.className = "tiny downvote";
      downvote.setAttribute("comment_id",chain[i].id);
      downvote.onclick = function() {
        simpleAJAX(`/api/commentvote${location.search},${this.getAttribute("comment_id")},down`,function() {
          simpleAJAX(`/api/info${location.search}`,function(result) {
            data = JSON.parse(result);
            renderAll();
          });
        });
      }
      votes.appendChild(downvote);
      votes.style.width = "20%";
      row.appendChild(votes);
      var comment = document.createElement("td");
      var b = document.createElement("b");
      b.innerText = decodeURIComponent(chain[i].name);
      b.className = ["left","center","right"][chain[i].opinion];
      comment.appendChild(b);
      var p = document.createElement("p");
      p.innerText = decodeURIComponent(chain[i].comment);
      comment.appendChild(p);
      var reply = document.createElement("div");
      var textbox = document.createElement("textarea");
      textbox.rows = "1";
      textbox.placeholder = "Add a reply...";
      textbox.id = "replyBox:" + chain[i].id;
      reply.appendChild(textbox);
      var panel = document.createElement("div");
      var button1 = document.createElement("button");
      button1.className = "rectangle";
      button1.innerText = "Comment";
      button1.onclick = function() {
        console.log("comment",this.id);
      }
      panel.appendChild(button1);
      var button2 = document.createElement("button");
      button2.className = "rectangle";
      button2.innerText = "Cancel";
      button2.onclick = function() {
        var textbox = document.getElementById(this.parentElement.id.split(":").slice(0,2).join(":"));
        textbox.value = "";
        this.parentElement.style.display = "none";
      }
      panel.appendChild(button2);
      panel.appendChild(document.createElement("br"));
      panel.id = "replyBox:" + chain[i].id + ":panel";
      panel.style.display = "none";
      reply.appendChild(panel);
      reply.id = "reply:" + i;
      comment.appendChild(reply);
      comment.style.paddingLeft = right + "px";
      comment.style.width = "80%";
      comment.className = "alignleft";
      row.appendChild(comment);
      comments.appendChild(row);
      renderCommentChain(chain[i].replies,right + 50);
    }
  }
  var activeCount = 0;
  var interval = setInterval(function() {
    document.getElementById("complete").innerText = `${Math.min(activeCount,Math.abs(data.votes.rating))}% Biased`;
    document.getElementById("complete").className = data.votes.rating > 0 ? "right" : data.votes.rating < 0 ? "left" : "";
    document.getElementById("leftvote").innerHTML = `The left (${Math.min(activeCount,data.votes.left.sum / (data.votes.left.sum + data.votes.right.sum) * 100 || 0)}% of everyone) said:<br />${Math.min(activeCount,Math.abs(data.votes.left.rating))}% Biased<br />${data.votes.left.rating < 0 ? "&lt;" : ""}&#9473;&#9473;&#9473;&#9473;${data.votes.left.rating > 0 ? "&gt;" : ""}`
    document.getElementById("leftvote").className = data.votes.left.rating > 0 ? "right" : data.votes.left.rating < 0 ? "left" : "";
    document.getElementById("rightvote").innerHTML = `The right (${Math.min(activeCount,data.votes.right.sum / (data.votes.right.sum + data.votes.right.sum) * 100 || 0)}% of everyone) said:<br />${Math.min(activeCount,Math.abs(data.votes.right.rating))}% Biased<br />${data.votes.right.rating < 0 ? "&lt;" : ""}&#9473;&#9473;&#9473;&#9473;${data.votes.right.rating > 0 ? "&gt;" : ""}`
    document.getElementById("rightvote").className = data.votes.right.rating > 0 ? "right" : data.votes.right.rating < 0 ? "left" : "";
    activeCount++;
    if ( activeCount >= 100 ) clearInterval(interval);
  },25);
  var comments = document.getElementById("comments");
  while ( comments.firstChild ) {
    comments.removeChild(comments.firstChild);
  }
  renderCommentChain(data.comments);
}

function runVote(type) {
  simpleAJAX(`/api/vote${location.search},${localStorage.getItem("party")},${type}`,location.reload);
}

function runComment(reply) {
  var req = new XMLHttpRequest();
  req.open("POST",`/api/comment${location.search},${document.getElementById("commentName").value},${reply || -1},${commentType || 1}`);
  req.onload = renderAll;
  req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  req.send(`comment=${document.getElementById("comment").value}`);
}

function setCommentType(type) {
  document.getElementById("opinionSel0").className = "left tiny";
  document.getElementById("opinionSel1").className = "center tiny";
  document.getElementById("opinionSel2").className = "right tiny";
  document.getElementById("opinionSel" + type).className = "selected tiny";
  commentType = type;
}

function dropdownOperation(type) {
  if ( type == 0 ) {

  }
}

window.onload = function() {
  simpleAJAX(`/api/info${location.search}`,function(result) {
    data = JSON.parse(result);
    renderAll();
    var commentBoxes = document.getElementsByTagName("textarea");
    for ( var i = 0; i < commentBoxes.length; i++ ) {
      commentBoxes[i].onfocus = function() {
        document.getElementById(this.id + ":panel").style.display = "block";
      }
      commentBoxes[i].onblur = function() {
        if ( this.value == "" ) document.getElementById(this.id + ":panel").style.display = "none";
      }
    }
  });
}
