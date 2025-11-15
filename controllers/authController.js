const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const crypto = require('crypto'); 



 
const renderUsersPanel = async (req, res) => {
    try {
        
        const result = await db.query('SELECT id, nombre_usuario, nombre_completo, rol FROM usuarios ORDER BY id');
        
        res.render('usuarios', { 
            usuarios: result.rows, 
            usuario: req.session.usuario, 
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).send('Error al cargar el panel de usuarios.');
    }
};

const renderLoginPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
};

const renderRegisterPage = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'registrer.html'));
};

const loginUser = async (req, res) => {
    const { nombre_usuario, contrasena } = req.body;
    try {
        
        const result = await db.query('SELECT * FROM usuarios WHERE nombre_usuario = $1', [nombre_usuario]);
        
       
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const usuario = result.rows[0];
        const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        req.session.usuario = { id: usuario.id, nombre_usuario: usuario.nombre_usuario, rol: usuario.rol };
        
        res.status(200).json({ message: 'Login exitoso', redirectUrl: '/' });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const registerUser = async (req, res) => {
    const { nombre_usuario, contrasena, nombre_completo, rol } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const rolValido = rol === 'admin' ? 'admin' : 'usuario';
        
        
        const query = 'INSERT INTO usuarios (nombre_usuario, contrasena, nombre_completo, rol) VALUES ($1, $2, $3, $4)';
        await db.query(query, [nombre_usuario, hashedPassword, nombre_completo, rolValido]);
        
        
        res.redirect('/usuarios');

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar.' });
    }
};

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('No se pudo cerrar la sesión.');
        }
        res.redirect('/login');
    });
};




const resetPasswordAdmin = async (req, res) => {
    const adminId = req.session.usuario.id;
    const userIdToReset = req.params.id;

    try {
        
        if (Number(adminId) === Number(userIdToReset)) {
            console.warn(`Admin (ID: ${adminId}) intentó auto-restablecer su contraseña.`);
            
            return res.redirect('/usuarios');
        }

        
        const tempPassword = crypto.randomBytes(4).toString('hex').match(/.{1,3}/g).join('-');

        
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

       
        const userResult = await db.query('SELECT nombre_usuario FROM usuarios WHERE id = $1', [userIdToReset]);
        if (userResult.rows.length === 0) {
            return res.status(404).send('Usuario a restablecer no encontrado.');
        }
        const userName = userResult.rows[0].nombre_usuario;

        
        await db.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2', [hashedPassword, userIdToReset]);

      
        const usuariosResult = await db.query('SELECT id, nombre_usuario, nombre_completo, rol FROM usuarios ORDER BY id');

        
        res.render('usuarios', {
            usuarios: usuariosResult.rows, 
            usuario: req.session.usuario,
            tempPasswordInfo: {
                pass: tempPassword,
                userName: userName
            }
        });

    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).send('Error interno al restablecer la contraseña.');
    }
};



module.exports = { 
    renderLoginPage, 
    renderRegisterPage, 
    loginUser, 
    registerUser, 
    logoutUser, 
    renderUsersPanel,
    resetPasswordAdmin 
};