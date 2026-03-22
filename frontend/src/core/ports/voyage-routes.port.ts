import type { MaritimeRoute } from '../domain/route.js';

export type SetBaselineResult = {
  route: MaritimeRoute;
  achievedGco2ePerMj: number;
};

export interface VoyageRoutesPort {
  listRoutes(): Promise<MaritimeRoute[]>;
  setBaseline(routeId: string, baselineGco2ePerMj: number): Promise<SetBaselineResult>;
}
