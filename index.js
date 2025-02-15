const puppeteer = require('puppeteer');

async function scrapeCompanies() {
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    await page.goto('https://www.agritechnica.com/en/exhibitors-products#/search/f=h-entity_orga;v_sg=0;v_fg=0;v_fpa=FUTURE', { waitUntil: 'networkidle2' });

    // Selectors (Update these if incorrect)
    const cookieAcceptSelector = '.button.ccm--save-settings.ccm--button-primary.ccm--ctrl-init';
    const companySelector = '.EWP5KKC-w-J';
    const loadMoreSelector = '.EWP5KKC-u-c';

    // Handle Cookie Consent
    try {
        const cookieButton = await page.$(cookieAcceptSelector);
        if (cookieButton) {
            console.log("Clicking the cookie accept button...");
            await cookieButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } catch (error) {  
        console.log("No cookie consent popup found or error clicking it.");
    }

    // Load all companies
    async function loadAllCompanies() { 
        let previousHeight = 0;
        while (true) {
            try {
                await new Promise(resolve => setTimeout(resolve, 3000));
                // await page.evaluate(()=> document.querySelector('.EWP5KKC-u-c').scrollIntoView({ behavior: 'smooth' }));
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await new Promise(resolve => setTimeout(resolve, 500));
                const exists = await page.$('.EWP5KKC-u-c') !== null;
                previousHeight == 0 && console.log(`Button exists: ${exists}`); 

                const loadMoreButton = await page.$$(loadMoreSelector);
                previousHeight == 0 && console.log("load more button assigned");
                if (loadMoreButton[1]) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    previousHeight == 0 && console.log("loadMoreButton present");
                    await page.evaluate(el => el.scrollIntoView(), loadMoreButton[1]);
                    console.log("scrolled into view");
                    await page.evaluate(el => el.click(), loadMoreButton[1]);
                    // await loadMoreButton.click(); 
                    console.log("load more button clicked");
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                let newHeight = await page.evaluate(() => document.body.scrollHeight);
                console.log("new height:" + newHeight + " previous Height:" + previousHeight);
                if (newHeight < previousHeight) {
                    console.log("new height is smaller than previous height");
                    break;
                };
                previousHeight = newHeight;
            } catch (error) { 
                console.log("No more companies to load or error encountered.", error);
                break;
            }
        }
    }

    await loadAllCompanies();

    // Debugging: Check if companies exist
    await page.waitForSelector(companySelector, { timeout: 5000 }).catch(() => {
        console.log("Company elements not found! Check selector.");
    });

    const companyElements = await page.$$(companySelector);
    console.log(`Found ${companyElements.length} companies.`);

    let companyData = [];

    for (let i = 0; i < companyElements.length; i++) {
        try {
            if(i == 36) {
                continue;
            }
            console.log(`Scraping company ${i + 1}...`);

            const companies = await page.$$(companySelector);

            await companies[i].click();
            console.log("company clicked")
            await new Promise(resolve => setTimeout(resolve, 3000));

            let details = await page.evaluate(() => {
                const emailSelector = '.EWP5KKC-y-Eb.EWP5KKC-H-c.EWP5KKC-y-b:nth-child(2) .EWP5KKC-y-Fb > div > div > div:nth-child(5) div:nth-child(4) a';
                
            // Select multiple elements with different address-related itemprop values
            const addressProps = ['streetAddress', 'addressLocality', 'addressCountry', 'postalCode'];
            const addressElements = addressProps.flatMap(prop => Array.from(document.querySelectorAll(`[itemprop=${prop}]`)));

            // Extract innerHTML and join them into a single formatted address
            const address = addressElements.map(el => el.innerText.trim()).join(', ') || 'N/A';

                return {
                    name: document.querySelector('[itemprop=legalName]')?.innerText || 'N/A',
                    address: address,
                    phone: document.querySelector('[itemprop=telephone]')?.innerText || 'N/A',
                    email: document.querySelector(emailSelector)?.innerText || 'N/A',
                    website: document.querySelector('[itemprop=url]')?.href || 'N/A',
                };
            });

            companyData.push(details);
            console.log(details);

            await page.goBack({ waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (err) {
            console.log(`Error scraping company ${i + 1}:`, err);
        }
    }

    console.log("Scraped Data:", companyData);
    await browser.close();
}

scrapeCompanies();


// const puppeteer = require('puppeteer');

// async function scrapeCompanies() {
//     const browser = await puppeteer.launch({ headless: false }); // Set true in production
//     const page = await browser.newPage();
//     await page.goto('https://www.agritechnica.com/en/exhibitors-products#/search/f=h-entity_orga;v_sg=0;v_fg=0;v_fpa=FUTURE', { waitUntil: 'networkidle0' });

//     // Selectors (Modify these as per your site's structure)
//     const cookieAcceptSelector = '.button.ccm--save-settings.ccm--button-primary.ccm--ctrl-init';
//     const companySelector = '.EWP5KKC-w-J'; // Change this
//     const loadMoreSelector = '.EWP5KKC-u-c'; // Change this if needed
//     const backButtonSelector = '.EWP5KKC-y-1'; // Modify if needed

//     // Handle Cookie Consent
//     try {
//         const cookieButton = await page.$(cookieAcceptSelector);
//         if (cookieButton) {
//             console.log("Clicking the cookie accept button...");
//             await cookieButton.click();
//             await page.waitForTimeout(2000); // Wait for any page reload after clicking
//         }
//     } catch (error) {  
//         console.log("No cookie consent popup found or error clicking it.");
//     }

//     // Function to load all companies
//     async function loadAllCompanies() {
//         let previousHeight = 0;
//         while (true) {
//             try {
//                 await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
//                 await page.waitForTimeout(2000);

//                 const loadMoreButton = await page.$(loadMoreSelector);
//                 if (loadMoreButton) {
//                     await loadMoreButton.click();
//                     await page.waitForTimeout(3000);
//                 }

//                 let newHeight = await page.evaluate(() => document.body.scrollHeight);
//                 if (newHeight === previousHeight) break;
//                 previousHeight = newHeight; 
//             } catch (error) {
//                 console.log("No more companies to load or error encountered.", error);
//                 break;
//             }
//         }
//     }

//     // Load all companies before extracting details
//     await loadAllCompanies();

//     // Get all company elements
//     const companyElements = await page.$$(companySelector);
//     console.log(`Found ${companyElements.length} companies.`);

//     let companyData = [];

//     for (let i = 0; i < companyElements.length; i++) {
//         try {
//             console.log(`Scraping company ${i + 1}...`);

//             const companies = await page.$$(companySelector);
//             await companies[i].click(); // Click the company item
//             await page.waitForTimeout(3000); // Wait for page transition

//             // Extract company details
//             let details = await page.evaluate(() => {
//                 return {
//                     name: document.querySelector('.company-name')?.innerText || 'N/A',
//                     address: document.querySelector('.company-address')?.innerText || 'N/A',
//                     phone: document.querySelector('.company-phone')?.innerText || 'N/A',
//                     website: document.querySelector('.company-website a')?.href || 'N/A',
//                 };
//             });

//             companyData.push(details);
//             console.log(details);

//             // Go back to the company list
//             await page.goBack({ waitUntil: 'networkidle0' });
//             await page.waitForTimeout(2000); // Wait for page to reload

//         } catch (err) {
//             console.log(`Error scraping company ${i + 1}:`, err);
//         }
//     }

//     console.log("Scraped Data:", companyData);
//     await browser.close();
// }

// scrapeCompanies();
