const express = require('express');
const router = express.Router();
const Grupo = require('../models/Grupo');
const Alumno = require('../models/Alumno');

const ExcelJS = require('exceljs');

// Crear un grupo
// POST /api/grupos/crear
router.post('/crear', async (req, res) => {
  const { dni, invitados } = req.body;

  try {
    // Buscar al líder
    const lider = await Alumno.findOne({ dni });
    if (!lider) return res.status(404).json({ message: 'Líder no encontrado.' });

    // Validar que el líder no lidere o pertenezca a otro grupo
    const liderGrupo = await Grupo.findOne({ "lider.dni": dni });
    if (liderGrupo) return res.status(400).json({ message: 'Ya lideras un grupo.' });

    const integrantesGrupo = await Grupo.findOne({ "alumnos.dni": dni });
    if (integrantesGrupo) return res.status(400).json({ message: 'Ya perteneces a un grupo.' });

    // Buscar la información de los invitados
    const invitadosInfo = await Alumno.find({ dni: { $in: invitados } });

    // Crear el grupo
    const nuevoGrupo = new Grupo({
      lider: { dni: lider.dni, nombre: lider.nombre, confirmado: true }, // Líder confirmado
      alumnos: [
        { dni: lider.dni, nombre: lider.nombre, confirmado: true }, // También confirmado en alumnos
        ...invitadosInfo.map(inv => ({
          dni: inv.dni,
          nombre: inv.nombre,
          confirmado: false, // Los invitados no están confirmados inicialmente
        }))
      ],
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

// Ruta para verificar si el alumno es líder
router.get('/verificar-lider/:dni', async (req, res) => {
  const { dni } = req.params;

  try {
    const liderGrupo = await Grupo.findOne({ "lider.dni": dni });
    if (liderGrupo) {
      return res.status(200).json({ lidera: true });
    }

    res.status(200).json({ lidera: false });
  } catch (error) {
    console.error('Error al verificar si es líder:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});


// Obtener invitaciones para un alumno
router.get('/invitaciones/:dni', async (req, res) => {
  const { dni } = req.params;

  try {
    const liderGrupo = await Grupo.findOne({ "lider.dni": dni });
    if (liderGrupo) {
      return res.status(403).json({ message: "No puedes ver invitaciones porque ya lideras un grupo." });
    }

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

      // Verificar si hay suficientes confirmados para marcar el grupo como completo
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

    // Actualizar el estado del alumno en la colección de alumnos
    const alumno = await Alumno.findOne({ dni });
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado.' });
    }

    if (aceptar) {
      alumno.enGrupo = true;
      alumno.grupoId = grupo._id; // Asociar el grupo al alumno
    } else {
      alumno.enGrupo = false;
      alumno.grupoId = null; // Eliminar la asociación si rechaza
    }

    await alumno.save();
    await grupo.save();

    // Devolver el estado actualizado del grupo
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

router.get('/excel-sheet', async (req, res) => {
  try {
    // Obtener los datos de los grupos desde la base de datos
    const grupos = await Grupo.find();

    // Crear un nuevo libro de trabajo
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Grupos');

    // Configurar el ancho de las columnas
    worksheet.columns = [
      { key: 'grupo', width: 15 }, // Ancho para la columna de "Grupo"
      { key: 'nombre', width: 35 }, // Ancho para la columna de "Nombre"
      { key: 'dni', width: 15 },    // Ancho para la columna de "DNI"
    ];

    // Recorrer cada grupo y agregar sus datos
    grupos.forEach((grupo, index) => {
      // Agregar encabezado del grupo y las columnas "Nombre" y "DNI"
      worksheet.addRow([`Grupo ${index + 1}`, 'Nombre', 'DNI']);

      // Agregar los alumnos del grupo
      grupo.alumnos.forEach(alumno => {
        worksheet.addRow([null, alumno.nombre, alumno.dni]); // Primera columna vacía para alineación
      });

      // Agregar una fila vacía para separar grupos
      worksheet.addRow([]);
    });

    // Configurar la respuesta como archivo Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=grupos.xlsx'
    );

    // Enviar el archivo Excel al cliente
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar el archivo Excel:', error);
    res.status(500).send('Error al generar el archivo Excel');
  }
});


module.exports = router;