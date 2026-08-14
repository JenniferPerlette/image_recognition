"use client"

export function saveToken(token: string) {
  try { localStorage.setItem('auth_token', token) } catch (e) {}
}

export function clearToken() {
  try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_current') } catch (e) {}
}

export function getToken() {
  try { return localStorage.getItem('auth_token') } catch (e) { return null }
}

export async function login(email: string, password: string) {
  // Simulate auth: check stored users
  const usersJson = localStorage.getItem('auth_users') || '[]'
  const users = JSON.parse(usersJson)
  const u = users.find((x: any) => x.email === email && x.password === password)
  if (!u) throw new Error('Identifiants invalides')
  const token = Math.random().toString(36).slice(2)
  saveToken(token)
  try { localStorage.setItem('auth_current', email) } catch (e) {}
  return { token }
}

export async function register(email: string, password: string) {
  const usersJson = localStorage.getItem('auth_users') || '[]'
  const users = JSON.parse(usersJson)
  if (users.find((x: any) => x.email === email)) throw new Error('Utilisateur déjà existant')
  users.push({ email, password })
  localStorage.setItem('auth_users', JSON.stringify(users))
  const token = Math.random().toString(36).slice(2)
  saveToken(token)
  try { localStorage.setItem('auth_current', email) } catch (e) {}
  return { token }
}

export function getCurrentEmail() {
  try { return localStorage.getItem('auth_current') } catch (e) { return null }
}

export function setCurrentEmail(email: string) {
  try { localStorage.setItem('auth_current', email) } catch (e) {}
}

export function clearCurrentEmail() {
  try { localStorage.removeItem('auth_current') } catch (e) {}
}

export function getCurrentUser() {
  const email = getCurrentEmail()
  if (!email) return null
  try {
    const profilesJson = localStorage.getItem('auth_profiles') || '{}'
    const profiles = JSON.parse(profilesJson)
    const p = profiles[email]
    if (p) return { email, firstName: p.firstName, lastName: p.lastName }
    // fallback derive firstName from email
    const firstName = email.split('@')[0].split(/[._-]/)[0] || ''
    return { email, firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1), lastName: '' }
  } catch (e) {
    return { email, firstName: '', lastName: '' }
  }
}

export function updateProfile(email: string, firstName: string, lastName: string) {
  try {
    const profilesJson = localStorage.getItem('auth_profiles') || '{}'
    const profiles = JSON.parse(profilesJson)
    profiles[email] = { firstName, lastName }
    localStorage.setItem('auth_profiles', JSON.stringify(profiles))
    return true
  } catch (e) { return false }
}

export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const usersJson = localStorage.getItem('auth_users') || '[]'
  const users = JSON.parse(usersJson)
  const idx = users.findIndex((x: any) => x.email === email)
  if (idx === -1) throw new Error('Utilisateur introuvable')
  if (users[idx].password !== currentPassword) throw new Error('Mot de passe actuel incorrect')
  users[idx].password = newPassword
  localStorage.setItem('auth_users', JSON.stringify(users))
  return true
}
