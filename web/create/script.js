var opinion = 3;

function setOpinion(value) {
  opinion = value;
  var items = ["left1","left2","left3","center","right3","right2","right1"];
  for ( var i = 0; i < items.length; i++ ) {
    document.getElementById(items[i]).className = "tiny";
  }
  document.getElementById(items[value]).className = "tiny selected";
}

function runCreate() {
  var errorState = -1;
  if ( document.getElementById("url").value.length < 3 ) errorState = 0;
  else if ( document.getElementById("name").value.length < 3 ) errorState = 1;
  else if ( document.getElementById("author").value.length < 3 ) errorState = 2;
  if ( errorState > -1 ) {
    document.getElementById("error").innerText = `The ${["URL","Name","Author Name"][errorState]} must be at least 3 characters.`;
    document.getElementById("error").className = "error";
    return;
  }
  simpleAJAX(`/api/create?${document.getElementById("url").value},${document.getElementById("name").value},${document.getElementById("author").value},${document.getElementById("type").value}`,function(id) {
    simpleAJAX(`/api/vote?${id},${localStorage.getItem("party")},${opinion}`,function() {
      incrementAwardPoints(4);
      location.href = `/web/article/index.html?${id}`;
    });
  });
}

window.onload = function() {
  renderNavbar(Function.prototype);
  setOpinion(3);
}
