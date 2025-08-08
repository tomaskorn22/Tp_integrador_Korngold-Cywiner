const pool = require('../models/DB.js'); // ajusta según tu archivo de conexión

// 1. GET /api/event - lista eventos con filtros y paginación
exports.getEvents = async (req, res) => {
  const { name, startdate, tag, page = 1, limit = 10 } = req.query;

  let filters = [];
  let values = [];
  let i = 1;

  if (name) {
    filters.push(`LOWER(e.name) LIKE LOWER($${i++})`);
    values.push(`%${name}%`);
  }

  if (startdate) {
    filters.push(`e.start_date::DATE = $${i++}`);
    values.push(startdate);
  }

  if (tag) {
    filters.push(`LOWER(t.name) LIKE LOWER($${i++})`);
    values.push(`%${tag}%`);
  }

  let whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';

  const limitInt = parseInt(limit, 10);
  const pageInt = parseInt(page, 10);
  const offset = (pageInt - 1) * limitInt;

  try {
    const result = await pool.query(`
      SELECT DISTINCT e.*, 
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username
        ) AS creator_user,
        json_build_object(
          'id', el.id,
          'name', el.name,
          'full_address', el.full_address,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'max_capacity', el.max_capacity
        ) AS event_location,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM events e
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN event_tags et ON e.id = et.id_event
      LEFT JOIN tags t ON et.id_tag = t.id
      ${whereClause}
      GROUP BY e.id, u.id, el.id
      ORDER BY e.start_date
      LIMIT $${i++} OFFSET $${i++}
    `, [...values, limitInt, offset]);

    res.status(200).json({ collection: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

// 2. GET /api/event/:id - detalle completo de un evento
exports.getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.*, 
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username
        ) AS creator_user,
        json_build_object(
          'id', el.id,
          'name', el.name,
          'full_address', el.full_address,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'max_capacity', el.max_capacity
        ) AS event_location,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM events e
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN event_tags et ON e.id = et.id_event
      LEFT JOIN tags t ON et.id_tag = t.id
      WHERE e.id = $1
      GROUP BY e.id, u.id, el.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.status(200).json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
};

// 3. POST /api/event - crear evento (requiere autenticación)
exports.createEvent = async (req, res) => {
  const { name, description, start_date, id_event_location } = req.body;
  const id_creator_user = req.user.id; // middleware JWT debe poner esto

  if (!name || !start_date || !id_event_location) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (name, description, start_date, id_event_location, id_creator_user)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description || '', start_date, id_event_location, id_creator_user]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

// 4. PUT /api/event/:id - editar evento (sólo creador)
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, description, start_date, id_event_location } = req.body;
  const id_user = req.user.id;

  try {
    // Verificar que el evento existe y pertenece al usuario
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND id_creator_user = $2',
      [id, id_user]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado o evento no encontrado' });
    }

    // Actualizar evento
    const result = await pool.query(
      `UPDATE events
       SET name = $1, description = $2, start_date = $3, id_event_location = $4
       WHERE id = $5
       RETURNING *`,
      [name, description || '', start_date, id_event_location, id]
    );

    res.status(200).json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};

// 5. DELETE /api/event/:id - borrar evento (con validaciones)
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id;

  try {
    // Verificar que el evento existe y pertenece al usuario
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND id_creator_user = $2',
      [id, id_user]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado o evento no encontrado' });
    }

    // Borrar evento
    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};
