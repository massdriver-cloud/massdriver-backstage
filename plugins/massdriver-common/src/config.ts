import { Config } from '@backstage/config';
import { DEFAULT_API_URL, DEFAULT_APP_URL } from './urls';

/** Root config key for all Massdriver plugin settings. @public */
export const MASSDRIVER_CONFIG_KEY = 'massdriver';

/**
 * Non-secret Massdriver settings, safe to read on the frontend.
 *
 * @public
 */
export interface MassdriverPublicConfig {
  organizationId: string;
  /** API origin for GraphQL. Defaults to {@link DEFAULT_API_URL}. */
  baseUrl: string;
  /** Web app origin for deep-links. Defaults to {@link DEFAULT_APP_URL}. */
  appUrl: string;
}

/**
 * Full Massdriver settings including the backend-only service-account token.
 *
 * @public
 */
export interface MassdriverConfig extends MassdriverPublicConfig {
  apiToken: string;
}

/**
 * Read the non-secret Massdriver settings. Safe on the frontend, where
 * `apiToken` is filtered out by config visibility.
 *
 * @public
 */
export const readMassdriverPublicConfig = (
  config: Config,
): MassdriverPublicConfig => {
  const massdriver = config.getConfig(MASSDRIVER_CONFIG_KEY);
  return {
    organizationId: massdriver.getString('organizationId'),
    baseUrl: massdriver.getOptionalString('baseUrl') ?? DEFAULT_API_URL,
    appUrl: massdriver.getOptionalString('appUrl') ?? DEFAULT_APP_URL,
  };
};

/**
 * Read the full Massdriver settings, including the service-account token.
 * Backend-only — the token is never exposed to the frontend.
 *
 * @public
 */
export const readMassdriverConfig = (config: Config): MassdriverConfig => {
  const massdriver = config.getConfig(MASSDRIVER_CONFIG_KEY);
  return {
    ...readMassdriverPublicConfig(config),
    apiToken: massdriver.getString('apiToken'),
  };
};
