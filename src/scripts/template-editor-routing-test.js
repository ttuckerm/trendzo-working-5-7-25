/**
 * Template Editor Routing Test Script
 * 
 * This script verifies that the template editor can be accessed via both
 * the old route /editor and the new integrated route /dashboard-view/template-editor
 * and that the old route properly redirects to the new one.
 */

const fetch = require('node-fetch');

// Fix chalk import for compatibility
const chalkImport = import('chalk').then(m => m.default);
let chalk;

async function testRoutes() {
  // Initialize chalk
  chalk = await chalkImport;
  
  const baseUrl = 'http://localhost:3010';
  const oldRoute = '/editor';
  const newRoute = '/dashboard-view/template-editor';
  
  console.log(chalk.blue('🧪 Template Editor Routing Test'));
  console.log(chalk.gray('---------------------------------------'));
  
  try {
    // Test old route (should redirect)
    console.log(chalk.yellow('Testing old route:', oldRoute));
    const oldRouteResponse = await fetch(`${baseUrl}${oldRoute}`, { redirect: 'manual' });
    
    console.log(`Status: ${oldRouteResponse.status}`);
    if (oldRouteResponse.status >= 300 && oldRouteResponse.status < 400) {
      const location = oldRouteResponse.headers.get('location');
      console.log(chalk.green('✅ Old route redirects correctly'));
      console.log(`Redirect location: ${location}`);
      
      if (location.includes(newRoute)) {
        console.log(chalk.green('✅ Redirects to the new route'));
      } else {
        console.log(chalk.red('❌ Redirects to an unexpected location'));
      }
    } else {
      console.log(chalk.red('❌ Old route does not redirect as expected'));
    }
    
    console.log(chalk.gray('---------------------------------------'));
    
    // Test new route (should load directly)
    console.log(chalk.yellow('Testing new route:', newRoute));
    const newRouteResponse = await fetch(`${baseUrl}${newRoute}`);
    
    console.log(`Status: ${newRouteResponse.status}`);
    if (newRouteResponse.status === 200) {
      console.log(chalk.green('✅ New route loads successfully'));
    } else {
      console.log(chalk.red('❌ New route failed to load'));
    }
    
    console.log(chalk.gray('---------------------------------------'));
    
    // Final verdict
    if (
      (oldRouteResponse.status >= 300 && oldRouteResponse.status < 400) &&
      oldRouteResponse.headers.get('location').includes(newRoute) &&
      newRouteResponse.status === 200
    ) {
      console.log(chalk.green('✅ PASSED: Template editor routing is working correctly'));
    } else {
      console.log(chalk.red('❌ FAILED: Template editor routing has issues'));
    }
    
  } catch (error) {
    console.error(chalk.red('Error running tests:'), error.message);
  }
}

// Run the tests
testRoutes(); 