export function getAnonId() {
  const cookieName = `__anonSession=`
  const decodedCookies = decodeURIComponent(document.cookie)
  const cookies = decodedCookies.split(';')

  let cookieValue = null

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.indexOf(cookieName) === 0) {
      cookieValue = cookie.substring(cookieName.length, cookie.length)
    }
  }

  if (!cookieValue) return null

  try {
    const decodedCookie = decodeURIComponent(window.atob(cookieValue))
    const parsedCookie = JSON.parse(decodedCookie)

    return parsedCookie.anon.anonId
  } catch (e) {
    return null
  }
}
