function simpleAJAX(url,callback) {
  var req = new XMLHttpRequest();
  req.open("GET",url);
  req.onload = function() {
    callback(this.responseText);
  }
  req.send();
}

function sendReport() {
  simpleAJAX(`/api/admin/report?${document.getElementById("form").type.value},${location.search.slice(1)}`,function(data) {
    window.close();
  });
}

window.onload = function() {
  document.getElementById("header").innerText = `Report ${["","Article","Comment"][location.search.split(",").length]}`
}
