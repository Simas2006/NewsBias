var data;
var commentType;
var commentDialogSelected;
var reminders;
var hasActiveReminder;
var reminderDialogActive = false;

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
        var dropdown = document.getElementById("commentDropdown");
        if ( commentDialogSelected != this.getAttribute("comment_id") ) {
          var position = this.getBoundingClientRect();
          var bodyPosition = document.body.getBoundingClientRect();
          dropdown.style.position = "absolute";
          dropdown.style.left = (position.left - bodyPosition.left + position.width * 0.5) + "px";
          dropdown.style.top = (position.top - bodyPosition.top + position.height * 0.5) + "px";
          dropdown.style.display = "block";
          commentDialogSelected = this.getAttribute("comment_id");
        } else {
          dropdown.style.display = "none";
          commentDialogSelected = null;
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
      var selected = data.comments.filter(item => item.votes > 0 && item.opinion == chain[i].opinion).sort((a,b) => b.votes - a.votes);
      if ( selected[0] && selected[0].id == chain[i].id ) {
        var star = document.createElement("img");
        star.src = "/web/article/star.png";
        star.width = "30";
        star.height = "30";
        comment.appendChild(star);
      }
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
        var textbox = document.getElementById(this.parentElement.id.split(":").slice(0,2).join(":"));
        runComment(textbox.value,this.parentElement.id.split(":")[1],this.parentElement.id);
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
      var name = document.createElement("input");
      name.size = "40";
      name.maxlength = "40";
      name.placeholder = "Name";
      name.id = "replyBox:" + chain[i].id + ":panel:name";
      panel.appendChild(name);
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
  function renderTopComment(opinion) {
    var element = document.getElementById(["left","center","right"][opinion] + "Box");
    while ( element.firstChild ) {
      element.removeChild(element.firstChild);
    }
    var selected = data.comments.filter(item => item.votes > 0 && item.opinion == opinion).sort((a,b) => b.votes - a.votes);
    var item = selected[0] || null;
    var b = document.createElement("b");
    b.innerText = "\n" + ["Left","Center","Right"][opinion] + " Top Opinion\n";
    element.appendChild(b);
    if ( item ) {
      var text = document.createElement("p");
      text.className = "alignleft";
      text.innerText = decodeURIComponent(item.comment);
      text.style.paddingLeft = "20px";
      element.appendChild(text);
      var author = document.createElement("p");
      author.className = "alignright";
      author.innerText = `~ ${decodeURIComponent(item.name)} (${item.votes} vote${item.votes > 1 ? "s" : ""})`;
      author.style.paddingRight = "20px";
      element.appendChild(author);
    } else {
      var text = document.createElement("p");
      text.className = "alignleft";
      text.innerText = "No opinion available.";
      text.style.paddingLeft = "20px";
      element.appendChild(text);
    }
  }
  var comments = document.getElementById("comments");
  while ( comments.firstChild ) {
    comments.removeChild(comments.firstChild);
  }
  renderCommentChain(data.comments);
  renderTopComment(0);
  renderTopComment(1);
  renderTopComment(2);
  renderBarGraphic(document.getElementById("graphic"),data.votes.rating);
  var commentBoxes = document.getElementsByTagName("textarea");
  for ( var i = 0; i < commentBoxes.length; i++ ) {
    commentBoxes[i].onfocus = function() {
      document.getElementById(this.id + ":panel").style.display = "block";
    }
    commentBoxes[i].onblur = function() {
      if ( this.value == "" ) document.getElementById(this.id + ":panel").style.display = "none";
    }
    commentBoxes[i].onkeyup = function() {
      this.rows = this.value.split("\n").length;
    }
  }
  var table = document.getElementById("votetable");
  while ( table.firstChild ) {
    table.removeChild(table.firstChild);
  }
  var row = document.createElement("tr");
  var titles = ["","<S","<M","<W","<C>","W>","M>","S>"]
  var colors = ["white","blue","#4c4cff","#9999ff","white","#ff9999","#ff4c4c","red"];
  for ( var i = 0; i < titles.length; i++ ) {
    var col = document.createElement("td");
    col.innerText = titles[i];
    col.style.backgroundColor = colors[i];
    row.appendChild(col);
  }
  table.appendChild(row);
  for ( var i = 0; i < data.votes.matrix.length; i++ ) {
    var row = document.createElement("tr");
    var col = document.createElement("td");
    col.innerText = titles[i + 1 + (i > 2 ? 1 : 0)];
    col.style.backgroundColor = colors[i + 1 + (i > 2 ? 1 : 0)];
    row.appendChild(col);
    for ( var j = 0; j < data.votes.matrix[i].length; j++ ) {
      var col = document.createElement("td");
      col.innerText = data.votes.matrix[i][j] + "%";
      var lbyte = Math.round(255 - 255 * (data.votes.matrix[i][j] / 100));
      if ( j < 3 ) col.style.backgroundColor = `rgb(${lbyte},${lbyte},255)`;
      else if ( j > 3 ) col.style.backgroundColor = `rgb(255,${lbyte},${lbyte})`;
      else col.style.backgroundColor = `rgb(${lbyte},${lbyte},${lbyte})`
      row.appendChild(col);
    }
    table.appendChild(row);
  }
  document.getElementById("link").href = data.url;
  document.getElementById("link").innerText = data.title;
  document.getElementById("author").innerText = `By ${data.author}`;
}

function runVote(type) {
  if ( localStorage.getItem("party") ) {
    simpleAJAX(`/api/vote${location.search},${localStorage.getItem("party")},${type}`,function() {
      simpleAJAX(`/api/info${location.search}`,function(result) {
        data = JSON.parse(result);
        renderAll();
        if ( type < 3 ) setCommentType(0);
        if ( type > 3 ) setCommentType(2);
        incrementAwardPoints(1);
      });
    });
  } else {
    alert("Before voting, you must select an opinion from the home page.");
  }
}

function runComment(text,replyId,id) {
  if ( document.getElementById(id + ":name").value == "" ) {
    alert("You need to set a name!");
    return;
  }
  var req = new XMLHttpRequest();
  req.open("POST",`/api/comment${location.search},${document.getElementById(id + ":name").value},${replyId || -1},${replyId ? 1 : (commentType || 1)}`);
  req.onload = function() {
    simpleAJAX(`/api/info${location.search}`,function(result) {
      data = JSON.parse(result);
      renderAll();
      incrementAwardPoints(3);
      if ( id == "comment" ) {
        document.getElementById("comment").value = "";
      }
    });
  }
  req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  req.send(`comment=${text}`);
}

function setCommentType(type) {
  document.getElementById("opinionSel0").className = "left tiny";
  document.getElementById("opinionSel1").className = "center tiny";
  document.getElementById("opinionSel2").className = "right tiny";
  document.getElementById("opinionSel" + type).className = "selected tiny";
  commentType = type;
}

function commentDropdownOperation(type,button) {
  if ( type == 0 ) {
    document.getElementById("replyBox:" + commentDialogSelected).focus();
  } else if ( type == 1 ) {
    window.open(`/web/article/report/index.html${location.search},${commentDialogSelected}`,"_blank");
  } else if ( type == 2 ) {
    
  }
  document.getElementById("commentDropdown").style.display = "none";
}

function reminderDropdownOperation(type) {
  var days = [1,3,7,14,30];
  if ( type > 0 ) {
    var val = new Date().getTime() + days[type - 1] * 86400;
    reminders.push([location.search.slice(1),val]);
    localStorage.setItem("reminders",reminders.map(item => item.join(":")).join(","));
    document.getElementById("reminderButton").innerHTML = "&#x1f514";
  }
  toggleReminderDropdown();
}

function toggleReminderDropdown(button) {
  if ( hasActiveReminder ) {
    reminders = reminders.filter(item => item[0] != location.search.slice(1));
    localStorage.setItem("reminders",reminders.map(item => item.join(":")).join(","));
    hasActiveReminder = false;
    document.getElementById("reminderButton").innerHTML = "&#x1f515";
  } else {
    var dropdown = document.getElementById("reminderDropdown");
    if ( ! reminderDialogActive ) {
      var position = button.getBoundingClientRect();
      var bodyPosition = document.body.getBoundingClientRect();
      dropdown.style.position = "absolute";
      dropdown.style.left = (position.left - bodyPosition.left + position.width * 0.5) + "px";
      dropdown.style.top = (position.top - bodyPosition.top + position.height * 0.5) + "px";
      dropdown.style.display = "block";
    } else {
      dropdown.style.display = "none";
    }
    reminderDialogActive = ! reminderDialogActive;
  }
}

window.onload = function() {
  if ( ! localStorage.getItem("reminders") ) localStorage.setItem("reminders","");
  reminders = localStorage.getItem("reminders").split(",").map(item => item.split(":"));
  hasActiveReminder = reminders.filter(item => item[0] == location.search.slice(1)).length > 0;
  reminders = reminders.filter(item => parseInt(item[1]) >= new Date().getTime() || item[0] != location.search.slice(1));
  localStorage.setItem("reminders",reminders.map(item => item.join(":")).join(","));
  if ( hasActiveReminder ) {
    document.getElementById("reminderButton").innerHTML = "&#x1f514";
  }
  simpleAJAX(`/api/info${location.search}`,function(result) {
    data = JSON.parse(result);
    renderAll();
    renderNavbar();
    setCommentType(1);
  });
}
