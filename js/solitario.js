/***** INICIO DECLARACIÓN DE VARIABLES GLOBALES *****/

// Array de palos
let palos = ["viu", "cua", "hex", "cir"];
// Array de número de cartas
//let numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// En las pruebas iniciales solo se trabajará con cuatro cartas por palo parametizables por el usuario

// paso (top y left) en pixeles de una carta a la siguiente en un mazo
let paso = 5;
let pasoReceptor = 12; // paso en receptores

// Mapa de combinaciones (número-palo-color)
const PALOS = {
	viu: { color: 'rojo', corto: 'r' },
	cua: { color: 'rojo', corto: 'r' },
	hex: { color: 'negro', corto: 'n' },
	cir: { color: 'negro', corto: 'n' }
}

// Tapetes				
let tapeteInicial = document.getElementById("inicial");
let tapeteSobrantes = document.getElementById("sobrantes");
let tapeteReceptor1 = document.getElementById("receptor1");
let tapeteReceptor2 = document.getElementById("receptor2");
let tapeteReceptor3 = document.getElementById("receptor3");
let tapeteReceptor4 = document.getElementById("receptor4");

// Mazos
let mazoInicial = []; // array de cartas inicial
let mazoSobrantes = [];
let mazoReceptor1 = [];
let mazoReceptor2 = [];
let mazoReceptor3 = [];
let mazoReceptor4 = [];

// Contadores de cartas
let contInicial = document.getElementById("contador_inicial");
let contSobrantes = document.getElementById("contador_sobrantes");
let contReceptor1 = document.getElementById("contador_receptor1");
let contReceptor2 = document.getElementById("contador_receptor2");
let contReceptor3 = document.getElementById("contador_receptor3");
let contReceptor4 = document.getElementById("contador_receptor4");
let contMovimientos = document.getElementById("contador_movimientos");

// Tiempo
let contTiempo = document.getElementById("contador_tiempo"); // span cuenta tiempo
let segundos = 0;    // cuenta de segundos
let temporizador = null; // manejador del temporizador

const MAX_SEGUNDOS = 10*60;  // 10 minutos
const MAX_MOVIMIENTOS = 200;  //Movimientops
let juegoTerminado = false;

/***** FIN DECLARACIÓN DE VARIABLES GLOBALES *****/

function validarRango(valorInicial, valorFinal) {
	return valorInicial <= valorFinal;
}

function crearRangoNumeros(valorInicial, valorFinal) {
	const numeros = [];
	for (let i = valorInicial; i <= valorFinal; i++) {
		numeros.push(i);
	}
	return numeros;
}

function generarCombinaciones(numerosCartas, palos) {
	const combinaciones = new Map();
	// Se separan palos por color para alternarlos
	const palosRojos = palos.filter(p => PALOS[p].color === 'rojo');
	const palosNegros = palos.filter(p => PALOS[p].color === 'negro');

	// Se alternan los colores de las cartas
	const palosAlternados = [];
	for (let i = 0; i < Math.max(palosRojos.length, palosNegros.length); i++) {
		if (palosRojos[i]) palosAlternados.push(palosRojos[i]);
		if (palosNegros[i]) palosAlternados.push(palosNegros[i]);
	}

	// se generan todas las combinaciones con palos ya alternados por color
	for (const numero of numerosCartas) {
		for (const palo of palosAlternados) {
			const infoPalo = PALOS[palo];
			const claveCarta = `${numero}-${palo}-${infoPalo.corto}`;
			combinaciones.set(claveCarta, infoPalo.color);
		}
	}

	return combinaciones;
}

function barajarMazo(mazo) {
	// Toma un mazo que ya este creado segun la seleccion
	// Lo desordena aleatoriamente
	// Devuelve el mazo desordenado
	const copiaMazo = [...mazo]
	const mazoBarajado = [];
	for (let i = copiaMazo.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		mazoBarajado.push(copiaMazo[j]);
		copiaMazo.splice(j, 1);
	}
	return mazoBarajado;
}

function configurarEventosDragDrop() {

	// --- 1) RECEPTORES ---
	[tapeteReceptor1, tapeteReceptor2, tapeteReceptor3, tapeteReceptor4].forEach((tapeteReceptor, index) => {
		const contadores = [contReceptor1, contReceptor2, contReceptor3, contReceptor4];

		tapeteReceptor.addEventListener("dragover", (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		});

		tapeteReceptor.addEventListener("drop", (e) => {
		e.preventDefault();
		const cartaId = e.dataTransfer.getData("cartaId");
		const cartaImg = document.querySelector(`img[src="imagenes/baraja/${cartaId}.png"]`);
		if (!cartaImg) return;

const origen = cartaImg.dataset.origen;

		// 1) Solo permitir arrastrar la carta superior del origen
		const top = (origen === "sobrantes")
		? cartaSuperior(tapeteSobrantes)
		: cartaSuperior(tapeteInicial);

		if (cartaImg !== top) {
		return; // NO cuenta movimiento, NO hace nada
		}

		// 2)  ya es un intento válido
		const contOrigen = (origen === "sobrantes") ? contSobrantes : contInicial;
		intentarEnviarAReceptor(cartaImg, tapeteReceptor, contadores[index], contOrigen);

		});
	});

	// --- 2) SOBRANTES (fuera del forEach!) ---
	tapeteSobrantes.addEventListener("dragover", (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	});

	tapeteSobrantes.addEventListener("drop", (e) => {
		e.preventDefault();
		const cartaId = e.dataTransfer.getData("cartaId");
		const cartaImg = document.querySelector(`img[src="imagenes/baraja/${cartaId}.png"]`);
		if (!cartaImg) return;

		// Solo permitir mover a sobrantes la carta superior del tapete inicial
		const topInicial = cartaSuperior(tapeteInicial);
		if (cartaImg !== topInicial) return;

		moverASobrantes(cartaImg);
	});
}


function reiniciarContadores() {
	
	// Limpiar todos los receptores preservando sus contadores
	[tapeteReceptor1, tapeteReceptor2, tapeteReceptor3, tapeteReceptor4, tapeteSobrantes, tapeteInicial].forEach(receptor => {
		const contador = receptor.querySelector('.contador');
		receptor.innerHTML = '';
		if (contador) {
			receptor.appendChild(contador);
		}
	});
	
	// Vaciar arrays de mazos
	mazoInicial = [];
	mazoSobrantes = [];
	mazoReceptor1 = [];
	mazoReceptor2 = [];
	mazoReceptor3 = [];
	mazoReceptor4 = [];
	
	// Poner contadores a cero
	setContador(contInicial, 0);
	setContador(contSobrantes, 0);
	setContador(contReceptor1, 0);
	setContador(contReceptor2, 0);
	setContador(contReceptor3, 0);
	setContador(contReceptor4, 0);
	setContador(contMovimientos, 0);
}

// Desarrollo del comienzo de juego
function comenzarJuego() {
	// Barajar y dejar mazoInicial en tapete inicial

	let valorInicial = parseInt(document.getElementById("valorInicial").value);
	let valorFinal = parseInt(document.getElementById("valorFinal").value);

	if (!validarRango(valorInicial, valorFinal)) {
		alert("Rango de valores incorrecto: el valor inicial debe ser menor o igual que el valor final.");
		return;
	}

	numeros = crearRangoNumeros(valorInicial, valorFinal);

	// Generar combinaciones de cartas (número + palo + color)
	const combinaciones = generarCombinaciones(numeros, palos);

	mazoInicial = [...combinaciones];
	const cartasBarajadas = barajarMazo(mazoInicial);
	document.getElementById("mP").style.display = "none";
	
	// Puesta a cero de contadores ANTES de cargar
	reiniciarContadores();
	
	cargarTapeteInicial(cartasBarajadas);
	configurarEventosDragDrop();
	
	// Arrancar el conteo de tiempo
	arrancarTiempo();

}

//sincronizar valores de inputs con sus textos
function actualizarTextoValor(inputId, textoId) {
	const input = document.getElementById(inputId);
	const texto = document.getElementById(textoId);
	texto.textContent = input.value;
}

document.getElementById("valorInicial").addEventListener("input", () => {
	actualizarTextoValor("valorInicial", "valorInicialTexto");
});

document.getElementById("valorFinal").addEventListener("input", () => {
	actualizarTextoValor("valorFinal", "valorFinalTexto");
});

// Inicializar valores al cargar la página
actualizarTextoValor("valorInicial", "valorInicialTexto");
actualizarTextoValor("valorFinal", "valorFinalTexto");


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

function arrancarTiempo() {
	/*** !!!!!!!!!!!!!!!!!!! CODIGO !!!!!!!!!!!!!!!!!!!! **/
	if (temporizador) clearInterval(temporizador);
	let hms = function () {
		let seg = Math.trunc(segundos % 60);
		let min = Math.trunc((segundos % 3600) / 60);
		let hor = Math.trunc((segundos % 86400) / 3600);
		let tiempo = ((hor < 10) ? "0" + hor : "" + hor)
			+ ":" + ((min < 10) ? "0" + min : "" + min)
			+ ":" + ((seg < 10) ? "0" + seg : "" + seg);
		setContador(contTiempo, tiempo);
		if (segundos >= MAX_SEGUNDOS) {
			terminarJuego("Se alcanzó el límite de tiempo (10 minutos).");
			return;
			}
		segundos++;
	}
	segundos = 0;
	hms(); // Primera visualización 00:00:00
	temporizador = setInterval(hms, 1000);

} // arrancarTiempo

function pararTiempo() {
	if (temporizador) {
		clearInterval(temporizador);
		temporizador = null;
	}
}  //Esta función nos ayuda a detener el tiempo


function reiniciarTiempo() {
	pararTiempo();                 // Llamamos ala función de detener el tiempo en caso de que el cronómetro siga corriendo
	segundos = 0;                  // Vuelve a 0 el contador interno
	setContador(contTiempo, "00:00:00"); // Muestra el contador seteado en 0
}  // Funcion para reiniciar el contador



document.getElementById("iniciar").addEventListener("click", comenzarJuego);

document.getElementById("reset").addEventListener("click", () => {
	pararTiempo();
	reiniciarTiempo();
	reiniciarContadores();
	juegoTerminado = false;
	// Mostrar el menú principal nuevamente
	document.getElementById("mP").style.display = "flex";
	document.getElementById("fin").style.display = "none";

});
/**
	  En el elemento HTML que representa el tapete inicial (variable tapeteInicial)
	se deben añadir como hijos todos los elementos <img> del array mazo.
	Antes de añadirlos, se deberían fijar propiedades como la anchura, la posición,
	coordenadas top y left, algun atributo de tipo data-...
	Al final se debe ajustar el contador de cartas a la cantidad oportuna
*/
function cargarTapeteInicial(mazo) {
	// Recorrer todas las cartas del mazo
	mazo.forEach((carta, indice) => {
		let img = document.createElement('img');
		img.src = `imagenes/baraja/${carta[0]}.png`; // carta[0] es la clave del Map
		const [numStr, palo, colorCorto] = carta[0].split("-"); // ej: "12", "viu", "r/n"
		// Guardar metadatos de la carta en el dataset para lógica del juego
		img.dataset.numero = numStr;
		img.dataset.palo = palo;
		img.dataset.color = (colorCorto === "r") ? "rojo" : "negro";
		img.draggable = true;
		img.style.height = '100px';
		img.style.width = '75px';
		img.style.position = 'absolute';
		img.style.top = (indice * paso) + 'px';
		img.style.left = (indice * paso) + 'px';
		img.dataset.indice = indice;
		img.dataset.origen = 'inicial'; // Marcar que viene del tapete inicial

		// Evento dragstart: inicia el arrastre de la carta
		img.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('cartaId', carta[0]);
			e.dataTransfer.effectAllowed = 'move'; //Indica que la carta se mueve, no se copia
			img.style.opacity = '0.5';
		});
		// Evento dragend: finaliza el arrastre de la carta y cambia la opacidad de nuevo
		img.addEventListener('dragend', () => {
			img.style.opacity = '1';
		});

		//agregar la carta al tapete inicial
		tapeteInicial.appendChild(img);
	});

	setContador(contInicial, mazo.length);
	actualizarDraggables();

} // cargarTapeteInicial


/**
	  Esta función debe incrementar el número correspondiente al contenido textual
		  del elemento que actúa de contador
*/
function incContador(contador) {
	let v = parseInt(contador.textContent) || 0;
	contador.textContent = v + 1;
} // incContador

/**
	Idem que anterior, pero decrementando 
*/
function decContador(contador) {
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


function cartaSuperior(tapete) {
	const cartas = tapete.querySelectorAll("img");
	return cartas.length ? cartas[cartas.length - 1] : null;
} // Busca todas las cartas dentro del receptor y devuelve la ultima y si encuentra que está vacío devuelve un null

function numeroDe(cartaImg) {
	return parseInt(cartaImg.dataset.numero, 10);
} //Con esta función leemos el número de la carta en formato entero

function colorDe(cartaImg) {
	return cartaImg.dataset.color;
} //Esta función devuelve el color de la carta.

function puedeColocarEnReceptor(cartaImg, tapeteReceptor) {
	const top = cartaSuperior(tapeteReceptor);
	const num = numeroDe(cartaImg);
	if (!top) return num === 12; //Si el receptor está vacío, solo se permite el 12

	//Si hay carta arriba: debe ser decreciente y alternar color
	const topNum = numeroDe(top);
	const topColor = colorDe(top);

	const esDecreciente = num === topNum - 1;
	const alternaColor = colorDe(cartaImg) !== topColor;

	return esDecreciente && alternaColor;
} //Función de validación del receptor

function depositarEnReceptor(cartaImg, tapeteReceptor, contReceptor, contOrigen) {
	tapeteReceptor.appendChild(cartaImg);

	const n = tapeteReceptor.querySelectorAll("img").length - 1;
	cartaImg.style.position = "absolute";
	cartaImg.style.top = (n * pasoReceptor) + "px";
	cartaImg.style.left = "0px";

	// contadores
	incContador(contReceptor);
	decContador(contOrigen);

	verificarRecargaMazoInicial();
	actualizarDraggables();
}
 //Funcion para depositor en un mazo receptor

function moverASobrantes(cartaImg) {

	// Si la carta venía de sobrantes y la vuelves a colocar, primero resta 1 a sobrantes
	if (cartaImg.dataset.origen === "sobrantes") {
		decContador(contSobrantes);
	} else {
		decContador(contInicial);
	}

	tapeteSobrantes.appendChild(cartaImg);
	cartaImg.dataset.origen = "sobrantes";

	const indice = tapeteSobrantes.querySelectorAll("img").length - 1;
	cartaImg.style.position = "absolute";
	cartaImg.style.top = (indice * paso) + "px";
	cartaImg.style.left = (indice * paso) + "px";

	incContador(contSobrantes);

	verificarRecargaMazoInicial();
	actualizarDraggables();
}


function verificarRecargaMazoInicial() {
	const valueContInicial = parseInt(contInicial.textContent, 10);
	const valueContSobrantes = parseInt(contSobrantes.textContent, 10);

	if (valueContInicial == 0 && valueContSobrantes > 0) {
		// Si el mazo inicial está vacío y hay cartas en sobrantes, mover todas las cartas de sobrantes al inicial
		const cartasSobrantes = tapeteSobrantes.querySelectorAll("img");

		// Guardar el contador de sobrantes antes de limpiar
		const contadorSobrantes = tapeteSobrantes.querySelector('.contador');
		const contadorInicial = tapeteInicial.querySelector('.contador');

		cartasSobrantes.forEach(carta => {
			// Mover en el DOM
			tapeteInicial.appendChild(carta);
			// Cambiar el origen de vuelta a inicial
			carta.dataset.origen = 'inicial';
			// Ajustar posición para que quede apilada
			const n = tapeteInicial.querySelectorAll("img").length - 1; // index de la carta recién puesta
			carta.style.position = "absolute";
			carta.style.top = (n * paso) + "px";
			carta.style.left = (n * paso) + "px";
		});

		// Limpiar el tapete de sobrantes pero preservar el contador
		tapeteSobrantes.innerHTML = '';
		if (contadorSobrantes) {
			tapeteSobrantes.appendChild(contadorSobrantes);
		}

		// Actualizar contadores
	setContador(contInicial, cartasSobrantes.length);
	setContador(contSobrantes, 0);
	actualizarDraggables();


	}
}

function intentarEnviarAReceptor(cartaImg, tapeteReceptor, contReceptor, contOrigen) {
	incContador(contMovimientos);

	const movs = parseInt(contMovimientos.textContent, 10) || 0;
	if (movs >= MAX_MOVIMIENTOS) {
	terminarJuego("Se alcanzó el límite de movimientos (200).");
	return false;
	}


	if (puedeColocarEnReceptor(cartaImg, tapeteReceptor)) {
		depositarEnReceptor(cartaImg, tapeteReceptor, contReceptor, contOrigen);
		verificarVictoria(); // Verificar si ganó después de cada movimiento
		return true;
	}

	moverASobrantes(cartaImg);
	return false;
}

  // Une la validación mas el deposito de las cartas



function actualizarDraggables() {
	// Tapete inicial: solo la carta superior es draggable
	tapeteInicial.querySelectorAll("img").forEach(img => img.draggable = false);
	const topInicial = cartaSuperior(tapeteInicial);
	if (topInicial) topInicial.draggable = true;

	// Tapete sobrantes: solo la carta superior es draggable
	tapeteSobrantes.querySelectorAll("img").forEach(img => img.draggable = false);
	const topSobrantes = cartaSuperior(tapeteSobrantes);
	if (topSobrantes) topSobrantes.draggable = true;
}

/**
 * Verifica si el jugador ha ganado.
 * Gana cuando el total de cartas en los 4 receptores coincide
 * con el número de cartas totales del juego.
 */
function verificarVictoria() {
	const cont1 = parseInt(contReceptor1.textContent, 10) || 0;
	const cont2 = parseInt(contReceptor2.textContent, 10) || 0;
	const cont3 = parseInt(contReceptor3.textContent, 10) || 0;
	const cont4 = parseInt(contReceptor4.textContent, 10) || 0;

	const totalCartas = cont1 + cont2 + cont3 + cont4;

	const nums = crearRangoNumeros(
		parseInt(document.getElementById("valorInicial").value),
		parseInt(document.getElementById("valorFinal").value)
	);
	const cartasEsperadas = nums.length * palos.length;

	if (totalCartas === cartasEsperadas) {
		terminarJuego("¡Ganaste! Completaste todos los receptores.");
	}
	}

	function terminarJuego(motivo) {
	if (juegoTerminado) return;
	juegoTerminado = true;

	pararTiempo();

	// Bloquear drag & drop
	tapeteInicial.querySelectorAll("img").forEach(img => img.draggable = false);
	tapeteSobrantes.querySelectorAll("img").forEach(img => img.draggable = false);

	// Si existe el panel #fin (de tus compañeros), úsalo
	document.getElementById("reset").style.zIndex = "999999"
	const fin = document.getElementById("fin");
	if (fin) {
		fin.style.display = "flex";
		fin.style.zIndex = "101";

		const tiempo = document.getElementById("contador_tiempo").textContent;
		const movimientos = document.getElementById("contador_movimientos").textContent;

		const tFinal = document.getElementById("tiempoFinal");
		const mFinal = document.getElementById("movimientosFinal");
		const motivoEl = document.getElementById("motivoFinal");

		if (tFinal) tFinal.textContent = tiempo;
		if (mFinal) mFinal.textContent = movimientos;
		if (motivoEl) motivoEl.textContent = motivo;

		return;
	}
	

	// Si NO existe #fin, usa tu overlay (fallback)
	mostrarMensajeFin(motivo);
}

function mostrarMensajeFin(motivo) {
	let overlay = document.getElementById("overlay_fin");
	if (!overlay) {
		overlay = document.createElement("div");
		overlay.id = "overlay_fin";
		overlay.style.position = "fixed";
		overlay.style.inset = "0";
		overlay.style.background = "rgba(0,0,0,0.65)";
		overlay.style.display = "flex";
		overlay.style.alignItems = "center";
		overlay.style.justifyContent = "center";
		overlay.style.zIndex = "101";

		overlay.innerHTML = `
		<div style="background:white; padding:24px; border-radius:12px; width:min(420px,90%); text-align:center;">
			<h3 style="margin:0 0 12px;">Juego finalizado</h3>
			<p id="fin_texto" style="margin:0 0 18px;"></p>
			<button id="btn_volver_menu" style="padding:10px 16px; border:none; border-radius:8px; background:#E65014; color:white; cursor:pointer;">
			Volver al menú
			</button>
		</div>
		`;
		document.body.appendChild(overlay);

		document.getElementById("btn_volver_menu").addEventListener("click", () => {
		overlay.remove();
		reiniciarTiempo();
		reiniciarContadores();
		document.getElementById("mP").style.display = "flex";
		juegoTerminado = false;
		});
	}

	document.getElementById("fin_texto").textContent = motivo;
}


