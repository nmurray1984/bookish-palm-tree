const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TWITTER_USERNAME = process.env.TWITTER_USERNAME;
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD;
const MAX_TWEETS = parseInt(process.env.MAX_TWEETS || '100', 10);
const HEADLESS = process.env.HEADLESS !== 'false';

// Helper function to add random delays (more human-like)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomSleep = (min, max) => sleep(Math.floor(Math.random() * (max - min + 1)) + min);

// Get today's date in YYYY-MM-DD format
function getDateString() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

// Ensure tweets directory exists
async function ensureTweetsDir() {
  const dir = path.join(__dirname, 'tweets');
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  return dir;
}

// Save tweets to markdown file
async function saveTweets(tweets, date) {
  const dir = await ensureTweetsDir();
  const filename = path.join(dir, `${date}.md`);

  let content = `# Twitter Timeline - ${date}\n\n`;
  content += `> Scraped at: ${new Date().toLocaleString()}\n`;
  content += `> Total tweets: ${tweets.length}\n\n`;
  content += `---\n\n`;

  tweets.forEach((tweet, index) => {
    content += `## ${index + 1}. @${tweet.username}\n\n`;
    content += `**Posted:** ${tweet.timestamp}\n\n`;
    content += `${tweet.text}\n\n`;
    if (tweet.metrics) {
      content += `*💬 ${tweet.metrics.replies || 0} | 🔁 ${tweet.metrics.retweets || 0} | ❤️ ${tweet.metrics.likes || 0}*\n\n`;
    }
    if (tweet.url) {
      content += `[View on X](${tweet.url})\n\n`;
    }
    content += `---\n\n`;
  });

  await fs.writeFile(filename, content, 'utf-8');
  console.log(`✅ Saved ${tweets.length} tweets to ${filename}`);
  return filename;
}

// Main scraper function
async function scrapeTweets() {
  console.log('🚀 Starting Twitter scraper...');

  // Validate credentials
  if (!TWITTER_USERNAME || !TWITTER_PASSWORD) {
    throw new Error('❌ TWITTER_USERNAME and TWITTER_PASSWORD environment variables must be set');
  }

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();

  try {
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    console.log('📱 Navigating to X/Twitter login page...');
    await page.goto('https://twitter.com/i/flow/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await randomSleep(2000, 4000);

    // Enter username
    console.log('👤 Entering username...');
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 30000 });
    await page.type('input[autocomplete="username"]', TWITTER_USERNAME, { delay: 100 });
    await randomSleep(500, 1000);

    // Click "Next" button
    await page.keyboard.press('Enter');
    await randomSleep(2000, 3000);

    // Sometimes X asks for phone/email verification - handle this
    try {
      const verificationInput = await page.$('input[data-testid="ocfEnterTextTextInput"]');
      if (verificationInput) {
        console.log('📧 Phone/email verification required...');
        // If you have a phone number or email set in env var, you can handle it here
        const verificationValue = process.env.TWITTER_VERIFICATION;
        if (verificationValue) {
          await page.type('input[data-testid="ocfEnterTextTextInput"]', verificationValue, { delay: 100 });
          await randomSleep(500, 1000);
          await page.keyboard.press('Enter');
          await randomSleep(2000, 3000);
        } else {
          console.warn('⚠️ Verification required but TWITTER_VERIFICATION not set');
        }
      }
    } catch (e) {
      // No verification needed, continue
    }

    // Enter password
    console.log('🔑 Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.type('input[type="password"]', TWITTER_PASSWORD, { delay: 100 });
    await randomSleep(500, 1000);

    // Click login
    await page.keyboard.press('Enter');
    console.log('⏳ Logging in...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    await randomSleep(3000, 5000);

    console.log('✅ Successfully logged in!');

    // Navigate to "Following" timeline (chronological)
    console.log('📰 Navigating to Following timeline...');
    await page.goto('https://twitter.com/home', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await randomSleep(2000, 3000);

    // Try to switch to "Following" tab (instead of "For You")
    try {
      const followingTab = await page.waitForSelector('a[role="tab"][href="/home"]', { timeout: 5000 });
      // Look for "Following" text
      const tabs = await page.$$('a[role="tab"]');
      for (const tab of tabs) {
        const text = await tab.evaluate(el => el.textContent);
        if (text.includes('Following')) {
          console.log('🔄 Switching to Following tab...');
          await tab.click();
          await randomSleep(2000, 3000);
          break;
        }
      }
    } catch (e) {
      console.log('ℹ️ Could not find Following tab, using default timeline');
    }

    // Scroll and collect tweets
    console.log(`🔍 Collecting up to ${MAX_TWEETS} tweets...`);
    const tweets = [];
    const seenTweets = new Set();
    let scrollAttempts = 0;
    const maxScrollAttempts = 50;

    while (tweets.length < MAX_TWEETS && scrollAttempts < maxScrollAttempts) {
      // Extract tweets from current view
      const newTweets = await page.evaluate(() => {
        const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
        const results = [];

        tweetElements.forEach(tweet => {
          try {
            // Get username
            const usernameEl = tweet.querySelector('a[role="link"] span');
            const username = usernameEl ? usernameEl.textContent.replace('@', '') : 'unknown';

            // Get tweet text
            const textEl = tweet.querySelector('div[data-testid="tweetText"]');
            const text = textEl ? textEl.textContent : '';

            // Get timestamp
            const timeEl = tweet.querySelector('time');
            const timestamp = timeEl ? timeEl.getAttribute('datetime') : '';

            // Get tweet URL
            const linkEl = tweet.querySelector('a[href*="/status/"]');
            const url = linkEl ? 'https://twitter.com' + linkEl.getAttribute('href') : '';

            // Extract tweet ID from URL
            const tweetId = url.match(/status\/(\d+)/)?.[1] || '';

            // Get metrics (likes, retweets, replies)
            const metricsEls = tweet.querySelectorAll('div[role="group"] button');
            const metrics = {
              replies: 0,
              retweets: 0,
              likes: 0
            };

            metricsEls.forEach((btn, idx) => {
              const text = btn.textContent.trim();
              const count = parseInt(text) || 0;
              if (idx === 0) metrics.replies = count;
              if (idx === 1) metrics.retweets = count;
              if (idx === 2) metrics.likes = count;
            });

            if (tweetId && text) {
              results.push({
                id: tweetId,
                username,
                text,
                timestamp,
                url,
                metrics
              });
            }
          } catch (e) {
            // Skip malformed tweets
          }
        });

        return results;
      });

      // Add new unique tweets
      let addedCount = 0;
      for (const tweet of newTweets) {
        if (!seenTweets.has(tweet.id)) {
          seenTweets.add(tweet.id);
          tweets.push(tweet);
          addedCount++;
          if (tweets.length >= MAX_TWEETS) break;
        }
      }

      console.log(`📊 Collected ${tweets.length} tweets (found ${addedCount} new this scroll)...`);

      // Scroll down
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });

      await randomSleep(1500, 2500);
      scrollAttempts++;

      // If we haven't found new tweets in a while, stop
      if (addedCount === 0) {
        scrollAttempts += 5; // Speed up exit if no new tweets
      }
    }

    console.log(`✅ Collected ${tweets.length} total tweets`);

    // Save tweets to markdown file
    const dateString = getDateString();
    const filename = await saveTweets(tweets, dateString);

    console.log('✨ Scraping completed successfully!');

  } catch (error) {
    console.error('❌ Error during scraping:', error);
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('📸 Error screenshot saved to error-screenshot.png');
    } catch (e) {
      // Ignore screenshot errors
    }
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the scraper
if (require.main === module) {
  scrapeTweets()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { scrapeTweets };
