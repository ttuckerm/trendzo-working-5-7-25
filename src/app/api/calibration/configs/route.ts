import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CALIBRATIONS, CalibrationConfig } from '@/lib/calibration/score-calibrator';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Get current calibration configurations
 */
export async function GET() {
  try {
    // Try to load from database first
    const dbConfigs = await loadCalibrationFromDB();
    
    if (dbConfigs && Object.keys(dbConfigs).length > 0) {
      return NextResponse.json({
        success: true,
        configs: dbConfigs,
        source: 'database'
      });
    }
    
    // Fall back to defaults
    return NextResponse.json({
      success: true,
      configs: DEFAULT_CALIBRATIONS,
      source: 'defaults'
    });
  } catch (error: any) {
    console.error('Failed to load calibration configs:', error);
    return NextResponse.json({
      success: true,
      configs: DEFAULT_CALIBRATIONS,
      source: 'defaults',
      warning: error.message
    });
  }
}

/**
 * Update calibration configurations
 */
export async function POST(request: NextRequest) {
  try {
    const { configs } = await request.json();
    
    if (!configs || typeof configs !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid configs format' },
        { status: 400 }
      );
    }
    
    // Validate configs
    for (const [componentId, config] of Object.entries(configs)) {
      const cfg = config as CalibrationConfig;
      if (typeof cfg.scale !== 'number' || typeof cfg.offset !== 'number') {
        return NextResponse.json(
          { success: false, error: `Invalid config for ${componentId}` },
          { status: 400 }
        );
      }
    }
    
    // Save to database
    await saveCalibrationToDB(configs as Record<string, CalibrationConfig>);
    
    return NextResponse.json({
      success: true,
      message: 'Calibration configs updated',
      configs
    });
  } catch (error: any) {
    console.error('Failed to update calibration configs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update configs', message: error.message },
      { status: 500 }
    );
  }
}

async function loadCalibrationFromDB(): Promise<Record<string, CalibrationConfig> | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error } = await supabase
      .from('calibration_configs')
      .select('*');
    
    if (error) {
      console.error('DB error loading calibration:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const configs: Record<string, CalibrationConfig> = {};
    for (const row of data) {
      configs[row.component_id] = {
        componentId: row.component_id,
        scale: row.scale,
        offset: row.offset,
        minOutput: row.min_output || 0,
        maxOutput: row.max_output || 100
      };
    }
    
    return configs;
  } catch (error) {
    console.error('Error loading calibration from DB:', error);
    return null;
  }
}

async function saveCalibrationToDB(configs: Record<string, CalibrationConfig>): Promise<void> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    for (const [componentId, config] of Object.entries(configs)) {
      await supabase
        .from('calibration_configs')
        .upsert({
          component_id: componentId,
          scale: config.scale,
          offset: config.offset,
          min_output: config.minOutput,
          max_output: config.maxOutput,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'component_id'
        });
    }
  } catch (error) {
    console.error('Error saving calibration to DB:', error);
    throw error;
  }
}




























































































