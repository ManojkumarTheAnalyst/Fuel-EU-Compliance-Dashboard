export type PoolMemberRefDto = {
  routeId: string;
};

export type PoolDto = {
  id: string;
  name: string;
  reportingYear: number;
  members: PoolMemberRefDto[];
  createdAt: string;
};
