import sentinel from 'sentinel-js'
import stringSimilarity from 'string-similarity'
import 'regenerator-runtime/runtime'

const ratingElementClass = 'product-rating'

const isWineBox = (string) => {
    const sbBoxString = 'vinlåda'
    const isBox = string?.toLowerCase().includes(sbBoxString)
    return isBox
}

const getData = (query) => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(query, (messageResponse) => {
        const [response, error] = messageResponse;
        if (response) {
            return resolve(response);
        }
        reject(error);
    });
});

const getFromLocal = (query) => new Promise((resolve, reject) => {
    chrome.storage.local.get([query], (items) => {
        const data = Object.values(items)[0]
        // Check if data is older then a week
        if (data) {
            const weekUnix = 604800000
            const monthUnix = weekUnix * 4
            const weekAgoUnix = Date.now() - monthUnix
            if (weekAgoUnix > data.date) resolve(undefined)
        }
        resolve(data)
    });
})

const create = async (name, sbType, elWrapper, elItem, productType) => {

    if (isWineBox(sbType)) {
        elWrapper.remove()
        return
    }

    //Get data from local or make request to vivino
    let data = await getFromLocal(name)
    if (!data) {
        data = await getData({
            name: name,
            type: productType
        })
        chrome.storage.local.set({
            [name]: data
        });
        data.request = "External"
        console.table(data)
    } else {
        data.request = "Local"
        console.table(data)
    }

    // Check returned name similarity
    if (data.type === 'wine') {
        const similarity = stringSimilarity.compareTwoStrings(name, data.name);
        const similarityTreshold = .5
        const isNotSimilar = similarity < similarityTreshold
        if (isNotSimilar) {
            elWrapper.remove()
            return
        }
    }
    elWrapper.setAttribute('title', data.source)
    elWrapper.classList.add(data.type)
    elWrapper.href = data.url
    elWrapper.target = "_blank"
    elWrapper.innerHTML = `
        <div class="info">
            <svg class="logo vivino" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 18c0-1 .9-2 2-2a2 2 0 1 1-2 2m-.5 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2M5.2 14c0-1 .9-2 2-2 1 0 2 1 2 2a2 2 0 1 1-4 0m4.4-5.9a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2c0-1 .9-2 2-2M12 4a2 2 0 1 1 0 4 2 2 0 0 1-2-2c0-1 .9-2 2-2M14.4 0a2 2 0 1 1 0 4 2 2 0 0 1-2-2c0-1.1 1-2 2-2m-2.8 18a2 2 0 0 1-2 2 2 2 0 0 1-2-2c0-1 1-2 2-2a2 2 0 0 1 2 2m-1.5-4c0-1 .8-2 2-2 1 0 2 1 2 2a2 2 0 1 1-4 0m4.3-2a2 2 0 0 1-2-1.9c0-1 1-2 2-2a2 2 0 0 1 2 2 2 2 0 0 1-2 2m4.4 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
            <svg class="logo untappd" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m11 13.3-5.82 8.12c-.3.41-.8.63-1.31.57a4.76 4.76 0 0 1-2.2-.88 4.77 4.77 0 0 1-1.53-1.8 1.4 1.4 0 0 1 .12-1.42L6.1 9.77c.27-.39.64-.7 1.06-.93l1.14-.6c.23-.12.44-.28.61-.48.56-.63 2.05-2.28 4.7-4.95l.04-.21a.13.13 0 0 1 .1-.1l.15-.04c.06-.01.1-.07.1-.14l-.02-.18c0-.07.05-.14.13-.14.17 0 .51.05 1 .4.48.34.64.65.69.82a.13.13 0 0 1-.1.16l-.17.04a.13.13 0 0 0-.1.14l.01.15c0 .05-.02.1-.06.13l-.19.1C13.5 7.32 12.42 9.27 12 9.99c-.13.23-.22.48-.26.73l-.2 1.28c-.08.47-.26.92-.54 1.3zm12.74 4.59L17.9 9.77c-.27-.39-.64-.7-1.06-.93l-1.14-.6a2.14 2.14 0 0 1-.61-.48l-.59-.65a.09.09 0 0 0-.14.02 96.04 96.04 0 0 1-1.74 3.21c-.1.15-.15.32-.18.49-.05.36-.05.73 0 1.1l.01.06c.08.47.26.92.54 1.3l5.82 8.13c.3.4.8.63 1.3.57a4.76 4.76 0 0 0 2.2-.88 4.76 4.76 0 0 0 1.54-1.8c.22-.46.18-1-.12-1.42M8.3 3.38l.17.04c.06.02.1.08.1.14l-.01.15c0 .05.02.1.06.13l.19.1.87 1.73c.02.05.09.06.13.02.43-.47.96-1.03 1.58-1.67a.14.14 0 0 0 0-.2l-1-1-.04-.22a.13.13 0 0 0-.1-.1l-.15-.04a.13.13 0 0 1-.1-.14l.02-.18A.13.13 0 0 0 9.9 2c-.18 0-.52.04-1 .4-.49.34-.65.65-.7.82-.02.07.02.14.1.16" fill-rule="evenodd"/></svg>
            <svg class="logo distiller" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m11.5 0 .2.6c2.2 5.3 4.3 9.3 6.1 12A7.4 7.4 0 0 1 11.5 24 7.5 7.5 0 0 1 4 16.6c0-1.5.4-2.9 1.2-4 1.9-2.8 4-7 6.3-12.6Z" fill-rule="evenodd"/></svg>
            <div class="name">${data.name}</div>
        </div>
        <div class="score">
            <div class="reviews">${data.reviews} betyg</div>
            <div class="rating">${data.rating}</div>
            <div class="stars">
                <svg viewBox="0 0 576 512" title="star">
                <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                </svg><svg viewBox="0 0 576 512" title="star">
                <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                </svg><svg viewBox="0 0 576 512" title="star">
                <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                </svg><svg viewBox="0 0 576 512" title="star">
                <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                </svg><svg viewBox="0 0 576 512" title="star">
                <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" />
                </svg>
                <div data-width="${data.invertedPercentage}%" class="cover"></div>
            </div>
        </div>
    `

    // Remove element if data is missing
    if (!data.reviews) elWrapper.querySelector('.reviews').remove()
    if (!data.rating || isNaN(data.rating) || data.rating === '0.0') {
        elWrapper.querySelector('.rating').remove()
        elWrapper.querySelector('.stars').remove()
    }

    // Add extra margin on search page
    if (elWrapper.classList.contains("search-page")) elItem.querySelector('a')?.classList.add('inner-card')

    // Show the new element
    elWrapper.classList.add('visible')

    ratingObserver.observe(elWrapper)

    

    // Image
    const elImage = await waitForImage(elItem)

    // Fix left margin aligned with image
    const elImageParent = elImage?.parentElement?.parentElement
    if (!elImage) return
    if (elImageParent) {
        const imageWidth = elImageParent.clientWidth
        elItem.style.setProperty('--image-width', `${imageWidth}px`)
        // If aligment breaks? change this back to global variable
    }

    // Replace Missing
    const isMissingImage = elImage?.src.includes('placeholder-wine-bottle')
    if(!isMissingImage) return 
    const imageStyle = window.getComputedStyle(elImage)

    // Create new image
    const elNewImage = document.createElement("figure")
    let caption
    if(productType === 'wine') caption = 'vivino'
    if(productType === 'beer') caption = 'untappd'
    if(productType === 'liquor') caption = 'distiller'
    elNewImage.innerHTML = `
    <img src="${data.image}">
    <figcaption>${caption}</figcaption>`

    elNewImage.classList.add('inserted-image')

    elNewImage.style.width = imageStyle.maxWidth
    elNewImage.style.height = imageStyle.maxHeight

    elImage.parentElement.append(elNewImage)
    elImage.style.display = 'none'

}

const waitForImage = (elItem) =>  new Promise((resolve, reject) => {
    const check = () =>{
        const elImage = elItem.querySelector('img')
        if(elImage) return resolve(elImage)
        setTimeout(() => {
            console.log('check');
            check()
        }, 500);
    }
    check()
});

const insertImage = (targetEl, imageUrl) =>{

}

const dump = () =>{
        // Set image if missing
    const elImage = elItem.querySelector('img')
    const elImageParent = elImage?.parentElement?.parentElement
    if (!elImage) return

    if (elImageParent) {
        const imageWidth = elImageParent.clientWidth
        document.documentElement.style.setProperty('--image-width', `${imageWidth}px`)
    }

    const isEmpty = elImage.src.includes('placeholder-wine-bottle')
    elImageParent.classList.add('image')
    elImageParent.style.setProperty('--url', `url('https://${data.image}')`);

    if (isEmpty) {
        elImage.style.opacity = 0
        elImageParent.classList.add('show')
    }
}

const ratingObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return
        observer.unobserve(entry.target);
        const cover = entry.target.querySelector('.cover')
        if (cover) cover.style.width = cover.dataset.width
    });
}, {
    rootMargin: '0px 0px -50px 0px'
});

const insertOnProdcutPage = (elTrigger) => {

    const wineUrl = location.href.includes('/produkt/vin/')
    const beerUrl = location.href.includes('/produkt/ol/')
    const liquorUrl = location.href.includes('/produkt/sprit/')

    if (!wineUrl && !beerUrl && !liquorUrl) return

    let productType
    if (wineUrl) productType = 'wine'
    if (beerUrl) productType = 'beer'
    if (liquorUrl) productType = 'liquor'

    if(elTrigger.innerText !== 'Handla i butik') return

    // Find elements to insert relative to
    const parre = elTrigger.closest('.react-no-print');
    const target = elTrigger.closest('.react-no-print');
    const targetParent = target.parentElement

    // Create rating element
    const elRatingWrapper = document.createElement("a")
    elRatingWrapper.classList.add(ratingElementClass)
    elRatingWrapper.classList.add('product-page')

    const elExcisitingRating = document.getElementsByClassName(ratingElementClass)[0]
    if (elExcisitingRating) elExcisitingRating.remove()

    targetParent.insertBefore(elRatingWrapper, target)

    // Systembolaget Data
    const sbName = document.querySelector("main h1")?.innerText.trim()
    const sbType = document.querySelector("main h4")?.parentElement.parentElement.innerText.trim()

    create(sbName, sbType, elRatingWrapper, targetParent.parentElement, productType)

}

const insertOnSearchPage = (elTrigger) => {

    // Set product type
    const url = elTrigger.getAttribute("href")
    const wineUrl = url.includes('/produkt/vin/')
    const beerUrl = url.includes('/produkt/ol/')
    const liquorUrl = url.includes('/produkt/sprit/')

    let productType
    if (wineUrl) productType = 'wine'
    if (beerUrl) productType = 'beer'
    if (liquorUrl) productType = 'liquor'

    if (!location.href.includes('/sok/')) return

    // Prepare sb markup
    const elCard = elTrigger.parentElement
    elCard.classList.add('card')

    // Create rating element
    const elRatingWrapper = document.createElement("a")
    elRatingWrapper.classList.add(ratingElementClass)
    elRatingWrapper.classList.add('search-page')

    if (elCard.getElementsByClassName(ratingElementClass)[0]) return

    elCard.appendChild(elRatingWrapper);

    // Systembolaget Data
    const sbName = elTrigger.querySelector("h3")?.innerText.trim()
    const sbType = elTrigger.querySelector("h4")?.innerText.trim()

    create(sbName, sbType, elRatingWrapper, elCard, productType)
}

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return
        observer.unobserve(entry.target);
        insertOnSearchPage(entry.target)
    });
}, {
    rootMargin: '0px 0px 100px 0px'
});

export const init = () => {
    const wineItemSelector = 'main a[href*="/vin"], main a[href*="/ol"], main a[href*="/sprit"]'
    sentinel.on(wineItemSelector, (el) => observer.observe(el))

    const winePageSelector = 'h3'
    sentinel.on(winePageSelector, insertOnProdcutPage)
}