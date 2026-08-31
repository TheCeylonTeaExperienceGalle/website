# TCTE Monthly GA4 Report

Automated monthly analytics report for **The Ceylon Tea Experience**. Pulls data from GA4, generates an HTML report, and emails it to the client.

## One-time setup

### 1. Google Cloud service account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (e.g. `TCTE Analytics Reporting`)
3. Enable **Google Analytics Data API**
4. Create a **Service account** → download JSON key
5. Save the key outside the repo, e.g. `~/secrets/tcte-ga4-reporter.json`

### 2. Grant GA4 access

1. GA4 → **Admin → Property access management**
2. Add the service account email as **Viewer**

### 3. Get the numeric Property ID

GA4 → **Admin → Property settings → Property ID** (digits only, e.g. `123456789`)

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. **Never commit `.env` or the JSON key.**

### 5. Install dependencies

```bash
npm install
```

## Run the report

**Previous calendar month (default):**
```bash
npm run report:monthly
```

**Generate HTML only (no email):**
```bash
npm run report:monthly:dry
```

**Specific month:**
```bash
npm run report:monthly -- --month=2026-08
```

Reports are saved to:
```
output/reports/TCTE-GA4-Report-YYYY-MM.html
```

## What the report includes

- Overview metrics (sessions, users, new users, engagement) vs previous month
- Booking events: `whatsapp_enquiry`, `sms_landing`, blog events
- Traffic channels and top source/medium
- SMS campaign breakdown (when `utm_source=sms` traffic exists)
- Top pages

## Schedule monthly (GitHub Actions — recommended)

The repo includes `.github/workflows/ga4-monthly-report.yml`. It runs automatically on the **1st of each month at 9:00 AM (Colombo time)** and can also be triggered manually from **Actions → GA4 Monthly Report → Run workflow**.

### One-time: add GitHub secrets

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `GA4_PROPERTY_ID` | Numeric GA4 property ID (e.g. `536583074`) |
| `GA4_SERVICE_ACCOUNT_JSON` | Full contents of the service account `.json` key file |
| `REPORT_TO` | Primary recipient (e.g. `tcte.galle@gmail.com`) |
| `REPORT_CC` | Optional CC, comma-separated (e.g. `info.expace@gmail.com`) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail address used to send |
| `SMTP_PASS` | Gmail app password (16 characters, spaces OK) |
| `SMTP_FROM` | e.g. `TCTE Reports <tcte.galle@gmail.com>` |

Optional **Variables** (Settings → Secrets and variables → Actions → Variables): `GA4_MEASUREMENT_ID`, `REPORT_CLIENT_NAME`, `REPORT_SITE_URL`.

After secrets are saved, push this workflow to `main` (or your default branch). Use **Run workflow** once to verify before waiting for the 1st.

Each run also saves the HTML report as a workflow **artifact** (90-day retention) in case email delivery fails.

### Alternative: macOS cron

If you prefer running locally instead:

```cron
0 9 1 * * cd /path/to/website && /usr/local/bin/npm run report:monthly >> output/reports/cron.log 2>&1
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing GA4_PROPERTY_ID` | Copy `.env.example` → `.env` and fill values |
| `Permission denied` on GA4 | Add service account email in GA4 property access |
| `Invalid credentials` | Check `GOOGLE_APPLICATION_CREDENTIALS` path |
| Email fails | Use `--dry-run` first; verify SMTP app password |

## Security

- `.env` and `secrets/` are gitignored
- Generated reports in `output/reports/` are gitignored
- Use a dedicated reporting Gmail/ SMTP account with app password
