import { NextRequest, NextResponse } from 'next/server';
import { testGeneTagger } from '@/lib/services/geneTagger';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting GeneTagger test...');
    const startTime = Date.now();

    // Run comprehensive test
    const testResults = await runComprehensiveTest();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1) + 's';

    return NextResponse.json({
      success: true,
      message: 'GeneTagger test completed successfully',
      duration,
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GeneTagger test error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Test failed',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

async function runComprehensiveTest() {
  const results: any = {};

  try {
    // Test 1: Framework genes loading
    console.log('Testing framework genes loading...');
    const genesPath = path.join(process.cwd(), 'framework_genes.json');
    const genesData = await fs.readFile(genesPath, 'utf8');
    const framework = JSON.parse(genesData);
    
    results.frameworkGenesTest = {
      success: true,
      genesCount: framework.genes?.length || 0,
      expectedCount: 48,
      passed: framework.genes?.length === 48
    };

    // Test 2: Required packages
    console.log('Testing required packages...');
    try {
      const req = eval('require');
      req('sharp');
      req('tesseract.js');
      let naturalOk = false;
      try {
        req('natural');
        naturalOk = true;
      } catch {}
      results.packagesTest = {
        success: true,
        packages: naturalOk
          ? ['sharp', 'tesseract.js', 'natural (optional)']
          : ['sharp', 'tesseract.js', 'natural (optional, missing)'],
        passed: true
      };
    } catch (error) {
      results.packagesTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Package loading failed',
        passed: false
      };
    }

    // Test 3: Text pattern recognition
    console.log('Testing text pattern recognition...');
    results.textAnalysisTest = await testTextAnalysis(framework.genes);

    // Test 4: Gene definition validation
    console.log('Testing gene definitions...');
    results.geneDefinitionsTest = await testGeneDefinitions(framework.genes);

    // Test 5: Module functionality
    console.log('Testing module functionality...');
    try {
      await testGeneTagger();
      results.moduleFunctionalityTest = {
        success: true,
        passed: true
      };
    } catch (error) {
      results.moduleFunctionalityTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Module test failed',
        passed: false
      };
    }

    // Calculate overall score
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter((test: any) => test.passed).length;
    results.overallScore = {
      passed: passedTests,
      total: totalTests,
      percentage: Math.round((passedTests / totalTests) * 100)
    };

    return results;

  } catch (error) {
    console.error('Comprehensive test failed:', error);
    throw error;
  }
}

async function testTextAnalysis(genes: any[]) {
  try {
    const testCases = [
      {
        text: "Hot take: I'm a doctor with 10 years of experience",
        expectedGenes: ['AuthorityHook', 'ControversyHook']
      },
      {
        text: "Nobody talks about this shocking truth about fitness",
        expectedGenes: ['ControversyHook', 'FitnessContent']
      },
      {
        text: "Learn how to cook delicious meals in 5 easy steps",
        expectedGenes: ['EducationalContent', 'FoodContent', 'NumbersHook']
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      const detectedGenes: string[] = [];

      for (const gene of genes) {
        if (gene.type === 'text' && gene.pattern) {
          try {
            const regex = new RegExp(gene.pattern, 'gi');
            if (regex.test(testCase.text)) {
              detectedGenes.push(gene.name);
            }
          } catch (error) {
            // Skip invalid regex patterns
          }
        }
      }

      const expectedFound = testCase.expectedGenes.filter(expected => 
        detectedGenes.includes(expected)
      );

      results.push({
        text: testCase.text.substring(0, 50) + '...',
        expectedGenes: testCase.expectedGenes,
        detectedGenes,
        expectedFound,
        score: expectedFound.length / testCase.expectedGenes.length
      });
    }

    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;

    return {
      success: true,
      averageScore: Math.round(averageScore * 100),
      testCases: results,
      passed: averageScore > 0.5
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text analysis test failed',
      passed: false
    };
  }
}

async function testGeneDefinitions(genes: any[]) {
  try {
    const requiredGenes = [
      'AuthorityHook', 'ControversyHook', 'TransformationBeforeAfter',
      'WalkingWisdom', 'GreenScreen', 'QuestionHook', 'NumbersHook',
      'UrgencyHook', 'PersonalStory', 'CallToAction'
    ];

    const foundGenes = requiredGenes.filter(name => 
      genes.some(gene => gene.name === name)
    );

    const missingGenes = requiredGenes.filter(name => 
      !genes.some(gene => gene.name === name)
    );

    // Validate gene structure
    const validGenes = genes.filter(gene => 
      gene.id !== undefined &&
      gene.name &&
      gene.description &&
      gene.type &&
      gene.detection_method
    );

    return {
      success: true,
      totalGenes: genes.length,
      requiredGenes: requiredGenes.length,
      foundRequiredGenes: foundGenes.length,
      missingGenes,
      validStructure: validGenes.length,
      structureScore: Math.round((validGenes.length / genes.length) * 100),
      passed: foundGenes.length >= 8 && validGenes.length >= 40
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gene definitions test failed',
      passed: false
    };
  }
}