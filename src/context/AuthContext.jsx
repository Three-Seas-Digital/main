import { createContext, useContext, useState, useEffect } from 'react';
import { generateId } from '../constants';

const AuthContext = createContext();

// Client-side password hashing (stopgap until backend with bcrypt).
function hashPassword(password) {
  const salt = 'tsd_2026';
  const str = salt + password;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const USERS_KEY = 'threeseas_users';
const ADMIN_AUTH_KEY = 'threeseas_current_user';
const CLIENT_AUTH_KEY = 'threeseas_current_client';

const ROLES = {
  admin: {
    label: 'Admin',
    permissions: ['view_appointments', 'manage_appointments', 'manage_users', 'manage_clients'],
    description: 'Full access: manage appointments, users, clients, and all settings',
  },
  manager: {
    label: 'Manager',
    permissions: ['view_appointments', 'manage_appointments', 'manage_clients', 'manage_users'],
    description: 'Can manage appointments, clients, and approve new user registrations',
  },
  staff: {
    label: 'Staff',
    permissions: ['view_appointments', 'confirm_appointments', 'view_clients'],
    description: 'Can view appointments, confirm pending ones, and view clients',
  },
};

const STAFF_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#ef4444', '#84cc16',
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(ADMIN_AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [currentClient, setCurrentClient] = useState(() => {
    const saved = localStorage.getItem(CLIENT_AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentClient) {
      localStorage.setItem(CLIENT_AUTH_KEY, JSON.stringify(currentClient));
    } else {
      localStorage.removeItem(CLIENT_AUTH_KEY);
    }
  }, [currentClient]);

  const needsSetup = users.length === 0 || !users.some((u) => u.role === 'admin' && u.status === 'approved');

  const setupAdmin = (userData) => {
    if (!needsSetup) return { success: false, error: 'Admin already configured' };
    if (!userData.username || !userData.password || !userData.name || !userData.email) {
      return { success: false, error: 'All fields are required' };
    }
    if (userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    const newAdmin = {
      id: generateId(),
      username: userData.username,
      password: hashPassword(userData.password),
      name: userData.name,
      email: userData.email,
      role: 'admin',
      status: 'approved',
      color: STAFF_COLORS[0],
      createdAt: new Date().toISOString(),
    };
    setUsers([newAdmin]);
    setCurrentUser(newAdmin);
    return { success: true, user: newAdmin };
  };

  const login = (username, password) => {
    const hashed = hashPassword(password);
    const user = users.find((u) => {
      if (u.username !== username) return false;
      if (u.password === hashed) return true;
      if (u.password === password) {
        setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, password: hashed } : x));
        return true;
      }
      return false;
    });
    if (!user) return { success: false, error: 'Invalid credentials' };
    if (user.status === 'pending') return { success: false, error: 'Your account is pending approval. Please wait for an admin to approve your registration.' };
    if (user.status === 'rejected') return { success: false, error: 'Your account has been rejected. Contact an administrator.' };
    setCurrentUser(user);
    return { success: true, user };
  };

  const register = (userData) => {
    const existsUsername = users.some((u) => u.username === userData.username);
    if (existsUsername) return { success: false, error: 'Username already taken' };
    const existsEmail = users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existsEmail) return { success: false, error: 'Email already registered' };
    const newUser = {
      ...userData,
      password: hashPassword(userData.password),
      id: generateId(),
      role: 'pending',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(ADMIN_AUTH_KEY);
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const role = ROLES[currentUser.role];
    return role?.permissions.includes(permission) || false;
  };

  // User management
  const addUser = (userData) => {
    const exists = users.some((u) => u.username === userData.username);
    if (exists) return { success: false, error: 'Username already exists' };
    const colorIndex = users.length % STAFF_COLORS.length;
    const newUser = {
      ...userData,
      password: hashPassword(userData.password),
      id: generateId(),
      status: 'approved',
      color: userData.color || STAFF_COLORS[colorIndex],
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true, user: newUser };
  };

  const updateUser = (id, updates) => {
    if (updates.username) {
      const exists = users.some((u) => u.username === updates.username && u.id !== id);
      if (exists) return { success: false, error: 'Username already taken' };
    }
    const processed = updates.password ? { ...updates, password: hashPassword(updates.password) } : updates;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...processed } : u))
    );
    if (currentUser?.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    return { success: true };
  };

  const deleteUser = (id) => {
    if (id === '1') return { success: false, error: 'Cannot delete the default admin' };
    if (currentUser?.id === id) return { success: false, error: 'Cannot delete yourself' };
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true };
  };

  const approveUser = (id, role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role, status: 'approved' } : u))
    );
    return { success: true };
  };

  const rejectUser = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'rejected' } : u))
    );
    return { success: true };
  };

  // Client auth
  const clientLogin = (email, password, clientsList) => {
    const hashed = hashPassword(password);
    let migrateFn = null;
    const client = clientsList.find((c) => {
      if (c.email.toLowerCase() !== email.toLowerCase()) return false;
      if (c.password === hashed) return true;
      if (c.password === password) {
        migrateFn = { id: c.id, hashed };
        return true;
      }
      return false;
    });
    if (!client) return { success: false, error: 'Invalid email or password', migrateFn: null };
    if (client.status === 'pending') {
      return { success: false, error: 'Your account is pending approval. Please wait for an administrator to approve your registration.', migrateFn: null };
    }
    setCurrentClient(client);
    return { success: true, client, migrateFn };
  };

  const clientLogout = () => setCurrentClient(null);

  return (
    <AuthContext.Provider
      value={{
        // Admin auth
        currentUser,
        needsSetup,
        setupAdmin,
        login,
        logout,
        register,
        hasPermission,
        // Users CRUD
        users,
        addUser,
        updateUser,
        deleteUser,
        approveUser,
        rejectUser,
        ROLES,
        STAFF_COLORS,
        // Client auth
        currentClient,
        setCurrentClient,
        clientLogin,
        clientLogout,
        // Utilities
        hashPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
