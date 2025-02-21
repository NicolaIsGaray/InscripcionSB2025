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
// renderizarTodosLosGrupos();

// URL de la API
const API_URL = "/fecha-limite";

// Función para obtener la fecha límite desde el servidor
async function obtenerFechaLimite() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return new Date(data.fechaLimite); // Convierte la fecha a objeto Date
  } catch (error) {
    console.error("Error al obtener la fecha límite:", error);
    return null;
  }
}

// Función para actualizar el contador
function actualizarContador(fechaLimite) {
  const ahora = new Date(); // Fecha actual
  const tiempoRestante = fechaLimite - ahora; // Tiempo restante en milisegundos

  if (tiempoRestante <= 0) {
    document.getElementById("tiempo-restante").innerText = "¡La página ha cerrado!";
    clearInterval(intervalo); // Detiene el contador
    return;
  }

  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24));
  const horas = Math.floor((tiempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

  document.getElementById("tiempo-restante").innerText =
    `${dias} días, ${horas} horas, ${minutos} minutos, ${segundos} segundos`;
}

// Inicializar el contador
async function iniciarContador() {
  const fechaLimite = await obtenerFechaLimite();
  if (fechaLimite) {
    // Llama a la función de actualización cada segundo
    setInterval(() => actualizarContador(fechaLimite), 1000);
    actualizarContador(fechaLimite); // Llama una vez para mostrarlo inmediatamente
  } else {
    document.getElementById("tiempo-restante").innerText = "Error al cargar el contador.";
  }
}

// Inicia el contador al cargar la página
iniciarContador();
