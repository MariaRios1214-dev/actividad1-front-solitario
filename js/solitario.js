/***** INICIO DECLARACIÓN DE VARIABLES GLOBALES *****/

// Array de palos
let palos = ["viu", "cua", "hex", "cir"];
// Array de número de cartas
//let numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// En las pruebas iniciales solo se trabajará con cuatro cartas por palo:
let numeros = [9, 10, 11, 12];

// paso (top y left) en pixeles de una carta a la siguiente en un mazo
let paso = 5;

const combinaciones = new Map();

for(let combinacion of numeros) {
	for (const paloCorto of palos.values()) {
		combinaciones.set(combinacion + "-" +paloCorto + "-"  + dividirPorColores(paloCorto, 'n', 'r'), dividirPorColores(paloCorto, 'negro', 'rojo'));
	}
}

// Tapetes				
let tapeteInicial   = document.getElementById("inicial");
let tapeteSobrantes = document.getElementById("sobrantes");
let tapeteReceptor1 = document.getElementById("receptor1");
let tapeteReceptor2 = document.getElementById("receptor2");
let tapeteReceptor3 = document.getElementById("receptor3");
let tapeteReceptor4 = document.getElementById("receptor4");

// Mazos
let mazoInicial   = [...combinaciones]; // array de cartas inicial
let mazoSobrantes = [];
let mazoReceptor1 = [];
let mazoReceptor2 = [];
let mazoReceptor3 = [];
let mazoReceptor4 = [];

// Contadores de cartas
let contInicial     = document.getElementById("contador_inicial");
let contSobrantes   = document.getElementById("contador_sobrantes");
let contReceptor1   = document.getElementById("contador_receptor1");
let contReceptor2   = document.getElementById("contador_receptor2");
let contReceptor3   = document.getElementById("contador_receptor3");
let contReceptor4   = document.getElementById("contador_receptor4");
let contMovimientos = document.getElementById("contador_movimientos");

// Tiempo
let contTiempo  = document.getElementById("contador_tiempo"); // span cuenta tiempo
let segundos 	 = 0;    // cuenta de segundos
let temporizador = null; // manejador del temporizador

/***** FIN DECLARACIÓN DE VARIABLES GLOBALES *****/

 
// Rutina asociada a boton reset
/*** !!!!!!!!!!!!!!!!!!! CODIGO !!!!!!!!!!!!!!!!!!!! **/


// El juego arranca ya al cargar la página: no se espera a reiniciar
/*** !!!!!!!!!!!!!!!!!!! CODIGO !!!!!!!!!!!!!!!!!!!! **/

// Desarrollo del comienzo de juego
function comenzarJuego() {
	/* Crear baraja, es decir crear el mazoInicial. Este será un array cuyos 
	elementos serán elementos HTML <img>, siendo cada uno de ellos una carta.
	Sugerencia: en dos bucles for, bárranse los "palos" y los "numeros", formando
	oportunamente el nombre del fichero png que contiene a la carta (recuérdese poner
	el path correcto en la URL asociada al atributo src de <img>). Una vez creado
	el elemento img, inclúyase como elemento del array mazoInicial. 
	*/
	/*** !!!!!!!!!!!!!!!!!!! CODIGO !!!!!!!!!!!!!!!!!!!! **/	
	// Barajar y dejar mazoInicial en tapete inicial

	let ini = parseInt(document.getElementById("valorInicial").value);
  	let fin = parseInt(document.getElementById("ultimoValor").value);
	
	if (ini > fin) [ini, fin] = [fin, ini];
	else {alert("Rango de valores incorrecto: el valor inicial debe ser menor o igual que el valor final."); return;}
	
	numeros = [];
	for (let n = ini; n <= fin; n++) {
		numeros.push(n);
	}
	combinaciones.clear();
	
	for (let combinacion of numeros) {
		for (const palo of palos) {
			combinaciones.set(
				combinacion + "-" + palo + "-" + dividirPorColores(palo, 'n', 'r'),
				dividirPorColores(palo, 'negro', 'rojo')
			);
		}
	}
	mazoInicial = [...combinaciones];
	var cartasBarajadas = barajar(mazoInicial);
	document.getElementById("mP").style.display = "none";
    cargarTapeteInicial(cartasBarajadas);
	/*** !!!!!!!!!!!!!!!!!!! CODIGO !!!!!!!!!!!!!!!!!!!! **/
	
	// Puesta a cero de contadores de mazos
	setContador(contSobrantes, 0);
	setContador(contReceptor1, 0);
	setContador(contReceptor2, 0);
	setContador(contReceptor3, 0);
	setContador(contReceptor4, 0);
	setContador(contMovimientos, 0);
	
	// Arrancar el conteo de tiempo
	arrancarTiempo();

} // comenzarJuego

function cambiarParametros(event, idDestino){
	document.getElementById(idDestino).textContent = event.target.value;
}

document.getElementById("valorInicial").addEventListener("change", (event) => cambiarParametros(event, "valorInicialtexto"));
document.getElementById("ultimoValor").addEventListener("change", (event) => cambiarParametros(event, "ultimoValortexto"));

// Inicializar con los valores actuales de los inputs
document.getElementById("valorInicialtexto").textContent = document.getElementById("valorInicial").value;
document.getElementById("ultimoValortexto").textContent = document.getElementById("ultimoValor").value;

/**
	Se debe encargar de arrancar el temporizador: cada 1000 ms se
	debe ejecutar una función que a partir de la cuenta autoincrementada
	de los segundos (segundos totales) visualice el tiempo oportunamente con el 
	format hh:mm:ss en el contador adecuado.

	Para descomponer los segundos en horas, minutos y segundos pueden emplearse
	las siguientes igualdades:

	segundos = truncar (   segundos_totales % (60)                 )
	minutos  = truncar ( ( segundos_totales % (60*60) )     / 60   )
	horas    = truncar ( ( segundos_totales % (60*60*24)) ) / 3600 )

	donde % denota la operación módulo (resto de la división entre los operadores)

	Así, por ejemplo, si la cuenta de segundos totales es de 134 s, entonces será:
	   00:02:14

	Como existe la posibilidad de "resetear" el juego en cualquier momento, hay que 
	evitar que exista más de un temporizador simultáneo, por lo que debería guardarse
	el resultado de la llamada a setInterval en alguna variable para llamar oportunamente
	a clearInterval en su caso.   
*/

function arrancarTiempo(){
	/*** !!!!!!!!!!!!!!!!!!! CODIGO !!!!!!!!!!!!!!!!!!!! **/
	if (temporizador) clearInterval(temporizador);
    let hms = function (){
			let seg = Math.trunc( segundos % 60 );
			let min = Math.trunc( (segundos % 3600) / 60 );
			let hor = Math.trunc( (segundos % 86400) / 3600 );
			let tiempo = ( (hor<10)? "0"+hor : ""+hor ) 
						+ ":" + ( (min<10)? "0"+min : ""+min )  
						+ ":" + ( (seg<10)? "0"+seg : ""+seg );
			setContador(contTiempo, tiempo);
            segundos++;
		}
	segundos = 0;
    hms(); // Primera visualización 00:00:00
	temporizador = setInterval(hms, 1000);
    	
} // arrancarTiempo

function pararTiempo(){  
  if (temporizador) {
    clearInterval(temporizador);
    temporizador = null;
  }
}  //Esta función nos ayuda a detener el tiempo, creada el 16/01 por Roos


function reiniciarTiempo(){
  pararTiempo();                 // Llamamos ala función de detener el tiempo en caso de que el cronómetro siga corriendo
  segundos = 0;                  // Vuelve a 0 el contador interno
  setContador(contTiempo, "00:00:00"); // Muestra el contador seteado en 0
}  // Funcion para reiniciar el contador, creada el 16/01 por Roos


/**
	Si mazo es un array de elementos <img>, en esta rutina debe ser
	reordenado aleatoriamente. Al ser un array un objeto, se pasa
	por referencia, de modo que si se altera el orden de dicho array
	dentro de la rutina, esto aparecerá reflejado fuera de la misma.
*/
function barajar(mazo) {

	var mazoTemp = [];
	var index = [];

	for(let random of mazo) {
		random = Math.floor(Math.random() * mazo.length);
		index.push(random);
	}

	for(let nCarta of index) {
		mazoTemp.push(mazo[nCarta]);
	}

	return mazoTemp;
} // barajar

document.getElementById("iniciar").addEventListener("click", comenzarJuego);

/**
 	En el elemento HTML que representa el tapete inicial (variable tapeteInicial)
	se deben añadir como hijos todos los elementos <img> del array mazo.
	Antes de añadirlos, se deberían fijar propiedades como la anchura, la posición,
	coordenadas top y left, algun atributo de tipo data-...
	Al final se debe ajustar el contador de cartas a la cantidad oportuna
*/
function cargarTapeteInicial(mazo) {
    // Limpiar el tapete antes
    tapeteInicial.innerHTML = '';
    
    // Recorrer todas las cartas del mazo
    mazo.forEach((carta, indice) => {
        let img = document.createElement('img');
        img.src = `imagenes/baraja/${carta[0]}.png`; // carta[0] es la clave del Map
		img.attributes.draggable = true;
        img.style.width = '100px';
        img.style.position = 'absolute';
        img.style.top = (indice * paso) + 'px';
        img.style.left = (indice * paso) + 'px';
        img.dataset.indice = indice;
        
        tapeteInicial.appendChild(img);
    });
    
    setContador(contInicial, mazo.length);
} // cargarTapeteInicial

// color 1 es negro y color 2 es rojo
function dividirPorColores(palo, color1, color2) {
	switch (palo) {
		case 'viu':
			return color2;			
		case 'cir':
			return color1;
		case 'cua':
			return color2;
		case 'hex':
			return color1;
		default:
			return null;
	}
	
}

/**
 	Esta función debe incrementar el número correspondiente al contenido textual
   	del elemento que actúa de contador
*/
function incContador(contador){
  let v = parseInt(contador.textContent) || 0;
  contador.textContent = v + 1;
} // incContador

/**
	Idem que anterior, pero decrementando 
*/
function decContador(contador){
  let v = parseInt(contador.textContent) || 0;
  contador.textContent = Math.max(0, v - 1);	
} // decContador

/**
	Similar a las anteriores, pero ajustando la cuenta al
	valor especificado
*/
function setContador(contador, valor) {
	contador.textContent = valor;
} // setContador
