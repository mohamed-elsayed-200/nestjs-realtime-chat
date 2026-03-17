export const extractPublicId = (url: string) => {
  if (!url) return '';
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return '';

    let folderParts = parts.slice(uploadIndex + 1);
    if (folderParts[0]?.match(/^v\d+$/)) folderParts.shift();

    const fileNameWithExt = folderParts.pop();
    if (!fileNameWithExt) return '';

    const fileName = fileNameWithExt.split('.')[0];
    const folder = folderParts.join('/');

    return folder ? `${folder}/${fileName}` : fileName;
  } catch {
    return '';
  }
};
export const extractRowPublicId = (url: string): string => {
  if (!url) return '';

  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return '';

    let publicIdParts = parts.slice(uploadIndex + 1);

    if (publicIdParts[0]?.startsWith('v')) {
      publicIdParts.shift();
    }

    return publicIdParts.join('/');
  } catch {
    return '';
  }
};
