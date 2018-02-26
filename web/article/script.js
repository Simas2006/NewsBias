var data;

function loadData(callback) {
  var req = new XMLHttpRequest();
  req.open("GET",`/api/info${location.search}`);
  req.onload = function() {
    data = JSON.parse(this.responseText);
    callback();
  }
  req.send();
}

function renderAll() {
  var activeCount = 0;
  var interval = setInterval(function() {
    document.getElementById("complete").innerText = `${Math.min(activeCount,Math.abs(data.votes.rating))}% Biased`;
    document.getElementById("complete").className = data.votes.rating > 0 ? "right" : data.votes.rating < 0 ? "left" : "";
    document.getElementById("leftvote").innerHTML = `The left (${Math.min(activeCount,data.votes.left.sum / (data.votes.left.sum + data.votes.right.sum) || 0)}% of everyone) said:<br />${Math.min(activeCount,Math.abs(data.votes.left.rating))}% Biased<br />${data.votes.left.rating < 0 ? "&lt;" : ""}&#9473;&#9473;&#9473;&#9473;${data.votes.left.rating > 0 ? "&gt;" : ""}`
    document.getElementById("leftvote").className = data.votes.left.rating > 0 ? "right" : data.votes.left.rating < 0 ? "left" : "";
    document.getElementById("rightvote").innerHTML = `The right (${Math.min(activeCount,data.votes.right.sum / (data.votes.right.sum + data.votes.right.sum) || 0)}% of everyone) said:<br />${Math.min(activeCount,Math.abs(data.votes.right.rating))}% Biased<br />${data.votes.right.rating < 0 ? "&lt;" : ""}&#9473;&#9473;&#9473;&#9473;${data.votes.right.rating > 0 ? "&gt;" : ""}`
    document.getElementById("rightvote").className = data.votes.right.rating > 0 ? "right" : data.votes.right.rating < 0 ? "left" : "";
    activeCount++;
    if ( activeCount >= 100 ) clearInterval(interval);
  },25);
}

function runVote(type) {
  var req = new XMLHttpRequest();
  req.open("GET",`/api/vote${location.search},${localStorage.getItem("party")},${type}`);
  req.onload = function() {
    data = JSON.parse(this.responseText);
    callback();
  }
  req.send();
}

window.onload = function() {
  loadData(renderAll);
}
