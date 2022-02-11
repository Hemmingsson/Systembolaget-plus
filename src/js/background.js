import 'regenerator-runtime/runtime'

const cleanBackgroundImageUrl = (string) => string.split(/"/)[1].replace(/^\/+/, '')
const kFormatter = (num) => Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)

const fetchData = async (query) => {
    return new Promise((resolve, reject) => {

        let url, parser

        if (query.type === 'wine') {
            url = `https://www.vivino.com/search/wines?q=${encodeURIComponent(query.name)}`
            parser = parseWine
        }
        if (query.type === 'beer') {
            url = `https://untappd.com/search?q=${encodeURIComponent(query.name)}&type=beer&sort=all`
            parser = parseBeer
        }
        if (query.type === 'liquor') {
            url = `https://distiller.com/search?term=${encodeURIComponent(query.name)}`
            parser = parseLiquor
        }

        fetch(url).then((response) => {
            if (response.status === 429) return reject('Hit rate limit')
            return response.text();
        }).then((html) => {

            const HTMLparser = new DOMParser();
            const doc = HTMLparser.parseFromString(html, 'text/html');
            const data = parser(doc)
            console.table(data);

            if (data) return resolve(data)
            return reject('NOT FOUND')
        })
    })
}

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
    rating = rating.replace(',', '.')
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
    rating = rating.replace(/[{()}]/g, '')
    rating = parseFloat(rating)
    rating = Math.round(rating * 10) / 10
    rating = rating.toFixed(1)

    // Image
    const image = elFirstResult.querySelector('.label img').getAttribute("href")

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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.name) {
        fetchData(request).then((response) => {
            sendResponse([response, null])
        }).catch((err) => {
            sendResponse([null, err])
        })
    }
    return true
});