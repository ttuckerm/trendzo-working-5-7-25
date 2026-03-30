/**
 * TikTok Template Service Tests
 * 
 * Integration tests for the TikTok template service
 */

const { tikTokTemplateService } = require('../services/tikTokTemplateService');
require('dotenv').config({ path: '.env.local' });

/**
 * Sample template data for testing
 */
const sampleTemplate = {
  title: 'Test Template',
  description: 'A test template for service testing',
  category: 'test',
  duration: 30,
  structure: {
    sections: [
      {
        name: 'Intro',
        type: 'intro',
        duration: 5
      },
      {
        name: 'Content',
        type: 'content',
        duration: 20
      },
      {
        name: 'Outro',
        type: 'outro',
        duration: 5
      }
    ]
  },
  engagement_metrics: {
    views: 1000,
    likes: 100,
    comments: 50,
    shares: 25
  },
  growth_data: {
    velocity: 10,
    acceleration: 2
  },
  is_trending: false
};

/**
 * Sample expert insights for testing
 */
const sampleInsights = {
  tags: ['trending', 'potential', 'dance'],
  notes: 'This template shows good potential for growth',
  manual_adjustment: true,
  adjustment_reason: 'Manually adjusted for testing',
  created_by: 'test-user'
};

/**
 * Run the tests
 */
async function runTests() {
  console.log('Starting TikTok Template Service tests...');
  let passedTests = 0;
  let failedTests = 0;
  let createdTemplateId = null;
  
  // Test: Create template
  try {
    console.log('Testing template creation...');
    const createdTemplate = await tikTokTemplateService.createTemplate(sampleTemplate);
    
    if (!createdTemplate) {
      throw new Error('Failed to create template');
    }
    
    createdTemplateId = createdTemplate.id;
    console.log(`✅ Successfully created template with ID ${createdTemplateId}`);
    
    // Verify all fields
    const requiredFields = ['title', 'structure', 'engagement_metrics', 'growth_data'];
    for (const field of requiredFields) {
      if (!createdTemplate[field]) {
        throw new Error(`Created template is missing field: ${field}`);
      }
    }
    
    passedTests++;
  } catch (error) {
    console.error('❌ Template creation test failed:', error.message);
    failedTests++;
  }
  
  // Only continue tests if template creation succeeded
  if (createdTemplateId) {
    // Test: Get template by ID
    try {
      console.log(`Testing retrieval of template ${createdTemplateId}...`);
      const template = await tikTokTemplateService.getTemplateById(createdTemplateId);
      
      if (!template) {
        throw new Error('Failed to retrieve template');
      }
      
      if (template.title !== sampleTemplate.title) {
        throw new Error(`Template title mismatch: ${template.title} vs ${sampleTemplate.title}`);
      }
      
      console.log('✅ Successfully retrieved template');
      passedTests++;
    } catch (error) {
      console.error('❌ Template retrieval test failed:', error.message);
      failedTests++;
    }
    
    // Test: Update template
    try {
      console.log(`Testing update of template ${createdTemplateId}...`);
      const updates = {
        title: 'Updated Test Template',
        is_trending: true
      };
      
      const updatedTemplate = await tikTokTemplateService.updateTemplate(createdTemplateId, updates);
      
      if (!updatedTemplate) {
        throw new Error('Failed to update template');
      }
      
      if (updatedTemplate.title !== updates.title) {
        throw new Error(`Template title not updated correctly: ${updatedTemplate.title} vs ${updates.title}`);
      }
      
      if (updatedTemplate.is_trending !== updates.is_trending) {
        throw new Error(`Template trending status not updated correctly: ${updatedTemplate.is_trending} vs ${updates.is_trending}`);
      }
      
      console.log('✅ Successfully updated template');
      passedTests++;
    } catch (error) {
      console.error('❌ Template update test failed:', error.message);
      failedTests++;
    }
    
    // Test: Save expert insights
    try {
      console.log(`Testing expert insights for template ${createdTemplateId}...`);
      const insights = await tikTokTemplateService.saveTemplateExpertInsights(
        createdTemplateId,
        sampleInsights
      );
      
      if (!insights) {
        throw new Error('Failed to save expert insights');
      }
      
      if (insights.template_id !== createdTemplateId) {
        throw new Error(`Insight template ID mismatch: ${insights.template_id} vs ${createdTemplateId}`);
      }
      
      if (!Array.isArray(insights.tags) || insights.tags.length !== sampleInsights.tags.length) {
        throw new Error('Insight tags not saved correctly');
      }
      
      console.log('✅ Successfully saved expert insights');
      passedTests++;
    } catch (error) {
      console.error('❌ Expert insights test failed:', error.message);
      failedTests++;
    }
    
    // Test: Get expert insights
    try {
      console.log(`Testing retrieval of expert insights for template ${createdTemplateId}...`);
      const insights = await tikTokTemplateService.getTemplateExpertInsights(createdTemplateId);
      
      if (!insights) {
        throw new Error('Failed to retrieve expert insights');
      }
      
      if (insights.template_id !== createdTemplateId) {
        throw new Error(`Retrieved insight template ID mismatch: ${insights.template_id} vs ${createdTemplateId}`);
      }
      
      console.log('✅ Successfully retrieved expert insights');
      passedTests++;
    } catch (error) {
      console.error('❌ Insights retrieval test failed:', error.message);
      failedTests++;
    }
    
    // Test: Get audit logs
    try {
      console.log(`Testing audit logs for template ${createdTemplateId}...`);
      const auditLogs = await tikTokTemplateService.getTemplateAuditLogs(createdTemplateId);
      
      if (!Array.isArray(auditLogs)) {
        throw new Error('Failed to retrieve audit logs');
      }
      
      if (auditLogs.length < 2) { // Should have at least creation and update
        throw new Error(`Expected at least 2 audit logs, but got ${auditLogs.length}`);
      }
      
      // Verify audit log content
      const createLog = auditLogs.find(log => log.action === 'create');
      const updateLog = auditLogs.find(log => log.action === 'update');
      const expertLog = auditLogs.find(log => log.action === 'expert_adjustment');
      
      if (!createLog) {
        throw new Error('Create audit log not found');
      }
      
      if (!updateLog) {
        throw new Error('Update audit log not found');
      }
      
      if (!expertLog) {
        throw new Error('Expert adjustment audit log not found');
      }
      
      console.log('✅ Successfully retrieved audit logs');
      passedTests++;
    } catch (error) {
      console.error('❌ Audit logs test failed:', error.message);
      failedTests++;
    }
    
    // Test: Get trending templates
    try {
      console.log('Testing trending templates retrieval...');
      const trendingTemplates = await tikTokTemplateService.getTrendingTemplates();
      
      if (!Array.isArray(trendingTemplates)) {
        throw new Error('Failed to retrieve trending templates');
      }
      
      // Since we marked our template as trending, it should appear in results
      const foundTemplate = trendingTemplates.find(t => t.id === createdTemplateId);
      
      if (!foundTemplate) {
        throw new Error('Created template not found in trending templates');
      }
      
      console.log('✅ Successfully retrieved trending templates');
      passedTests++;
    } catch (error) {
      console.error('❌ Trending templates test failed:', error.message);
      failedTests++;
    }
    
    // Test: Search templates
    try {
      console.log('Testing template search...');
      const searchResults = await tikTokTemplateService.searchTemplates('Updated Test');
      
      if (!Array.isArray(searchResults)) {
        throw new Error('Failed to search templates');
      }
      
      const foundTemplate = searchResults.find(t => t.id === createdTemplateId);
      
      if (!foundTemplate) {
        throw new Error('Created template not found in search results');
      }
      
      console.log('✅ Successfully searched templates');
      passedTests++;
    } catch (error) {
      console.error('❌ Template search test failed:', error.message);
      failedTests++;
    }
    
    // Cleanup: Delete the template
    try {
      console.log(`Cleaning up: Deleting template ${createdTemplateId}...`);
      const deleteSuccess = await tikTokTemplateService.deleteTemplate(createdTemplateId);
      
      if (!deleteSuccess) {
        throw new Error('Failed to delete template');
      }
      
      console.log('✅ Successfully deleted template');
    } catch (error) {
      console.error('❌ Template deletion failed:', error.message);
      // We don't count cleanup as part of the test suite
    }
  }
  
  // Print test summary
  console.log(`\nTest summary: ${passedTests} passed, ${failedTests} failed`);
  
  return {
    success: failedTests === 0,
    passed: passedTests,
    failed: failedTests
  };
}

// Run the tests
runTests()
  .then(result => {
    if (result.success) {
      console.log('All TikTok Template Service tests passed! 🎉');
      process.exit(0);
    } else {
      console.error('Some TikTok Template Service tests failed. 😢');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  }); 