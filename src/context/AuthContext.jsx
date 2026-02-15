import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { generateId, safeSetItem, safeGetItem } from '../constants';
import { syncToApi } from '../api/apiSync';
import { usersApi } from '../api/users';
import { authApi } from '../api/auth';

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
  owner: {
    label: 'Owner',
    permissions: [
      'view_dashboard', 'view_clients', 'manage_clients', 'delete_clients', 'approve_clients',
      'view_bi', 'manage_bi', 'view_appointments', 'manage_appointments', 'confirm_appointments',
      'view_sales', 'manage_sales', 'view_finance', 'manage_finance', 'view_projects',
      'manage_projects', 'view_research', 'manage_research', 'manage_users', 'manage_settings',
    ],
    description: 'Business owner — full access to everything',
  },
  admin: {
    label: 'Admin',
    permissions: [
      'view_dashboard', 'view_clients', 'manage_clients', 'delete_clients', 'approve_clients',
      'view_bi', 'manage_bi', 'view_appointments', 'manage_appointments', 'confirm_appointments',
      'view_sales', 'manage_sales', 'view_finance', 'manage_finance', 'view_projects',
      'manage_projects', 'view_research', 'manage_research', 'manage_users', 'manage_settings',
    ],
    description: 'System admin — full access to everything',
  },
  manager: {
    label: 'Manager',
    permissions: [
      'view_dashboard', 'view_clients', 'manage_clients', 'approve_clients',
      'view_bi', 'manage_bi', 'view_appointments', 'manage_appointments', 'confirm_appointments',
      'view_sales', 'manage_sales', 'view_finance', 'view_projects',
      'manage_projects', 'view_research', 'manage_research',
    ],
    description: 'Department lead — clients, BI, sales, appointments, projects, research; view finance',
  },
  sales: {
    label: 'Sales',
    permissions: [
      'view_dashboard', 'view_clients', 'view_appointments', 'manage_appointments', 'confirm_appointments',
      'view_sales', 'manage_sales',
    ],
    description: 'Sales team — leads, pipeline, follow-ups, appointments; view clients',
  },
  accountant: {
    label: 'Accountant',
    permissions: [
      'view_dashboard', 'view_clients', 'view_finance', 'manage_finance',
    ],
    description: 'Finance team — revenue, expenses, invoices, profit, taxes, analytics; view clients',
  },
  it: {
    label: 'IT',
    permissions: [
      'view_dashboard', 'view_clients', 'view_bi', 'view_projects', 'manage_projects',
      'view_research',
    ],
    description: 'Technical staff — projects, BI (view), research; view clients',
  },
  developer: {
    label: 'Developer',
    permissions: [
      'view_dashboard', 'view_projects', 'manage_projects',
    ],
    description: 'Project worker — dashboard and projects with time tracking',
  },
  analyst: {
    label: 'Analyst',
    permissions: [
      'view_dashboard', 'view_clients', 'view_bi', 'view_finance', 'view_research',
    ],
    description: 'Reporting/BI — view BI, finance, research, and clients',
  },
};

const STAFF_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#ef4444', '#84cc16',
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => safeGetItem(USERS_KEY, []));
  const [currentUser, setCurrentUser] = useState(() => safeGetItem(ADMIN_AUTH_KEY, null));
  const [currentClient, setCurrentClient] = useState(() => safeGetItem(CLIENT_AUTH_KEY, null));

  useEffect(() => {
    safeSetItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem(ADMIN_AUTH_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentClient) {
      safeSetItem(CLIENT_AUTH_KEY, JSON.stringify(currentClient));
    } else {
      localStorage.removeItem(CLIENT_AUTH_KEY);
    }
  }, [currentClient]);

  // Auto-migrate legacy 'staff' role to 'developer'
  useEffect(() => {
    const hasStaff = users.some((u) => u.role === 'staff');
    if (hasStaff) {
      setUsers((prev) => prev.map((u) => u.role === 'staff' ? { ...u, role: 'developer' } : u));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const needsSetup = users.length === 0 || !users.some((u) => (u.role === 'admin' || u.role === 'owner') && u.status === 'approved');

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
      role: 'owner',
      status: 'approved',
      color: STAFF_COLORS[0],
      createdAt: new Date().toISOString(),
    };
    setUsers([newAdmin]);
    setCurrentUser(newAdmin);
    syncToApi(() => authApi.setup({ username: userData.username, password: userData.password, name: userData.name, email: userData.email }), 'setupAdmin');
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
    syncToApi(() => authApi.login({ username, password }), 'login');
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
    syncToApi(() => authApi.register({ ...userData, password: userData.password }), 'register');
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
    syncToApi(() => usersApi.create({ ...userData, password: userData.password }), 'addUser');
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
    syncToApi(() => usersApi.update(id, processed), 'updateUser');
    if (currentUser?.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    return { success: true };
  };

  const deleteUser = (id) => {
    if (id === '1') return { success: false, error: 'Cannot delete the default admin' };
    if (currentUser?.id === id) return { success: false, error: 'Cannot delete yourself' };
    setUsers((prev) => prev.filter((u) => u.id !== id));
    syncToApi(() => usersApi.delete(id), 'deleteUser');
    return { success: true };
  };

  const approveUser = (id, role) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role, status: 'approved' } : u))
    );
    syncToApi(() => usersApi.approve(id, role), 'approveUser');
    return { success: true };
  };

  const rejectUser = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'rejected' } : u))
    );
    syncToApi(() => usersApi.reject(id), 'rejectUser');
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

  const value = useMemo(() => ({
    currentUser, needsSetup, setupAdmin, login, logout, register, hasPermission,
    users, addUser, updateUser, deleteUser, approveUser, rejectUser, ROLES, STAFF_COLORS,
    currentClient, setCurrentClient, clientLogin, clientLogout, hashPassword,
  }), [currentUser, users, currentClient, needsSetup]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
