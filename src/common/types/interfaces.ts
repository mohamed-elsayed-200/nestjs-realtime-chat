import { ClientSession } from 'mongoose';

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
  payload: any;
  session?: ClientSession;
}

export interface InsertManyProps {
  payload: any;
  session?: ClientSession;
}
