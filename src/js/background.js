export const ratingSearchUrl = ({ name, type }) => {
    if (typeof name !== 'string' || !name.trim() || name.length > 300) {
        throw new Error('Invalid product name')
    }
    const query = encodeURIComponent(name.trim())
    if (type === 'wine') return `https://www.vivino.com/search/wines?q=${query}`
    if (type === 'beer') return `https://untappd.com/search?q=${query}&type=beer&sort=all`
    if (type === 'liquor') return `https://distiller.com/search?term=${query}`
    throw new Error('Unsupported product type')
}

export const fetchRatingHtml = async (query, fetcher = fetch) => {
    const response = await fetcher(ratingSearchUrl(query), {
        credentials: 'omit', signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`Rating search failed (${response.status})`)
    return response.text()
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request?.action !== 'rating-search' || sender.id !== chrome.runtime.id) return false
        fetchRatingHtml(request).then(
            html => sendResponse([html, null]),
            error => sendResponse([null, String(error.message || error)]),
        )
        return true
    })
}
