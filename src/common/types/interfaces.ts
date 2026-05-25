export interface FindOneProps {
  query: any;
  select?: string;
  populate?: any[];
}
export interface FindManyProps {
  query: any;
  select?: string;
  limit?: number;
  skip?: number;
}

export interface CreateOneProps {
  dto: any;
  populate?: any[];
}
