
const cleanBackgroundImageUrl = (value = '') => {
    const match = value.match(/url\(["']?(.*?)["']?\)/)
    return match ? new URL(match[1], 'https://www.vivino.com').href : undefined
}
const kFormatter = (num) => Number.isFinite(num) ? (Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : num) : undefined

const parseWine = (doc) => {
    const elFirstResult = doc.querySelector('.card')
    if (!elFirstResult) {
        return
    }

    // Name
    const name = elFirstResult.querySelector('.wine-card__name .link-color-alt-grey')?.innerText.trim()

    // Url
    const url = 'https://www.vivino.com' + elFirstResult.querySelector('.wine-card__image-wrapper a')?.getAttribute("href")

    // Rating
    let rating = elFirstResult.querySelector('.average__number')?.innerText.trim()
    rating = rating?.replace(',', '.')
    rating = parseFloat(rating)
    rating = rating.toFixed(1)

    // Reviews
    const reviewsString = elFirstResult.querySelector('.average__stars .text-micro')?.innerText.trim()
    const reviews = kFormatter(parseInt(reviewsString))

    // Image
    const backgroundImage = elFirstResult.querySelector('.wine-card__image')?.style?.backgroundImage
    const image = cleanBackgroundImageUrl(backgroundImage)

    // Inverted Percentage
    const invertedPercentage = 100 - parseInt(rating * 10) * 2

    return {
        type: 'wine',
        name: name,
        url: url,
        rating: rating,
        reviews: reviews,
        image: image,
        invertedPercentage: invertedPercentage,
        date: Date.now(),
        source: 'vivino.com'
    }
}

const parseBeer = (doc) => {

    const elFirstResult = doc.querySelector('.beer-item')
    if (!elFirstResult) {
        return
    }

    // Name
    let name = elFirstResult.querySelector('.name')?.innerText.trim()
    const brewery = elFirstResult.querySelector('.brewery')?.innerText.trim()
    if (name !== brewery) {
        name = name + ' - ' + brewery
    }

    // Url
    const url = 'https://untappd.com' + elFirstResult.querySelector('.name a')?.getAttribute("href")

    // Rating
    let rating = elFirstResult.querySelector('.num')?.innerText.trim()
    rating = rating?.replace(/[{()}]/g, '')
    rating = parseFloat(rating)
    rating = Math.round(rating * 10) / 10
    rating = rating.toFixed(1)

    // Image
    const image = elFirstResult.querySelector('.label img')?.getAttribute("src")

    // Inverted Percentage
    const invertedPercentage = 100 - (rating * 10) * 2

    return {
        type: 'beer',
        name: name,
        url: url,
        rating: rating,
        image: image,
        invertedPercentage: invertedPercentage,
        date: Date.now(),
        source: 'untappd.com'
    }

}

const parseLiquor = (doc) => {
    const elFirstResult = doc.querySelector('.spirit')
    if (!elFirstResult) {
        return
    }

    // Name
    let name = elFirstResult.querySelector('.name')?.innerText.trim()

    // Url
    const url = 'https://distiller.com' + elFirstResult.querySelector('a')?.getAttribute("href")

    // Rating
    let rating = elFirstResult.querySelector('.community-rating')?.innerText.trim()
    rating = parseFloat(rating)
    rating = Math.round(rating * 10) / 10
    rating = rating.toFixed(1)

    // Image
    const backgroundImage = elFirstResult.querySelector('.image')?.style?.backgroundImage
    const image = cleanBackgroundImageUrl(backgroundImage)

    // Inverted Percentage
    const invertedPercentage = 100 - (rating * 10) * 2

    return {
        type: 'liquor',
        name: name,
        url: url,
        rating: rating,
        image: image,
        invertedPercentage: invertedPercentage,
        date: Date.now(),
        source: 'distiller.com'
    }

}

export const parseRating = (html, type) => {
    const parser = { wine: parseWine, beer: parseBeer, liquor: parseLiquor }[type]
    if (!parser) throw new Error('Unsupported product type')
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const data = parser(doc)
    if (!data?.name || !data.url || data.url.includes('undefined') || !Number.isFinite(Number(data.rating))) {
        throw new Error('No rating found')
    }
    return data
}
