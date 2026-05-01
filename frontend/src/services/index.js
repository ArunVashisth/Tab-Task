import api from './api'

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

export const projectService = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  updateMemberRole: (projectId, userId, role) => api.put(`/projects/${projectId}/members/${userId}/role`, { role }),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`)
}

export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  remove: (id) => api.delete(`/tasks/${id}`)
}

export const userService = {
  getAll: () => api.get('/users'),
  getMeWithProjects: () => api.get('/users/me-with-projects'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePassword: (data) => api.put('/users/password', data),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteAvatar: () => api.delete('/users/avatar')
}

export const invitationService = {
  send: (data) => api.post('/invitations/send', data),
  getMine: () => api.get('/invitations/mine'),
  getSent: () => api.get('/invitations/sent'),
  respond: (id, status) => api.put(`/invitations/${id}/respond`, { status }),
  search: (q) => api.get('/invitations/search', { params: { q } })
}
