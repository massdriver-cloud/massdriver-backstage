export interface Config {
  massdriver?: {
    /**
     * Massdriver organization id.
     * @visibility frontend
     */
    organizationId: string;

    /**
     * Web app origin used to build deep-links back into Massdriver. Point this at
     * a self-hosted Massdriver instance to override. Defaults to
     * https://app.massdriver.cloud.
     * @visibility frontend
     */
    appUrl?: string;
  };
}
