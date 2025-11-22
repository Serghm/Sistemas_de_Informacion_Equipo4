const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config(); 
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const oficiosRoutes = require('./routes/oficiosRoutes');

const app = express();


const port = process.env.PORT || 4000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para loguear las peticiones
app.use((req, res, next) => {
    console.log('*** PETICIÓN RECIBIDA:', req.method, req.path);
    next();
});

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas principales
app.use('/', authRoutes);
app.use('/', oficiosRoutes);

// Ruta raíz: redirige a /login o al formulario de oficios si hay sesión
app.get('/', (req, res) => {
    if (req.session.usuario) {
        res.redirect('/oficios'); // Redirige a la ruta principal de oficios
    } else {
        res.redirect('/login'); // Redirige al login si no hay sesión
    }
});

// Inicializa servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});