const express = require('express');
const router = express.Router();

const { 
  renderOficiosForm, 
  crearOficio, 
  verOficio,
  renderAdminOficios,
  renderEditarOficioForm, 
  actualizarOficio      
} = require('../controllers/oficiosController');

// Importamos AMBOS middlewares de protección
const { protegerRuta, protegerAdmin } = require('../middleware/authMiddleware'); 
const noCache = require('../middleware/cacheMiddleware'); // Middleware anticache

// Ruta para mostrar el formulario principal de oficios
router.get('/oficios', noCache, protegerRuta, renderOficiosForm);

// Ruta para crear un nuevo oficio
router.post('/guardar-oficio', noCache, protegerRuta, crearOficio);

// Ruta para ver un oficio específico por ID
router.get('/oficio/:id', noCache, protegerRuta, verOficio);

// Ruta para que el admin vea TODOS los oficios
router.get('/admin/oficios', noCache, protegerAdmin, renderAdminOficios);

// MUESTRA el formulario para editar un oficio
router.get('/oficio/editar/:id', noCache, protegerAdmin, renderEditarOficioForm);

// RECIBE los datos del formulario y actualiza la BD
router.post('/oficio/editar/:id', noCache, protegerAdmin, actualizarOficio);


module.exports = router;
