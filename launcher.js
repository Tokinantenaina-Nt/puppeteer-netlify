const puppeteer = require('puppeteer-core');
const path = require('path');
const random = Math.floor(Math.random() * 100);
async function capture() {
    const browser = await puppeteer.launch({
        // executablePath: path.join(__dirname, 'palemoon', 'palemoon.exe'),
        executablePath: path.join(__dirname, 'Slimjet', 'slimjet.exe'),
        // headless: true
    });
    const page = await browser.newPage();

    //await page.goto('https://www.getintopc.com');
    // await page.goto('https://www.flashscore.mobi/?s=2');
    await page.evaluate(() => {
        window.location.assign('https://www.flashscore.mobi/?s=2');
    });
    // await page.waitForNavigation();

    // await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: `screenshot-${random}.png` });

    await browser.close();
}

module.exports = capture;
