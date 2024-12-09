document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dni = urlParams.get('dni');

  const dniForm = document.querySelector('.access-container');
  const formularioSiguiente = document.querySelector('.manage-container');
  const info = document.querySelector('.infoAlumno');

  if (dni) {
    dniForm.style.display = 'none';
    formularioSiguiente.style.display = 'flex';
    checkAlumno(dni, info);
  }

  const dniCheck = async () => {
    let response = await axios.get("./api/alumnos/alumnosAll");
    const dniCheckResult = response.data;
    return dniCheckResult;
  }

  const dniCheckings = await dniCheck();

  dniForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const inputDni = document.getElementById('dni').value;
    if (inputDni) {
      dniCheckings.forEach(dniChecking => {
        if (inputDni === dniChecking.dni) {
          window.location.href = `${window.location.pathname}?dni=${encodeURIComponent(inputDni)}`;
        } else {
          Swal.fire({
            icon: "error",
            title: "DNI no encontrado",
            text: 'Porfavor, revisa que ingresaste bien tu  DNI.',
          });
        }
      });
    }
  });

  await cargarAlumnos();
  await obtenerAlumnosEnGrupos();
});

async function checkAlumno(dni, info) {
  try {
    const response = await axios.get(`/api/alumnos/find/${dni}`);
    const alumno = response.data;
    info.innerText = `Alumno/a: ${alumno.nombre}`;
    info.style.color = "white";
  } catch (error) {
    console.error('Error al obtener el alumno:', error);
    info.innerText = error.response && error.response.status === 404 
      ? 'Error: No se encontró el alumno.' 
      : 'Error: Algo salió mal.';
  }
}

const crearGrupoBtn = document.getElementById('crearGrupo');
const verInvitacionesBtn = document.getElementById('verInvitaciones');
const accionesContainer = document.querySelector('.manage-container');
const addGroupContainer = document.querySelector('.addgroup-container');

crearGrupoBtn.addEventListener('click', async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const dni = urlParams.get('dni');

    const response = await axios.get('/api/alumnos/alumnosAll');
    const alumnos = response.data;

    alumnos.forEach(alumno => {
      if (alumno.dni === dni) {
        if (alumno.enGrupo) {
          Swal.fire({
            icon: "warning",
            title: "Ya estás inscrito/a en un grupo.",
            text: 'Ve a "Ver Invitaciones" para aceptarlo o rechazarlo.',
          });
          return;
        } else {
          accionesContainer.style.display = "none";
          addGroupContainer.style.display = "flex";
        }
      }
    });
  } catch (error) {
    console.error('Error al cargar la verificación:', error);
  }
});

verInvitacionesBtn.addEventListener('click', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dni = urlParams.get('dni');

  if (!dni) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "No se proporcionó un DNI válido.",
    });
    return;
  }

  try {
    // Obtener las invitaciones del backend
    const response = await axios.get(`/api/grupos/invitaciones/${dni}`);
    const invitaciones = response.data.invitaciones;

    // Iterar sobre las invitaciones y gestionar cada una
    for (const invitacion of invitaciones) {
      await gestionarInvitacion(dni, invitacion);
    }
  } catch (error) {
    console.error("Error al cargar las invitaciones:", error.response?.data || error.message);
    Swal.fire("No hay invitaciones", "Todavia no estás invitado/a a ningún grupo.", "info");
  }
});

async function gestionarInvitacion(dni, invitacion) {
  const result = await Swal.fire({
    title: "Tienes una invitación.",
    html: `
      <p><strong>Grupo ID:</strong> ${invitacion.grupoId}</p>
      <p><strong>Líder:</strong> ${invitacion.lider.nombre}</p>
      <p><strong>Miembros:</strong></p>
      <ul>
        ${invitacion.alumnos.map(alumno => `<li>${alumno.nombre}</li>`).join('')}
      </ul>
    `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Unirse",
    cancelButtonText: "Rechazar",
    allowOutsideClick: false
  });

  try {
    const aceptar = result.isConfirmed;
    const response = await axios.post('/api/grupos/invitaciones/gestionar', {
      dni,
      grupoId: invitacion.grupoId,
      aceptar,
    });

    Swal.fire(
      aceptar ? "¡Unido!" : "Rechazado",
      aceptar ? "Te has unido al grupo." : "No te uniste al grupo.",
      aceptar ? "success" : "info"
    ).then(() => {
      // Redirige después de que el usuario haga clic en "Ok"
      window.location.href = "../index.html";
    });
    
  } catch (error) {
    console.error("Error al gestionar invitación:", error.response?.data || error.message);
    Swal.fire("Error", "No se pudo gestionar la invitación.", "error");
  }
}



async function obtenerAlumnosEnGrupos() {
  try {
    const response = await axios.get('/api/alumnos/en-grupo');
    const alumnosEnGrupos = response.data.alumnosEnGrupos;
    inhabilitarOpciones(alumnosEnGrupos);
  } catch (error) {
    console.error('Error al obtener alumnos en grupos:', error.response?.data || error.message);
  }
}

const cargarAlumnos = async () => {
  try {
    const response = await axios.get('/api/alumnos/alumnosAll');
    const alumnos = response.data;
    
    const selectCompanero1 = document.getElementById('compañero1');
    const selectCompanero2 = document.getElementById('compañero2');

    // Limpiar opciones existentes
    selectCompanero1.innerHTML = '<option value="" disabled selected>Selecciona un compañero</option>';
    selectCompanero2.innerHTML = '<option value="" disabled selected>Selecciona un compañero</option>';

    alumnos.forEach(alumno => {
      const option1 = document.createElement('option');
      const option2 = document.createElement('option');

      option1.value = option2.value = alumno.dni;
      option1.textContent = option2.textContent = `${alumno.nombre}`;

      if (alumno.enGrupo) {
        console.log(alumno);
        
        option1.disabled = true;
        option2.disabled = true;
        option1.textContent += ' - En grupo';
        option2.textContent += ' - En grupo';
      }

      selectCompanero1.appendChild(option1);
      selectCompanero2.appendChild(option2);
    });
  } catch (error) {
    console.error('Error al cargar alumnos:', error);
  }
};

// Asegúrate de llamar a esta función cuando se carga la página
document.addEventListener('DOMContentLoaded', cargarAlumnos);

function inhabilitarOpciones(alumnosEnGrupos) {
  const opciones = document.querySelectorAll('option');
  const urlParams = new URLSearchParams(window.location.search);
  const dni = urlParams.get('dni');

  opciones.forEach(opcion => {
    if (alumnosEnGrupos.includes(opcion.value) || opcion.value === dni) {
      opcion.disabled = true;
    }
  });
}

const formGroup = document.getElementById('grupoForm');
formGroup.addEventListener('submit', async (e) => {
  e.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const dni = urlParams.get('dni');
  const companero1 = document.getElementById('compañero1').value;
  const companero2 = document.getElementById('compañero2').value;

  if (companero1 === companero2) {
    alert('Los compañeros deben ser distintos');
    return;
  }

  if (!dni || !companero1 || !companero2) {
    alert('Por favor ingresa tu DNI y selecciona dos compañeros.');
    return;
  }

  try {
    const response = await axios.post('/api/grupos/crear', { 
      dni: dni,
      invitados: [companero1, companero2]
    });

    console.log('Grupo creado:', response.data);
    Swal.fire({
      icon: 'success',
      title: 'Grupo creado con éxito',
      text: `ID del grupo: ${response.data.grupoId}`,
    });
  } catch (error) {
    console.error('Error al crear el grupo:', error.response?.data || error.message);
    Swal.fire({
      icon: 'error',
      title: 'Error al crear el grupo',
      text: error.response?.data?.message || 'No se pudo crear el grupo.',
    });
  }
});