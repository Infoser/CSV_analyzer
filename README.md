<<<<<<< HEAD
# GrowEasy AI CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from any valid CSV format. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Universal CSV Support**: Handles Facebook Lead Exports, Google Ads, Excel sheets, Real Estate CRM exports, Sales reports, and manually created spreadsheets
- **AI-Powered Field Mapping**: Uses NVIDIA NIM / OpenAI-compatible API to intelligently map arbitrary CSV columns to GrowEasy CRM fields
- **Step-by-Step Flow**: Upload → Preview → Confirm → Results
- **Responsive Tables**: Horizontal/vertical scrolling, sticky headers, pagination, search, column visibility
- **Dark Mode**: Full dark mode support
- **Progress Indicators**: Real-time progress during AI processing
- **Export Results**: Download extracted leads as CSV
- **Error Handling**: Comprehensive error handling and validation

## CRM Fields Extracted

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date |
| `name` | Lead name |
| `email` | Primary email |
| `country_code` | Country code (e.g., +91) |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | Lead status (GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE) |
| `crm_note` | Notes/remarks |
| `data_source` | Source (leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots) |
| `possession_time` | Property possession time |
| `description` | Additional description |

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **AI**: NVIDIA NIM / OpenAI-compatible API
- **CSV Parsing**: PapaParse
- **UI Components**: Custom components with Lucide React icons
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- NVIDIA NIM API key (or OpenAI-compatible API)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd csv-importer

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your API key to .env.local
# OPENAI_API_KEY=your_api_key_here
# OPENAI_API_BASE=https://integrate.api.nvidia.com/v1  # For NVIDIA NIM
# OPENAI_MODEL=meta/llama-3.1-70b-instruct  # Or your preferred model

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your NVIDIA NIM / OpenAI API key | Required |
| `OPENAI_API_BASE` | API base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` |

For NVIDIA NIM:
```env
OPENAI_API_BASE=https://integrate.api.nvidia.com/v1
OPENAI_MODEL=meta/llama-3.1-70b-instruct
```

## Project Structure

```
csv-importer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── preview/route.ts    # CSV preview endpoint
│   │   │   └── extract/route.ts    # AI extraction endpoint
│   │   ├── globals.css             # Global styles
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main page
│   ├── components/
│   │   ├── CSVUpload.tsx           # File upload with drag & drop
│   │   ├── DataTable.tsx           # Preview table component
│   │   └── ResultsTable.tsx        # Results table with expandable rows
│   ├── lib/
│   │   ├── ai.ts                   # AI extraction logic
│   │   ├── csv.ts                  # CSV parsing utilities
│   │   └── utils.ts                # Helper functions
│   └── types/
│       └── index.ts                # TypeScript types
├── public/
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## API Endpoints

### POST /api/preview
Upload and parse CSV for preview.

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "success": true,
  "result": {
    "headers": ["Name", "Email", "Phone"],
    "rows": [{"Name": "John", "Email": "john@example.com", "Phone": "+1234567890"}],
    "totalRows": 100,
    "previewRows": [...]
  }
}
```

### POST /api/extract
Process CSV with AI to extract CRM leads.

**Request**: `multipart/form-data` with `file` field

**Response**:
```json
{
  "success": true,
  "result": {
    "data": [...],           // Extracted leads
    "skipped": [...],        // Skipped records
    "total_imported": 95,
    "total_skipped": 5
  }
}
```

## AI Prompt Engineering

The AI extraction uses a carefully crafted system prompt that:

1. **Defines all CRM fields** with descriptions
2. **Provides mapping rules** for common variations (phone formats, name splits, dates)
3. **Handles country code extraction** from phone numbers
4. **Sets confidence thresholds** for skipping invalid records
5. **Enforces valid enum values** for status and source fields
6. **Returns structured JSON** with mappings, extracted leads, and skipped records

The system also includes a **fallback heuristic mapper** that works without an API key for testing.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t csv-importer .
docker run -p 3000:3000 --env-file .env.local csv-importer
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript check
```

## License

MIT License - feel free to use for your own projects.

## Support

For questions or issues, please open a GitHub issue.
=======
# CSV_analyzer
AI-Powered CSV Importer for GrowEasy CRM – Intelligently extracts CRM lead data from any CSV format (Facebook, Google Ads, Excel, real estate exports, etc.) using NVIDIA NIM (LLM) for automatic column mapping. Built with Next.js 14, TypeScript, Tailwind CSS, and PapaParse.
>>>>>>> df0a663e0d1fd5cca261dc2f124ef7f01ceb1de4
