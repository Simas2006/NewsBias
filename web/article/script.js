var data;

function loadData(callback) {
  var req = new XMLHttpRequest();
  req.open("GET","/api/info" + location.search);
  req.onload = function() {
    data = JSON.parse(this.responseText);
    callback();
  }
  req.send();
}

window.onload = function() {
  loadData(console.log);
}
