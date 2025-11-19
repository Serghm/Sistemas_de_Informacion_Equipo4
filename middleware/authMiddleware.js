// Archivo: middleware/authMiddleware.js

const protegerRuta = (req, res, next) => {
  console.log('Middleware protegerRuta: Verificando sesión para la ruta:', req.path);

  if (req.session && req.session.usuario) {
    // ✅ Sesión válida
    return next();
  }

  // ⚠️ Sin sesión → redirige y detiene ejecución
  console.log('Middleware protegerRuta: No hay sesión. Redirigiendo a /login');
  return res.redirect('/login');
};

const protegerAdmin = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.redirect('/login');
  }

  if (req.session.usuario.rol !== 'admin') {
    return res
      .status(403)
      .send('Acceso denegado. Esta área es solo para administradores.');
  }

  next();
};

module.exports = { protegerRuta, protegerAdmin };
