export function imgUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `/uploads/${path}`;
}
