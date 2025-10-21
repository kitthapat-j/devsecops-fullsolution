const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runTest() {
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(new chrome.Options().addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage'))
    .build();

  try {
    await driver.get('http://localhost:3000'); 
    let welcomeMessage = await driver.findElement(By.css('body')).getText();
    if (welcomeMessage.includes('Hello DevSecOps World!')) {
      console.log('✅ Functional Test Passed.');
    } else {
      console.error('❌ Functional Test Failed.');
      process.exit(1);
    }
  } finally {
    await driver.quit();
  }
}
runTest().catch(err => { process.exit(1); });