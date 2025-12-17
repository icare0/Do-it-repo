/**
 * AI Engine - Examples and Test Cases
 * Demonstrates the AI capabilities with real-world examples
 */

import { aiEngine } from './index';

/**
 * Run all example tests
 */
export async function runExamples() {
  console.log('\n🧪 AI Engine - Running Examples\n');
  console.log('═'.repeat(60));

  await aiEngine.initialize();

  // Test categories
  await testTemporalFlexibility();
  await testTimeOfDay();
  await testDeadlines();
  await testIntentDetection();
  await testPriorityDetection();
  await testCategoryDetection();
  await testComplexExamples();

  console.log('\n═'.repeat(60));
  console.log('✅ All examples completed!\n');
}

/**
 * Test 1: Temporal Flexibility
 */
async function testTemporalFlexibility() {
  console.log('\n📅 Test 1: Temporal Flexibility');
  console.log('-'.repeat(60));

  const examples = [
    "Acheter du lait demain", // Flexible
    "Acheter du lait demain 14h", // Strict
    "Acheter du lait demain matin", // Range
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    console.log(`  → Title: "${result.title}"`);
    console.log(`  → Date: ${result.date?.toLocaleDateString('fr-FR')}`);
    console.log(`  → Specific time: ${result.hasSpecificTime ? 'Yes' : 'No'}`);
    if (result.timeOfDay) {
      console.log(`  → Time of day: ${result.timeOfDay}`);
    }
    if (result.suggestedTimeSlot) {
      console.log(`  → Suggested slot: ${result.suggestedTimeSlot.start}h-${result.suggestedTimeSlot.end}h`);
    }
    console.log(`  → Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * Test 2: Time of Day
 */
async function testTimeOfDay() {
  console.log('\n🌅 Test 2: Time of Day Detection');
  console.log('-'.repeat(60));

  const examples = [
    "Appeler Marie demain matin",
    "Réunion cet après-midi",
    "Dîner ce soir",
    "Finir le rapport cette nuit",
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    console.log(`  → Time of day: ${result.timeOfDay || 'Not detected'}`);
    if (result.suggestedTimeSlot) {
      console.log(`  → Slot: ${result.suggestedTimeSlot.start}h-${result.suggestedTimeSlot.end}h`);
    }
  }
}

/**
 * Test 3: Deadlines vs Start Dates
 */
async function testDeadlines() {
  console.log('\n⏰ Test 3: Deadlines vs Start Dates');
  console.log('-'.repeat(60));

  const examples = [
    "Finir le rapport pour lundi",
    "Rendre le dossier avant vendredi",
    "Préparer la présentation d'ici mercredi",
    "Appeler le client lundi", // Start date, not deadline
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    if (result.deadline) {
      console.log(`  → Deadline: ${result.deadline.toLocaleDateString('fr-FR')}`);
    } else if (result.date) {
      console.log(`  → Start date: ${result.date.toLocaleDateString('fr-FR')}`);
    }
  }
}

/**
 * Test 4: Intent Detection
 */
async function testIntentDetection() {
  console.log('\n🎯 Test 4: Intent Detection');
  console.log('-'.repeat(60));

  const examples = [
    "Acheter du pain",
    "Appeler le médecin",
    "Réunion avec l'équipe",
    "Finir le rapport",
    "Aller à la gym",
    "Payer la facture d'électricité",
    "Faire le ménage",
    "Cuisiner le dîner",
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    console.log(`  → Intent: ${result.intent || 'Unknown'}`);
    console.log(`  → Category: ${result.category || 'None'}`);
    console.log(`  → Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * Test 5: Priority Detection
 */
async function testPriorityDetection() {
  console.log('\n🚨 Test 5: Priority Detection');
  console.log('-'.repeat(60));

  const examples = [
    "Appeler le médecin urgent",
    "Finir le rapport important",
    "Acheter du lait plus tard",
    "Faire les courses quand possible",
    "Réunion critique demain",
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    console.log(`  → Priority: ${result.priority}`);
    console.log(`  → Title (cleaned): "${result.title}"`);
  }
}

/**
 * Test 6: Category Detection
 */
async function testCategoryDetection() {
  console.log('\n📁 Test 6: Category Detection');
  console.log('-'.repeat(60));

  const examples = [
    "Réunion avec le client",
    "Acheter du pain au supermarché",
    "Rendez-vous dentiste",
    "Aller à la salle de sport",
    "Payer le loyer",
    "Ranger la chambre",
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    console.log(`  → Category: ${result.category || 'None'}`);
    console.log(`  → Intent: ${result.intent || 'Unknown'}`);
  }
}

/**
 * Test 7: Complex Real-World Examples
 */
async function testComplexExamples() {
  console.log('\n🌟 Test 7: Complex Real-World Examples');
  console.log('-'.repeat(60));

  const examples = [
    "Appeler le médecin pour prendre rdv demain matin urgent",
    "Faire les courses au Carrefour ce weekend",
    "Finir le rapport pour la réunion de lundi à 14h",
    "Aller à la gym tous les lundis et mercredis à 18h",
    "Payer la facture d'électricité avant le 25/12",
  ];

  for (const input of examples) {
    const result = await aiEngine.parseTask(input);
    console.log(`\nInput: "${input}"`);
    console.log(`  → Title: "${result.title}"`);
    console.log(`  → Intent: ${result.intent || 'Unknown'}`);
    console.log(`  → Category: ${result.category || 'None'}`);
    console.log(`  → Priority: ${result.priority}`);

    if (result.date) {
      const dateStr = result.date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      if (result.hasSpecificTime) {
        const timeStr = result.date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`  → Date: ${dateStr} à ${timeStr} (précis)`);
      } else {
        console.log(`  → Date: ${dateStr} (flexible)`);
        if (result.timeOfDay) {
          console.log(`  → Moment: ${result.timeOfDay}`);
        }
      }
    }

    if (result.deadline) {
      console.log(`  → Deadline: ${result.deadline.toLocaleDateString('fr-FR')}`);
    }

    if (result.recurringPattern) {
      console.log(`  → Récurrence: ${result.recurringPattern.frequency}`);
    }

    if (result.location) {
      console.log(`  → Lieu: ${result.location.name}`);
    }

    console.log(`  → Confiance: ${(result.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * Test Learning System
 */
export async function testLearningSystem() {
  console.log('\n🎓 Test: Learning System');
  console.log('═'.repeat(60));

  await aiEngine.initialize();

  // Simulate user corrections
  console.log('\n1. User creates task: "Aller à la salle demain"');
  const result1 = await aiEngine.parseTask("Aller à la salle demain");
  console.log(`   AI parsed: "${result1.title}"`);
  console.log(`   Location: ${result1.location?.name || 'Not detected'}`);

  console.log('\n2. User corrects location to "Basic Fit"');
  await aiEngine.recordCorrection({
    taskId: 'task-1',
    originalInput: "Aller à la salle demain",
    parsedResult: result1,
    correctLocation: { name: 'Basic Fit', latitude: 0, longitude: 0 },
    changed: true,
    timestamp: new Date()
  });

  console.log('\n3. AI learns pattern: "salle" → "Basic Fit"');
  const patterns = aiEngine.getLearnedPatterns();
  console.log(`   Learned patterns: ${patterns.length}`);

  console.log('\n4. User creates similar task: "Aller à la salle lundi"');
  const result2 = await aiEngine.parseTask("Aller à la salle lundi");
  console.log(`   AI parsed: "${result2.title}"`);
  console.log(`   Location: ${result2.location?.name || 'Not detected'}`);

  if (result2.location?.name === 'Basic Fit') {
    console.log('\n✅ AI successfully applied learned pattern!');
  } else {
    console.log('\n⚠️ AI did not apply learned pattern (may need more examples)');
  }

  // Show metrics
  console.log('\n📊 Current Metrics:');
  const metrics = aiEngine.getMetrics();
  console.log(`   Overall Accuracy: ${(metrics.overallAccuracy * 100).toFixed(1)}%`);
  console.log(`   Total Predictions: ${metrics.totalPredictions}`);
  console.log(`   Total Corrections: ${metrics.totalCorrections}`);
  console.log(`   Learning Rate: ${(metrics.learningRate * 100).toFixed(1)}%`);
}

/**
 * Benchmark Performance
 */
export async function benchmarkPerformance() {
  console.log('\n⚡ Benchmark: Performance');
  console.log('═'.repeat(60));

  await aiEngine.initialize();

  const testCases = [
    "Acheter du lait demain",
    "Réunion avec le client lundi 14h",
    "Finir le rapport pour vendredi",
    "Appeler le médecin urgent",
    "Faire les courses ce weekend",
  ];

  console.log('\nTesting parsing speed...\n');

  for (const input of testCases) {
    const start = Date.now();
    const result = await aiEngine.parseTask(input);
    const duration = Date.now() - start;

    console.log(`"${input}"`);
    console.log(`  → Parsed in ${duration}ms`);
    console.log(`  → Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
  }

  // Batch test
  console.log('Running 100 parsings...');
  const batchStart = Date.now();
  for (let i = 0; i < 100; i++) {
    await aiEngine.parseTask(testCases[i % testCases.length]);
  }
  const batchDuration = Date.now() - batchStart;

  console.log(`\nBatch results:`);
  console.log(`  → Total time: ${batchDuration}ms`);
  console.log(`  → Average per task: ${(batchDuration / 100).toFixed(1)}ms`);
  console.log(`  → Throughput: ${(100 / (batchDuration / 1000)).toFixed(1)} tasks/second`);
}

// Export for easy testing
export default {
  runExamples,
  testLearningSystem,
  benchmarkPerformance
};
