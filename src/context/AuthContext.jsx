import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { generateId, safeSetItem, safeGetItem } from '../constants';
import { syncToApi } from '../api/apiSync';
import { usersApi } from '../api/users';
import { authApi } from '../api/auth';

const AuthContext = createContext();

// Client-side password hashing — localStorage fallback ONLY.
// Real auth uses bcrypt on the server via /api/auth and /api/client-auth.
// This is NOT compatible with bcrypt hashes in Neon. Do NOT use for DB operations.
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
const TEMPLATE_USERS_KEY = 'threeseas_template_users';
const TEMPLATE_AUTH_KEY = 'threeseas_current_template_user';

// Template subscription tiers
export const TEMPLATE_TIERS = {
  free: {
    id: 'free',
    label: 'Free',
    price: 0,
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Basic access to free templates',
    features: [
      'Access to Starter templates',
      'Preview all templates',
      'Save favorites (up to 5)',
      'Email notifications',
    ],
    allowedTiers: ['Starter'],
    maxFavorites: 5,
    downloadsPerMonth: Infinity,
    color: '#6b7280',
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 19,
    priceMonthly: 19,
    priceYearly: 190, // ~17% discount
    description: 'Full access to professional templates',
    features: [
      'Everything in Free',
      'Download Business templates',
      'Download Premium templates',
      'Unlimited favorites',
      'Priority support',
      'Source code included',
    ],
    allowedTiers: ['Starter', 'Business', 'Premium'],
    maxFavorites: Infinity,
    downloadsPerMonth: Infinity,
    color: '#22d3ee',
    stripePriceId: 'price_pro_monthly', // Replace with real Stripe price ID
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    price: 49,
    priceMonthly: 49,
    priceYearly: 490, // ~17% discount
    description: 'Complete access to all templates',
    features: [
      'Everything in Pro',
      'Download Enterprise templates',
      'White-label license',
      'Commercial use allowed',
      'Priority feature requests',
      '1-on-1 customization call',
    ],
    allowedTiers: ['Starter', 'Business', 'Premium', 'Enterprise'],
    maxFavorites: Infinity,
    downloadsPerMonth: Infinity,
    color: '#c8a43e',
    stripePriceId: 'price_enterprise_monthly', // Replace with real Stripe price ID
  },
};

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
  const [templateUsers, setTemplateUsers] = useState(() => safeGetItem(TEMPLATE_USERS_KEY, []));
  const [currentTemplateUser, setCurrentTemplateUser] = useState(() => safeGetItem(TEMPLATE_AUTH_KEY, null));

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

  useEffect(() => {
    safeSetItem(TEMPLATE_USERS_KEY, JSON.stringify(templateUsers));
  }, [templateUsers]);

  useEffect(() => {
    if (currentTemplateUser) {
      safeSetItem(TEMPLATE_AUTH_KEY, JSON.stringify(currentTemplateUser));
    } else {
      localStorage.removeItem(TEMPLATE_AUTH_KEY);
    }
  }, [currentTemplateUser]);

  // Auto-migrate legacy 'staff' role to 'developer'
  useEffect(() => {
    const hasStaff = users.some((u) => u.role === 'staff');
    if (hasStaff) {
      setUsers((prev) => prev.map((u) => u.role === 'staff' ? { ...u, role: 'developer' } : u));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: try to restore session from stored JWT token
  const [apiChecked, setApiChecked] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('threeseas_access_token');
    const isClientSession = !!localStorage.getItem(CLIENT_AUTH_KEY);
    // Skip admin /api/auth/me if this is a client session — the token is a client JWT
    if (token && !currentUser && !isClientSession) {
      authApi.me().then((user) => {
        setCurrentUser(user);
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === user.id);
          return exists ? prev : [...prev, user];
        });
      }).catch(() => {
        localStorage.removeItem('threeseas_access_token');
        localStorage.removeItem('threeseas_refresh_token');
      }).finally(() => setApiChecked(true));
    } else {
      setApiChecked(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const needsSetup = apiChecked && users.length === 0 && !currentUser;

  const setupAdmin = async (userData) => {
    if (!needsSetup) return { success: false, error: 'Admin already configured' };
    if (!userData.username || !userData.password || !userData.name || !userData.email) {
      return { success: false, error: 'All fields are required' };
    }
    if (userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    // Try API setup first
    try {
      const data = await authApi.setup({ username: userData.username, password: userData.password, displayName: userData.name, email: userData.email });
      if (data.accessToken) {
        localStorage.setItem('threeseas_access_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem('threeseas_refresh_token', data.refreshToken);
      }
      const apiUser = data.user || { ...userData, role: 'owner', status: 'approved' };
      setCurrentUser(apiUser);
      setUsers([apiUser]);
      return { success: true, user: apiUser };
    } catch {
      // Fallback to client-side setup
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
      return { success: true, user: newAdmin };
    }
  };

  const login = async (username, password) => {
    // Try API login first (returns JWT tokens)
    try {
      const data = await authApi.login({ username, password });
      if (data.accessToken) {
        localStorage.setItem('threeseas_access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('threeseas_refresh_token', data.refreshToken);
        }
      }
      const apiUser = data.user || { username, role: data.role };
      setCurrentUser(apiUser);
      return { success: true, user: apiUser };
    } catch (apiErr) {
      // API login failed — fall back to client-side auth
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
    }
  };

  const register = async (userData) => {
    // Try API register first
    try {
      const data = await authApi.register({ username: userData.username, password: userData.password, displayName: userData.name, email: userData.email });
      const newUser = data.user || { ...userData, id: data.id, role: 'pending', status: 'pending' };
      setUsers((prev) => [...prev, newUser]);
      return { success: true, user: newUser };
    } catch (apiErr) {
      const errMsg = apiErr.response?.data?.error;
      if (errMsg) return { success: false, error: errMsg };
      // Fallback to client-side
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
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem('threeseas_access_token');
    localStorage.removeItem('threeseas_refresh_token');
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

  // Template user auth
  const registerTemplateUser = (userData) => {
    const existing = templateUsers.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) return { success: false, error: 'An account with this email already exists' };

    const newUser = {
      id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashPassword(userData.password),
      tier: 'free',
      subscription: {
        status: 'active', // 'active', 'canceled', 'past_due'
        startedAt: new Date().toISOString(),
        expiresAt: null, // null for free tier
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
      favorites: [],
      downloads: [],
      downloadsThisMonth: 0,
      downloadResetDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setTemplateUsers((prev) => [...prev, newUser]);
    setCurrentTemplateUser(newUser);
    return { success: true, user: newUser };
  };

  const templateUserLogin = (email, password) => {
    const hashed = hashPassword(password);
    const user = templateUsers.find((u) => {
      if (u.email.toLowerCase() !== email.toLowerCase()) return false;
      if (u.password === hashed) return true;
      return false;
    });
    if (!user) return { success: false, error: 'Invalid email or password' };
    setCurrentTemplateUser(user);
    return { success: true, user };
  };

  const templateUserLogout = () => setCurrentTemplateUser(null);

  const updateTemplateUserTier = (userId, tier, subscriptionData = {}) => {
    setTemplateUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              tier,
              subscription: {
                ...u.subscription,
                ...subscriptionData,
              },
            }
          : u
      )
    );
    if (currentTemplateUser?.id === userId) {
      setCurrentTemplateUser((prev) => ({
        ...prev,
        tier,
        subscription: {
          ...prev.subscription,
          ...subscriptionData,
        },
      }));
    }
  };

  const addToFavorites = (templateId) => {
    if (!currentTemplateUser) return { success: false, error: 'Not logged in' };
    const tier = TEMPLATE_TIERS[currentTemplateUser.tier];
    if (currentTemplateUser.favorites.length >= tier.maxFavorites) {
      return { success: false, error: 'Favorite limit reached. Upgrade to add more.' };
    }
    if (currentTemplateUser.favorites.includes(templateId)) {
      return { success: false, error: 'Already in favorites' };
    }
    const updated = {
      ...currentTemplateUser,
      favorites: [...currentTemplateUser.favorites, templateId],
    };
    setCurrentTemplateUser(updated);
    setTemplateUsers((prev) =>
      prev.map((u) => (u.id === currentTemplateUser.id ? updated : u))
    );
    return { success: true };
  };

  const removeFromFavorites = (templateId) => {
    if (!currentTemplateUser) return { success: false, error: 'Not logged in' };
    const updated = {
      ...currentTemplateUser,
      favorites: currentTemplateUser.favorites.filter((id) => id !== templateId),
    };
    setCurrentTemplateUser(updated);
    setTemplateUsers((prev) =>
      prev.map((u) => (u.id === currentTemplateUser.id ? updated : u))
    );
    return { success: true };
  };

  const canDownloadTemplate = (templateTier) => {
    if (!currentTemplateUser) return { canDownload: false, reason: 'login_required' };
    const tier = TEMPLATE_TIERS[currentTemplateUser.tier];
    if (!tier.allowedTiers.includes(templateTier)) {
      return { canDownload: false, reason: 'upgrade_required', requiredTier: getRequiredTier(templateTier) };
    }
    return { canDownload: true };
  };

  const getRequiredTier = (templateTier) => {
    if (templateTier === 'Starter') return 'free';
    if (templateTier === 'Business' || templateTier === 'Premium') return 'pro';
    return 'enterprise';
  };

  const recordDownload = (templateId, templateTier) => {
    if (!currentTemplateUser) return { success: false, error: 'Not logged in' };
    const tier = TEMPLATE_TIERS[currentTemplateUser.tier];
    
    // Check if allowed
    if (!tier.allowedTiers.includes(templateTier)) {
      return { success: false, error: 'Template tier not included in your plan' };
    }

    const download = {
      templateId,
      templateTier,
      downloadedAt: new Date().toISOString(),
    };

    const updated = {
      ...currentTemplateUser,
      downloads: [...currentTemplateUser.downloads, download],
      downloadsThisMonth: currentTemplateUser.downloadsThisMonth + 1,
    };

    setCurrentTemplateUser(updated);
    setTemplateUsers((prev) =>
      prev.map((u) => (u.id === currentTemplateUser.id ? updated : u))
    );
    return { success: true };
  };

  const value = useMemo(() => ({
    currentUser, needsSetup, setupAdmin, login, logout, register, hasPermission,
    users, addUser, updateUser, deleteUser, approveUser, rejectUser, ROLES, STAFF_COLORS,
    currentClient, setCurrentClient, clientLogin, clientLogout, hashPassword,
    // Template user auth
    templateUsers, currentTemplateUser, TEMPLATE_TIERS,
    registerTemplateUser, templateUserLogin, templateUserLogout,
    updateTemplateUserTier, addToFavorites, removeFromFavorites,
    canDownloadTemplate, recordDownload, getRequiredTier,
  }), [currentUser, users, currentClient, needsSetup, templateUsers, currentTemplateUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
