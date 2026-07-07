// --- VARIABLES GLOBALES Y ESTADOS ---
let isPremium = false;
const PRODUCT_ID = 'premium_mensual';

const bgmMenu = new Audio('audios/Cut Trance.mp3');
bgmMenu.loop = true;
const bgmGame = new Audio('audios/EDM Detection Mode.mp3');
bgmGame.loop = true;
let isAudioInitialized = false;

// Los navegadores requieren interacción del usuario para reproducir audio.
document.getElementById('screen-start').addEventListener('click', () => {
    isAudioInitialized = true;
    bgmMenu.play().catch(e => console.log("Audio play prevented", e));
    
    document.getElementById('screen-start').classList.remove('active');
    document.getElementById('screen-start').classList.add('hidden');
    
    document.getElementById('btn-mute-audio').classList.remove('hidden');
    
    document.getElementById('screen-home').classList.remove('hidden');
    document.getElementById('screen-home').classList.add('active');
});

let isGlobalMuted = false;
document.getElementById('btn-mute-audio').addEventListener('click', (e) => {
    isGlobalMuted = !isGlobalMuted;
    bgmMenu.muted = isGlobalMuted;
    bgmGame.muted = isGlobalMuted;
    
    if(isGlobalMuted) {
        document.getElementById('icon-unmute').classList.add('hidden');
        document.getElementById('icon-mute').classList.remove('hidden');
    } else {
        document.getElementById('icon-unmute').classList.remove('hidden');
        document.getElementById('icon-mute').classList.add('hidden');
    }
});

const MAX_PLAYERS = 15;
const MAX_CARDS = 50;

let players = []; 
let captain = "";
let currentCardCount = 0;
let usedCards = [];
let selectedAvatar = null;
let movementInterval = null;
let currentMode = ""; // classic, chupistico, retos, pyramid, hot, roulette

// Avatares disponibles
const avatars = ["🧙‍♂️", "💀", "🧛", "🐱", "🐶", "🐹", "🐻", "🐒", "🐷", "🐸", "🦄", "🦖", "🐙", "🐼", "🦥"];
const speechEmojis = ["🍻", "😂", "🎵", "🕺", "💃", "🔥", "🤫", "🤪", "❤️"];
const drunkSpeechEmojis = ["🤬", "🥴", "🤮", "¡*#%&!", "💢", "🖕", "💥", "😾", "¿Qué miras?", "Hipo..."];

// --- BASES DE DATOS (Fase 1: Solo Clásico, otras vacías por ahora) ---
const cardDatabaseClassic = [
    { title: "¡Brindis General!", text: "Todos los jugadores levantan su vaso y toman 1 trago.", type: "group" },
    { title: "El Vocero", text: "El jugador a la derecha de {player1} debe hacer un brindis por alguna virtud de {player1}. Luego ambos toman.", type: "interaction" },
    { title: "Duelo de Miradas", text: "{player1} y {player2} deben mirarse fijamente. El primero en reírse o parpadear toma 2 tragos.", type: "versus" },
    { title: "Memoria de Elefante", text: "{player1} dice una palabra, el siguiente hacia su derecha repite y agrega otra. El que se equivoque toma 3 tragos.", type: "group" },
    { title: "Regla del Pulgar", text: "{player1} es el Maestro del Pulgar. Cuando ponga su pulgar en la mesa, el último en hacerlo toma 2 tragos. Dura 5 turnos.", type: "rule" },
    { title: "Equipos Impar/Par", text: "Los que tengan edad par son un equipo, los de edad impar son otro equipo. Cada equipo elige a un capitán. Los capitanes deben jugar una partida de piedra, papel o tijeras, el mejor de 3 gana. El equipo perdedor bebe 4 tragos.", type: "team" },
    { title: "Cultura Chupística", text: "Categoría elegida por {player1}. El de su izquierda comienza. El que repita o dude, toma.", type: "group" },
    { title: "Zurdos", text: "Hasta que salga otra carta que lo anule, todos deben beber con la mano izquierda. El que se equivoque toma doble.", type: "rule" },
    { title: "Palabra Clave", text: "El capitán del juego elige una palabra, todos los jugadores deben hablar usando esa palabra al inicio de cada frase durante 1 vuelta completa. El que no lo hace toma 1 trago por cada frase.", type: "rule" },
    { title: "Cambio de Puesto", text: "Todos deben cambiar de asiento con la persona enfrente suyo. El último en sentarse toma 1 trago. (Si no se quieren cambiar, todos toman 4 tragos)", type: "group" },
    { title: "Yo Nunca Nunca", text: "{player1} dice un 'Yo nunca nunca'. Todos los que sí lo hayan hecho, toman 1 trago.", type: "group" },
    { title: "Voto Secreto", text: "A la cuenta de 3, todos apuntan a la persona más probable de dormirse primero. La persona con más votos toma 2 tragos.", type: "group" },
    { title: "Cascada", text: "Empieza a beber {player1}, luego el de su derecha y así sucesivamente. Nadie puede parar hasta que el de su izquierda pare.", type: "group" },
    { title: "El Abogado", text: "{player1} es ahora el abogado de {player2}. Cada vez que le pregunten algo a {player2}, el abogado debe responder. Si no lo hace, ambos toman. Esto dura toda una vuelta.", type: "interaction" },
    { title: "Sin Nombres", text: "Nadie puede decir el nombre de otro jugador por los próximos 10 minutos. Si alguien lo hace, toma 1 trago.", type: "rule" },
    { title: "El Espejo", text: "{player1} debe imitar todos los gestos físicos que haga {player2} durante una vuelta completa. Si falla, toma 2 tragos.", type: "interaction" },
    { title: "Suelo de Lava", text: "Cuando {player1} grite '¡Lava!', el último jugador en levantar los pies del piso toma 3 tragos. Dura 3 rondas.", type: "group" },
    { title: "Pregunta Incómoda", text: "{player1} debe hacerle una pregunta muy incómoda a {player2}. {player2} responde la verdad o toma 3 tragos.", type: "versus" },
    { title: "Compañeros de Sed", text: "A partir de ahora, cada vez que {player1} beba, {player2} debe beber la misma cantidad. Dura 2 vueltas.", type: "interaction" },
    { title: "Cazador de T-Rex", text: "Nueva regla general: Todos deben beber con los codos completamente pegados al torso (como un T-Rex). El que se olvide toma doble durante 2 vueltas.", type: "rule" },
    { title: "El Francotirador", text: "{player1} tiene 4 shoots que puede repartir entre los jugadores ahora mismo como él quiera.", type: "interaction" },
    { title: "Sin Dientes", text: "{player1} debe decir un trabalenguas sin mostrar los dientes. Si se ríe o se equivoca, toma 3 tragos.", type: "interaction" },
    { title: "Vocal Prohibida", text: "Nadie puede usar palabras que contengan la letra 'E' por 5 minutos. 1 trago por error.", type: "rule" },
    { title: "Batalla de Rap", text: "{player1} y {player2} deben improvisar un rap insultándose amistosamente. El grupo vota al ganador, el perdedor toma 3 tragos. (Si no hace el rap toma 5 tragos)", type: "versus" },
    { title: "Cultura General", text: "El grupo le hace una pregunta de cultura general a {player1}. Si no la sabe, toma 2 tragos.", type: "interaction" },
    { title: "El Fotógrafo", text: "El último jugador en hacer una pose de foto cuando {player1} grite '¡Whisky!' toma 2 tragos.", type: "group" },
    { title: "Acento Extranjero", text: "{player1} debe hablar con un acento extranjero exagerado durante toda una vuelta.", type: "interaction" },
    { title: "Mano a la Cabeza", text: "El último en ponerse la mano en la cabeza toma 1 trago. ¡Rápido!", type: "group" },
    { title: "El Soplón", text: "{player1} debe revelar un secreto gracioso o vergonzoso de {player2}. Si no lo hace, {player1} toma 4 tragos.", type: "interaction" },
    { title: "Piedra, Papel o Tijera Masivo", text: "Todos los jugadores juegan a la vez contra {player1}. Todos los que pierdan contra {player1} toman 1 trago.", type: "group" },
    { title: "Ronda de Elogios", text: "{player1} debe decirle algo lindo a la persona de su derecha, y así sucesivamente en círculo. El que dude o ría, toma 2 tragos.", type: "group" },
    { title: "Cambiando Identidades", text: "{player1} y {player2} cambian de nombre. Todos deben llamarlos por el nombre invertido. 1 trago al que se equivoque.", type: "rule" },
    { title: "El Mesero", text: "{player1} debe servir los tragos de todos durante esta ronda. Como recompensa, puede mandar a tomar 2 tragos a quien quiera.", type: "interaction" },
    { title: "El Intocable", text: "Nadie puede mirar a los ojos a {player1} durante 2 vueltas. El que haga contacto visual toma 1 trago.", type: "rule" },
    { title: "Derecha e Izquierda", text: "Todos los jugadores pasan su vaso a la persona de su derecha y toman 1 trago del nuevo vaso.", type: "group" },
    { title: "La Momia", text: "{player1} no puede mover los brazos por 2 turnos. Si quiere beber, alguien más debe darle el vaso en la boca.", type: "rule" },
    { title: "Cara o Cruz", text: "{player1} lanza una moneda. Si pierde, toma 2 tragos. Si gana, reparte 2.", type: "interaction" },
    { title: "Confesión Anónima", text: "Todos cierran los ojos. Quien alguna vez haya robado algo que levante la mano. Abran los ojos. Los que levantaron la mano toman 1 trago.", type: "group" },
    { title: "El Políglota", text: "Di 'Salud' en 3 idiomas diferentes. Si {player1} falla, bebe 2 tragos.", type: "interaction" },
    { title: "Dedo Congelado", text: "{player1} pone su dedo sobre la mesa. El juego sigue. Cuando {player1} ponga el dedo, todos deben hacerlo, cuando lo levante, el último en levantar el suyo toma 3 tragos.", type: "rule" },
    { title: "Duelo de Pulgadas", text: "Los jugadores más altos y más bajos del grupo se ponen de pie y brindan. Toman 2 tragos cada uno.", type: "versus" },
    { title: "Modo Zurdo", text: "¡Todos los diestros toman 1 trago en honor a los zurdos del grupo!", type: "group" },
    { title: "Castigo Compartido", text: "{player1} debe tomar 3 tragos, pero puede elegir a {player2} para que lo acompañe y tomen los dos.", type: "interaction" },
    { title: "Teléfono Roto", text: "{player1} le susurra una frase rara al oído a {player2}, y así sigue la ronda. El último la dice en voz alta. Si no es igual, toman todos 1 trago.", type: "group" },
    { title: "Ronda de Apodos", text: "Desde ahora, nadie puede usar nombres reales, solo apodos inventados. Quien se equivoque toma 1 trago.", type: "rule" },
    { title: "El Medallista", text: "El que se haya graduado o ganado algún premio más recientemente reparte 4 tragos.", type: "group" },
    { title: "Grito de Guerra", text: "{player1} inventa un sonido extraño. Cada vez que {player1} lo haga, todos deben tomar un trago. Dura 2 vueltas.", type: "rule" },
    { title: "Juego de Palmas", text: "{player1} da 2 aplausos, el siguiente 3, etc. Quien se equivoque o pierda la cuenta toma 2 tragos.", type: "group" },
    { title: "Solo Preguntas", text: "Por toda una vuelta, todos deben comunicarse haciendo solo preguntas. El que afirme algo toma 1 trago.", type: "rule" },
    { title: "El Trago de Oro", text: "{player1} se salva de tomar en su próximo castigo. Guarda esta carta mentalmente.", type: "interaction" }
];

const cardDatabaseChupistico = [
    { title: "Marcas de Cerveza", text: "Nombren marcas de cerveza. El que repita o tarde mucho, toma 2 tragos.", type: "group" },
    { title: "Posiciones Sexuales", text: "Nombren posiciones. El que repita o tarde mucho, toma 2 tragos.", type: "group" },
    { title: "Países de Europa", text: "Nombren países europeos. El que repita o se equivoque, toma 2 tragos.", type: "group" },
    { title: "Marcas de Autos", text: "Nombren marcas de autos. El que se quede en blanco toma.", type: "group" },
    { title: "Excusas para no salir", text: "Nombren excusas típicas para faltar a una fiesta. El que pierda toma.", type: "group" },
    { title: "Deportes con pelota", text: "Nombren deportes que usen una pelota. El que pierda toma 2 tragos.", type: "group" },
    { title: "Superhéroes", text: "Nombren superhéroes de cualquier universo. El que repita toma.", type: "group" },
    { title: "Tipos de trago", text: "Nombren cócteles o tipos de alcohol. El que dude, toma 2 tragos.", type: "group" },
    { title: "Cantantes de Reggaeton", text: "Nombren cantantes. El que repita toma 1 trago.", type: "group" },
    { title: "Animales de granja", text: "Nombren animales. El que se equivoque toma 1 trago.", type: "group" },
    { title: "Videojuegos Clásicos", text: "Nombren consolas o videojuegos retro (anteriores al 2005). El que dude o repita, toma 2 tragos.", type: "group" },
    { title: "Personajes de Animé", text: "Nombren personajes de cualquier anime. Si nadie lo conoce o te quedas callado, tomas 2 tragos.", type: "group" },
    { title: "Series de Streaming", text: "Nombren series de Netflix, HBO o Prime. El último en aportar una válida toma 1 trago.", type: "group" },
    { title: "Películas de Terror", text: "Nombren películas de terror famosas. El que repita o no sepa, toma 2 tragos.", type: "group" },
    { title: "Mitología y Dioses", text: "Nombren dioses griegos, romanos o nórdicos. El que se equivoque toma 2 tragos.", type: "group" },
    { title: "Capitales del Mundo", text: "Nombren capitales. El que nombre una ciudad que no sea capital, o se repita, toma 3 tragos.", type: "group" },
    { title: "Estilos Musicales", text: "Nombren géneros musicales de todo el mundo. El que dude toma 1 trago.", type: "group" },
    { title: "Universo Star Wars", text: "Nombren personajes, planetas o naves de Star Wars. El que repita toma 2 tragos.", type: "group" },
    { title: "Villanos del Cine", text: "Nombren villanos famosos de películas. El que se quede en blanco toma 2 tragos.", type: "group" },
    { title: "Gastronomía Mundial", text: "Nombren comidas típicas indicando su país (ej: Tacos de México). El que falle toma 1 trago.", type: "group" },
    { title: "Bandas de Rock", text: "Nombren bandas famosas de rock clásico o moderno. El que repita toma 2 tragos.", type: "group" },
    { title: "Mundo de Mario Bros", text: "Nombren personajes o enemigos del universo de Super Mario. El que repita toma 2 tragos.", type: "group" },
    { title: "Películas Animadas", text: "Nombren películas de Disney, Pixar o Dreamworks. El que se equivoque toma 1 trago.", type: "group" },
    { title: "Leyendas Urbanas", text: "Nombren mitos urbanos (La Llorona, Pie Grande, etc). El que se quede sin ideas toma 2 tragos.", type: "group" },
    { title: "Monedas del Mundo", text: "Nombren monedas oficiales de países (Dólar, Euro, Yen, Peso...). El que pierda toma 2 tragos.", type: "group" },
    { title: "Redes Sociales", text: "Nombren redes sociales, actuales o muertas (MySpace, Fotolog...). El que falle toma 1 trago.", type: "group" },
    { title: "Personajes Históricos", text: "Nombren personajes relevantes de la historia mundial. El que nombre a alguien vivo toma 2 tragos.", type: "group" },
    { title: "Primera Generación Pokémon", text: "Nombren solo los primeros 151 pokémones originales. Si dicen uno nuevo, toman 3 tragos.", type: "group" },
    { title: "Elementos Químicos", text: "Nombren elementos de la tabla periódica. El que repita toma 2 tragos.", type: "group" },
    { title: "Juegos de Mesa", text: "Nombren juegos de mesa clásicos o modernos. El que se quede en blanco toma 1 trago.", type: "group" },
    { title: "Razas de Perros", text: "Nombren razas oficiales de perros. El que invente una raza toma 2 tragos.", type: "group" },
    { title: "Festividades", text: "Nombren celebraciones mundiales o nacionales (Navidad, Halloween...). El que repita toma 1 trago.", type: "group" },
    { title: "Marcas de Ropa", text: "Nombren marcas famosas de ropa o calzado. El que dude toma 2 tragos.", type: "group" },
    { title: "Cuentos Infantiles", text: "Nombren cuentos o fábulas clásicas. El que repita o falle toma 1 trago.", type: "group" },
    { title: "Signos y Constelaciones", text: "Nombren signos del zodiaco o constelaciones. El que diga un invento toma 2 tragos.", type: "group" },
    { title: "Premios Oscar", text: "Nombren actores o películas que hayan ganado un premio Óscar. Si el grupo comprueba que es mentira, tomas 4 tragos.", type: "group" },
    { title: "Instrumentos Musicales", text: "Nombren instrumentos. Quien dude o repita, toma 1 trago.", type: "group" },
    { title: "Deportes Extremos", text: "Nombren deportes de riesgo. El que no sepa toma 2 tragos.", type: "group" },
    { title: "Idiomas del Mundo", text: "Nombren idiomas oficiales vivos. Dialectos no cuentan. El que falle toma 2 tragos.", type: "group" },
    { title: "Consolas Portátiles", text: "Nombren exclusivamente consolas portátiles de la historia. El que diga una de sobremesa toma 3 tragos.", type: "group" }
];

const cardDatabaseRetos = [
    { title: "El Imitador", text: "{player1} debe imitar a otro jugador. Si nadie adivina quién es en 10 segundos, toma 2 tragos. Si adivinan, el imitado toma.", type: "interaction" },
    { title: "Pasarela", text: "{player1} debe caminar por la habitación como un modelo de alta costura. Si se ríe, toma 2 tragos.", type: "interaction" },
    { title: "Sin pulgares", text: "{player1} no puede usar sus pulgares durante los próximos 3 turnos. Si olvida la regla, toma.", type: "rule" },
    { title: "El Bailarín", text: "{player1} tiene que hacer su mejor paso de baile por 10 segundos. Si a la mayoría no le gusta, toma 2 tragos.", type: "interaction" },
    { title: "Canto obligado", text: "{player1} debe decir todo cantando hasta su próximo turno. Si habla normal, toma.", type: "rule" },
    { title: "Abdominales", text: "{player1} debe hacer 5 flexiones o abdominales. Si se niega, toma 3 tragos.", type: "versus" },
    { title: "Acento extranjero", text: "{player1} debe hablar con un acento extranjero inventado por 2 turnos.", type: "rule" },
    { title: "Estatua", text: "{player1} y {player2} deben quedarse congelados. El primero en moverse toma 2 tragos.", type: "versus" },
    { title: "Masaje", text: "{player1} debe hacerle un masaje en los hombros de 30 segundos a {player2}.", type: "interaction" },
    { title: "Confesión vergonzosa", text: "{player1}, cuenta tu anécdota más vergonzosa o toma 3 tragos.", type: "group" },
    { title: "Broma Telefónica Ligera", text: "Llama a una pizzería local y pregunta si venden sushi (o algo absurdo pero inofensivo). Si no te atreves, toma 4 tragos.", type: "interaction" },
    { title: "El Citófono", text: "Llama al conserje o guardia por el citófono y deséale muy amablemente buenas noches, sin otro motivo. Si no lo haces, toma 3 tragos.", type: "interaction" },
    { title: "Grito por la Ventana", text: "Asómate por la ventana o balcón y grita '¡Chamo, este país es una huevada!' a todo pulmón. Si te da vergüenza, toma 4 tragos.", type: "interaction" },
    { title: "Declaración de Amor", text: "Mándale un mensaje de audio a un amigo/a diciendo que siempre lo has amado en secreto. Si te rindes, toma 5 tragos.", type: "interaction" },
    { title: "Sombrero de Lujo", text: "Elige un objeto aleatorio y úsalo de sombrero por el resto del juego. Si te lo quitas o te niegas, tomas 3 tragos.", type: "rule" },
    { title: "Intercambio de Ropa", text: "Intercambia una prenda de ropa (visible, no accesorios) con {player2}. Si alguno se niega, ambos toman 4 tragos.", type: "interaction" },
    { title: "Poesía Urbana", text: "Recita la letra de una canción de reggaeton muy sucia como si fuera un poema trágico de Shakespeare. Si paras, toma 3 tragos.", type: "interaction" },
    { title: "Selfie Extraña", text: "Sube una foto haciendo tu peor doble papada o cara fea a tu historia de Instagram por 5 minutos. Si no te atreves, toma 4 tragos.", type: "interaction" },
    { title: "El Mimo", text: "Comunícate exclusivamente mediante mímica por toda una vuelta completa. Si dices una sola sílaba, toma 3 tragos.", type: "rule" },
    { title: "El Presentador de TV", text: "Presenta a {player2} al grupo como si el resto no lo conociera. Si alguien se ríe toma 2 tragos. Si no lo quieres hacer, tomas 4 tragos.", type: "interaction" },
    { title: "Baile del Caño", text: "Haz un baile sensual (y gracioso) usando una silla o el marco de una puerta por 20 segundos. Si no lo haces, toma 4 tragos.", type: "interaction" },
    { title: "El Vendedor", text: "El grupo elige un objeto de la habitación. Intenta venderle ese objeto al grupo durante 1 minuto, alabando sus cualidades mágicas. Si te rindes, toma 3 tragos.", type: "interaction" },
    { title: "Tren enojado", text: "Haz el sonido de un tren muy enojado con mucha fuerza. Si el grupo decide que no sonó épico, toma 2 tragos.", type: "interaction" },
    { title: "Llamada de Riesgo", text: "Marca el número de una ex pareja (o antiguo casi-algo), deja que suene 2 veces completas y cuelga. Si te falta valor, toma 5 tragos.", type: "interaction" },
    { title: "El Traductor", text: "{player2} habla normal y tú debes 'traducir' simultáneamente todo lo que dice a lenguaje de señas inventado por 1 vuelta. Si te niegas, toma 3 tragos.", type: "rule" },
    { title: "Propuesta de Matrimonio", text: "Arrodíllate y pídele matrimonio a {player2} dándole un objeto inútil de la mesa (ej: una tapa de cerveza). Si te da pena, toma 3 tragos.", type: "interaction" },
    { title: "El DJ Humano", text: "Haz beatbox o sonidos de batería electrónica con la boca mientras alguien más hace un mini breakdance. Si no lo haces, toma 3 tragos.", type: "interaction" },
    { title: "Comentarista Deportivo", text: "Narra en voz alta, muy rápido y con emoción, cualquier acción que haga {player2} por el próximo minuto. Si paras, toma 3 tragos.", type: "interaction" },
    { title: "Historia Misteriosa", text: "Sube una historia a Instagram con fondo negro que diga 'Me gustas, tu sabes quien eres'. Si no lo subes, toma 4 tragos.", type: "interaction" },
    { title: "El Modelo de Revista", text: "Posa en 5 posiciones diferentes y ridículas en el centro del grupo como un modelo de alta costura. Si te niegas, toma 3 tragos.", type: "interaction" },
    { title: "Stand Up Comedy", text: "Cuéntale un chiste al grupo actuando como en un teatro. Si nadie se ríe (ni siquiera por pena), tomas 3 tragos.", type: "interaction" },
    { title: "Miedo Irracional", text: "Explícale al grupo con lágrimas falsas por qué le tienes pánico a las polillas. Si rompes personaje, toma 2 tragos.", type: "interaction" },
    { title: "La Gallina", text: "Camina por la sala aleteando y cacareando como gallina por 15 segundos. Si te da vergüenza, toma 3 tragos.", type: "interaction" },
    { title: "Llamada Sorpresa a Amigo", text: "Llámale a un amigo que no esté presente solo para decirle 'Oye, me acabo de acordar que te quiero mucho, adiós'. Si no te atreves, toma 4 tragos.", type: "interaction" },
    { title: "Maquillaje a Ciegas", text: "Deja que {player2} te pinte los labios (o la cara con algo lavable) teniendo los ojos cerrados. Si te niegas, tomas 4 tragos.", type: "interaction" },
    { title: "El Robot", text: "Debes moverte y hablar de forma mecanizada como un robot antiguo durante 2 turnos completos. Si hablas normal, toma 3 tragos.", type: "rule" },
    { title: "Lectura de Labios", text: "Ponte audífonos con música muy fuerte; {player2} te dirá una frase loca y debes adivinarla leyendo sus labios. Si fallas 3 veces, toma 2 tragos.", type: "interaction" },
    { title: "Desfile de Modas", text: "Ponte un calzoncillo/sostén o una prenda extraña encima de la ropa y desfila por la habitación. Si te niegas, toma 3 tragos.", type: "interaction" },
    { title: "Risa Malvada", text: "Haz tu mejor, más larga y diabólica risa de villano de película. Si no logras intimidar/hacer reír, toma 2 tragos.", type: "interaction" },
    { title: "El Gurú", text: "Siéntate en posición de loto y dale un consejo de vida 'profundo' pero totalmente absurdo a cada jugador. Si te rindes, toma 3 tragos.", type: "interaction" },
    { title: "El Extraterrestre", text: "Finge ser un alien que acaba de llegar a la Tierra y pregúntale a {player2} desesperadamente para qué sirve un celular. Si te da pena, toma 2 tragos.", type: "interaction" },
    { title: "Acento Telenovela", text: "Habla con un acento muy exagerado de telenovela mexicana durante 2 vueltas. Si olvidas el acento, toma 3 tragos.", type: "rule" },
    { title: "Canto de Ópera", text: "Canta el coro de tu canción favorita actual pero imitando a un cantante de ópera a todo volumen. Si te niegas, toma 3 tragos.", type: "interaction" },
    { title: "Abogado del Diablo", text: "Defiende apasionadamente durante 1 minuto por qué la pizza con piña es el mayor invento de la humanidad. Si te trabas, toma 2 tragos.", type: "interaction" },
    { title: "Comercial de TV", text: "Haz un infomercial muy exagerado promocionando el trago que estás tomando como si fuera la cura a todo mal. Si paras, toma 2 tragos.", type: "interaction" },
    { title: "Lectura Dramática", text: "Abre tu WhatsApp y lee en voz alta el último mensaje de texto que enviaste, pero con una intensidad súper dramática. Si no lo haces, toma 3 tragos.", type: "interaction" },
    { title: "Broma a un Vecino", text: "Escribe una nota de amor ('Eres el vecino más guapo') y déjala deslizada bajo la puerta de algún vecino cercano. Si no hay valor, toma 4 tragos.", type: "interaction" },
    { title: "Elogio Incómodo", text: "Mira fijamente a los ojos a {player2} y dile cumplidos sin parar por 30 segundos, sin pestañear. El primero en reírse toma 3 tragos.", type: "interaction" },
    { title: "El Equilibrista", text: "Mantén tu celular balanceado sobre tu cabeza durante 1 minuto mientras el juego sigue. Si se cae, tomas 2 tragos.", type: "interaction" },
    { title: "La Momia Express", text: "Deja que el grupo te envuelva la cabeza con un rollo de papel higiénico. Si te rehúsas a perder el glamour, toma 4 tragos.", type: "interaction" }
];

const cardDatabaseHot = [
    { title: "Beso de 3", text: "Las 3 personas con la batería de celular más baja deben darse un beso. Si se niegan, los 3 toman.", type: "group" },
    { title: "El número 1", text: "A la cuenta de 3, apunten a la persona más atractiva de la mesa. Esa persona manda a tomar 3 tragos.", type: "group" },
    { title: "Prenda de vestir", text: "{player1}, quítate una prenda de ropa o toma 4 tragos.", type: "interaction" },
    { title: "Siete Minutos", text: "{player1} y {player2} deben ir al baño solos por 2 minutos. O ambos toman 4 tragos.", type: "versus" },
    { title: "Beso en el cuello", text: "{player1} debe darle un beso en el cuello a {player2}. Si se niegan, ambos toman.", type: "interaction" },
    { title: "Verdad íntima", text: "{player1}, ¿cuál es tu posición favorita? Si no respondes, toma 3 tragos.", type: "interaction" },
    { title: "Lap Dance", text: "{player1} debe hacerle un baile sensual de 30 segundos a {player2}. Si se niegan, ambos toman 4 tragos.", type: "interaction" },
    { title: "Intercambio de ropa", text: "{player1} y {player2} deben intercambiar una prenda de ropa. Si se niegan, ambos toman 4 tragos.", type: "versus" },
    { title: "Foto sugerente", text: "{player1} debe dejar que {player2} le tome una foto en una pose sugerente. Si se niegan, ambos toman 3 tragos.", type: "interaction" },
    { title: "Mordida", text: "{player1} debe morder sensualmente a {player2} en la oreja o brazo. Si se niegan, ambos toman 3 tragos.", type: "interaction" },
    { title: "Susurro Secreto", text: "{player1} debe susurrarle al oído a {player2} algo que lo haga sonrojar. Si no lo hace, toma 3 tragos.", type: "interaction" },
    { title: "Hielo Ardiente", text: "{player1} debe pasar un vaso frío o hielo por el cuello de {player2}. Si alguno se niega, ambos toman 4 tragos.", type: "interaction" },
    { title: "Caricia Ciega", text: "{player1} debe dejarse acariciar el rostro por {player2} con los ojos cerrados y adivinar qué usó (dedos, cabello). Si se niegan, toman 3 tragos.", type: "interaction" },
    { title: "Verdad Picante", text: "{player1}, ¿cuál es el lugar más extraño donde has tenido intimidad? Si mientes o callas, tomas 4 tragos.", type: "interaction" },
    { title: "El Masaje", text: "{player1} debe darle un masaje en la parte baja de la espalda a {player2} por 1 minuto. Si se niegan, ambos toman 3 tragos.", type: "interaction" },
    { title: "Intercambio de Miradas", text: "{player1} y {player2} deben mirarse fijamente a los labios por 30 segundos sin reírse. Si fallan, toman 2 tragos.", type: "interaction" },
    { title: "Verdad o Reto Hot", text: "{player1} le pone un reto físico o una pregunta íntima a {player2}. Si {player2} se niega a hacerlo o responder, toma 4 tragos.", type: "interaction" },
    { title: "Confesión Culpable", text: "{player1}, confiesa un fetiche, gusto culposo o fantasía que tengas. Si te da vergüenza y callas, toma 5 tragos.", type: "interaction" },
    { title: "Beso de Película", text: "{player1} y {player2} deben recrear una escena romántica a un centímetro de besarse. Si se ríen y rompen el clima, toman 4 tragos.", type: "interaction" },
    { title: "El Ciego", text: "{player1} cierra los ojos. {player2} debe darle un beso en cualquier parte de la cara y {player1} debe adivinar dónde fue. Si no lo hacen, toman 3 tragos.", type: "interaction" },
    { title: "Trago Compartido", text: "{player1} debe beber de su vaso sin usar las manos, mientras {player2} se lo sostiene cerca de los labios. Si derraman, toman 2 tragos.", type: "interaction" },
    { title: "La Marca de Agua", text: "{player1} debe mojar su dedo en su trago y pasarlo por los labios de {player2}. Si no, ambos toman 3 tragos.", type: "interaction" },
    { title: "Confesión del Pasado", text: "Todos los que hayan besado a alguien presente en esta habitación (que no sea su pareja actual) toman 2 tragos.", type: "group" },
    { title: "Ronda de Poca Ropa", text: "El que lleve más prendas de ropa puestas en este momento debe quitarse 1. Si se niega a emparejar la situación, toma 4 tragos.", type: "group" },
    { title: "Beso en la Mejilla", text: "{player1} debe darle un beso muy sonoro, húmedo y prolongado en la mejilla a {player2}. Si les da pena, ambos toman 2 tragos.", type: "interaction" },
    { title: "El Semáforo", text: "{player1}, elige a alguien de la mesa a quien le darías luz verde, amarilla y roja. Si no te atreves a decirlo, tomas 4 tragos.", type: "interaction" },
    { title: "El Mordisco", text: "{player1} debe darle un mordisco muy suave y juguetón en el labio inferior a {player2}. Si se niegan, toman 5 tragos.", type: "interaction" },
    { title: "Contacto Físico", text: "{player1} debe sentarse en las piernas de {player2} durante 1 ronda completa. Si se niegan, ambos toman 4 tragos.", type: "interaction" },
    { title: "Mensaje Arriesgado", text: "{player1} debe enviarle un mensaje que diga 'Estoy pensando en ti...' al 3er contacto de su WhatsApp. Si no, toma 5 tragos.", type: "interaction" },
    { title: "Pregunta Directa", text: "{player1}, apunta a la persona más atractiva de esta mesa, excluyendo a tu pareja si la tienes. Si no respondes, toma 4 tragos.", type: "interaction" },
    { title: "La Marca", text: "{player1} debe dejarle una marca de beso (con labial imaginario o real) en el cuello a {player2}. Si se niegan, toman 4 tragos.", type: "interaction" },
    { title: "Aliento Cercano", text: "{player1} y {player2} deben poner sus rostros a 5 centímetros de distancia por 30 segundos sin besarse. Si se besan o se alejan, toman 3 tragos.", type: "interaction" },
    { title: "Historia Caliente", text: "{player1}, cuenta la historia de tu mejor beso. Si la historia es muy corta o aburre al grupo, toma 3 tragos.", type: "interaction" },
    { title: "El Evaluador", text: "{player1} debe puntuar del 1 al 10 qué tan buen besador/a cree que es {player2}. Si se niega a poner una nota, toma 2 tragos.", type: "interaction" },
    { title: "Beso de Esquimal", text: "{player1} y {player2} deben frotar sus narices cariñosamente por 15 segundos sin separar la vista. Si se ríen, toman 2 tragos.", type: "interaction" },
    { title: "Cosquillas", text: "{player1} debe hacerle cosquillas a {player2} en el cuello o costillas. Si {player2} no soporta 10 segundos seguidos, ambos toman 3 tragos.", type: "interaction" },
    { title: "Tatuaje Falso", text: "{player1} debe usar un lápiz o plumón para dibujarle un 'tatuaje' pequeño en el abdomen o pecho a {player2}. Si se niegan, toman 4 tragos.", type: "interaction" },
    { title: "Baile Pegados", text: "{player1} y {player2} deben bailar pegados sin dejar espacio entre ellos por 1 minuto. Si se separan antes de tiempo, toman 3 tragos.", type: "interaction" },
    { title: "Ropa Interior", text: "A la cuenta de tres, todos dicen el color de su ropa interior en voz alta. El que tenga negro manda a tomar 2 tragos.", type: "group" },
    { title: "Trago de Ombligo", text: "{player1} debe tomarse un shot de licor servido en el ombligo de {player2}. Si les da demasiada pena, ¡ambos toman 5 tragos!", type: "interaction" },
    { title: "Roce Sensual", text: "{player1} debe recorrer el brazo de {player2} con la yema de los dedos lentamente. Si {player2} se estremece o ríe, toma 2 tragos.", type: "interaction" },
    { title: "La Propuesta Indecente", text: "{player1}, ofrécele algo muy atrevido (de broma) a {player2}. Si {player2} lo rechaza en seco, ambos toman 3 tragos.", type: "interaction" },
    { title: "Verdad Incómoda", text: "{player1}, ¿cuántas parejas sexuales has tenido a lo largo de tu vida? Si te niegas a revelar el número, toma 4 tragos.", type: "interaction" },
    { title: "La Pasarela Caliente", text: "{player1} debe quitarse una prenda pequeña mientras hace un mini striptease al ritmo de la música. Si no lo hace, toma 5 tragos.", type: "interaction" },
    { title: "Nombres Gemidos", text: "Durante la próxima vuelta, cuando alguien diga el nombre de {player1}, debe decirlo como un gemido. El que olvide la regla toma 2 tragos.", type: "rule" },
    { title: "Beso en la Oreja", text: "{player1} debe darle un beso muy suave en el lóbulo de la oreja a {player2}. Si alguno se opone rotundamente, toman 4 tragos.", type: "interaction" },
    { title: "Caricia Inesperada", text: "{player1} debe acariciar la pierna de {player2} por debajo de la mesa usando solo su pie durante 1 ronda. Si se rinden, toman 3 tragos.", type: "interaction" },
    { title: "El Trago de los Enamorados", text: "{player1} y {player2} deben entrelazar sus brazos (estilo boda) y tomar su vaso al mismo tiempo. Si derraman, toman 2 tragos.", type: "interaction" },
    { title: "El Kamasutra", text: "{player1} debe nombrar 3 posiciones famosas en menos de 10 segundos. Si duda o falla el tiempo, toma 3 tragos.", type: "interaction" },
    { title: "Confesión Final", text: "Todos los que alguna vez se hayan besado con la ex pareja de un amigo o conocido directo, toman 3 tragos al seco en penitencia.", type: "group" }
];

// --- EVENT LISTENERS ---
document.addEventListener("deviceready", onDeviceReady, false);

document.addEventListener('DOMContentLoaded', () => {
    initAvatarGrid();

    // Paywall
    document.getElementById('btn-subscribe').addEventListener('click', () => {
        if (window.store) store.order(PRODUCT_ID);
    });
    document.getElementById('btn-restore').addEventListener('click', () => {
        if (window.store) store.refresh();
    });

    // Navegación General
    document.getElementById('btn-play-home').addEventListener('click', () => switchScreen('screen-home', 'screen-mode-select'));
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentScreenId = e.target.closest('.screen').id;
            const targetScreenId = e.target.dataset.target;
            
            if(currentScreenId.startsWith('screen-game') || currentScreenId === 'screen-ranking') {
                clearInterval(movementInterval);
            }
            switchScreen(currentScreenId, targetScreenId);
        });
    });

    window.confirmExit = function() {
        document.getElementById('modal-exit').classList.remove('hidden');
    };
    
    window.closeExitModal = function() {
        document.getElementById('modal-exit').classList.add('hidden');
    };
    
    window.executeExit = function() {
        document.getElementById('modal-exit').classList.add('hidden');
        showInterstitial();
        clearInterval(movementInterval);
        switchScreen(document.querySelector('.screen.active').id, 'screen-mode-select');
    };

    window.clearPlayersAndSetup = function() {
        document.getElementById('modal-keep-players').classList.add('hidden');
        players = [];
        selectedAvatar = null;
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected', 'disabled'));
        renderPlayers();
        checkAddButtonState();
        switchScreen('screen-mode-select', 'screen-setup');
    };

    window.keepPlayersAndProceed = function() {
        document.getElementById('modal-keep-players').classList.add('hidden');
        switchScreen('screen-mode-select', 'screen-setup');
        proceedFromSetup();
    };

    // Selección de Modo
    document.querySelectorAll('.mode-box').forEach(box => {
        box.addEventListener('click', () => selectMode(box.dataset.mode));
    });

    // Inputs Jugadores
    document.getElementById('btn-add-player').addEventListener('click', addPlayer);
    document.getElementById('player-input').addEventListener('input', checkAddButtonState);
    document.getElementById('player-input').addEventListener('keypress', (e) => {
        if(e.key === 'Enter' && !document.getElementById('btn-add-player').disabled) addPlayer();
    });
    
    // Flujos de Juego
    document.getElementById('btn-next-setup').addEventListener('click', proceedFromSetup);
    
    // Botones de Siguiente Carta para los dos tipos de pantallas
    document.querySelectorAll('.btn-next-card').forEach(btn => {
        btn.addEventListener('click', showNextCard);
    });
    
    // Ranking
    document.getElementById('btn-next-ranking').addEventListener('click', showNextRanking);
});

// --- ENRUTADOR (STATE MACHINE) ---
function selectMode(mode) {
    if ((mode === 'hot' || mode === 'pyramid') && !isPremium) {
        switchScreen('screen-mode-select', 'screen-paywall');
        return;
    }

    currentMode = mode;
    
    // Resetear variables de juego (SIN borrar players)
    captain = "";
    currentCardCount = 0;
    usedCards = [];
    clearInterval(movementInterval);
    
    // Rutas según modo
    if (mode === 'chupistico') {
        switchScreen('screen-mode-select', 'screen-game-simple');
        startGameSimple();
    } else if (mode === 'hot' || mode === 'roulette' || mode === 'pyramid') {
        document.getElementById('avatar-grid').classList.add('hidden');
        document.getElementById('setup-instruction').textContent = "Ingresa los nombres de los jugadores.";
        if(players.length > 0) {
            document.getElementById('modal-keep-players').classList.remove('hidden');
        } else {
            switchScreen('screen-mode-select', 'screen-setup');
        }
    } else if (mode === 'classic' || mode === 'retos') {
        document.getElementById('avatar-grid').classList.remove('hidden');
        document.getElementById('setup-instruction').textContent = "Ingresa los nombres y elige un avatar.";
        if(players.length > 0) {
            document.getElementById('modal-keep-players').classList.remove('hidden');
        } else {
            switchScreen('screen-mode-select', 'screen-setup');
        }
    } else if (mode === 'pyramid') {
        // Redirige al setup igual que roulette
    }
}
function proceedFromSetup() {
    if (currentMode === 'classic' || currentMode === 'retos') {
        showCaptainScreen();
    } else if (currentMode === 'hot') {
        switchScreen('screen-setup', 'screen-game-simple');
        startGameSimple();
    } else if (currentMode === 'roulette') {
        switchScreen('screen-setup', 'screen-roulette');
        initRoulette();
    } else if (currentMode === 'pyramid') {
        switchScreen('screen-setup', 'screen-pyramid');
        initPyramid();
    }
}

function startGameSimple() {
    currentCardCount = 0;
    usedCards = [];
    document.querySelectorAll('.btn-next-card').forEach(btn => btn.textContent = "Siguiente 🍻");
    showNextCard();
}

// La función resetToHome fue reemplazada por la navegación dinámica con data-target

function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.remove('active');
    document.getElementById(hideId).classList.add('hidden');
    
    let showScreen = document.getElementById(showId);
    showScreen.classList.remove('hidden');
    showScreen.classList.add('active');

    // --- MANEJO DE AUDIO ---
    if (isAudioInitialized) {
        let isGameScreen = showId.startsWith('screen-game') || showId === 'screen-captain' || showId === 'screen-roulette' || showId === 'screen-pyramid';
        let wasGameScreen = hideId.startsWith('screen-game') || hideId === 'screen-captain' || hideId === 'screen-roulette' || hideId === 'screen-pyramid';
        
        if (isGameScreen) {
            bgmMenu.pause();
            if (bgmGame.paused) bgmGame.play().catch(e => console.log(e));
        } else {
            bgmGame.pause();
            bgmGame.currentTime = 0;
            if (wasGameScreen) {
                // Volviendo desde un juego: reiniciar música del menú desde cero
                bgmMenu.currentTime = 0;
            }
            if (bgmMenu.paused) bgmMenu.play().catch(e => console.log(e));
        }
    }

    if(showId.startsWith('screen-game') || showId === 'screen-captain' || showId === 'screen-roulette' || showId === 'screen-pyramid') {
        showScreen.classList.remove('bg-classic', 'bg-chupistico', 'bg-retos', 'bg-hot', 'bg-roulette', 'bg-pyramid');
        if(currentMode) showScreen.classList.add('bg-' + currentMode);
    }

    // --- MANEJO DE BANNER ---
    if (bannerAd) {
        const menuScreens = ['screen-home', 'screen-mode-select', 'screen-setup'];
        if (menuScreens.includes(showId)) {
            bannerAd.show().catch(e => console.log(e));
        } else {
            bannerAd.hide().catch(e => console.log(e));
        }
    }

    const canvas = document.getElementById('particles-canvas');
    if(canvas && showId !== 'screen-setup') {
        showScreen.insertBefore(canvas, showScreen.firstChild);
    }
}

// --- LÓGICA DE JUGADORES Y AVATARES ---
function initAvatarGrid() {
    const grid = document.getElementById('avatar-grid');
    grid.innerHTML = '';
    avatars.forEach((emoji) => {
        const div = document.createElement('div');
        div.className = 'avatar-option';
        div.textContent = emoji;
        div.dataset.emoji = emoji;
        div.onclick = () => selectAvatar(div, emoji);
        grid.appendChild(div);
    });
}

function selectAvatar(element, emoji) {
    if(element.classList.contains('disabled')) return;
    
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedAvatar = emoji;
    checkAddButtonState();
}

function checkAddButtonState() {
    const input = document.getElementById('player-input').value.trim();
    const btn = document.getElementById('btn-add-player');
    
    let isValid = false;
    if (currentMode === 'classic' || currentMode === 'retos') {
        isValid = input && selectedAvatar && players.length < MAX_PLAYERS;
    } else {
        isValid = input && players.length < MAX_PLAYERS;
    }

    if(isValid) {
        btn.removeAttribute('disabled');
    } else {
        btn.setAttribute('disabled', 'true');
    }
}

function addPlayer() {
    const input = document.getElementById('player-input');
    const name = input.value.trim();
    
    let isAvatarRequired = (currentMode === 'classic' || currentMode === 'retos');
    
    if(name && (!isAvatarRequired || selectedAvatar) && players.length < MAX_PLAYERS && !players.find(p => p.name === name)) {
        players.push({
            name: name,
            avatar: selectedAvatar || "👤", // Placeholder if no avatar needed
            drinks: 0,
            scale: 1.0,
            x: 50,
            y: 50,
            targetX: 50,
            targetY: 50
        });
        
        if (isAvatarRequired) {
            const avatarEl = document.querySelector(`.avatar-option[data-emoji="${selectedAvatar}"]`);
            if(avatarEl) {
                avatarEl.classList.remove('selected');
                avatarEl.classList.add('disabled');
            }
        }
        
        input.value = '';
        selectedAvatar = null;
        renderPlayers();
        checkAddButtonState();
    }
}

function removePlayer(name) {
    const player = players.find(p => p.name === name);
    if(player && player.avatar !== "👤") {
        const avatarEl = document.querySelector(`.avatar-option[data-emoji="${player.avatar}"]`);
        if(avatarEl) avatarEl.classList.remove('disabled');
    }
    
    players = players.filter(p => p.name !== name);
    renderPlayers();
    checkAddButtonState();
}

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    players.forEach(player => {
        const li = document.createElement('li');
        let avatarDisplay = player.avatar !== "👤" ? player.avatar : "";
        li.innerHTML = `
            <span>${avatarDisplay} ${player.name}</span>
            <button class="btn-delete" onclick="removePlayer('${player.name}')">✖</button>
        `;
        list.appendChild(li);
    });

    const btnNext = document.getElementById('btn-next-setup');
    if(players.length >= 2) {
        btnNext.removeAttribute('disabled');
    } else {
        btnNext.setAttribute('disabled', 'true');
    }
}

function showCaptainScreen() {
    const grid = document.getElementById('captain-selection');
    grid.innerHTML = '';
    
    players.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'btn-captain';
        btn.innerHTML = `${player.avatar} ${player.name}`;
        btn.onclick = () => setCaptain(player.name);
        grid.appendChild(btn);
    });

    switchScreen('screen-setup', 'screen-captain');
}

function setCaptain(selectedCaptain) {
    captain = selectedCaptain;
    document.querySelectorAll('.captain-name').forEach(el => el.textContent = captain);
    
    switchScreen('screen-captain', 'screen-game-classic');
    
    renderArena(); 
    startPlazaLogic(); 
    
    document.querySelector('#screen-game-classic .card-title').textContent = "¡Salud!";
    document.querySelector('#screen-game-classic .card-text').textContent = `El Capitán es ${captain}. Presiona siguiente para comenzar.`;
    document.querySelector('#screen-game-classic .card-title').style.color = 'var(--primary-color)';
}

// --- CONTROLES Y PLAZA DE JUGADORES (CLÁSICO Y RETOS) ---
function renderArena() {
    const controlsBar = document.getElementById('player-controls-bar');
    const plaza = document.getElementById('plaza-area');
    
    controlsBar.innerHTML = '';
    plaza.innerHTML = '';
    
    const allDrinkBtn = document.createElement('button');
    allDrinkBtn.className = 'btn-drink btn-drink-all';
    allDrinkBtn.textContent = '🍻';
    allDrinkBtn.onclick = () => {
        players.forEach((_, i) => addDrink(i));
    };
    controlsBar.appendChild(allDrinkBtn);
    
    players.forEach((player, index) => {
        const controlBtn = document.createElement('div');
        controlBtn.className = 'control-btn';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'control-name';
        nameSpan.textContent = player.name;
        
        const drinkBtn = document.createElement('button');
        drinkBtn.className = 'btn-drink';
        drinkBtn.textContent = '🍺';
        drinkBtn.onclick = () => addDrink(index);
        
        controlBtn.appendChild(nameSpan);
        controlBtn.appendChild(drinkBtn);
        controlsBar.appendChild(controlBtn);
        
        player.x = Math.random() * 80 + 10;
        player.y = Math.random() * 80 + 10;
        
        const avatarEl = document.createElement('div');
        avatarEl.className = 'plaza-avatar';
        avatarEl.id = `avatar-${index}`;
        avatarEl.innerHTML = `<div class="avatar-emoji">${player.avatar}</div><div class="avatar-name-label">${player.name}</div>`;
        avatarEl.style.left = `${player.x}%`;
        avatarEl.style.top = `${player.y}%`;
        avatarEl.onclick = () => spawnCustomSpeechBubble(player.x, player.y - 10);
        
        plaza.appendChild(avatarEl);
    });
}

function startPlazaLogic() {
    movementInterval = setInterval(() => {
        players.forEach((player, index) => {
            let speed = 2.0;
            let ease = 'linear';
            
            if(player.drinks >= 8) {
                speed = 3.0 + Math.random() * 2; 
                ease = 'ease-in-out';
            } else if (player.drinks >= 4) {
                speed = 2.5;
            }

            player.targetX = Math.max(5, Math.min(90, player.x + (Math.random() * 30 - 15)));
            player.targetY = Math.max(10, Math.min(85, player.y + (Math.random() * 30 - 15)));
            
            player.x = player.targetX;
            player.y = player.targetY;
            
            const avatarEl = document.getElementById(`avatar-${index}`);
            if(avatarEl) {
                avatarEl.style.transition = `left ${speed}s ${ease}, top ${speed}s ${ease}, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
                avatarEl.style.left = `${player.x}%`;
                avatarEl.style.top = `${player.y}%`;
            }
            
            checkInteractions(player, index);
        });
    }, 2000);
}

function checkInteractions(player, index) {
    if(Math.random() > 0.15) return;
    
    for(let i=0; i<players.length; i++) {
        if(i === index) continue;
        let other = players[i];
        let dx = player.x - other.x;
        let dy = player.y - other.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist < 15) { 
            spawnSpeechBubble(player.x, player.y - 10, player.drinks);
            break; 
        }
    }
}

function spawnSpeechBubble(x, y, drinks) {
    const plaza = document.getElementById('plaza-area');
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    
    let textArray = drinks >= 5 ? drunkSpeechEmojis : speechEmojis;
    bubble.textContent = textArray[Math.floor(Math.random() * textArray.length)];
    bubble.style.left = `${x}%`;
    bubble.style.top = `${y}%`;
    
    if(drinks >= 8) {
        bubble.style.border = "2px solid red";
        bubble.style.color = "red";
    }
    
    plaza.appendChild(bubble);
    
    setTimeout(() => {
        if(plaza.contains(bubble)) plaza.removeChild(bubble);
    }, 2500);
}

function spawnCustomSpeechBubble(x, y) {
    const plaza = document.getElementById('plaza-area');
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    
    const touchSpeech = ["¡Ouch!", "¡No me toques!", "¡Me haces cosquillas!", "¿Qué miras?", "¡Déjame!", "¡Ey!", "¡Pulsame otra vez!", "¡Ay!"];
    bubble.textContent = touchSpeech[Math.floor(Math.random() * touchSpeech.length)];
    bubble.style.left = `${x}%`;
    bubble.style.top = `${y}%`;
    bubble.style.border = "2px solid #0fb9b1";
    bubble.style.color = "#0fb9b1";
    bubble.style.zIndex = "100";
    
    plaza.appendChild(bubble);
    
    setTimeout(() => {
        if(plaza.contains(bubble)) plaza.removeChild(bubble);
    }, 2000);
}

function addDrink(playerIndex) {
    let player = players[playerIndex];
    player.drinks += 1;
    player.scale = Math.min(1.0 + (player.drinks * 0.05), 2.5);
    
    const avatarEl = document.getElementById(`avatar-${playerIndex}`);
    if(avatarEl) {
        avatarEl.classList.remove('drink-bounce');
        void avatarEl.offsetWidth; 
        avatarEl.classList.add('drink-bounce');
        
        if(player.drinks >= 8) {
            avatarEl.style.textShadow = '0 0 20px rgba(255, 0, 0, 1)'; 
        } else if (player.drinks >= 4) {
            avatarEl.style.textShadow = '0 0 15px rgba(255, 165, 0, 0.8)'; 
        }
        
        setTimeout(() => {
            avatarEl.style.transform = `scale(${player.scale})`;
        }, 500);
    }
}

// --- LÓGICA DE CARTAS (Aplica a Clásico por ahora) ---
function showNextCard() {
    if (currentCardCount >= MAX_CARDS) {
        endGame();
        return;
    }

    // Identificar de qué pantalla se llamó
    let screenPrefix = currentMode === 'classic' || currentMode === 'retos' ? 'classic' : 'simple';
    const cardEl = document.getElementById(`game-card-${screenPrefix}`);
    
    cardEl.classList.remove('card-anim-in');
    cardEl.classList.add('card-anim-out');
    
    setTimeout(() => {
        generateCardContent(screenPrefix);
        currentCardCount++;
        document.querySelectorAll('.current-card').forEach(el => el.textContent = currentCardCount);
        
        if(currentCardCount % 25 === 0 && currentCardCount > 0 && currentCardCount < MAX_CARDS) {
            showInterstitial();
        }

        cardEl.classList.remove('card-anim-out');
        cardEl.classList.add('card-anim-in');
        
        if(currentCardCount === MAX_CARDS) {
            document.querySelectorAll('.btn-next-card').forEach(btn => btn.textContent = "Ver Resultados 🏆");
        }
    }, 300);
}

function generateCardContent(screenPrefix) {
    let db = cardDatabaseClassic;
    if (currentMode === 'chupistico') db = cardDatabaseChupistico;
    if (currentMode === 'retos') db = cardDatabaseRetos;
    if (currentMode === 'hot') db = cardDatabaseHot;
    
    if (usedCards.length >= db.length) usedCards = [];

    let card;
    do {
        card = db[Math.floor(Math.random() * db.length)];
    } while (usedCards.includes(card));

    usedCards.push(card);

    let finalTitle = card.title;
    let finalText = card.text;

    if(finalText.includes('{player1}')) {
        let p1 = getRandomPlayerName();
        finalText = finalText.replace('{player1}', `<strong>${p1}</strong>`);
        
        if(finalText.includes('{player2}')) {
            let p2 = getRandomPlayerName([p1]);
            finalText = finalText.replace('{player2}', `<strong>${p2}</strong>`);
        }
    }

    let titleColor = 'var(--primary-color)';
    if(card.type === 'interaction') titleColor = '#ff9f43';
    if(card.type === 'versus') titleColor = '#ee5253';
    if(card.type === 'rule') titleColor = '#10ac84';
    if(card.type === 'team') titleColor = '#2e86de';

    const cardTitleEl = document.querySelector(`#screen-game-${screenPrefix} .card-title`);
    const cardTextEl = document.querySelector(`#screen-game-${screenPrefix} .card-text`);
    
    cardTitleEl.textContent = finalTitle;
    cardTitleEl.style.color = titleColor;
    cardTextEl.innerHTML = finalText;
}

function getRandomPlayerName(exclude = []) {
    if (players.length === 0) return "Alguien"; // Fallback si juegan modos sin nombre
    let available = players.filter(p => !exclude.includes(p.name));
    if(available.length === 0) available = players;
    return available[Math.floor(Math.random() * available.length)].name;
}

// --- RANKING FINAL ---
let rankingQueue = [];

function endGame() {
    showInterstitial();
    clearInterval(movementInterval);
    rankingQueue = [...players].sort((a, b) => b.drinks - a.drinks);
    
    // Ocultar todas las pantallas y mostrar ranking
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    
    if (players.length > 0) {
        document.getElementById('screen-ranking').classList.remove('hidden');
        document.getElementById('screen-ranking').classList.add('active');
        showNextRanking();
    } else {
        // Modos sin jugadores no tienen ranking
        resetToHome();
    }
}

function showNextRanking() {
    if (rankingQueue.length === 0) {
        document.getElementById('ranking-display').innerHTML = `<h2>¡La fiesta terminó!</h2>`;
        document.getElementById('btn-next-ranking').classList.add('hidden');
        return;
    }
    
    const currentPlayer = rankingQueue.shift();
    const position = players.length - rankingQueue.length;
    
    document.getElementById('ranking-position').textContent = `${position}º Lugar`;
    document.getElementById('ranking-name').textContent = currentPlayer.name;
    document.getElementById('ranking-drinks').textContent = `${currentPlayer.drinks} Tragos 🍻`;
    
    const avatarContainer = document.getElementById('ranking-avatar');
    avatarContainer.textContent = currentPlayer.avatar !== "👤" ? currentPlayer.avatar : "🍺";
    avatarContainer.style.transform = `scale(${Math.min(1.0 + (currentPlayer.drinks * 0.1), 3.0)})`;
}

// --- ADMOB ---
let interstitialAd = null;
let bannerAd = null;

async function onDeviceReady() {
    initStore();

    if (typeof admob !== 'undefined') {
        try {
            await admob.start();
            
            interstitialAd = new admob.InterstitialAd({
                adUnitId: 'ca-app-pub-9175463204669767/2063064270',
            });
            
            await interstitialAd.load();
            
            bannerAd = new admob.BannerAd({
                adUnitId: 'ca-app-pub-9175463204669767/9918337718',
                position: 'bottom',
            });
            await bannerAd.show();
        } catch (err) {
            console.log("AdMob Error:", err);
        }
    }
}

function initStore() {
    if (!window.store) {
        console.log("Cordova Purchase Plugin no detectado.");
        return;
    }
    
    store.register({
        id: PRODUCT_ID,
        type: store.PAID_SUBSCRIPTION
    });

    store.when(PRODUCT_ID).approved((product) => {
        product.verify();
    });

    store.when(PRODUCT_ID).verified((product) => {
        product.finish();
        isPremium = true;
        unlockPremiumUI();
    });

    store.when(PRODUCT_ID).owned((product) => {
        isPremium = true;
        unlockPremiumUI();
    });
    
    store.error((err) => {
        console.log('Store Error: ' + JSON.stringify(err));
    });

    store.refresh();
}

function unlockPremiumUI() {
    document.querySelectorAll('.premium-mode').forEach(el => {
        el.classList.add('unlocked');
    });
    
    if (document.getElementById('screen-paywall').classList.contains('active')) {
        switchScreen('screen-paywall', 'screen-mode-select');
    }
}

async function showInterstitial() {
    if (interstitialAd) {
        try {
            await interstitialAd.show();
            await interstitialAd.load(); // Cargar el siguiente
        } catch (err) {
            console.log("Show Interstitial Error:", err);
            // Intentar cargar de nuevo para la próxima vez en caso de que no estuviera cargado
            try { await interstitialAd.load(); } catch(e) {}
        }
    }
}

// --- PARTICLES LOGIC ---
let particlesArray = [];
const canvas = document.getElementById('particles-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particlesAnimationId = null;

function initParticles() {
    if(!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = [];
    let numberOfParticles = 60;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 3) + 1;
        let x = Math.random() * (innerWidth - size * 2) + size * 2;
        let y = Math.random() * (innerHeight - size * 2) + size * 2;
        let directionX = (Math.random() * 1) - 0.5;
        let directionY = (Math.random() * -1.5) - 0.5; // Flotan hacia arriba
        let color = Math.random() > 0.5 ? '#ff4757' : '#1e90ff';
        particlesArray.push({x, y, directionX, directionY, size, color});
    }
}

function animateParticles() {
    if(!canvas) return;
    
    let isSetup = document.getElementById('screen-setup').classList.contains('active');
    if(isSetup) {
        particlesAnimationId = requestAnimationFrame(animateParticles);
        return; 
    }

    let isHot = document.getElementById('screen-game-simple').classList.contains('active') && currentMode === 'hot';
    
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) {
        let p = particlesArray[i];
        p.x += p.directionX;
        p.y += p.directionY;
        
        // Reset si sale por arriba
        if(p.y < 0) {
            p.x = Math.random() * innerWidth;
            p.y = innerHeight;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
        ctx.fillStyle = isHot ? '#ff4757' : p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = isHot ? '#ff4757' : p.color;
        ctx.fill();
    }
    particlesAnimationId = requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    if(canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

if(canvas) {
    initParticles();
    animateParticles();
}

// --- FASE 3: RULETA ---
const rouletteDatabase = [
    "Todos toman 1 trago 🍻", "El último en tocar la mesa toma 2 ⚡", "{player} regala 3 tragos 🎁", "{player} toma 2 tragos 🍺", 
    "{player}, vaso al seco 🌪️", "Cascada de tragos 🌊", "{player} elige a alguien para que tome 2 👈", "Regla nueva 📜", 
    "El de la derecha de {player} toma 2 ➡️", "El de la izquierda de {player} toma 2 ⬅️", "Todos los hombres toman 🧔", 
    "Todas las mujeres toman 👩", "{player} hace un reto o toma 3 🎯", "Verdad o reto para {player} 🎭", "Beso o cachetada para {player} 💋",
    "{player} toma 1 trago sin usar las manos 🤸", "Cultura chupística 🧠", "Simón dice 👑", "El Maestro del Pulgar 👍",
    "Piedra, papel o tijera con {player}, el que pierde toma 2 ✂️",
    "Toma 1 trago y gira de nuevo 🔄", "{player} hace que 2 personas tomen 👯", "El jugador más alto toma 2 tragos 🦒", "El jugador más bajo toma 2 tragos 🐥",
    "Di una rima o toma 2 tragos 🎤", "Castigo máximo: {player} toma 3 😈", "El de al frente toma 2 tragos 👁️", "¡Brindis grupal! 🍻",
    "{player} reparte 1 shot 🥃", "Todos los solteros toman 1 trago 💔", "Todos los emparejados toman 1 trago ❤️", "{player} toma 1 trago por cada jugador 👥",
    "Nadie dice 'Sí' por 2 vueltas 🚫", "Toma del vaso de tu derecha ➡️", "Toma del vaso de tu izquierda ⬅️", "Duelo de miradas hacia la derecha 👁️",
    "Cuenta un chiste malo o toma 2 🤡", "Último en tocarse la nariz toma 1 👃", "Los que usen lentes toman 1 👓", "Los que no usen lentes toman 1 👁️",
    "Adivina la ropa interior del de tu derecha o toma 2 👙", "Todos con el celular en la mesa toman 1 📱", "Vaso en la cabeza 1 min o toma 2 ⚖️", "Todos saludan, último toma 1 👋",
    "Voten al más borracho, él toma 2 🥴", "Inventen un apodo para {player} 🏷️", "5 sentadillas o toma 2 tragos 🏋️", "El con menos % de celular toma 2 🔋",
    "El con más % de celular reparte 2 ⚡", "Inmunidad: Guardala para otro castigo 🛡️"
];

let currentRouletteRotation = 0;

function initRoulette() {
    const wheel = document.getElementById('roulette-wheel');
    const resultBox = document.getElementById('roulette-result-box');
    
    resultBox.classList.add('hidden');
    
    // Generar fondo conic-gradient con 16 segmentos
    const colors = ["#ff4757", "#ffa502", "#eccc68", "#2ed573", "#1e90ff", "#5352ed", "#9b59b6", "#e84393"];
    let segments = 16;
    let gradientParts = [];
    let anglePerSegment = 360 / segments;
    
    for(let i=0; i<segments; i++) {
        let color = colors[i % colors.length];
        let startAngle = i * anglePerSegment;
        let endAngle = (i + 1) * anglePerSegment;
        gradientParts.push(`${color} ${startAngle}deg ${endAngle}deg`);
    }
    
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    wheel.style.transform = `rotate(${currentRouletteRotation}deg)`;
    
    const btnSpin = document.getElementById('btn-spin-roulette');
    btnSpin.onclick = spinRoulette;
    btnSpin.removeAttribute('disabled');
}

function spinRoulette() {
    const btnSpin = document.getElementById('btn-spin-roulette');
    const wheel = document.getElementById('roulette-wheel');
    const resultBox = document.getElementById('roulette-result-box');
    const titleEl = document.getElementById('roulette-title');
    const descEl = document.getElementById('roulette-desc');
    
    btnSpin.setAttribute('disabled', 'true');
    resultBox.classList.add('hidden');
    
    // Física del giro
    let extraSpins = 5 + Math.floor(Math.random() * 5); // 5 a 9 vueltas extra
    let randomDegree = Math.floor(Math.random() * 360);
    
    currentRouletteRotation += (extraSpins * 360) + randomDegree;
    
    wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0.9, 0.2, 1)';
    wheel.style.transform = `rotate(${currentRouletteRotation}deg)`;
    
    let outcome = rouletteDatabase[Math.floor(Math.random() * rouletteDatabase.length)];
    if (players.length > 0 && outcome.includes('{player}')) {
        let randomPlayer = players[Math.floor(Math.random() * players.length)].name;
        outcome = outcome.replace(/{player}/g, randomPlayer);
    }
    
    // Al terminar de girar (4000ms)
    setTimeout(() => {
        titleEl.textContent = "¡Resultado!";
        descEl.textContent = outcome;
        resultBox.classList.remove('hidden');
        btnSpin.removeAttribute('disabled');
    }, 4000);
}

// --- FASE 3: PIRÁMIDE ---
let isHardcorePyramid = false;

const pyramidDatabase = {
    1: ["Toma 2 tragos", "Regala 2 tragos", "El de tu derecha toma 2", "El de tu izquierda toma 2", "Toman los hombres 2 tragos", "Toman las mujeres 2 tragos"],
    2: ["Toma 3 tragos", "Regala 3 tragos", "{player} elige a alguien para tomar 3", "Toma 2 y regala 2", "Beso o cachetada a {player}", "Verdad o reto para {player}"],
    3: ["Toma 4 tragos", "Regala 4 tragos", "Cascada de tragos", "Regla nueva obligatoria", "Juega Simón dice", "El Maestro del Pulgar"],
    4: ["Toma 5 tragos", "Regala 5 tragos", "Todos toman 3 tragos", "{player} toma al seco su vaso", "Cambio de ropa con alguien"],
    5: ["Toma 6 tragos", "Regala 6 tragos", "Todos toman 4 tragos", "Vaso al seco y das 5 vueltas"],
    6: ["TOMA TODO TU VASO AL SECO", "ELIGE A ALGUIEN PARA QUE TOME AL SECO", "UN SHOT DIRECTO"]
};

const pyramidHardcoreDatabase = {
    1: ["Toma 3 tragos", "Quítate una prenda o toma 4", "Dale un pico a {player} o toma 3", "Toman todos 2 tragos"],
    2: ["Vaso al seco para {player}", "Regala 5 tragos", "Hazle un baile a {player} o toma 5", "Toman todos 3 tragos"],
    3: ["Toma 6 tragos", "Muestra tu última foto o toma 6", "Verdad muy incómoda o vaso al seco", "Beso con lengua a {player} o toma 6"],
    4: ["SHOT DIRECTO", "Beso a {player} donde tú quieras o toma al seco", "Todos toman 4 tragos", "{player} toma al seco"],
    5: ["TOMA AL SECO Y QUÍTATE 2 PRENDAS", "ELIGE A ALGUIEN PARA QUE HAGA UN SHOT DIRECTO"],
    6: ["TODOS TOMAN AL SECO", "BESA A QUIEN QUIERAS DURANTE 10 SEGUNDOS", "FONDO BLANCO Y CUENTA UN SECRETO OSCURO"]
};

let currentPyramidPlayerIndex = 0;
let currentPyramidRow = 1;
let pyramidCardsFlippedInRow = 0;

function initPyramid() {
    const grid = document.getElementById('pyramid-grid');
    grid.innerHTML = '';
    
    currentPyramidPlayerIndex = 0;
    currentPyramidRow = 1;
    pyramidCardsFlippedInRow = 0;
    
    // Switch background if hardcore
    const screen = document.getElementById('screen-pyramid');
    if (isHardcorePyramid) {
        screen.classList.remove('bg-pyramid');
        screen.classList.add('bg-pyramid_hardcore');
        document.querySelector('.pyramid-main-title').style.background = 'linear-gradient(90deg, #ff4757, #ff6b81)';
        document.querySelector('.pyramid-main-title').style.webkitBackgroundClip = 'text';
    } else {
        screen.classList.remove('bg-pyramid_hardcore');
        screen.classList.add('bg-pyramid');
        document.querySelector('.pyramid-main-title').style.background = 'linear-gradient(90deg, #00d2d3, #54a0ff)';
        document.querySelector('.pyramid-main-title').style.webkitBackgroundClip = 'text';
    }
    
    for(let numCards=1; numCards<=6; numCards++) {
        let logicalRow = 7 - numCards;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'pyramid-row';
        
        for(let c=0; c<numCards; c++) {
            const card = document.createElement('div');
            card.className = 'pyramid-card';
            if (isHardcorePyramid) card.classList.add('hardcore'); // to show 🔥 when flipped
            
            if (logicalRow > 1) {
                card.classList.add('locked');
            }
            card.dataset.row = logicalRow;
            card.onclick = () => flipPyramidCard(card, logicalRow);
            rowDiv.appendChild(card);
        }
        grid.appendChild(rowDiv);
    }
    
    updatePyramidTurn();
}

function flipPyramidCard(card, row) {
    if (card.classList.contains('flipped') || card.classList.contains('locked')) return;
    
    card.classList.add('flipped');
    
    let db = isHardcorePyramid ? pyramidHardcoreDatabase[row] : pyramidDatabase[row];
    let text = db[Math.floor(Math.random() * db.length)];
    let playerName = players[currentPyramidPlayerIndex].name;
    
    if (text.includes('{player}')) {
        let randomPlayer = players[Math.floor(Math.random() * players.length)].name;
        // Avoid self targeting if possible
        if(randomPlayer === playerName && players.length > 1) {
            randomPlayer = players[(currentPyramidPlayerIndex + 1) % players.length].name;
        }
        text = text.replace(/{player}/g, randomPlayer);
        text = `${playerName}: ${text}`;
    } else {
        text = `${playerName}: ${text}`;
    }
    
    document.getElementById('pyramid-card-text').textContent = text;
    document.getElementById('modal-pyramid-card').classList.remove('hidden');
    
    pyramidCardsFlippedInRow++;
    let expectedCards = 7 - row;
    
    if (pyramidCardsFlippedInRow >= expectedCards) {
        if (currentPyramidRow === 6) {
            // Ganaron la pirámide. El modal se mostrará cuando cierren la carta (btn-pyramid-close).
            card.dataset.isLast = "true";
        } else {
            currentPyramidRow++;
            pyramidCardsFlippedInRow = 0;
            document.querySelectorAll(`.pyramid-card[data-row="${currentPyramidRow}"]`).forEach(c => c.classList.remove('locked'));
        }
    }
    
    currentPyramidPlayerIndex = (currentPyramidPlayerIndex + 1) % players.length;
}

document.getElementById('btn-pyramid-close').onclick = () => {
    document.getElementById('modal-pyramid-card').classList.add('hidden');
    // Check if the last card was flipped
    if (currentPyramidRow === 6 && pyramidCardsFlippedInRow >= 1) {
        setTimeout(() => {
            document.getElementById('modal-pyramid-win').classList.remove('hidden');
        }, 300);
    } else {
        updatePyramidTurn();
    }
};

document.getElementById('btn-pyramid-play-again').onclick = () => {
    document.getElementById('modal-pyramid-win').classList.add('hidden');
    isHardcorePyramid = false;
    initPyramid();
};

document.getElementById('btn-pyramid-hardcore').onclick = () => {
    document.getElementById('modal-pyramid-win').classList.add('hidden');
    isHardcorePyramid = true;
    initPyramid();
};

function updatePyramidTurn() {
    if (players.length > 0) {
        let playerName = players[currentPyramidPlayerIndex].name;
        document.getElementById('pyramid-turn-indicator').textContent = `Turno de ${playerName}`;
    }
}
