document.getElementById("heading").innerHTML =
  localStorage["title"] || "Text Editor v.0.0.1"; // default text
document.getElementById("content").innerHTML =
  localStorage["text"] || "This text is automatically saved every second :) "; // default text

setInterval(function() {
  // fuction that is saving the innerHTML of the div
  localStorage["title"] = document.getElementById("heading").innerHTML; // heading div
  localStorage["text"] = document.getElementById("content").innerHTML; // content div
  //searchDiv();
}, 1000);

setInterval(function() {
	searchDiv();
}, 10000);



let divSearch = [];
let divArray = [];
let i = 0;
let x = 0;
function searchDiv() {
	divSearch.push(localStorage["text"].indexOf("<div>", x+1));
	
	//console.log(divSearch[i]);
	divArray.push(localStorage["text"].slice(x, divSearch[i]));
	x = divSearch[i];
	i++;
	//console.log(divArray[i-1]);
	if(divSearch[i-1] !== undefined && divSearch[i-1] !== -1) {
		
		if (localStorage["text"].indexOf("<div>", divSearch[i-1]) !== -1){
			searchDiv();
		} 

		//console.log(divSearch[i-1]);
		
	}
}
searchDiv();