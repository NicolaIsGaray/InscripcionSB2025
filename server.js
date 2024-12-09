const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Cargar configuración de .env
dotenv.config();

const app = express();

app.use(express.static('public'));

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/alumnos', require('./routes/alumno'));
app.use('/api/grupos', require('./routes/grupo'));

const connectDB = async () => {
const PORT = process.env.PORT || 3000;
    try {
      await mongoose.connect(`mongodb+srv://nicogaray2713:JByAVMIMd4Oa4LDO@basedata.nv8hc.mongodb.net/?retryWrites=true&w=majority&appName=BaseData`);
        app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
};

// Conectar a la base de datos
connectDB();