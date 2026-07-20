import { Config } from '@backstage/config';
import { DEFAULT_API_URL, DEFAULT_APP_URL } from './urls';

/** @public */
export const MASSDRIVER_CONFIG_KEY = 'massdriver';

/** @public */
export interface MassdriverPublicConfig {
  organizationId: string;
  baseUrl: string;
  appUrl: string;
}

/** @public */
export interface MassdriverConfig extends MassdriverPublicConfig {
  apiToken: string;
}

/** @public */
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

/** @public */
export const readMassdriverConfig = (config: Config): MassdriverConfig => {
  const massdriver = config.getConfig(MASSDRIVER_CONFIG_KEY);
  return {
    ...readMassdriverPublicConfig(config),
    apiToken: massdriver.getString('apiToken'),
  };
};
