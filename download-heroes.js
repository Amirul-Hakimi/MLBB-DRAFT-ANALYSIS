const fs = require('fs');
const path = require('path');
const https = require('https');

const { HERO_DATASET } = require('./public/js/hero-data.js');
const targetDir = path.join(__dirname, 'public', 'assets', 'heroes');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Fetch helper with headers
function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchBuffer(res.headers.location));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

// Normalize name string for matching
function normalizeName(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
    console.log('📡 Fetching hero directory from Mobile Legends Fandom Wiki...');
    const apiUrl = 'https://mobile-legends.fandom.com/api.php?action=parse&page=List_of_heroes&prop=text&format=json';

    let rawHtml = '';
    try {
        const rawJsonBuffer = await fetchBuffer(apiUrl);
        const parsed = JSON.parse(rawJsonBuffer.toString());
        rawHtml = parsed.parse.text['*'];
    } catch (e) {
        console.error('Failed to query Fandom API. Falling back to direct HTML...');
        const pageBuffer = await fetchBuffer('https://mobile-legends.fandom.com/wiki/List_of_heroes');
        rawHtml = pageBuffer.toString();
    }

    // Regex to extract hero link and image URL from table cells
    const heroRegex = /<a\s+href="\/wiki\/([^"]+)"[^>]*>\s*<img[^>]+(?:data-src|src)="([^"]+)"/gi;
    const fandomHeroes = new Map();

    let match;
    while ((match = heroRegex.exec(rawHtml)) !== null) {
        let heroName = decodeURIComponent(match[1]).replace(/_/g, ' ');
        let imgUrl = match[2];

        // Clean Fandom image thumbnail parameters to get clean base image
        imgUrl = imgUrl.split('/revision/')[0];
        
        fandomHeroes.set(normalizeName(heroName), imgUrl);
    }

    console.log(`🔍 Discovered ${fandomHeroes.size} hero portraits from Fandom Wiki.`);
    console.log(`📥 Downloading portraits for your ${HERO_DATASET.length} dataset heroes...\n`);

    let downloadedCount = 0;

    for (let i = 0; i < HERO_DATASET.length; i++) {
        const hero = HERO_DATASET[i];
        const dest = path.join(targetDir, `${hero.id}.png`);
        const normId = normalizeName(hero.id);
        const normName = normalizeName(hero.name);

        let imgUrl = fandomHeroes.get(normId) || fandomHeroes.get(normName);

        // Fallback search if direct key differs slightly
        if (!imgUrl) {
            for (const [fName, fUrl] of fandomHeroes.entries()) {
                if (fName.includes(normId) || normId.includes(fName)) {
                    imgUrl = fUrl;
                    break;
                }
            }
        }

        if (imgUrl) {
            try {
                const imgBuffer = await fetchBuffer(imgUrl);
                fs.writeFileSync(dest, imgBuffer);
                downloadedCount++;
                console.log(`[✓] (${downloadedCount}/${HERO_DATASET.length}) Downloaded: ${hero.name}`);
            } catch (err) {
                console.warn(`[!] Failed downloading ${hero.name}: ${err.message}`);
            }
        } else {
            console.warn(`[?] No wiki image matched for: ${hero.name}`);
        }

        // Small delay to respect rate limits
        await new Promise(r => setTimeout(r, 40));
    }

    console.log(`\n🎉 ALL DONE! Successfully saved ${downloadedCount} portraits to public/assets/heroes/\n`);
}

run();