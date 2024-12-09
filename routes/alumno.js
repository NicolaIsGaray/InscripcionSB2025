const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');
const Grupo = require('../models/Grupo');

// Ruta para obtener todos los alumnos
router.get('/alumnosAll', async (req, res) => {
  try {
    // Buscar todos los alumnos en la base de datos
    const alumnos = await Alumno.find();

    // Si no hay alumnos, devolver un mensaje
    if (alumnos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron alumnos.' });
    }

    // Devolver los datos de los alumnos (DNI, nombre y si está en un grupo)
    const alumnosResponse = alumnos.map(alumno => ({
      dni: alumno.dni,
      nombre: alumno.nombre,
      enGrupo: alumno.enGrupo // Convertir a booleano
    }));

    res.status(200).json(alumnosResponse);
  } catch (error) {
    console.error('Error al obtener los alumnos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Endpoint para encontrar un alumno
router.get('/find/:dni', async (req, res) => {
  const { dni } = req.params;

  try {
    // Buscar al alumno por su DNI
    const alumno = await Alumno.findOne({ dni });

    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    // Devolver los datos del alumno
    res.json(alumno);
  } catch (error) {
    console.error('Error al buscar al alumno:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Ruta para crear un nuevo alumno
router.post('/registrar', async (req, res) => {
  const { nombre, dni } = req.body;

  try {
    // Verificar si el alumno ya existe
    const alumnoExistente = await Alumno.findOne({ dni });
    if (alumnoExistente) {
      return res.status(400).json({ message: 'El alumno ya existe.' });
    }

    // Crear un nuevo alumno
    const nuevoAlumno = new Alumno({ nombre, dni });
    await nuevoAlumno.save();

    res.status(201).json(nuevoAlumno);
  } catch (error) {
    console.error('Error al crear el alumno:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});
  
  router.get('/en-grupo', async (req, res) => {
    try {
      // Obtener todos los grupos
      const grupos = await Grupo.find();
  
      // Extraer todos los DNIs de los integrantes
      const alumnosEnGrupos = grupos.flatMap(grupo => grupo.integrantes);
  
      res.status(200).json({ alumnosEnGrupos });
    } catch (error) {
      console.error('Error al obtener los alumnos en grupos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
module.exports = router;