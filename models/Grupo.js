const mongoose = require('mongoose');

// const GrupoSchema = new mongoose.Schema({
//   integrantes: [
//     {
//       type: String, // DNI de los alumnos
//       required: true,
//     },
//   ],
//   invitaciones: [
//     {
//       type: String, // DNI de los alumnos invitados
//     },
//   ],
//   completo: {
//     type: Boolean,
//     default: false, // Grupo completo cuando tenga 3 integrantes
//   },
// });

const grupoSchema = new mongoose.Schema({
  lider: {
    dni: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    confirmado: {
      type: Boolean,
      default: false,
    }
  },
  alumnos: [{
    dni: {
      type: String,
      required: true,
    },
    nombre: String,
    confirmado: { type: Boolean, default: false }
    ,
  }],
});

// Middleware para actualizar `completo` antes de guardar
grupoSchema.pre('save', function (next) {
  this.completo = this.alumnos.length === 3;
  next();
});

module.exports = mongoose.model('Grupo', grupoSchema);
