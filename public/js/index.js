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
       <li>${alumno.nombre || "Sin nombre"}</li>
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
