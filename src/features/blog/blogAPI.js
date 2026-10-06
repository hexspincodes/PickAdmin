import { api1, unwrap } from '../../api/axiosClient';
import { toFormData } from '../../utils/toFormData';

// GET /api/v1/blog/blogs-admin — Backend1, JWT, SA/Marketing, paginated
export const getAdminBlogs = (page = 1, search = '') =>
  unwrap(api1.get('/api/v1/blog/blogs-admin', { params: { page, search } }));

// POST /api/v1/blog/ — Backend1, JWT, SA/Marketing, multipart/form-data
export const createBlog = (fields) =>
  unwrap(api1.post('/api/v1/blog/', toFormData(fields), { headers: { 'Content-Type': 'multipart/form-data' } }));

// PUT /api/v1/blog/edit/:id — Backend1, JWT, SA/Marketing, multipart/form-data.
// The `:id` path param is actually treated as the blog's slug by editBlogService, not its _id.
export const editBlog = (slug, fields) =>
  unwrap(api1.put(`/api/v1/blog/edit/${slug}`, toFormData(fields), { headers: { 'Content-Type': 'multipart/form-data' } }));

// DELETE /api/v1/blog/:id — Backend1, JWT, SA/Marketing. Same slug-not-_id quirk as edit.
export const deleteBlog = (slug) => unwrap(api1.delete(`/api/v1/blog/${slug}`));

// PUT /api/v1/blog/delete-comment — Backend1, JWT, SA/Marketing.
// Despite the route's documented `blog_id` field, the controller actually reads `slug`.
export const deleteBlogComment = (slug, comment_id) =>
  unwrap(api1.put('/api/v1/blog/delete-comment', { slug, comment_id }));

// GET /api/v1/blog/slug-check — Backend1, JWT, SA/Marketing.
// Despite the route name, the controller reads a `title` query param and returns a
// freshly generated unique slug for it — it's a "generate slug from title" helper,
// not a boolean uniqueness check.
export const generateSlugFromTitle = (title) =>
  unwrap(api1.get('/api/v1/blog/slug-check', { params: { title } }));
