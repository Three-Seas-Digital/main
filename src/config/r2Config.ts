const CONFIG_KEY = 'threeseas_r2_config';

interface R2Config {
  workerUrl: string;
  apiKey: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: R2Config = {
  workerUrl: '',
  apiKey: '',
  enabled: false,
};

export function getR2Config(): R2Config {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

export function setR2Config(config: R2Config): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function isR2Enabled(): boolean {
  const config = getR2Config();
  return config.enabled && !!config.workerUrl && !!config.apiKey;
}
