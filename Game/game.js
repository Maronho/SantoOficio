var speeds= [0,1,2,3,5];
var currentSpeed= 1;

var fechaStart = new Date(1500,2,1);
var fechaAct = new Date();

var gameIsOver = false;

var oroInicial= 300;
var oroActual = oroInicial;
var herejesCapturados= 0;
var desordenPublico = 0;

var agentCounter = 0;

var clockSignal;
var jsonCities;
var jsonNames;
var cities = [];

var herejesMes = 0;

var selectedAgent;
var selectedCity;

var actualCity=null;
var speedIcons= [
  "./resources/SpeedIcons/Pause.png",
  "./resources/SpeedIcons/Slow.png",
  "./resources/SpeedIcons/Medium.png",
  "./resources/SpeedIcons/Fast.png",
  "./resources/SpeedIcons/SupaFast.png"
];

var ost = new Audio('./resources/Sounds/ost.mp3');
var hereticCaughtSound = new Audio('./resources/Sounds/hereticCaught.wav');
var pagoSound = new Audio('./resources/Sounds/pago.wav');
var gameOverSound = new Audio('./resources/Sounds/gameOver.wav');

//EVENTOS
function selectCity(city){
  var ciudadSelect;
  var ciudadSelectJsonData;
  let cityname = city.id;

  let name = $('#cityName')[0];
  let heraldic = $('#cityHeraldic')[0];

  for (var i = 0; i < cities.length; i++) {
    if(cities[i].name == cityname){
      ciudadSelect = cities[i];
    }
  }
  actualCity = ciudadSelect;

  selectedCity= actualCity;

  let listaAgentes = ciudadSelect.agentes;

  for(var i = 0; i<7; i++){
    let ciudad = jsonCities[i];
    if(ciudad.name == cityname){
      ciudadSelectJsonData = ciudad;
    }
  }
  renewAgentList(listaAgentes);

  name.innerHTML= ciudadSelect.name;
  heraldic.src=ciudadSelectJsonData.icon;

  selectAgent(ciudadSelect.agentes[0]);

}

function renewAgentList(listaAgentes){
  let agentList = $('#agentList');
  agentList.empty()

  for (var i = 0; i < listaAgentes.length; i++) {
    let div = $('<div>');
    let p = $('<p>')


    let currentAgent = listaAgentes[i];
    p.text(listaAgentes[i].name);
    div.attr("class","listaAgentesItem");
    div.click(
      function(){
        console.log(currentAgent);
        selectAgent(currentAgent);
      }
    );

    div.append(p);
    agentList.append(div);
  }
}

function buyAgent(){
  if(oroActual>250){
    actualCity.agentes.push(createAgent());
    console.log(actualCity);
    renewAgentList(actualCity.agentes);
    calcularSiguienteHeretico(actualCity);
    changeOro(-250);
  }
  else{
    alert("No tienes oro suficiente!");
  }
}

function changeOro(cambio){
  oroActual = oroActual+cambio;
  let marcador = $('#oroMarcador');
  marcador.text(oroActual);
}

function changeUnrest(cambio){
  if(desordenPublico>=100){
    gameOver();
  }
  console.log(cambio);
  console.log(desordenPublico);
  desordenPublico = desordenPublico+cambio;
  console.log("nuevo desorden Publico "+ desordenPublico);

  $('#ordenMarcador').text(desordenPublico+" %");
}

function gameOver(){

  gameOverSound.play();

  gameIsOver = true;

  $("#hereticDialog").text("Mi señor, ¡la situacion es insostenible!, va a ser destituido (GAME OVER)");
  $( function() {
    $("#dialog-confirm" ).dialog({
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
      buttons: {
        "¡Oh no!": function() {
          $( this ).dialog( "close" );

          let highScores = localStorage.getItem("highScores");
          let name = localStorage.getItem("nome")

          let fecha = new Date();
          let composedString = "";

          composedString = "Fecha: "+fecha.getDate()+"-"+fecha.getMonth()+"-"+fecha.getYear()+", Nombre:"+name+", Herejes:"+ herejesCapturados +", Oro:"+oroActual+", Numero de agentes:"+agentCounter;

          if (highScores == null){
            highScores = composedString;
          }else{
            highScores= highScores+"||"+composedString;
          }
          localStorage.setItem("highScores",highScores);

          window.location.href = "../Menu/menu.html";
        }
      }
    });
  });
}

function selectAgent(agent){

  let dataDiv = $('#agentData');

  dataDiv.empty();

  let name = $('<p>');
  let stat1 = $('<p>');
  let stat2 = $('<p>');
  let stat3 = $('<p>');

  name.text(agent.name);
  stat1.text("Autoridad: "+agent.autoritas);
  stat2.text("Diplomacia: "+agent.diplomacy);
  stat3.text("Subterfugio: "+agent.subterfuge);

  dataDiv.append(name);
  dataDiv.append(stat1);
  dataDiv.append(stat2);
  dataDiv.append(stat3);

  let buttonEliminar = $('<button>');

  buttonEliminar.text("Despedir agente");
  buttonEliminar.click(
    function(){
      console.log(agent,selectedCity);
      despedirAgente(agent,selectedCity);
    }
  );

  dataDiv.append(buttonEliminar);


}
//START FUNCTIONS

$( document ).ready(function() {
  initGame();
});

function initGame(){
  startTimer();
  $("#herejeMarcador").text(herejesCapturados);
  $('#oroMarcador').text(oroActual);
  //get Objetos de .json
  jsonCities = readCitiesData();
  jsonNames = readNamesData();

  createCities(jsonCities);

  console.log(cities);

  changeOro(0);
  changeUnrest(0);
}

//Manipuladores de fecha

function startTimer(){
  $('#speedIcon').attr("src",speedIcons[currentSpeed]);
  fechaAct = fechaStart;

  let speed = 1000/speeds[currentSpeed];
  clockSignal=setInterval(advanceDay, speed);
}

function cycleSpeed(){
  currentSpeed!=4 ? currentSpeed++ : currentSpeed=0;

  $('#speedIcon').attr("src",speedIcons[currentSpeed]);
  clearInterval(clockSignal);

  currentSpeed!=0 ? setSpeed() :  $('#date').text("PAUSA");
}

function pause(){
  currentSpeed=0;

  $('#speedIcon').attr("src",speedIcons[currentSpeed]);
  clearInterval(clockSignal);

  currentSpeed!=0 ? setSpeed() :  $('#date').text("PAUSA");
}

function setSpeed(){
  let speed = 1000/speeds[currentSpeed];
  clockSignal=setInterval(advanceDay, speed);
}

function advanceDay(){
  setNewDate();
  huntForHeretics();

  if(fechaAct.getDate()==26){
    console.log("Dia de pago!");
    cobrarSueldos()

    let unrestChange = Math.round(20/herejesMes);
    if(herejesMes==0){
      unrestChange=25;
      changeUnrest(25);
    }
    else{
      console.log(unrestChange);
      changeUnrest(unrestChange);
    }
    pause();

    if (!gameIsOver){
      $("#hereticDialog").text("Reporte mensual: Este mes hemos capturado a "+herejesMes+" Herejes. El desordenPublico ha subido un"+ unrestChange + " %. Independientemente de los resultados, nuestros familiares se han ganado el sueldo");
      $( function() {
        $("#dialog-confirm" ).dialog({
          resizable: false,
          height: "auto",
          width: 400,
          modal: true,
          buttons: {
            "Asi sea.": function() {
              $( this ).dialog( "close" );
              herejesMes=0;
              cycleSpeed();
            }
          }
        });
      });
    }
  }
}

function cobrarSueldos(){
  pagoSound.play();
  changeOro(-5*agentCounter);
}

function setNewDate(){
  fechaAct.setDate(fechaAct.getDate()+1);
  $('#date').text(fechaAct.getDate()+"-"+fechaAct.getMonth()+"-"+fechaAct.getUTCFullYear());
}

function huntForHeretics(){
  for (var i = 0; i < cities.length; i++) {
    if(fechaAct.getDate() == cities[i].dateNextHeretic.getDate() &&
      fechaAct.getMonth() == cities[i].dateNextHeretic.getMonth() &&
      fechaAct.getYear() == cities[i].dateNextHeretic.getYear())
      {
        hereticCaught(cities[i]);
      }
  }
}

function hereticCaught(ciudad){
  console.log("Heretico en "+ciudad.name);

  hereticCaughtSound.play();

  let oro = calcularExpropiacion(ciudad);

  herejesMes++;

  $("#hereticDialog").text("Hemos atrapado a un hereje en "+ciudad.name+" Le hemos expropiado "+ oro + "ducados, que entraran directos a nuestas arcas");
  pause();

  changeOro(oro);

  herejesCapturados++;

  $("#herejeMarcador").text(herejesCapturados);

  $( function() {
    $("#dialog-confirm" ).dialog({
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
      buttons: {
        "¡La operacion ha sido un exito!": function() {
          $( this ).dialog( "close" );
          onResettingCycle(ciudad);
        }
      }
    });
  });
}

function onResettingCycle(ciudad){
  calcularSiguienteHeretico(ciudad);
  cycleSpeed();
}

//Constructores
function readCitiesData(){
  var request = new XMLHttpRequest();
  request.open("GET", "./resources/Cities/cities.json", false);
  request.send(null)
  let json = JSON.parse(request.responseText);
  return json;
}

function readNamesData(){
  var request = new XMLHttpRequest();
  request.open("GET", "./resources/Strings/AgentNames.json", false);
  request.send(null)
  let json = JSON.parse(request.responseText);
  return json;
}

function createCities(jsonCities){
  for (var i = 0; i < 7; i++) {
    let ciudad = jsonCities[i];
    let img = $('<img >');
    img.attr('id',ciudad.name);
    img.attr('src',ciudad.icon);
    img.attr('width',50);
    img.attr('height',50);
    //Evento click ciudad
    img.attr(
      'onClick',
      'selectCity('+ciudad.name+')'
      );
    //posicion
    img.attr('style',"position:absolute; top:"+ciudad.posy+"; left:"+ciudad.posx+";");
    img.attr('class','cityIcon');

    let etiqueta = $('<h5>'+ciudad.name+'</h5>');

    let posEtiY = ciudad.posy;
    let posEtiX = ciudad.posx;

    // etiqueta.attr('style',"position:relative; top:"+posEtiY+"; left:"+posEtiX+";")
    //
    let div = $("#mapa");
    div.append(img);
    // div.append(etiqueta);
    let newCity = {
        name: ciudad.name,
        dateNextHeretic:new Date(fechaStart.getTime()),
        agentes: []
    };

    newCity.agentes.push(createAgent());

    let cona =  calcularSiguienteHeretico(newCity);
    cities.push(newCity);
  }

  ost.play();

}

function createAgent(){
  let subtergfugio = Math.round(Math.random()*10);
  let diplomacia = Math.round(Math.random()*10);
  let autoridad = Math.round(Math.random()*10);
  var name = jsonNames.names.list[Math.floor(Math.random()*jsonNames.names.list.length)];
  agentCounter++;

  $("#agentesMarcador").text(agentCounter);

  let id = agentCounter;
  let newAgent = {
      name: name,
      subterfuge: subtergfugio,
      diplomacy: diplomacia,
      autoritas: autoridad
  };
  return newAgent;
}

function despedirAgente(agent,city){
  if(selectedCity.agentes.length==1){
    $("#hereticDialog").text("¡Seria una locura dejar una ciudad sin encargado!, no puedes eliminar este agente");
    $( function() {
      $("#dialog-confirm" ).dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
          "vale...": function() {
            $( this ).dialog( "close" );
          }
        }
      });
    });
  }
  else{
    $("#hereticDialog").text("Estas seguro de que quieres hacer eso?");
    $( function() {
      $("#dialog-confirm" ).dialog({
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
          "pensandoloMejor...": function() {
            $( this ).dialog( "close" );
          },
            "Si!": function() {
              $( this ).dialog( "close" );
              removeAgent(agent,city);
          }
        }
      });
    });
  }
}

function removeAgent(agent,city){

    for (var i = 0; i < city.agentes.length; i++) {
      console.log(agent);
      console.log(city.agentes[i]);
      if(city.agentes[i] == agent){
        console.log(city.agentes.splice(i,1));
      }
    }
    agentCounter--;

    console.log(city.agentes);

    renewAgentList(city.agentes);
    selectAgent(city.agentes[0]);
    $("#agentesMarcador").text(agentCounter);
}

function calcularSiguienteHeretico(newCity){
  let mediaAgentes = [];
  let mediaCiudad;

  for (var i = 0; i <  newCity.agentes.length; i++) {
    let suma = newCity.agentes[i].subterfuge +
               newCity.agentes[i].diplomacy +
               newCity.agentes[i].autoritas;

    mediaAgentes.push(suma/3);
  }

  let sumaAritmetica = 0;

  for (var i = 0; i < mediaAgentes.length; i++) {
    sumaAritmetica = mediaAgentes[i]+sumaAritmetica;
  }

  mediaCiudad = sumaAritmetica/mediaAgentes.length+1;


  let fechaHeretico = new Date(fechaAct.getTime());
  let semisuma = 20*mediaCiudad - 4*mediaCiudad;

  fechaHeretico = sumarDias(fechaHeretico, semisuma);

  newCity.dateNextHeretic= fechaHeretico;
  return newCity;
}

function calcularExpropiacion(ciudad){
  let suma = 0;
  for (var i = 0; i <  ciudad.agentes.length; i++) {
    suma = ciudad.agentes[i].autoritas+suma;
  }

  return 15 * suma;
}

function sumarDias(fecha, dias){
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}
