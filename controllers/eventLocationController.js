import pool from '../models/DB.js';

// GET /api/event-location - Obtener todas las event_locations del usuario autenticado
export const getEventLocations = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const id_creator_user = req.user.id;

  const limitInt = parseInt(limit, 10);
  const pageInt = parseInt(page, 10);
  const offset = (pageInt - 1) * limitInt;

  try {
    const result = await pool.query(`
      SELECT el.*, 
        json_build_object(
          'id', l.id,
          'name', l.name,
          'id_province', l.id_province,
          'latitude', l.latitude,
          'longitude', l.longitude
        ) as location
      FROM event_locations el
      LEFT JOIN locations l ON el.id_location = l.id
      WHERE el.id_creator_user = $1
      ORDER BY el.id
      LIMIT $2 OFFSET $3
    `, [id_creator_user, limitInt, offset]);

    res.status(200).json({ collection: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ubicaciones de eventos' });
  }
};

// GET /api/event-location/:id - Obtener una event_location específica del usuario
export const getEventLocationById = async (req, res) => {
  const { id } = req.params;
  const id_creator_user = req.user.id;

  try {
    const result = await pool.query(`
      SELECT el.*, 
        json_build_object(
          'id', l.id,
          'name', l.name,
          'id_province', l.id_province,
          'latitude', l.latitude,
          'longitude', l.longitude,
          'province', json_build_object(
            'id', p.id,
            'name', p.name,
            'full_name', p.full_name,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'display_order', p.display_order
          )
        ) as location
      FROM event_locations el
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      WHERE el.id = $1 AND el.id_creator_user = $2
    `, [id, id_creator_user]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ubicación de evento no encontrada o no pertenece al usuario' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ubicación de evento' });
  }
};

// POST /api/event-location/ - Crear nueva event_location
export const createEventLocation = async (req, res) => {
  const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;
  const id_creator_user = req.user.id;

  // Validaciones
  if (!name || name.length < 3) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (!full_address || full_address.length < 3) {
    return res.status(400).json({ error: 'La dirección debe tener al menos 3 caracteres' });
  }

  if (!max_capacity || max_capacity <= 0) {
    return res.status(400).json({ error: 'La capacidad máxima debe ser mayor que cero' });
  }

  if (!id_location) {
    return res.status(400).json({ error: 'ID de ubicación es requerido' });
  }

  try {
    // Verificar que el id_location existe
    const locationCheck = await pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [id_location]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(400).json({ error: 'ID de ubicación inexistente' });
    }

    const result = await pool.query(
      `INSERT INTO event_locations (id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user]
    );

    res.status(201).json({ event_location: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear ubicación de evento' });
  }
};

// PUT /api/event-location/:id - Actualizar event_location del usuario
export const updateEventLocation = async (req, res) => {
  const { id } = req.params;
  const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;
  const id_creator_user = req.user.id;

  // Validaciones
  if (name && name.length < 3) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (full_address && full_address.length < 3) {
    return res.status(400).json({ error: 'La dirección debe tener al menos 3 caracteres' });
  }

  if (max_capacity && max_capacity <= 0) {
    return res.status(400).json({ error: 'La capacidad máxima debe ser mayor que cero' });
  }

  try {
    // Verificar que la event_location existe y pertenece al usuario
    const locationCheck = await pool.query(
      'SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2',
      [id, id_creator_user]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ubicación de evento no encontrada o no pertenece al usuario' });
    }

    // Verificar que el id_location existe si se proporciona
    if (id_location) {
      const locCheck = await pool.query(
        'SELECT * FROM locations WHERE id = $1',
        [id_location]
      );

      if (locCheck.rows.length === 0) {
        return res.status(400).json({ error: 'ID de ubicación inexistente' });
      }
    }

    // Construir query dinámicamente
    const fields = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }
    if (full_address !== undefined) {
      fields.push(`full_address = $${index++}`);
      values.push(full_address);
    }
    if (max_capacity !== undefined) {
      fields.push(`max_capacity = $${index++}`);
      values.push(max_capacity);
    }
    if (latitude !== undefined) {
      fields.push(`latitude = $${index++}`);
      values.push(latitude);
    }
    if (longitude !== undefined) {
      fields.push(`longitude = $${index++}`);
      values.push(longitude);
    }
    if (id_location !== undefined) {
      fields.push(`id_location = $${index++}`);
      values.push(id_location);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE event_locations SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );

    res.status(200).json({ event_location: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar ubicación de evento' });
  }
};

// DELETE /api/event-location/:id - Eliminar event_location del usuario
export const deleteEventLocation = async (req, res) => {
  const { id } = req.params;
  const id_creator_user = req.user.id;

  try {
    // Verificar que la event_location existe y pertenece al usuario
    const locationCheck = await pool.query(
      'SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2',
      [id, id_creator_user]
    );

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ubicación de evento no encontrada o no pertenece al usuario' });
    }

    // Verificar si hay eventos usando esta ubicación
    const eventCheck = await pool.query(
      'SELECT COUNT(*) as event_count FROM events WHERE id_event_location = $1',
      [id]
    );

    if (parseInt(eventCheck.rows[0].event_count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la ubicación porque tiene eventos asociados' });
    }

    // Eliminar ubicación
    await pool.query('DELETE FROM event_locations WHERE id = $1', [id]);

    res.status(200).json({ message: 'Ubicación de evento eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar ubicación de evento' });
  }
};