import {
  coreServices,
  createBackendModule,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import {
  MASSDRIVER_CONFIG_KEY,
  readMassdriverConfig,
} from '@massdriver-cloud/backstage-plugin-massdriver-common';
import { MassdriverEntityProvider } from './provider';

const DEFAULT_SCHEDULE: SchedulerServiceTaskScheduleDefinition = {
  frequency: { minutes: 30 },
  timeout: { minutes: 3 },
};

const DEFAULT_OWNER = 'group:default/massdriver';

/**
 * Catalog backend module that registers the {@link MassdriverEntityProvider}.
 *
 * @public
 */
export const catalogModuleMassdriver = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'massdriver',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ logger, config, scheduler, catalog }) {
        if (!config.has(MASSDRIVER_CONFIG_KEY)) {
          logger.info(
            'Massdriver config not present; skipping catalog entity provider',
          );
          return;
        }

        const massdriverConfig = readMassdriverConfig(config);
        const scheduleConfig = config.getOptionalConfig(
          `${MASSDRIVER_CONFIG_KEY}.schedule`,
        );
        const schedule = scheduleConfig
          ? readSchedulerServiceTaskScheduleDefinitionFromConfig(scheduleConfig)
          : DEFAULT_SCHEDULE;
        const ownerRef =
          config.getOptionalString(`${MASSDRIVER_CONFIG_KEY}.defaultOwner`) ??
          DEFAULT_OWNER;

        catalog.addEntityProvider(
          new MassdriverEntityProvider({
            config: massdriverConfig,
            logger,
            ownerRef,
            taskRunner: scheduler.createScheduledTaskRunner(schedule),
          }),
        );
      },
    });
  },
});
