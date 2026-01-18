# Seed Scripts

## seed-stalls.ts

This script generates and inserts stalls and layouts for all exhibitions in your Supabase database.

### Prerequisites

1. ✅ All migrations have been run (exhibitions table exists)
2. ✅ Environment variables are set in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Usage

```bash
npm run seed-stalls
```

### What it does

1. **Fetches exhibitions** from your Supabase database
2. **Generates stalls** for each exhibition using the same layout logic as the app:
   - Floor 1: 46 stalls (outer frame + inner block)
   - Floor 2: 46 stalls (outer frame + inner block)
   - Total: 92 stalls per exhibition
3. **Inserts stalls** into the `stalls` table
4. **Inserts layouts** into the `stall_layouts` table with positioning data

### Exhibition Configurations

The script uses these configurations (matching your existing data):

- **Business - Kings Crown**: KB/KBF prefixes, ₹25,000 base rent
- **Education - Kings Crown**: KE/KEF prefixes, ₹18,000 base rent  
- **Education - Old City**: CB/CBF prefixes, ₹35,000 base rent

### Safety Features

- ✅ Checks if stalls already exist before inserting (won't duplicate)
- ✅ Processes exhibitions in batches (50 stalls at a time)
- ✅ Provides detailed progress output
- ✅ Skips exhibitions without matching configuration

### Output Example

```
🌱 Starting stall seeding process...

📋 Fetching exhibitions from database...
✅ Found 3 exhibition(s)

🏢 Processing: Business - Kings Crown (550e8400-...)
   Prefixes: KB (Floor 1), KBF (Floor 2)
   Base Rent: ₹25,000

   📦 Generated 92 stalls (46 Floor 1, 46 Floor 2)
   ✅ Inserted batch 1 (50 stalls)
   ✅ Inserted batch 2 (42 stalls)
   📐 Inserting 92 layouts...
   ✅ Successfully seeded 92 stalls and layouts for Business - Kings Crown

🎉 Seeding completed successfully!
```

### Troubleshooting

**Error: "No exhibitions found"**
- Make sure you've run the migrations first
- Check that `004_seed_data.sql` was executed

**Error: "Missing environment variables"**
- Verify your `.env` file exists in the project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set

**Error: "Stalls already exist"**
- The script will skip exhibitions that already have stalls
- To re-seed, you'll need to delete existing stalls first (via Supabase dashboard or SQL)

### Re-running the Script

The script is **idempotent** - it's safe to run multiple times. It will:
- Skip exhibitions that already have stalls
- Only insert stalls for exhibitions without existing data
