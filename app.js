const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
    user: 'cristofer',
    password: '2k20Cris1a2s3d4f',
    server: 'negocio.database.windows.net',
    database: 'Negocio',
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Asegúrate de que 'index.html' esté en la misma carpeta que app.js
});

// Conexión a la base de datos
sql.connect(config).then(pool => {
    console.log('Conectado a la base de datos');

    // Ruta para obtener todos los productos
    app.get('/api/productos', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM productos');
            res.json(result.recordset);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            res.status(500).send('Error al obtener productos');
        }
    });

    // Ruta para crear un nuevo producto
    app.post('/api/productos', async (req, res) => {
        const { nombre, precio, stock, categoria } = req.body;
        try {
            await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('precio', sql.Decimal(10, 2), precio)
                .input('stock', sql.Int, stock)
                .input('categoria', sql.NVarChar, categoria)
                .query('INSERT INTO productos (nombre, precio, stock, categoria) VALUES (@nombre, @precio, @stock, @categoria)');
            res.status(201).send('Producto creado');
        } catch (error) {
            console.error('Error al crear producto:', error);
            res.status(500).send('Error al crear producto');
        }
    });

    // Ruta para actualizar un producto
    app.put('/api/productos/:id', async (req, res) => {
        const { id } = req.params;
        const { nombre, precio, stock, categoria } = req.body;
        try {
            await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.NVarChar, nombre)
                .input('precio', sql.Decimal(10, 2), precio)
                .input('stock', sql.Int, stock)
                .input('categoria', sql.NVarChar, categoria)
                .query('UPDATE productos SET nombre = @nombre, precio = @precio, stock = @stock, categoria = @categoria WHERE id_producto = @id');
            res.send('Producto actualizado');
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            res.status(500).send('Error al actualizar producto');
        }
    });

    // Ruta para eliminar un producto
    app.delete('/api/productos/:id', async (req, res) => {
        const idProducto = req.params.id;
        const transaction = new sql.Transaction(pool);
    
        try {
            await transaction.begin();
    
            // Eliminar registros de detalle_ventas
            await transaction.request()
                .input('id_producto', sql.Int, idProducto)
                .query('DELETE FROM detalle_ventas WHERE id_producto = @id_producto');
    
            // Eliminar el producto
            await transaction.request()
                .input('id_producto', sql.Int, idProducto)
                .query('DELETE FROM productos WHERE id_producto = @id_producto');
    
            await transaction.commit();
            res.status(200).json({ message: 'Producto eliminado exitosamente' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error al eliminar producto:', error);
            res.status(500).json({ message: 'Error al eliminar producto' });
        }
    });
    

    // Rutas para ventas

// Ruta para obtener todas las ventas
app.get('/api/ventas', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM ventas');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).send('Error al obtener ventas');
    }
});

// Ruta para crear una nueva venta
app.post('/api/ventas', async (req, res) => {
    const { id_cliente, total } = req.body;
    try {
        const result = await pool.request()
            .input('id_cliente', sql.Int, id_cliente)
            .input('total', sql.Decimal(10, 2), total)
            .query('INSERT INTO ventas (id_cliente, total) VALUES (@id_cliente, @total); SELECT SCOPE_IDENTITY() AS id_venta');

        const id_venta = result.recordset[0].id_venta;
        res.status(201).json({ id_venta });
    } catch (error) {
        console.error('Error al crear venta:', error);  
        res.status(500).send('Error al crear venta');
    }
});

// Ruta para agregar un detalle de venta
app.post('/api/detalle_ventas', async (req, res) => {
    const { id_venta, id_producto, cantidad, precio_unitario } = req.body;
    try {
        await pool.request()
            .input('id_venta', sql.Int, id_venta)
            .input('id_producto', sql.Int, id_producto)
            .input('cantidad', sql.Int, cantidad)
            .input('precio_unitario', sql.Decimal(10, 2), precio_unitario)
            .query('INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario) VALUES (@id_venta, @id_producto, @cantidad, @precio_unitario)');
        res.status(201).send('Detalle de venta agregado');
    } catch (error) {
        console.error('Error al agregar detalle de venta:', error);
        res.status(500).send('Error al agregar detalle de venta');
    }
});

// Ruta para obtener los detalles de una venta
app.get('/api/detalle_ventas/:id_venta', async (req, res) => {
    const { id_venta } = req.params;
    try {
        const result = await pool.request()
            .input('id_venta', sql.Int, id_venta)
            .query('SELECT dv.*, p.nombre FROM detalle_ventas dv JOIN productos p ON dv.id_producto = p.id_producto WHERE dv.id_venta = @id_venta');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener detalles de la venta:', error);
        res.status(500).send('Error al obtener detalles de la venta');
    }
});



    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Error al conectar a la base de datos:', err);
});
