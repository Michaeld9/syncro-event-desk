import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'coordenador';
  auth_type: 'local' | 'google';
}

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      auth_type: user.auth_type,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      full_name: '',
      role: decoded.role,
      auth_type: decoded.auth_type,
    };
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const getUserByEmail = async (email: string): Promise<AuthUser | null> => {
  const result = await db.query(
    'SELECT id, email, full_name, role, auth_type FROM users WHERE email = $1 AND active = true',
    [email]
  );
  return result.rows[0] || null;
};

export const getUserById = async (id: number): Promise<AuthUser | null> => {
  const result = await db.query(
    'SELECT id, email, full_name, role, auth_type FROM users WHERE id = $1 AND active = true',
    [id]
  );
  return result.rows[0] || null;
};

export const loginLocal = async (email: string, password: string) => {
  const result = await db.query(
    'SELECT id, email, full_name, role, password_hash, auth_type FROM users WHERE email = $1 AND auth_type = $2 AND active = true',
    [email, 'local']
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];
  const passwordMatch = await verifyPassword(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error('Invalid password');
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    auth_type: user.auth_type,
  };

  return {
    user: authUser,
    token: generateToken(authUser),
  };
};

export const loginGoogle = async (googleId: string, email: string, fullName: string, avatarUrl: string) => {
  let result = await db.query(
    'SELECT id, email, full_name, role, auth_type FROM users WHERE google_id = $1',
    [googleId]
  );

  let user = result.rows[0];

  if (!user) {
    result = await db.query(
      `INSERT INTO users (google_id, email, full_name, avatar_url, auth_type, role, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, full_name, role, auth_type`,
      [googleId, email, fullName, avatarUrl, 'google', 'coordenador']
    );
    user = result.rows[0];
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    auth_type: user.auth_type,
  };

  return {
    user: authUser,
    token: generateToken(authUser),
  };
};
