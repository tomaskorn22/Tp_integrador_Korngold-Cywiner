import pool from '../models/DB.js';

// POST /api/event/{id}/enrollment/ - Inscribir usuario en evento
export const enrollUser = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id;

  try {
    // Verificar que el evento existe
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const event = eventResult.rows[0];

    // Verificar que el evento está habilitado para inscripciones
    if (!event.enabled_for_enrollment || event.enabled_for_enrollment === '0') {
      return res.status(400).json({ error: 'El evento no está habilitado para inscripciones' });
    }

    // Verificar que el evento no haya pasado
    const eventDate = new Date(event.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate <= today) {
      return res.status(400).json({ error: 'No se puede inscribir a un evento que ya sucedió o es hoy' });
    }

    // Verificar que el usuario no esté ya registrado
    const enrollmentCheck = await pool.query(
      'SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
      [id, id_user]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya se encuentra registrado en el evento' });
    }

    // Verificar capacidad máxima
    const enrollmentCount = await pool.query(
      'SELECT COUNT(*) as count FROM event_enrollments WHERE id_event = $1',
      [id]
    );

    const currentEnrollments = parseInt(enrollmentCount.rows[0].count);
    if (currentEnrollments >= event.max_assistance) {
      return res.status(400).json({ error: 'Se excedió la capacidad máxima de registrados al evento' });
    }

    // Registrar usuario
    const registrationDateTime = new Date();
    await pool.query(
      'INSERT INTO event_enrollments (id_event, id_user, registration_date_time, attended, observations, rating) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, id_user, registrationDateTime, null, null, null]
    );

    res.status(201).json({ message: 'Usuario registrado exitosamente en el evento' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario en evento' });
  }
};

// DELETE /api/event/{id}/enrollment/ - Desuscribir usuario de evento
export const unenrollUser = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id;

  try {
    // Verificar que el evento existe
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const event = eventResult.rows[0];

    // Verificar que el evento no haya pasado
    const eventDate = new Date(event.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate <= today) {
      return res.status(400).json({ error: 'No se puede desuscribir de un evento que ya sucedió o es hoy' });
    }

    // Verificar que el usuario esté registrado
    const enrollmentCheck = await pool.query(
      'SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
      [id, id_user]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'El usuario no se encuentra registrado al evento' });
    }

    // Remover registro
    await pool.query(
      'DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
      [id, id_user]
    );

    res.status(200).json({ message: 'Usuario removido exitosamente del evento' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al remover usuario del evento' });
  }
};