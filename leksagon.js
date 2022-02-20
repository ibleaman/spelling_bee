var validWords = [];
var letters = "";
var discoveredWords = [];
var totalScore = 0;
var pangram = getCookie("pangram");
var centerLetter = "";
var numFound = 0;
var maxscore = 0;

//makes http request to an awi api endpoint that triggers a lambda function to return today's letters/words
//today's words and letters are generated by a lambda function from the valid_words.json dictionary 
function get_valid_words(){

    const url='https://raw.githubusercontent.com/ibleaman/leksagon/master/puzzle.json';

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.setRequestHeader("Content-type", "text/plain");
    request.onreadystatechange = function(){
      try {
        var puzzles = JSON.parse(this.response);
        var most_recent_puzzle_date = Object.keys(puzzles).sort().reverse()[0];
        
        // did user specify a date? else, get most recent puzzle
        queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const date = urlParams.get('date');
        
        if (date !== null && puzzles.hasOwnProperty(date)) {
          var data = puzzles[date];
        } else {
          var data = puzzles[most_recent_puzzle_date];
        }
        
        //3 is LOADING, 4 is DONE
        if (request.readyState == 3 && request.status == 200){
          // console.log(data);
          letters = data['letters'];
          validWords = data['possible_words'];
          if (pangram != data['pangram']) {
            pangram = data['pangram'];
            setCookie("pangram", pangram, 365);
            setCookie("discoveredwords", JSON.stringify([]), 365);
            setCookie("totalscore", 0, 365);
            setCookie("numfound", 0, 365);
          } else {
            discoveredWords = getCookie("discoveredwords");
            if (discoveredWords != "") {
              discoveredWords = JSON.parse(discoveredWords);
            } else {
              discoveredWords = [];
            }
            totalScore = getCookie("totalscore");
            if (totalScore != "") {
              totalScore = parseInt(totalScore);
            } else {
              totalScore = 0;
            }
            numFound = getCookie("numfound");
            if (numFound != "") {
              numFound = parseInt(numFound);
            } else {
              numFound = 0;
            }
          }
          maxscore = data['maxscore'];
          initialize_letters();
          initialize_score();
          // console.log(validWords);

        }
      } 
      catch (e){
        console.log('error')
      };
    };
    request.send();
}

function initialize_score(){
  document.getElementById("maxscore").innerHTML = String(maxscore);
  
  if (numFound > 0) {
    document.getElementById("numfound").innerHTML = numFound;
    showDiscoveredWord('');
  }
  if (totalScore > 0) {
    document.getElementById("score").innerHTML = totalScore;
  }
}
//Creates the hexagon grid of 7 letters with middle letter as special color
function initialize_letters(){
    
    var hexgrid = document.getElementById('hexGrid');
    for(var i=0; i<letters.length; i++){
        var char = letters[i];
        
        var pElement = document.createElement("P");
        pElement.innerHTML = char;
        
        var aElement = document.createElement("A");
        aElement.className = "hexLink";
        aElement.href = "#";
        aElement.appendChild(pElement);
        aElement.addEventListener('click', clickLetter(char), false);

        var divElement = document.createElement('DIV');
        divElement.className = "hexIn"; 
        divElement.appendChild(aElement);
        
        var hexElement = document.createElement("LI");
        hexElement.className = "hex";
        hexElement.appendChild(divElement);
        if(i==3){
          aElement.id = "center-letter";
          centerLetter = letters[i];
        }
        hexgrid.appendChild(hexElement);
    }
}

Array.prototype.shuffle = function() {
  let input = this;
  for (let i = input.length-1; i >=0; i--) {
    let randomIndex = Math.floor(Math.random()*(i+1)); 
    let itemAtIndex = input[randomIndex]; 
    input[randomIndex] = input[i]; 
    input[i] = itemAtIndex;
  }
  return input;
}

function shuffleLetters() {
    letters.shuffle();
    //get center letter back to letter[3]
    var centerIndex = letters.indexOf(centerLetter);
    if(letters[3] != centerLetter) {
        var temp = letters[3];
        letters[3] = centerLetter;
        letters[centerIndex] = temp;
    }
    var hexgrid = document.getElementById('hexGrid');
    while (hexgrid.firstChild) {
      hexgrid.removeChild(hexgrid.firstChild);
    }
    initialize_letters();

    /*
    //fill in shuffled letters into hex grid 
    for(var i=0; i<letters.length; i++) {
        var char = letters[i];
        var hexLetterElement = document.getElementsByClassName("hexLink");
        hexLetterElement[i].removeChild(hexLetterElement[i].firstChild);

        var pElement = document.createElement("P");
        pElement.innerHTML = char;
        hexLetterElement[i].appendChild(pElement); 
    }*/
}

//Validate whether letter typed into input box was from one of 7 available letters
// document.getElementById("testword").addEventListener("keydown", function(event){
//     if(!letters.includes(event.key.toUpperCase())){
//         alert('Invalid Letter Typed')
//         event.preventDefault();
//     }
//   }
//   )

//When letter is clicked add it to input box
var clickLetter = function(letter){
  return function curried_func(e){
    var tryword = document.getElementById("testword");
    document.getElementById('testword').value = document.getElementById('testword').value + letter.toLowerCase();
  }
}

//Deletes the last letter of the string in the textbox
function deleteLetter(){
  var tryword = document.getElementById("testword");
  var trywordTrimmed = tryword.value.substring(0, tryword.value.length-1);
  tryword.value = trywordTrimmed;
}

function wrongInput(selector){
  $(selector).fadeIn(1000);
  $(selector).fadeOut(500);
  $( "#testword" ).effect("shake", {times:2.5}, 450, function(){
      clearInput();
    } );

}

function rightInput(selector){
  $(selector).fadeIn(1500).delay(500).fadeOut(1500);
  
  clearInput();
}

function clearInput(){
  document.getElementById('testword').value = '';
}

function showPoints(pts){
  $(".points").html("+" + pts);

}
//check if the word is valid and clear the input box
//word must be at least 4 letters
//word must contain center letter
//word can't already be found 
function submitWord(){
  var tryword = document.getElementById('testword');
  var centerLetter = document.getElementById('center-letter').firstChild.innerHTML;

  let score = 0;
  var isPangram = false;
  var showScore = document.getElementById("totalScore");
  
  var tryword_fixed = replaceWithPrecombined(tryword.value);
  
  if(tryword_fixed.length < 4){ 
    wrongInput("#too-short");
  }else if(discoveredWords.includes(tryword_fixed.toLowerCase())){
    wrongInput("#already-found");
  }else if(!tryword_fixed.toLowerCase().includes(centerLetter.toLowerCase())){
    wrongInput("#miss-center");

  }else if(validWords.includes(tryword_fixed.toLowerCase())){

    var isPangram = checkPangram(tryword_fixed);
    score = calculateWordScore(tryword_fixed, isPangram);
    addToTotalScore(score);
    console.log("totalscore: " + totalScore);
    
    showDiscoveredWord(tryword_fixed);
    var discoveredWordsAsJSONString = JSON.stringify(discoveredWords);
    setCookie("discoveredwords", discoveredWordsAsJSONString, 365);
    numFound++;
    setCookie("numfound", numFound, 365);
    document.getElementById("numfound").innerHTML = numFound;
    document.getElementById("score").innerHTML = totalScore;
    setCookie("totalscore", totalScore, 365);

    var l = tryword_fixed.length;
    if(isPangram){
      rightInput("#pangram");
      showPoints(l + 7);
    }else if(l < 5){
      rightInput("#good");
      showPoints(1);
    }else if(l<7){
      rightInput("#great");
      showPoints(l);
    }else{
      rightInput("#amazing");
      showPoints(l);
    }

  }else{
    wrongInput("#invalid-word");
  }
}

//if word was valid, display it 
//if all words are found end game.
function showDiscoveredWord(input){
    
    var discText = document.getElementById("discoveredText");
    if(input != "") {
      discoveredWords.push(input.toLowerCase());
      discoveredWords.sort(function(a, b) {
          return translate(a, "אאַאָבבֿגדהווּװױזחטייִײײַכּכךלמםנןסעפּפֿףצץקרששׂתּת").localeCompare(translate(b, "אאַאָבבֿגדהווּװױזחטייִײײַכּכךלמםנןסעפּפֿףצץקרששׂתּת"));//custom alphabetical order
      });
    }
    while(discText.firstChild){
      discText.removeChild(discText.firstChild);
    }

    var numFound = discoveredWords.length; 
    var numCol = Math.ceil(numFound/6);
    var w = 0; 
    for(var c=0; c<numCol; c++){
      var list = document.createElement("UL");
      list.id= "discovered-words"+c;
      list.style.cssText = "padding:5px 10px; font-weight:100; ";
      discText.appendChild(list);
      var n = 6; 
      if(c == numCol-1){
        if(numFound%6 ==0){
          if(numFound==0){
            n = 0
          }
          else{
            n=6;
          }
        }else{
        n = numFound%6;}
      }
      for(var i=0; i<n; i++){
        var listword = document.createElement("LI");
        var pword = document.createElement("P");
        pword.innerHTML = replaceNonfinalForms(discoveredWords[w]); 
        listword.appendChild(pword);
        list.appendChild(listword);
        w++;
      }
    }
    if (numFound == validWords.length){
      alert("מזל־טובֿ! דו האָסט אַנטדעקט אַלע מעגלעכע װערטער! אַ דאַנק פֿאַרן שפּילן.");
    }
}

//adds input "score" to the total score of user
function addToTotalScore(score) {
  totalScore += score;
}

//calculates the score of input "input" and also adjusts if "input" is a pangram 
function calculateWordScore(input, isPangram) {
  
  let len = input.length;
  let returnScore = 1; 
  if(len > 4) {
    if(isPangram) {
      returnScore = len + 7;
      
    }else{
      returnScore = len;
    }
  }
  console.log('score ' + returnScore)
  return returnScore;
}

//checks if "input" word is a pangram
function checkPangram(input) {
  
  var i;
  var containsCount = 0;
  var containsAllLetters = false;
  for(i = 0; i < 7; i++) {
    if(input.includes(letters[i])) {
      containsCount++;
    }
  }
  if(containsCount == 7) {
    containsAllLetters = true;
  }
  console.log("isPangram?: " + containsAllLetters);
  return containsAllLetters;
  
  // console.log(input.value);
  // if(input==pangram){
  //  return true;
  // }
 return false;
}

function checkIncorrectLetters(input) {
  var i;
  var badLetterCount = 0;
  for(i = 0; i < input.length; i++) {
    if(!letters.includes(input[i])) {
      badLetterCount++;
    }
  }
  if(badLetterCount > 0) {
    return true;
  }
  return false;
}

function pressEnter() {
  if(event.keyCode == 13) {
    submitWord();
  }
  //if(event.keyCode == 8) {
  //  deleteLetter();
  //}
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function replaceNonfinalForms(word) {
  var final_forms = {
    "כ$": "ך",
    "מ$": "ם",
    "נ$": "ן",
    "פֿ$": "ף",
    "צ$": "ץ"
  };
  for (var form in final_forms) {
    word = word.replace(new RegExp(form), final_forms[form]);
  }
  return word;
}

function replaceWithPrecombined(word) {
  var replacements = {
    "וּ": "וּ",
    "יִ": "יִ",
    "ײַ": "ײַ",
    "ייַ": "ײַ",
    "וו": "װ",
    "וי": "ױ",
    "יי": "ײ",
    "אַ": "אַ",
    "אָ": "אָ",
    "פּ": "פּ",
    "פֿ": "פֿ",
    "בֿ": "בֿ",
    "תּ": "תּ",
    "שׂ": "שׂ",
    "כּ": "כּ",
    "בּ": "ב",
    "ך": "כ",
    "ם": "מ",
    "ן": "נ",
    "ף": "פֿ",
    "ץ": "צ"
  };
  for (var letter_decomposed in replacements) {
    word = replaceAll(word, letter_decomposed, replacements[letter_decomposed]);
  }
  return word;
}

// custom alphabetical order
// from: https://stackoverflow.com/questions/28711653/sorting-string-function-by-custom-alphabet-javascript
function translate(str, alphabet) {
    var abc = "אאַאָבבֿגדהווּװױזחטייִײײַכּכךלמםנןסעפּפֿףצץקרששׂתּת";
    return [].map.call(str, function(c) {
        return alphabet[abc.indexOf(c)] || c;
    }).join("");
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + encodeURIComponent(cvalue) + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return decodeURIComponent(c.substring(name.length, c.length));
    }
  }
  return "";
}