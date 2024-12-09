const express = require('express');
const router = express.Router();
const Grupo = require('../models/Grupo');
const Alumno = require('../models/Alumno');

// Crear un grupo
// POST /api/grupos/crear
// POST /api/grupos/crear
router.post('/crear', async (req, res) => {
  const { dni, invitados } = req.body;

  try {
    const lider = await Alumno.findOne({ dni });
    if (!lider) return res.status(404).json({ message: 'Líder no encontrado.' });

    const liderGrupo = await Grupo.findOne({ "lider.dni": dni });
    if (liderGrupo) return res.status(400).json({ message: 'Ya lideras un grupo.' });

    const integrantesGrupo = await Grupo.findOne({ "alumnos.dni": dni });
    if (integrantesGrupo) return res.status(400).json({ message: 'Ya perteneces a un grupo.' });

    const invitadosInfo = await Alumno.find({ dni: { $in: invitados } });

    const nuevoGrupo = new Grupo({
      lider: { dni: lider.dni, nombre: lider.nombre },
      alumnos: [lider, ...invitadosInfo],
    });

    await nuevoGrupo.save();

    // Actualizar los alumnos como pertenecientes a un grupo
    await Alumno.updateMany(
      { dni: { $in: [lider.dni, ...invitados] } },
      { enGrupo: true }
    );

    res.status(201).json({ message: 'Grupo creado con éxito', grupoId: nuevoGrupo._id });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});



// Obtener invitaciones para un alumno
router.get('/invitaciones/:dni', async (req, res) => {
  const { dni } = req.params;

  try {
    // Buscar grupos donde el alumno está invitado pero aún no ha aceptado
    const grupos = await Grupo.find({
      alumnos: { $elemMatch: { dni } } // Buscar en el array de alumnos por DNI
    });

    if (!grupos.length) {
      return res.status(404).json({ 
        message: 'No tienes invitaciones pendientes.', 
        grupos: [] 
      });
    }

    // Formatear los grupos para que la respuesta sea más clara
    const invitaciones = grupos.map(grupo => ({
      grupoId: grupo._id,
      lider: grupo.lider,
      alumnos: grupo.alumnos.map(alumno => ({
        dni: alumno.dni,
        nombre: alumno.nombre || 'Nombre no especificado'
      }))
    }));

    res.status(200).json({ invitaciones });
  } catch (error) {
    console.error('Error al buscar invitaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// Aceptar o rechazar una invitación
router.post('/invitaciones/gestionar', async (req, res) => {
  const { dni, grupoId, aceptar } = req.body;

  try {
    // Buscar el grupo por ID
    const grupo = await Grupo.findById(grupoId);
    if (!grupo) {
      return res.status(404).json({ message: 'Grupo no encontrado.' });
    }

    // Verificar si el DNI está en la lista de alumnos invitados
    const invitacionIndex = grupo.alumnos.findIndex(alumno => alumno.dni === dni);
    if (invitacionIndex === -1) {
      return res.status(400).json({ message: 'No estás invitado a este grupo.' });
    }

    let mensaje = '';
    if (aceptar) {
      // Confirmar al alumno en el grupo
      grupo.alumnos[invitacionIndex].confirmado = true;

      // Marcar el grupo como completo si alcanza el límite de 3 integrantes confirmados
      const confirmados = grupo.alumnos.filter(alumno => alumno.confirmado).length;
      if (confirmados >= 3) {
        grupo.completo = true;
      }

      mensaje = 'Te uniste al grupo.';
    } else {
      // Rechazar la invitación eliminando al alumno de la lista
      grupo.alumnos.splice(invitacionIndex, 1);

      mensaje = 'Rechazaste la invitación.';
    }

    await grupo.save();

    // Devolver el estado del grupo y los cambios
    res.status(200).json({
      message: mensaje,
      grupo: {
        _id: grupo._id,
        lider: grupo.lider,
        alumnos: grupo.alumnos,
        completo: grupo.completo,
      },
    });
  } catch (error) {
    console.error('Error al gestionar invitación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});



// Eliminar un grupo
router.delete('/:grupoId', async (req, res) => {
  const { grupoId } = req.params;

  try {
    const grupoEliminado = await Grupo.findByIdAndDelete(grupoId);

    if (!grupoEliminado) {
      return res.status(404).json({ message: 'Grupo no encontrado.' });
    }

    // Desasociar el grupo de los alumnos
    await Alumno.updateMany(
      { dni: { $in: grupoEliminado.alumnos.map(a => a.dni) } },
      { enGrupo: false }
    );

    res.status(200).json({ message: 'Grupo eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el grupo:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

router.get('/', async (req, res) => {
  const {grupoId} = req.params;

  try {
    const grupos = await Grupo.find(grupoId);
    res.status(200).json(grupos);
  } catch (error) {
    console.error('Error al obtener los grupos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


module.exports = router;