const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  enGrupo: { type: Boolean, default: false }
});

module.exports = mongoose.model('Alumno', alumnoSchema);