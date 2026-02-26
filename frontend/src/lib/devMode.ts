import { env } from './env';
export const DEV_MODE = env.get('VITE_DEV_MODE') === 'true';
