/**
 * Schema validation helper for migration process
 */

const { validateSchema, correctSchema } = require('./schema-validation');

/**
 * Validates and corrects schema for a set of table mappings
 * 
 * @param {Object} supabase - Supabase client
 * @param {Array} mappings - Array of mappings with table names and transformations
 * @returns {Object} Result with validation and correction details
 */
async function validateAndCorrectSchemas(supabase, mappings) {
  console.log(`validateAndCorrectSchemas: Starting with ${mappings.length} mappings`);
  
  const results = {
    success: true,
    tables: {},
    validationErrors: [],
    correctionErrors: []
  };

  // Process each mapping
  for (const mapping of mappings) {
    const tableName = mapping.supabaseTable;
    console.log(`validateAndCorrectSchemas: Processing table ${tableName}`);
    
    // Generate expected schema from a sample transformation
    // This assumes the first document in Firebase collection can be used as a sample
    // We'll use a placeholder for demonstration
    const sampleData = { id: 'sample-id' };
    console.log(`validateAndCorrectSchemas: Generating sample schema`);
    
    try {
      const transformedSample = mapping.transform(sampleData, 'sample-id');
      console.log(`validateAndCorrectSchemas: Sample transformation successful`);
      
      // Convert object to expected schema format
      const expectedSchema = Object.entries(transformedSample).map(([name, value]) => {
        // Infer type from value - this is simplified
        let type = 'text'; // default
        
        if (typeof value === 'number') {
          type = Number.isInteger(value) ? 'integer' : 'float8';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (value instanceof Date || 
                  (typeof value === 'string' && !isNaN(Date.parse(value)))) {
          type = 'timestamp';
        }
        
        return { name, type };
      });
      
      console.log(`validateAndCorrectSchemas: Generated schema with ${expectedSchema.length} columns`);
      
      // Validate schema
      console.log(`validateAndCorrectSchemas: Validating schema for ${tableName}`);
      const validationResult = await validateSchema(supabase, tableName, expectedSchema);
      console.log(`validateAndCorrectSchemas: Validation result: success=${validationResult.success}`);
      
      if (!validationResult.success) {
        results.tables[tableName] = { 
          validated: false,
          corrected: false,
          missingColumns: validationResult.missingColumns 
        };
        
        if (validationResult.error) {
          console.log(`validateAndCorrectSchemas: Validation error: ${validationResult.error}`);
          results.validationErrors.push({
            table: tableName,
            error: validationResult.error
          });
        }
        
        // Try to correct the schema
        if (validationResult.missingColumns.length > 0) {
          console.log(`validateAndCorrectSchemas: Correcting schema for ${tableName}`);
          const correctionResult = await correctSchema(
            supabase, 
            tableName, 
            validationResult.missingColumns
          );
          
          console.log(`validateAndCorrectSchemas: Correction result: success=${correctionResult.success}`);
          results.tables[tableName].corrected = correctionResult.success;
          
          if (!correctionResult.success) {
            results.correctionErrors.push({
              table: tableName,
              errors: correctionResult.results?.filter(r => !r.success) || [],
              error: correctionResult.error
            });
            
            // Overall success is false if any correction fails
            results.success = false;
          }
        }
      } else {
        results.tables[tableName] = { 
          validated: true,
          corrected: false,
          missingColumns: [] 
        };
      }
    } catch (error) {
      console.log(`validateAndCorrectSchemas: Error processing ${tableName}: ${error.message}`);
      console.log(`validateAndCorrectSchemas: Stack: ${error.stack}`);
      
      results.tables[tableName] = { 
        validated: false,
        corrected: false,
        error: error.message,
        missingColumns: [] 
      };
      
      results.validationErrors.push({
        table: tableName,
        error: `Error generating schema: ${error.message}`
      });
      
      results.success = false;
    }
  }
  
  console.log(`validateAndCorrectSchemas: Completed with success=${results.success}`);
  return results;
}

module.exports = {
  validateAndCorrectSchemas
}; 