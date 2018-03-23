var inUS = false;

function simpleAJAX(url,locator,callback) {
  if ( ! callback ) callback = locator;
  var req = new XMLHttpRequest();
  req.open("GET",url);
  req.onload = function() {
    if ( this.responseText.startsWith("err") ) {
      alert(`A error occurred while communicating with the server: ${this.responseText}
You may attempt to resolve these issues, or you may report them to the NewsBias development team.
Sorry about that.`);
      return;
    }
    callback(this.responseText);
  }
  req.onerror = function() {
    if ( locator ) callback(`{"countryCode":"--"}`);
  }
  req.send();
}

function renderNavbar(callback) {
  if ( ! localStorage.getItem("points") ) localStorage.setItem("points","0:0:0");
  var points = localStorage.getItem("points").split(":").map(item => parseInt(item));
  if ( points[1] >= Math.pow(2,points[0]) * 100 ) {
    points[1] -= Math.pow(2,points[0]) * 100;
    points[2] = 1;
    localStorage.setItem("points",points.join(":"));
  }
  var navbar = document.getElementById("navbar");
  var row = document.createElement("tr");
  var col1 = document.createElement("td");
  col1.className = "navbar-item navbar-item-small aligncenter";
  col1.onclick = _ => location.href = "/web/home/index.html";
  var img = document.createElement("img");
  img.src = "/web/navbar/icon.png";
  img.width = "30";
  img.height = "30";
  col1.appendChild(img);
  row.appendChild(col1);
  var col2 = document.createElement("td");
  col2.className = "navbar-item navbar-item-large aligncenter";
  var input = document.createElement("input");
  input.id = "navbar-search";
  input.placeholder = "Search for something... 🔎";
  input.onkeyup = function(event) {
    if ( event.key == "Enter" ) {
      location.href = "/web/search/index.html?" + this.value + ",-1";
    }
  }
  col2.appendChild(input);
  row.appendChild(col2);
  var col3 = document.createElement("td");
  col3.className = "navbar-item navbar-item-small aligncenter";
  col3.onclick = _ => location.href = "/web/home/remind/index.html";
  var span = document.createElement("span");
  span.innerHTML = "&#x1f514;";
  col3.appendChild(span);
  row.appendChild(col3);
  var col4 = document.createElement("td");
  col4.className = "navbar-item navbar-item-small aligncenter";
  col4.onclick = _ => location.href = "/web/create/index.html";
  var span = document.createElement("span");
  span.innerHTML = "+";
  col4.appendChild(span);
  row.appendChild(col4);
  navbar.appendChild(row);
  if ( ! localStorage.getItem("reminders") ) localStorage.setItem("reminders","");
  var reminders = localStorage.getItem("reminders").split(",").map(item => item.split(":"));
  reminders = reminders.filter(item => parseInt(item[1]) < new Date().getTime());
  if ( localStorage.getItem("points").split(":")[2] == "1" ) reminders.push(null);
  if ( reminders.length > 0 ) {
    var badge = document.createElement("p");
    badge.className = "navbar-badge";
    document.body.appendChild(badge);
    var position = col3.getBoundingClientRect();
    var bodyPosition = document.body.getBoundingClientRect();
    badge.style.left = (position.left - bodyPosition.left + position.width * 0.55) + "px";
    badge.style.top = (position.top - bodyPosition.top - position.height * 0.05) + "px";
    badge.innerText = reminders.length;
    badge.style.display = "block";
  }
  function merge() {
    if ( inUS ) {
      document.body.style.setProperty("--left-color","blue");
      document.body.style.setProperty("--left-color-1","#4c4cff");
      document.body.style.setProperty("--left-color-2","#9999ff");
      document.body.style.setProperty("--right-color","red");
      document.body.style.setProperty("--right-color-1","#ff4c4c");
      document.body.style.setProperty("--right-color-2","#ff9999");
    } else {
      document.body.style.setProperty("--left-color","red");
      document.body.style.setProperty("--left-color-1","#ff4c4c");
      document.body.style.setProperty("--left-color-2","#ff9999");
      document.body.style.setProperty("--right-color","blue");
      document.body.style.setProperty("--right-color-1","#4c4cff");
      document.body.style.setProperty("--right-color-2","#9999ff");
    }
    callback();
  }
  if ( localStorage.getItem("location") ) {
    inUS = localStorage.getItem("location") == "US";
    merge();
  } else {
    simpleAJAX("http://ip-api.com/json",true,function(locinfo) {
      locinfo = JSON.parse(locinfo);
      if ( locinfo.countryCode == "US" ) inUS = true;
      localStorage.setItem("location",locinfo.countryCode);
      merge();
    });
  }
}

function renderBarGraphic(element,rating) {
  function animateFramePie() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 15;
    ctx.strokeStyle = inUS ? "blue" : "red";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.0 * Math.PI,1.2 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = `#${inUS ? "99" : "ff"}99${inUS ? "ff" : "99"}`;
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.2 * Math.PI,1.4 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "#999999";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.4 * Math.PI,1.6 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = `#${inUS ? "ff" : "99"}99${inUS ? "99" : "ff"}`;
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.6 * Math.PI,1.8 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = inUS ? "red" : "blue";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,canvas.width / 2 - 10,1.8 * Math.PI,2.0 * Math.PI,false);
    ctx.stroke();
    ctx.strokeStyle = "black";
    var activeCount = Math.min(frameCount,Math.floor(Math.abs(rating)));
    var angle = (activeCount * Math.sign(rating) + 100) / 200 + 1;
    var xval = Math.cos(angle * Math.PI) * (canvas.width / 2 - 3) + (canvas.width / 2);
    var yval = Math.sin(angle * Math.PI) * (canvas.width / 2 - 3) + (canvas.height / 2);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2,canvas.height / 2);
    ctx.lineTo(xval,yval);
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(canvas.width / 2,canvas.height / 2,15,0,2 * Math.PI);
    ctx.fill();
    var arr = ["blue","black","red"];
    if ( ! inUS ) arr = arr.reverse();
    ctx.fillStyle = arr[Math.sign(rating) + 1];
    ctx.textAlign = "center";
    ctx.font = "80px Arial";
    ctx.fillText(activeCount + "%",canvas.width / 2,canvas.height * 0.75);
    frameCount++;
    if ( frameCount > 100 ) clearInterval(graphicInterval);
  }
  function animateFrameBar() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = inUS ? "blue" : "red";
    ctx.fillRect(0,10,canvas.width / 5,canvas.height / 8 * 3);
    ctx.fillStyle = `#${inUS ? "99" : "ff"}99${inUS ? "ff" : "99"}`;
    ctx.fillRect(canvas.width / 5,10,canvas.width / 5,canvas.height / 8 * 3);
    ctx.fillStyle = "#999999";
    ctx.fillRect(canvas.width / 5 * 2,10,canvas.width / 5,canvas.height / 8 * 3);
    ctx.fillStyle = `#${inUS ? "ff" : "99"}99${inUS ? "99" : "ff"}`;
    ctx.fillRect(canvas.width / 5 * 3,10,canvas.width / 5,canvas.height / 8 * 3);
    ctx.fillStyle = inUS ? "red" : "blue";
    ctx.fillRect(canvas.width / 5 * 4,10,canvas.width / 5,canvas.height / 8 * 3);
    ctx.fillStyle = "black";
    ctx.fillRect(0,10,7,canvas.height / 8 * 3);
    ctx.fillRect(canvas.width - 7,10,7,canvas.height / 8 * 3)
    ctx.strokeStyle = "black";
    ctx.lineWidth = 7;
    var activeCount = Math.min(frameCount,Math.floor(Math.abs(rating)));
    var xval = (activeCount / 100) * (canvas.width / 2) * Math.sign(rating) + (canvas.width / 2);
    ctx.beginPath();
    ctx.moveTo(xval,0);
    ctx.lineTo(xval,canvas.height / 8 * 3 + 20);
    ctx.stroke();
    var arr = ["blue","black","red"];
    if ( ! inUS ) arr = arr.reverse();
    ctx.fillStyle = arr[Math.sign(rating) + 1];
    ctx.textAlign = "center";
    ctx.font = "80px Arial";
    ctx.fillText(activeCount + "%",canvas.width / 2,canvas.height * 0.75);
    frameCount++;
    if ( frameCount > 100 ) clearInterval(graphicInterval);
  }
  while ( element.firstChild ) {
    element.removeChild(element.firstChild);
  }
  var canvas = document.createElement("canvas");
  canvas.height = canvas.width;
  element.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var frameCount = 0;
  var graphicInterval;
  if ( localStorage.getItem("graphicType") == "pie" ) {
    graphicInterval = setInterval(animateFramePie,25);
  } else if ( localStorage.getItem("graphicType") == "bar" ) {
    graphicInterval = setInterval(animateFrameBar,25);
  }
}

function incrementAwardPoints(val) {
  if ( ! localStorage.getItem("points") ) localStorage.setItem("points","0:0:0");
  var points = localStorage.getItem("points").split(":");
  points[1] = parseInt(points[1]) + val;
  localStorage.setItem("points",points.join(":"));
}
