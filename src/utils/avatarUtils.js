const getInitial = (name = '', email = '') => {
  const safeName = String(name || '').trim()
  if (safeName) return safeName[0].toUpperCase()
  const safeEmail = String(email || '').trim()
  if (safeEmail) return safeEmail[0].toUpperCase()
  return 'N'
}

const buildAvatarSvg = (letter) => {
  const safeLetter = encodeURIComponent(letter)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><defs><radialGradient id='red' cx='30%25' cy='30%25' r='70%25'><stop offset='0%25' stop-color='%23ff4a6f'/><stop offset='65%25' stop-color='%23ff0037'/><stop offset='100%25' stop-color='%23b20025'/></radialGradient></defs><rect width='100%25' height='100%25' fill='%230a0206'/><circle cx='70' cy='70' r='58' fill='url(%23red)'/><text x='50%25' y='50%25' text-anchor='middle' dominant-baseline='central' font-size='58' font-family='\"Trebuchet MS\", \"Segoe UI\", sans-serif' font-weight='800' fill='%23ffffff'>${safeLetter}</text></svg>`
  return `data:image/svg+xml;utf8,${svg}`
}

const getAvatarDataUrl = (name, email) => buildAvatarSvg(getInitial(name, email))

export { getInitial, getAvatarDataUrl }
