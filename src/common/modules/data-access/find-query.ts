import { QueryDto } from '../dto/query.dto';

export interface PaginationOptions {
  model: any;
  modelActions?: {
    select?: string;
    find?: any;
    populate?: any | any[];
    sort?: Record<string, 1 | -1>;
  };
  allowedSearchFields?: string[];
  allowedFilterFields?: string[];
  muiColumns?: { field: string; headerName: string; flex?: number }[];
  excludeFilterValue?: Record<string, any | any[]>;
}

export async function queryWithPagination({
  options,
  query,
}: {
  options: PaginationOptions;
  query: QueryDto;
}) {
  const {
    model,
    allowedSearchFields = [],
    allowedFilterFields = [],
    modelActions = {},
    excludeFilterValue = {},
  } = options;

  const { filter = {}, page = 0, pageSize = 10, search } = query;
  const safePage = page >= 0 ? page : 0;
  const safeLimit = pageSize > 0 ? pageSize : 10;
  const skip = safePage * safeLimit;

  const finalFilter: any = {};

  for (const key in excludeFilterValue) {
    finalFilter[key] = {
      $nin: Array.isArray(excludeFilterValue[key])
        ? excludeFilterValue[key]
        : [excludeFilterValue[key]],
    };
  }

  if (filter && !Array.isArray(filter) && allowedFilterFields.length > 0) {
    for (const key in filter) {
      if (allowedFilterFields.includes(key)) {
        finalFilter[key] = {
          ...finalFilter[key],
          ...(Array.isArray(filter[key]) ? { $in: filter[key] } : { $eq: filter[key] }),
        };
      }
    }
  }

  if (filter && Array.isArray(filter) && allowedFilterFields.length > 0) {
    filter.forEach((f: any) => {
      const { field, operator, value } = f;
      if (!allowedFilterFields.includes(field)) return;

      switch (operator) {
        case 'contains':
          finalFilter[field] = { $regex: value, $options: 'i' };
          break;
        case 'eq':
          finalFilter[field] = value;
          break;
        case 'in':
          finalFilter[field] = { $in: Array.isArray(value) ? value : [value] };
          break;
        case 'nin':
          finalFilter[field] = { $nin: Array.isArray(value) ? value : [value] };
          break;
        case 'gt':
          finalFilter[field] = { $gt: value };
          break;
        case 'lt':
          finalFilter[field] = { $lt: value };
          break;
        default:
          break;
      }
    });
  }

  if (search && allowedSearchFields.length > 0) {
    finalFilter['$or'] = allowedSearchFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }

  if (modelActions.find && typeof modelActions.find === 'object') {
    Object.assign(finalFilter, modelActions.find);
  }

  let q = model.find(finalFilter).skip(skip).limit(safeLimit);
  if (modelActions.select) q = q.select(modelActions.select);
  if (modelActions.populate) q = q.populate(modelActions.populate);
  if (modelActions.sort) q = q.sort(modelActions.sort);
  if (!modelActions.sort) q = q.sort({ createdAt: -1 });

  const [items, total] = await Promise.all([q.lean(), model.countDocuments(finalFilter)]);

  return {
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit),
    },
    items,
  };
}
