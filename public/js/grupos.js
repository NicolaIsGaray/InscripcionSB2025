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
    showConfirmButton: false,
  });
});

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

    // Hacer una solicitud al backend para verificar si el alumno ya lidera un grupo
    const response = await axios.get(`/api/grupos/verificar-lider/${dni}`);
    
    if (response.data.lidera) {
      // Si el alumno ya lidera un grupo, mostrar una advertencia
      Swal.fire({
        icon: "warning",
        title: "Ya lideras un grupo.",
        text: 'No puedes crear otro grupo. Espera a que tus compañeros acepten entrar.',
      });
      return;  // Detener la ejecución para que no se permita crear otro grupo
    }

    // Si el alumno no lidera un grupo, continuar con la lógica de creación de grupo
    const alumnosResponse = await axios.get('/api/alumnos/alumnosAll');
    const alumnos = alumnosResponse.data;

    const alumno = alumnos.find(alumno => alumno.dni === dni);
    
    if (alumno) {
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
  } catch (error) {
    console.error('Error al cargar la verificación:', error);
  }
});

async function gestionarInvitacion(dni, invitacion) {
  const result = await Swal.fire({
    title: "Tienes una invitación.",
    html: `
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
    const aceptar = result.isConfirmed; // Si el usuario acepta la invitación
    const response = await axios.post('/api/grupos/invitaciones/gestionar', {
      dni,
      grupoId: invitacion.grupoId,
      aceptar, // Enviar si el usuario acepta o no
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
    // Verificar si el alumno ya lidera un grupo
    const liderResponse = await axios.get(`/api/grupos/verificar-lider/${dni}`);
    if (liderResponse.data.lidera) {
      Swal.fire({
        icon: "warning",
        title: "Ya lideras un grupo.",
        text: "No puedes ver invitaciones porque ya has creado un grupo.",
      });
      return;  // Bloquea el acceso si ya lidera un grupo
    }

    // Si no es líder, obtener las invitaciones del backend
    const response = await axios.get(`/api/grupos/invitaciones/${dni}`);
    const invitaciones = response.data.invitaciones;

    // Iterar sobre las invitaciones y gestionar cada una
    for (const invitacion of invitaciones) {
      await gestionarInvitacion(dni, invitacion);
    }
  } catch (error) {
    console.error("Error al cargar las invitaciones:", error.response?.data || error.message);
    Swal.fire("No hay invitaciones", "Todavía no estás invitado/a a ningún grupo.", "info");
  }
});


async function cargarInvitaciones() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const dni = urlParams.get('dni');

    // Verificar si el alumno ya lidera un grupo
    const response = await axios.get(`/api/grupos/verificar-lider/${dni}`);
    if (response.data.lidera) {
      Swal.fire({
        icon: "warning",
        title: "No puedes ver invitaciones.",
        text: 'Ya lideras un grupo, por lo que no puedes gestionar invitaciones.',
      });
      // Redirigir o bloquear acceso a la sección de invitaciones
      window.location.href = "../index.html";  // Redirigir al index o a donde sea necesario
      return;
    }

    // Si no lidera un grupo, continuar con la carga de invitaciones
    const invitacionesResponse = await axios.get('/api/grupos/invitaciones', { params: { dni } });
    // Mostrar las invitaciones en el frontend
    cargarInvitaciones(invitacionesResponse.data);
  } catch (error) {
    console.error('Error al cargar invitaciones:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar invitaciones',
      text: error.response?.data?.message || 'Hubo un problema al obtener tus invitaciones.',
    });
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
    // Confirmar creación del grupo
    const result = await Swal.fire({
      title: "Confirmar creación de grupo",
      text: "¿Estás seguro de que deseas crear este grupo?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, crear grupo",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
    });

    // Si el usuario cancela, no hacemos nada
    if (!result.isConfirmed) {
      Swal.fire("Cancelado", "No se creó el grupo.", "info");
      return;
    }

    // Crear el grupo si el usuario confirma
    const response = await axios.post('/api/grupos/crear', { 
      dni: dni,
      invitados: [companero1, companero2],
      confirmado: true, // Enviamos el estado confirmado al backend
    });

    Swal.fire({
      icon: 'success',
      title: 'Grupo creado con éxito',
      text: `¡Gran elección!`,
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
