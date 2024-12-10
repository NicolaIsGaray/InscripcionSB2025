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