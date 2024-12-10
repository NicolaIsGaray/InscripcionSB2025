const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Cargar configuración de .env
dotenv.config();

const app = express();

// Esquema de la fecha límite
const fechaSchema = new mongoose.Schema({
  fechaLimite: Date,
});

const Fecha = mongoose.model("Fecha", fechaSchema);

// Ruta para obtener la fecha límite
app.get("/fecha-limite", async (req, res) => {
  let fecha = await Fecha.findOne();
  if (!fecha) {
    // Si no hay fecha, crea una nueva con 7 días de límite
    const ahora = new Date();
    fecha = new Fecha({ fechaLimite: new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000) });
    await fecha.save();
  }
  res.json({ fechaLimite: fecha.fechaLimite });
});

// Ruta para resetear la fecha límite (opcional)
app.post("/reset-fecha", async (req, res) => {
  const ahora = new Date();
  const nuevaFecha = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fecha = await Fecha.findOneAndUpdate({}, { fechaLimite: nuevaFecha }, { upsert: true, new: true });
  res.json({ nuevaFecha: fecha.fechaLimite });
});

app.use(express.static('public'));

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/alumnos', require('./routes/alumno'));
app.use('/api/grupos', require('./routes/grupo'));

const connectDB = async () => {
  const MONGOUSR = process.env.MONGO_USR;
  const MONGOPSW = process.env.MONGO_PSWR;
  const PORT = process.env.PORT || 3000;
    try {
      await mongoose.connect(`mongodb+srv://${MONGOUSR}:${MONGOPSW}@basedata.nv8hc.mongodb.net/?retryWrites=true&w=majority&appName=BaseData`);
        app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
};

// Conectar a la base de datos
connectDB();