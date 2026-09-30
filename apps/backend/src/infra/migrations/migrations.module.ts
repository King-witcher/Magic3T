import { DynamicModule, Module, Type } from '@nestjs/common'
import { MigrationRunnerService } from './migration-runner.service'
import { RUNTIME_MIGRATIONS_KEY, RuntimeMigration } from './runtime-migration'

@Module({})
export class MigrationModule {
  static register(migrations: Type<RuntimeMigration>[]): DynamicModule {
    return {
      module: MigrationModule,
      providers: [
        ...migrations,
        {
          provide: RUNTIME_MIGRATIONS_KEY,
          inject: migrations,
          useFactory: (...instances: RuntimeMigration[]) => instances,
        },
        MigrationRunnerService,
      ],
      exports: [MigrationRunnerService],
    }
  }
}
