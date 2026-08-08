export interface FindOneProps {
  query: any;
  populate?: any;
  select?: any;
  sort?: any;
}

export interface FindManyProps {
  query: any;
  populate?: any[];
  select?: string;
  limit?: number;
  skip?: number;
  sort?: any;
}

export interface CreateOneProps {
  dto: any;
  populate?: any[];
}
export interface UpdateOneProps {
  query: any;
  dto: any;
  populate?: any[];
}
export interface DeleteOneProps {
  query: any;
  populate?: any[];
}
