export interface Config {
  massdriver?: {
    /**
     * Massdriver organization id.
     * @visibility frontend
     */
    organizationId: string;

    /**
     * Service-account bearer token the backend uses to call the Massdriver v2
     * GraphQL API. Never exposed to the frontend.
     * @visibility secret
     */
    apiToken: string;

    /**
     * API origin for GraphQL. Point this at a self-hosted Massdriver instance to
     * override. Defaults to https://api.massdriver.cloud.
     * @visibility frontend
     */
    baseUrl?: string;

    /**
     * Web app origin used to build deep-links back into Massdriver. Point this at
     * a self-hosted Massdriver instance to override. Defaults to
     * https://app.massdriver.cloud.
     * @visibility frontend
     */
    appUrl?: string;
  };
}
