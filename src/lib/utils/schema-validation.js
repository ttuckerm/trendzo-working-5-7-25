/**
 * Supabase schema validation and correction utilities
 * 
 * These functions help validate and correct mismatches between
 * expected schemas and actual Supabase table schemas.
 */

/**
 * Validates that a Supabase table has the expected schema
 * 
 * @param {Object} supabase - Supabase client
 * @param {string} tableName - Name of the table to validate
 * @param {Array} expectedSchema - Array of expected columns with name and type
 * @returns {Object} Result with success flag and any missing columns
 */
async function validateSchema(supabase, tableName, expectedSchema) {
  console.log(`validateSchema: Validating schema for ${tableName}`);
  
  try {
    // Get the actual schema from Supabase
    console.log(`validateSchema: Fetching columns for ${tableName}`);
    const { data: columns, error } = await supabase
      .from(tableName)
      .select()
      .columns();
    
    console.log(`validateSchema: Result: columns=${columns ? columns.length : 'null'}, error=${error ? 'yes' : 'no'}`);
    
    if (error) {
      console.log(`validateSchema: Error fetching schema: ${error.message}`);
      return {
        success: false,
        error: `Failed to get schema for ${tableName}: ${error.message}`,
        missingColumns: []
      };
    }

    // If no columns returned, all expected columns are missing
    if (!columns || columns.length === 0) {
      console.log(`validateSchema: No columns found for ${tableName}`);
      return {
        success: false,
        error: `Table ${tableName} has no columns or does not exist`,
        missingColumns: expectedSchema
      };
    }

    // Create map of column names for faster lookup
    const columnMap = new Map(columns.map(col => [col.name, col.type]));
    console.log(`validateSchema: Found ${columnMap.size} columns in table`);
    
    // Find missing columns
    const missingColumns = expectedSchema.filter(
      expected => !columnMap.has(expected.name)
    );
    
    console.log(`validateSchema: Found ${missingColumns.length} missing columns`);
    if (missingColumns.length > 0) {
      console.log(`validateSchema: Missing columns: ${missingColumns.map(c => c.name).join(', ')}`);
    }
    
    return {
      success: missingColumns.length === 0,
      missingColumns
    };
  } catch (error) {
    console.log(`validateSchema: Exception: ${error.message}`);
    console.log(`validateSchema: Stack: ${error.stack}`);
    return {
      success: false,
      error: `Validation error: ${error.message}`,
      missingColumns: []
    };
  }
}

/**
 * Corrects schema mismatches by adding missing columns
 * 
 * @param {Object} supabase - Supabase client
 * @param {string} tableName - Name of the table to correct
 * @param {Array} missingColumns - Array of missing columns with name and type
 * @returns {Object} Result with success flag
 */
async function correctSchema(supabase, tableName, missingColumns) {
  console.log(`correctSchema: Correcting schema for ${tableName} with ${missingColumns.length} missing columns`);
  
  try {
    if (!missingColumns || missingColumns.length === 0) {
      console.log(`correctSchema: No missing columns to add`);
      return { success: true };
    }
    
    const results = [];
    
    // Add each missing column
    for (const column of missingColumns) {
      console.log(`correctSchema: Adding column ${column.name} with type ${column.type}`);
      
      try {
        const { error } = await supabase
          .from(tableName)
          .alter()
          .add(column.name, column.type);
        
        if (error) {
          console.log(`correctSchema: Error adding column ${column.name}: ${error.message}`);
        } else {
          console.log(`correctSchema: Successfully added column ${column.name}`);
        }
        
        results.push({
          column: column.name,
          success: !error,
          error: error?.message
        });
      } catch (columnError) {
        console.log(`correctSchema: Exception adding column ${column.name}: ${columnError.message}`);
        results.push({
          column: column.name,
          success: false,
          error: columnError.message
        });
      }
    }
    
    // Check if all corrections were successful
    const allSuccessful = results.every(result => result.success);
    console.log(`correctSchema: All corrections successful: ${allSuccessful}`);
    
    return {
      success: allSuccessful,
      results
    };
  } catch (error) {
    console.log(`correctSchema: Exception: ${error.message}`);
    console.log(`correctSchema: Stack: ${error.stack}`);
    return {
      success: false,
      error: `Schema correction error: ${error.message}`
    };
  }
}

module.exports = {
  validateSchema,
  correctSchema
}; 