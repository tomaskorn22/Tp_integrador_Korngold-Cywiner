import pool from '../models/DB.js';

// 1. GET /api/event - lista eventos con filtros y paginación
export const getEvents = async (req, res) => {
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
export const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.*, 
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username,
          'password', '******'
        ) AS creator_user,
        json_build_object(
          'id', el.id,
          'id_location', el.id_location,
          'name', el.name,
          'full_address', el.full_address,
          'max_capacity', el.max_capacity,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'id_creator_user', el.id_creator_user,
          'location', json_build_object(
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
          ),
          'creator_user', json_build_object(
            'id', eu.id,
            'first_name', eu.first_name,
            'last_name', eu.last_name,
            'username', eu.username,
            'password', '******'
          )
        ) AS event_location,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM events e
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      LEFT JOIN users eu ON el.id_creator_user = eu.id
      LEFT JOIN event_tags et ON e.id = et.id_event
      LEFT JOIN tags t ON et.id_tag = t.id
      WHERE e.id = $1
      GROUP BY e.id, u.id, el.id, l.id, p.id, eu.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Return the event directly (without wrapping in "event" property)
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
};

// 3. POST /api/event - crear evento (requiere autenticación)
export const createEvent = async (req, res) => {
  const { name, description, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_event_location } = req.body;
  const id_creator_user = req.user.id;

  // Validación de campos obligatorios
  if (!name || name.length < 3) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (!description || description.length < 3) {
    return res.status(400).json({ error: 'La descripción debe tener al menos 3 caracteres' });
  }

  if (!start_date || !id_event_location) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  if (price && price < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo' });
  }

  if (duration_in_minutes && duration_in_minutes < 0) {
    return res.status(400).json({ error: 'La duración no puede ser negativa' });
  }

  try {
    // Verificar capacidad del evento vs ubicación
    if (max_assistance && id_event_location) {
      const locationResult = await pool.query(
        'SELECT max_capacity FROM event_locations WHERE id = $1',
        [id_event_location]
      );
      
      if (locationResult.rows.length > 0) {
        const maxCapacity = parseInt(locationResult.rows[0].max_capacity);
        if (max_assistance > maxCapacity) {
          return res.status(400).json({ error: 'La capacidad del evento excede la capacidad máxima de la ubicación' });
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO events (name, description, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_event_location, id_creator_user)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, description, start_date, duration_in_minutes || 60, price || 0, enabled_for_enrollment || 1, max_assistance || 100, id_event_location, id_creator_user]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

// 4. PUT /api/event/ - editar evento (sólo creador)
export const updateEvent = async (req, res) => {
  const { id, name, description, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_event_location } = req.body;
  const id_user = req.user.id;

  if (!id) {
    return res.status(400).json({ error: 'ID del evento es requerido' });
  }

  // Validación de campos
  if (name && name.length < 3) {
    return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (description && description.length < 3) {
    return res.status(400).json({ error: 'La descripción debe tener al menos 3 caracteres' });
  }

  if (price && price < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo' });
  }

  if (duration_in_minutes && duration_in_minutes < 0) {
    return res.status(400).json({ error: 'La duración no puede ser negativa' });
  }

  try {
    // Verificar que el evento existe y pertenece al usuario
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND id_creator_user = $2',
      [id, id_user]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o no pertenece al usuario' });
    }

    // Verificar capacidad del evento vs ubicación si se proporcionan ambos
    if (max_assistance && id_event_location) {
      const locationResult = await pool.query(
        'SELECT max_capacity FROM event_locations WHERE id = $1',
        [id_event_location]
      );
      
      if (locationResult.rows.length > 0) {
        const maxCapacity = parseInt(locationResult.rows[0].max_capacity);
        if (max_assistance > maxCapacity) {
          return res.status(400).json({ error: 'La capacidad del evento excede la capacidad máxima de la ubicación' });
        }
      }
    }

    // Construir query dinámicamente basado en campos proporcionados
    const fields = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(description);
    }
    if (start_date !== undefined) {
      fields.push(`start_date = $${index++}`);
      values.push(start_date);
    }
    if (duration_in_minutes !== undefined) {
      fields.push(`duration_in_minutes = $${index++}`);
      values.push(duration_in_minutes);
    }
    if (price !== undefined) {
      fields.push(`price = $${index++}`);
      values.push(price);
    }
    if (enabled_for_enrollment !== undefined) {
      fields.push(`enabled_for_enrollment = $${index++}`);
      values.push(enabled_for_enrollment);
    }
    if (max_assistance !== undefined) {
      fields.push(`max_assistance = $${index++}`);
      values.push(max_assistance);
    }
    if (id_event_location !== undefined) {
      fields.push(`id_event_location = $${index++}`);
      values.push(id_event_location);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );

    res.status(200).json({ event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};

// 5. DELETE /api/event/:id - borrar evento (con validaciones)
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id;

  try {
    // Verificar que el evento existe y pertenece al usuario
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND id_creator_user = $2',
      [id, id_user]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado o no pertenece al usuario' });
    }

    // Verificar si hay usuarios registrados al evento
    const enrollmentCheck = await pool.query(
      'SELECT COUNT(*) as enrollment_count FROM event_enrollments WHERE id_event = $1',
      [id]
    );

    if (parseInt(enrollmentCheck.rows[0].enrollment_count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el evento porque tiene usuarios registrados' });
    }

    // Borrar evento
    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};
