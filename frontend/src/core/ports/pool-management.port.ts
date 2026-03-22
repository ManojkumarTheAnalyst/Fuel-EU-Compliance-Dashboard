import type { PoolDto } from '../domain/pool';

export type CreatePoolInput = {
  name: string;
  reportingYear: number;
  memberRouteIds: string[];
};

export type CreatePoolResult = {
  pool: PoolDto;
};

export interface PoolManagementPort {
  createPool(input: CreatePoolInput): Promise<CreatePoolResult>;
}
