/** Builds a FormData from a flat object. Arrays are JSON-stringified (the API expects
 * JSON array strings for fields like `skills`/`languages`); File/FileList values are
 * appended as-is; nullish values are skipped. */
export function toFormData(fields) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (value instanceof FileList) {
      Array.from(value).forEach((file) => formData.append(key, file));
    } else if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}
