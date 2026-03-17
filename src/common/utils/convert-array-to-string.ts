export const convertArrayToString = (arr: any[], dotFailed) =>
  arr?.length ? arr?.map((el) => el[dotFailed])?.join(' • ') : '';

export const convertArrayToStringV2 = (arr: any[]) =>
  arr?.length ? arr?.join(' • ') : '';
