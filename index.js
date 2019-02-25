const puppeteer = require('puppeteer');


const EMAIL_ADDRESS = '';
const PASSWORD = '';


(async () => {
    const browser = await puppeteer.launch({ headless: true, ignoreDefaultArgs: ['--enable-automation'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36');
    await page.goto('https://accounts.google.com/ServiceLogin/identifier?service=mail&passive=true&rm=false&continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ss=1&scc=1&ltmpl=default&ltmplcache=2&emr=1&osid=1&flowName=GlifWebSignIn&flowEntry=AddSession');
    await page.waitFor('#identifierNext');
    const elementHandle = await page.$('input');
    await elementHandle.type(EMAIL_ADDRESS);
    await page.evaluate(() => {
        document.querySelector('#identifierNext').click();
    });
    // Wait for next pageload
    await page.waitForNavigation({ waitUntil: 'networkidle2'});
    await page.waitFor('input[type="password"]');
    await page.waitFor('#passwordNext');
    const pw = await page.$('input[type="password"]');
    await pw.type(PASSWORD);
    await page.evaluate(() => {
        document.querySelector('#passwordNext').click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitFor('input[name="q"]');
    

    const searchbox = await page.$('input[name="q"]');
    await searchbox.type('ola receipt from: ola share after: 2018/04/01');
    await searchbox.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    let sum = 0;
    sum = await process(page, sum, browser);
    console.log('Going to page 2');
    await page.goto(page.url() + '/p2')
    await page.waitFor(5000);
    console.log('Starting process');
    sum = await process(page, sum, browser);
    console.log('Going to page 3');
    await page.goto(page.url() + '/p3')
    await page.waitFor(5000);
    sum = await process(page, sum, browser);
    process.exit(0);

})();


async function process(page, sum, browser) {
    return new Promise(async (resolve, reject) => {
        let selectors = await page.$$('div[role="main"] table tbody tr');
        console.log(selectors.length);

        // await page.$$eval('div[role="main"] > table > tbody', trs => trs.map((tr) => {
        //     console.log(tr.innerHTML);
        // }));

        for (row of selectors) {
            // let box = await row.boundingBox();
            // console.log(box);
            // await page.mouse.click(parseFloat(box.x), parseFloat(box.y));
            await row.click();
            console.log('row clicked');
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            } catch (err) {
                continue;
            }

            let htmlContent = await page.$eval('div[style="margin:0;padding:0"]', (element) => {
                return element.innerHTML
            });
            const newpage = await browser.newPage();
            await newpage.setContent(htmlContent);

            let pdftitle = await page.$eval('span[style="background-color:#ffffff;padding-left:0px;padding-right:0px;font-size:12px;font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif"', (element) => {
                return element.innerHTML
            });
            pdftitle = pdftitle.trim();
            console.log(pdftitle);

            let amount = await page.$eval('td[style="font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;font-size:40px;font-weight:bold;color:#000000"', (element) => {
                return element.innerHTML
            });
            amount = amount.replace(/<\/?[^>]+(>|$)/g, "");
            amount = amount.trim();
            amount = amount.substr(1, amount.length);
            sum += parseFloat(amount);
            await newpage.pdf({path: 'output/' + pdftitle + '.pdf', format: 'A4'});
            await newpage.close();
            await page.goBack()
            await page.waitFor('div[role="main"] table tbody tr');
            console.log('sum=', sum);
        }

        resolve(sum);
    });

}