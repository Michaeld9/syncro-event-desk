import db from './db';

export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  event_type: string;
  status: 'pending' | 'approved' | 'rejected';
  created_by: number;
  created_at: string;
  updated_at: string;
  approved_by: number | null;
  approved_at: string | null;
  google_calendar_event_id: string | null;
  creator?: { full_name: string; email: string };
}

export const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at' | 'google_calendar_event_id'>): Promise<Event> => {
  const result = await db.query(
    `INSERT INTO events (title, description, start_date, end_date, start_time, end_time, all_day, event_type, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      eventData.title,
      eventData.description,
      eventData.start_date,
      eventData.end_date,
      eventData.start_time,
      eventData.end_time,
      eventData.all_day,
      eventData.event_type,
      eventData.status,
      eventData.created_by,
    ]
  );
  return result.rows[0];
};

export const getEventsByUser = async (userId: number): Promise<Event[]> => {
  const result = await db.query(
    `SELECT e.*, u.full_name as creator_name, u.email as creator_email
     FROM events e
     JOIN users u ON e.created_by = u.id
     WHERE e.created_by = $1
     ORDER BY e.start_date ASC`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    creator: {
      full_name: row.creator_name,
      email: row.creator_email,
    },
  }));
};

export const getApprovedEvents = async (): Promise<Event[]> => {
  const result = await db.query(
    `SELECT e.*, u.full_name as creator_name, u.email as creator_email
     FROM events e
     JOIN users u ON e.created_by = u.id
     WHERE e.status = 'approved'
     ORDER BY e.start_date ASC`
  );
  return result.rows.map(row => ({
    ...row,
    creator: {
      full_name: row.creator_name,
      email: row.creator_email,
    },
  }));
};

export const getPendingEvents = async (): Promise<Event[]> => {
  const result = await db.query(
    `SELECT e.*, u.full_name as creator_name, u.email as creator_email
     FROM events e
     JOIN users u ON e.created_by = u.id
     WHERE e.status = 'pending'
     ORDER BY e.start_date ASC`
  );
  return result.rows.map(row => ({
    ...row,
    creator: {
      full_name: row.creator_name,
      email: row.creator_email,
    },
  }));
};

export const getEventById = async (eventId: number): Promise<Event | null> => {
  const result = await db.query(
    `SELECT e.*, u.full_name as creator_name, u.email as creator_email
     FROM events e
     JOIN users u ON e.created_by = u.id
     WHERE e.id = $1`,
    [eventId]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    creator: {
      full_name: row.creator_name,
      email: row.creator_email,
    },
  };
};

export const updateEvent = async (eventId: number, updates: Partial<Event>): Promise<Event | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && key !== 'created_by' && key !== 'creator') {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) return getEventById(eventId);

  values.push(eventId);
  const result = await db.query(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

export const deleteEvent = async (eventId: number): Promise<boolean> => {
  const result = await db.query('DELETE FROM events WHERE id = $1', [eventId]);
  return result.rowCount! > 0;
};

export const approveEvent = async (eventId: number, approverId: number): Promise<Event | null> => {
  return updateEvent(eventId, {
    status: 'approved',
    approved_by: approverId,
    approved_at: new Date().toISOString(),
  } as any);
};

export const rejectEvent = async (eventId: number, approverId: number): Promise<Event | null> => {
  return updateEvent(eventId, {
    status: 'rejected',
    approved_by: approverId,
    approved_at: new Date().toISOString(),
  } as any);
};
