import { verifyToken, loginLocal, loginGoogle, hashPassword, AuthUser } from './auth';
import * as eventService from './events';
import db from './db';

export interface Request {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
}

export interface Response {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

const extractUser = (req: Request): AuthUser | null => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
};

const parseJsonBody = (body: any): any => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body || {};
};

export async function handleRequest(req: Request): Promise<Response> {
  const [basePath, ...pathParts] = req.path.split('/').filter(Boolean);

  try {
    if (basePath === 'api') {
      const [resource, action] = pathParts;

      if (resource === 'auth') {
        return await handleAuth(req, action);
      }

      if (resource === 'events') {
        return await handleEvents(req, action);
      }
    }

    return { status: 404, body: { error: 'Not found' } };
  } catch (error: any) {
    console.error('Request error:', error);
    return {
      status: 500,
      body: { error: error.message || 'Internal server error' },
    };
  }
}

async function handleAuth(req: Request, action: string): Promise<Response> {
  if (req.method === 'POST' && action === 'login-local') {
    const body = parseJsonBody(req.body);
    const { email, password } = body;

    if (!email || !password) {
      return { status: 400, body: { error: 'Email and password required' } };
    }

    const result = await loginLocal(email, password);
    return { status: 200, body: { user: result.user, token: result.token } };
  }

  if (req.method === 'POST' && action === 'login-google') {
    const body = parseJsonBody(req.body);
    const { googleId, email, fullName, avatarUrl } = body;

    if (!googleId || !email) {
      return { status: 400, body: { error: 'googleId and email required' } };
    }

    const result = await loginGoogle(googleId, email, fullName || '', avatarUrl || '');
    return { status: 200, body: { user: result.user, token: result.token } };
  }

  if (req.method === 'POST' && action === 'verify') {
    const user = extractUser(req);
    if (!user) {
      return { status: 401, body: { error: 'Unauthorized' } };
    }
    return { status: 200, body: { user } };
  }

  return { status: 404, body: { error: 'Auth endpoint not found' } };
}

async function handleEvents(req: Request, action: string): Promise<Response> {
  const user = extractUser(req);

  if (!user) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  if (req.method === 'GET') {
    if (action === 'my-events') {
      const events = await eventService.getEventsByUser(user.id);
      return { status: 200, body: { events } };
    }

    if (action === 'approved') {
      const events = await eventService.getApprovedEvents();
      return { status: 200, body: { events } };
    }

    if (action === 'pending' && (user.role === 'admin' || user.role === 'supervisor')) {
      const events = await eventService.getPendingEvents();
      return { status: 200, body: { events } };
    }

    const eventId = parseInt(action);
    if (!isNaN(eventId)) {
      const event = await eventService.getEventById(eventId);
      if (!event) {
        return { status: 404, body: { error: 'Event not found' } };
      }
      return { status: 200, body: { event } };
    }
  }

  if (req.method === 'POST' && action === 'create') {
    const body = parseJsonBody(req.body);
    const event = await eventService.createEvent({
      title: body.title,
      description: body.description,
      start_date: body.start_date,
      end_date: body.end_date,
      start_time: body.start_time,
      end_time: body.end_time,
      all_day: body.all_day || false,
      event_type: body.event_type,
      status: 'pending',
      created_by: user.id,
    });
    return { status: 201, body: { event } };
  }

  if (req.method === 'PUT') {
    const eventId = parseInt(action);
    if (isNaN(eventId)) {
      return { status: 400, body: { error: 'Invalid event ID' } };
    }

    const event = await eventService.getEventById(eventId);
    if (!event) {
      return { status: 404, body: { error: 'Event not found' } };
    }

    if (event.created_by !== user.id && user.role !== 'admin' && user.role !== 'supervisor') {
      return { status: 403, body: { error: 'Forbidden' } };
    }

    const body = parseJsonBody(req.body);
    const updated = await eventService.updateEvent(eventId, body);
    return { status: 200, body: { event: updated } };
  }

  if (req.method === 'DELETE' && !isNaN(parseInt(action))) {
    const eventId = parseInt(action);
    const event = await eventService.getEventById(eventId);

    if (!event) {
      return { status: 404, body: { error: 'Event not found' } };
    }

    if (event.created_by !== user.id && user.role !== 'admin' && user.role !== 'supervisor') {
      return { status: 403, body: { error: 'Forbidden' } };
    }

    await eventService.deleteEvent(eventId);
    return { status: 200, body: { message: 'Event deleted' } };
  }

  if (req.method === 'POST' && action === 'approve' && (user.role === 'admin' || user.role === 'supervisor')) {
    const body = parseJsonBody(req.body);
    const eventId = body.eventId;

    if (!eventId) {
      return { status: 400, body: { error: 'eventId required' } };
    }

    const event = await eventService.approveEvent(eventId, user.id);
    return { status: 200, body: { event } };
  }

  if (req.method === 'POST' && action === 'reject' && (user.role === 'admin' || user.role === 'supervisor')) {
    const body = parseJsonBody(req.body);
    const eventId = body.eventId;

    if (!eventId) {
      return { status: 400, body: { error: 'eventId required' } };
    }

    const event = await eventService.rejectEvent(eventId, user.id);
    return { status: 200, body: { event } };
  }

  return { status: 404, body: { error: 'Endpoint not found' } };
}
