# Twitter/X Scraper Bot

A GitHub Actions bot that scrapes your Twitter/X following timeline (chronological, no algorithm) and saves tweets to markdown files. Perfect for people who want to archive their timeline or avoid X's algorithmic feed.

## Why?

- **No algorithms**: Get tweets from people you follow in chronological order
- **Personal archive**: Keep a historical record of your timeline
- **API limitations**: X's API doesn't provide easy access to your chronological following feed
- **Privacy**: Your credentials stay in GitHub Secrets, tweets are saved to your private repo

## Features

- Runs automatically every 30 minutes via GitHub Actions
- Uses headless Chrome (Puppeteer) to scrape tweets
- Saves tweets to markdown files (one file per day)
- Handles X/Twitter login automatically
- Organized by date for easy browsing
- Includes tweet metrics (likes, retweets, replies)

## Setup

### 1. Fork or Clone This Repository

Fork this repository or clone it to your GitHub account.

### 2. Configure GitHub Secrets

Go to your repository **Settings → Secrets and variables → Actions** and add the following secrets:

#### Required Secrets:

- `TWITTER_USERNAME` - Your X/Twitter username (without @)
- `TWITTER_PASSWORD` - Your X/Twitter password

#### Optional Secrets:

- `TWITTER_VERIFICATION` - Your phone number or email (if X asks for additional verification during login)

### 3. Configure Variables (Optional)

Go to **Settings → Secrets and variables → Actions → Variables** tab and add:

- `MAX_TWEETS` - Maximum number of tweets to scrape per run (default: 100)

### 4. Enable GitHub Actions

1. Go to the **Actions** tab in your repository
2. Click "I understand my workflows, go ahead and enable them"
3. The scraper will run automatically every 30 minutes

### 5. Manual Trigger (Optional)

You can manually trigger the scraper:

1. Go to **Actions** tab
2. Select "Twitter Scraper" workflow
3. Click "Run workflow"

## How It Works

1. **GitHub Actions** triggers every 30 minutes (or manually)
2. **Puppeteer** launches a headless Chrome browser
3. **Login** to X/Twitter using your credentials from GitHub Secrets
4. **Navigate** to the Following timeline (chronological feed)
5. **Scrape** tweets, usernames, timestamps, and metrics
6. **Save** to markdown file in `tweets/YYYY-MM-DD.md`
7. **Commit** and push the markdown file to your repository

## Output Format

Tweets are saved in `tweets/` directory with the following format:

```
tweets/
  ├── 2026-01-24.md
  ├── 2026-01-25.md
  └── ...
```

Each markdown file contains:

```markdown
# Twitter Timeline - 2026-01-24

> Scraped at: 1/24/2026, 3:30:00 PM
> Total tweets: 100

---

## 1. @username

**Posted:** 2026-01-24T15:20:00.000Z

This is the tweet content...

*💬 5 | 🔁 12 | ❤️ 234*

[View on X](https://twitter.com/username/status/1234567890)

---
```

## Configuration

### Adjust Scraping Frequency

Edit `.github/workflows/scrape.yml` and modify the cron schedule:

```yaml
schedule:
  # Every 30 minutes (default)
  - cron: '*/30 * * * *'

  # Every hour
  # - cron: '0 * * * *'

  # Every 2 hours
  # - cron: '0 */2 * * *'

  # Every day at 9 AM
  # - cron: '0 9 * * *'
```

[Cron syntax reference](https://crontab.guru/)

### Adjust Number of Tweets

Set the `MAX_TWEETS` variable in GitHub Actions:

- Go to **Settings → Secrets and variables → Actions → Variables**
- Set `MAX_TWEETS` to your desired number (e.g., `200`)

Or modify `scraper.js` directly.

## Local Testing

You can run the scraper locally for testing:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export TWITTER_USERNAME="your_username"
   export TWITTER_PASSWORD="your_password"
   export MAX_TWEETS="50"
   export HEADLESS="false"  # Set to false to see browser
   ```

3. Run the scraper:
   ```bash
   npm run scrape
   ```

## Troubleshooting

### Login Fails

- Check that `TWITTER_USERNAME` and `TWITTER_PASSWORD` are correct
- X may require additional verification - set `TWITTER_VERIFICATION` secret
- X may have changed their login flow - the selectors in `scraper.js` may need updating

### No Tweets Scraped

- X may have changed their HTML structure - update selectors in `scraper.js`
- Check the error screenshot (`error-screenshot.png`) if generated
- Try running locally with `HEADLESS="false"` to see what's happening

### Rate Limiting

- X may rate limit your account if scraped too frequently
- Consider reducing the frequency (e.g., every 2 hours instead of 30 minutes)
- The scraper includes random delays to appear more human-like

### Verification Required

If X asks for email/phone verification during login:

1. Add your phone number or email to `TWITTER_VERIFICATION` secret
2. The format should match what X expects (e.g., `+1234567890` for phone)

## Security Notes

- Your credentials are stored securely in GitHub Secrets (encrypted)
- The scraper only accesses your own account
- Tweets are saved to your private repository (make sure it's private!)
- Never commit your credentials to the repository

## Legal & Ethical Considerations

- This scraper is for **personal use only**
- You're accessing your own account and timeline
- Respect X/Twitter's Terms of Service
- Don't use this for mass scraping or commercial purposes
- Don't share or redistribute scraped content without permission

## Limitations

- X may change their website structure, breaking the scraper
- Anti-bot measures may block the scraper occasionally
- Large timelines may take longer to scrape
- GitHub Actions has usage limits (2000 minutes/month for free tier)

## Contributing

Issues and pull requests are welcome! This is a personal project, but improvements are appreciated.

## License

MIT License - feel free to modify and use as you wish.

## Disclaimer

This tool is provided as-is for personal archival purposes. Use at your own risk. The author is not responsible for any issues arising from its use, including potential violations of X/Twitter's Terms of Service.
