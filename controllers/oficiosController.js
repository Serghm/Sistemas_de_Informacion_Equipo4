const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

 
const renderOficiosForm = (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.redirect('/login');
        }
        const vista = path.join(__dirname, '../views/oficios.ejs');
        res.render('oficios', { usuario: req.session.usuario });

    } catch (error) {
        console.error('Error renderizando el formulario de oficios:', error);
        res.status(500).send('Error interno al cargar la página de oficios');
    }
};

//Crear un nuevo oficio en la base de datos
 
const crearOficio = async (req, res) => {
    const { destinatario, departamento, asunto, fecha } = req.body;
    try {
        // PG: La consulta MAX es igual
        const resultMax = await db.query('SELECT MAX(consecutivo) as max_consecutivo FROM oficios');
        const nuevoConsecutivo = (resultMax.rows[0].max_consecutivo || 0) + 1;
        
        const datosParaHash = `${nuevoConsecutivo}${destinatario}${fecha}${Date.now()}`;
        const folio = crypto.createHash('sha256').update(datosParaHash).digest('hex');

        const query = `
            INSERT INTO oficios (consecutivo, destinatario, departamento, asunto, fecha, folio)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `; 
        
        const values = [nuevoConsecutivo, destinatario, departamento, asunto, fecha, folio];

        
        const result = await db.query(query, values);
        return res.redirect(`/oficio/${result.rows[0].id}`); 

    } catch (error) {
        console.error('Error al guardar el oficio:', error);
        return res.status(500).send('Error interno al guardar el oficio.');
    }
};


// Ver un oficio específico por ID

const verOficio = async (req, res) => {
    const idOficio = req.params.id;
    try {
        const query = `
            SELECT id, consecutivo, destinatario, departamento, asunto, fecha, folio
            FROM oficios WHERE id = $1
        `; 
        
        const result = await db.query(query, [idOficio]);

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).send('Oficio no encontrado');
        }

        return res.render('verOficio', { 
            oficio: result.rows[0], 
            usuario: req.session.usuario
        });

    } catch (error) {
        console.error('Error al buscar el oficio:', error);
        return res.status(500).send('Error interno al buscar el oficio.');
    }
};


 //Muestra el panel de administracion con TODOS los oficios.

const renderAdminOficios = async (req, res) => {
    try {
        const busqueda = req.query.busqueda || "";

        let query;
        let params = []; 

        if (busqueda.trim() !== '') {
            const terminoLike = `%${busqueda.trim()}%`;
            
            query = `
                SELECT id, consecutivo, destinatario, asunto, fecha , departamento
                FROM oficios 
                WHERE 
                    CAST(consecutivo AS TEXT) ILIKE $1 OR 
                    destinatario ILIKE $2 OR 
                    asunto ILIKE $3 OR 
                    departamento ILIKE $4 OR 
                    folio ILIKE $5
                ORDER BY consecutivo DESC
            `;
            
            params = [terminoLike, terminoLike, terminoLike, terminoLike, terminoLike];
        
        } else {
            query = `
                SELECT id, consecutivo, destinatario, asunto, fecha, departamento 
                FROM oficios 
                ORDER BY consecutivo DESC
            `;
        }

        const result = await db.query(query, params);
        
        res.render('adminOficios', { 
            oficios: result.rows, // PG: .rows
            usuario: req.session.usuario,
            busqueda: busqueda 
        });

    } catch (error) {
        console.error('Error al obtener la lista de oficios:', error);
        res.status(500).send('Error al cargar el panel de oficios.');
    }
};



 // Muestra el formulario para editar un oficio (Responde a GET /oficio/editar/:id)

const renderEditarOficioForm = async (req, res) => {
    const idOficio = req.params.id;
    try {
        const query = `
            SELECT id, consecutivo, destinatario, departamento, asunto, fecha, folio
            FROM oficios WHERE id = $1
        `; 
        
        const result = await db.query(query, [idOficio]);

        if (!result.rows || result.rows.length === 0) {
            return res.status(404).send('Oficio no encontrado');
        }

        const oficio = result.rows[0];
        
        const fechaDB = new Date(oficio.fecha);
        const year = fechaDB.getUTCFullYear();
        const month = String(fechaDB.getUTCMonth() + 1).padStart(2, '0'); 
        const day = String(fechaDB.getUTCDate()).padStart(2, '0');
        oficio.fecha_formato = `${year}-${month}-${day}`;


        return res.render('editarOficio', { 
            oficio: oficio,
            usuario: req.session.usuario
        });

    } catch (error) {
        console.error('Error al buscar el oficio para editar:', error);
        return res.status(500).send('Error interno al buscar el oficio.');
    }
};


 //Actualiza el oficio en la base de datos(Responde a POST /oficio/editar/:id)
 
    const actualizarOficio = async (req, res) => {
    const idOficio = req.params.id;
    const { destinatario, departamento, asunto, fecha } = req.body;

    try {
        const query = `
            UPDATE oficios
            SET destinatario = $1, departamento = $2, asunto = $3, fecha = $4
            WHERE id = $5
        `; 
        const values = [destinatario, departamento, asunto, fecha, idOficio];

        await db.query(query, values);

        return res.redirect('/admin/oficios');

    } catch (error) {
        console.error('Error al actualizar el oficio:', error);
        return res.status(500).send('Error interno al actualizar el oficio.');
    }
};


module.exports = { 
    renderOficiosForm, 
    crearOficio, 
    verOficio,
    renderAdminOficios,
    renderEditarOficioForm, 
    actualizarOficio      
};