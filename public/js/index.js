const contactAlert = document.getElementById('contact-link');

contactAlert.addEventListener('click', (e) => {
  e.preventDefault();

  Swal.fire({
    title: "Contacto",
    html: `
      <h2>Equipo de Gestión</h2>
      <ul id="gestionUl">
        <li><strong>Directora:</strong> Massoni, Paula</li>
        <li><strong>Vicedirectora:</strong> Juárez, Silvana</li>
        <li><strong>Regente:</strong> Maíz, Bibiana</li>
        <li><strong>Secretario:</strong> Diaz, Franco</li>
        <li><strong>Jefe de preceptor:</strong> Bariña, Betiana</li>
        <li id="subLi"><strong>Servicio de Orientación</strong> <ul> 
        <li>Damín, Ivana</li>
        <li>Gil, Maria José</li>
        <li>Nazaretto, Carla</li>
        <li>Miralles, Ximena</li>
        <li>Real, Soledad</li>
        </ul></li>
      </ul>
      <div class="dir-cor-tel">
        <h4>Dirección</h4>
        <a href="https://maps.app.goo.gl/HPCrYZ8qd7d7UNQA8" target="_blank">French 870, Gral. San Martín, Mendoza</a>
        <h4>Correo</h4>
        <span>dge4084@mendoza.edu.ar</span>
        <h4>Teléfono</h4>
        <span>0263-4427395</span>
      </div>
    `,
    icon: "info",
    showCancelButton: false,
    showConfirmButton: true,
  });
});

// Función para renderizar todos los grupos
async function renderizarTodosLosGrupos() {
  try {
    const response = await axios.get("/api/grupos"); // Obtener todos los grupos
    const grupos = response.data;

    // Renderizar cada grupo individualmente
    grupos.forEach((grupo) => {
      renderizarGrupo(grupo); // Pasar directamente el objeto del grupo
    });
  } catch (error) {
    console.error("Error al obtener todos los grupos:", error);
    Swal.fire("Error", "No se pudo cargar la lista de grupos.", "error");
  }
}

// Información de los miembros del grupo
let contadorGrupos = 1;
// Función para renderizar un solo grupo (recibe el objeto del grupo directamente)
function renderizarGrupo(grupo) {
  if (!grupo) return;

  const contenedor = document.getElementById("contenedor-grupos");
  const cuadro = document.createElement("div");
  cuadro.className = "grupo-cuadro";

  const alumnosInfo = `
    <h4>Grupo ${contadorGrupos++}</h4>
    <ul>
      ${grupo.alumnos
        .map(
          (alumno) => `
        <li>
          ${alumno.nombre || "Sin nombre"} 
          (${alumno.confirmado ? "Confirmado" : "Pendiente"})
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  // Insertar la información en el cuadro
  cuadro.innerHTML = `
    <div>
      ${alumnosInfo}
    </div>
  `;

  // Añadir el cuadro al contenedor
  contenedor.appendChild(cuadro);
}
// Llamar a la función para renderizar todos los grupos al cargar la página
renderizarTodosLosGrupos();

// Función para inicializar el contador con una fecha límite fija
function inicializarContador() {
  // Intenta obtener la fecha límite del almacenamiento local
  let fechaLimite = localStorage.getItem("fechaLimite");

  // Si no hay fecha límite almacenada, la establece como 7 días desde ahora
  if (!fechaLimite) {
    const ahora = new Date(); // Fecha actual
    fechaLimite = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000); // Fecha actual + 7 días
    localStorage.setItem("fechaLimite", fechaLimite); // Guardar en localStorage
  } else {
    fechaLimite = new Date(fechaLimite); // Convierte el valor de string a una fecha
  }

  return fechaLimite;
}

// Función para actualizar el contador en pantalla
function actualizarContador(fechaLimite) {
  const ahora = new Date(); // Fecha actual
  const tiempoRestante = fechaLimite - ahora; // Tiempo restante en milisegundos

  // Si el contador terminó
  if (tiempoRestante <= 0) {
    document.getElementById("tiempo-restante").innerText = "¡La página ha cerrado!";
    clearInterval(intervalo); // Detiene el contador
    return;
  }

  // Calcula días, horas, minutos y segundos
  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
  const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

  // Actualiza el contador en el HTML
  document.getElementById("tiempo-restante").innerText =
    `${dias} días, ${horas} horas, ${minutos} minutos, ${segundos} segundos`;
}

// Inicializa el contador con la fecha límite persistente
const fechaLimite = inicializarContador();

// Llama a la función de actualización cada segundo
const intervalo = setInterval(() => actualizarContador(fechaLimite), 1000);

// Llama una vez inmediatamente para mostrar el contador
actualizarContador(fechaLimite);
