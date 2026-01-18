/**
 * Seed Stalls and Layouts Script
 * 
 * This script generates and inserts stalls and layouts for all exhibitions
 * in the Supabase database.
 * 
 * Usage: npm run seed-stalls
 * Or: npx tsx scripts/seed-stalls.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Exhibition configurations (matching the original logic)
const EXHIBITION_CONFIGS: Record<string, {
  stallPrefix1: string;
  stallPrefix2: string;
  baseRent: number;
}> = {
  'Business - Kings Crown': {
    stallPrefix1: 'KB',
    stallPrefix2: 'KBF',
    baseRent: 25000,
  },
  'Education - Kings Crown': {
    stallPrefix1: 'KE',
    stallPrefix2: 'KEF',
    baseRent: 18000,
  },
  'Education - Old City': {
    stallPrefix1: 'CB',
    stallPrefix2: 'CBF',
    baseRent: 35000,
  },
};

// Generate fixed layout stalls (same logic as multiExhibitionData.ts)
function generateFixedLayoutStalls(
  exhibitionId: string,
  floor: number,
  prefix: string,
  baseRent: number
): Array<{
  stall_number: string;
  zone: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  base_rent: number;
}> {
  const stalls: Array<{
    stall_number: string;
    zone: string;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    base_rent: number;
  }> = [];

  let stallIndex = 0;

  // Location-based pricing multipliers
  const getPriceMultiplier = (x: number, y: number, isInner: boolean): number => {
    if (isInner) {
      return 1.2; // Inner block premium
    }
    if (floor === 2) {
      return 1.25; // Floor 2 premium
    }
    // Floor 1 perimeter
    if (y === 0 || y === 6) {
      return 1.0; // Top/bottom rows
    }
    return 1.1; // Side rows (slightly premium)
  };

  // OUTER FRAME - Top Row: 12 stalls (columns 0-11, row 0)
  for (let x = 0; x < 12; x++) {
    stallIndex++;
    const isInner = false;
    stalls.push({
      stall_number: `${prefix}${String(stallIndex).padStart(2, '0')}`,
      zone: `Floor ${floor}`,
      position_x: x,
      position_y: 0,
      width: 1,
      height: 1,
      base_rent: Math.round(baseRent * getPriceMultiplier(x, 0, isInner)),
    });
  }

  // OUTER FRAME - Left Vertical Side: 5 stalls (column 0, rows 1-5)
  for (let y = 1; y <= 5; y++) {
    stallIndex++;
    const isInner = false;
    stalls.push({
      stall_number: `${prefix}${String(stallIndex).padStart(2, '0')}`,
      zone: `Floor ${floor}`,
      position_x: 0,
      position_y: y,
      width: 1,
      height: 1,
      base_rent: Math.round(baseRent * getPriceMultiplier(0, y, isInner)),
    });
  }

  // OUTER FRAME - Right Vertical Side: 5 stalls (column 11, rows 1-5)
  for (let y = 1; y <= 5; y++) {
    stallIndex++;
    const isInner = false;
    stalls.push({
      stall_number: `${prefix}${String(stallIndex).padStart(2, '0')}`,
      zone: `Floor ${floor}`,
      position_x: 11,
      position_y: y,
      width: 1,
      height: 1,
      base_rent: Math.round(baseRent * getPriceMultiplier(11, y, isInner)),
    });
  }

  // OUTER FRAME - Bottom Row: 10 stalls with gap
  // Left segment: 5 stalls (columns 0-4, row 6)
  for (let x = 0; x <= 4; x++) {
    stallIndex++;
    const isInner = false;
    stalls.push({
      stall_number: `${prefix}${String(stallIndex).padStart(2, '0')}`,
      zone: `Floor ${floor}`,
      position_x: x,
      position_y: 6,
      width: 1,
      height: 1,
      base_rent: Math.round(baseRent * getPriceMultiplier(x, 6, isInner)),
    });
  }
  // Right segment: 5 stalls (columns 7-11, row 6) - gap at columns 5-6
  for (let x = 7; x <= 11; x++) {
    stallIndex++;
    const isInner = false;
    stalls.push({
      stall_number: `${prefix}${String(stallIndex).padStart(2, '0')}`,
      zone: `Floor ${floor}`,
      position_x: x,
      position_y: 6,
      width: 1,
      height: 1,
      base_rent: Math.round(baseRent * getPriceMultiplier(x, 6, isInner)),
    });
  }

  // INNER BLOCK - 2 rows × 6 columns = 12 stalls
  // Positioned centrally: columns 3-8, rows 2-3
  for (let y = 2; y <= 3; y++) {
    for (let x = 3; x <= 8; x++) {
      stallIndex++;
      const isInner = true;
      stalls.push({
        stall_number: `${prefix}${String(stallIndex).padStart(2, '0')}`,
        zone: `Floor ${floor}`,
        position_x: x,
        position_y: y,
        width: 1,
        height: 1,
        base_rent: Math.round(baseRent * getPriceMultiplier(x, y, isInner)),
      });
    }
  }

  return stalls;
}

async function seedStalls() {
  console.log('🌱 Starting stall seeding process...\n');

  try {
    // Fetch all exhibitions
    console.log('📋 Fetching exhibitions from database...');
    const { data: exhibitions, error: exhibitionsError } = await supabase
      .from('exhibitions')
      .select('*')
      .order('start_date');

    if (exhibitionsError) {
      throw exhibitionsError;
    }

    if (!exhibitions || exhibitions.length === 0) {
      console.error('❌ No exhibitions found in database!');
      console.error('Please run the migrations first to seed exhibitions.');
      process.exit(1);
    }

    console.log(`✅ Found ${exhibitions.length} exhibition(s)\n`);

    // Process each exhibition
    for (const exhibition of exhibitions) {
      const config = EXHIBITION_CONFIGS[exhibition.name];
      if (!config) {
        console.warn(`⚠️  No configuration found for exhibition: ${exhibition.name}`);
        console.warn('   Skipping this exhibition...\n');
        continue;
      }

      console.log(`🏢 Processing: ${exhibition.name} (${exhibition.id})`);
      console.log(`   Prefixes: ${config.stallPrefix1} (Floor 1), ${config.stallPrefix2} (Floor 2)`);
      console.log(`   Base Rent: ₹${config.baseRent.toLocaleString()}\n`);

      // Check if stalls already exist for this exhibition
      const { data: existingStalls, error: checkError } = await supabase
        .from('stalls')
        .select('id')
        .eq('exhibition_id', exhibition.id)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (existingStalls && existingStalls.length > 0) {
        console.log(`   ⚠️  Stalls already exist for this exhibition. Skipping...\n`);
        continue;
      }

      // Generate stalls for both floors
      const floor1Stalls = generateFixedLayoutStalls(
        exhibition.id,
        1,
        config.stallPrefix1,
        config.baseRent
      );
      const floor2Stalls = generateFixedLayoutStalls(
        exhibition.id,
        2,
        config.stallPrefix2,
        config.baseRent
      );
      const allStalls = [...floor1Stalls, ...floor2Stalls];

      console.log(`   📦 Generated ${allStalls.length} stalls (${floor1Stalls.length} Floor 1, ${floor2Stalls.length} Floor 2)`);

      // Insert stalls in batches
      const batchSize = 50;
      const stallIds: string[] = [];
      const layouts: Array<{
        stall_id: string;
        position_x: number;
        position_y: number;
        width: number;
        height: number;
      }> = [];

      for (let i = 0; i < allStalls.length; i += batchSize) {
        const batch = allStalls.slice(i, i + batchSize);
        const stallsToInsert = batch.map(stall => ({
          exhibition_id: exhibition.id,
          stall_number: stall.stall_number,
          zone: stall.zone,
          base_rent: stall.base_rent,
          is_blocked: false,
          notes: null,
        }));

        const { data: insertedStalls, error: insertError } = await supabase
          .from('stalls')
          .insert(stallsToInsert)
          .select('id, stall_number');

        if (insertError) {
          throw insertError;
        }

        if (insertedStalls) {
          // Map stall numbers to IDs and create layouts
          batch.forEach((stall, idx) => {
            const insertedStall = insertedStalls.find(s => s.stall_number === stall.stall_number);
            if (insertedStall) {
              stallIds.push(insertedStall.id);
              layouts.push({
                stall_id: insertedStall.id,
                position_x: stall.position_x,
                position_y: stall.position_y,
                width: stall.width,
                height: stall.height,
              });
            }
          });
        }

        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} stalls)`);
      }

      // Insert layouts
      console.log(`   📐 Inserting ${layouts.length} layouts...`);
      const { error: layoutError } = await supabase
        .from('stall_layouts')
        .insert(layouts);

      if (layoutError) {
        throw layoutError;
      }

      console.log(`   ✅ Successfully seeded ${allStalls.length} stalls and layouts for ${exhibition.name}\n`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seedStalls();
