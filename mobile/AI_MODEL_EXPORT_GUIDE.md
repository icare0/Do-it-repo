# Guide: Pré-entraîner et Exporter le Modèle AI

## Pourquoi Pré-entraîner ?

Actuellement, le modèle s'entraîne au **premier lancement** de l'app (30 epochs = ~10-15 secondes).

Pour une expérience optimale, vous pouvez :
1. **Pré-entraîner le modèle** sur votre machine de dev
2. **L'exporter** dans les assets de l'app
3. **Le charger** au lieu de l'entraîner

## Option 1: Entraînement Automatique (Actuel) ✅

### Comment ça fonctionne maintenant

1. **Premier lancement** : Le modèle s'entraîne (30 epochs, ~10s)
   ```
   LOG  🏋️ Training model...
   LOG  Epoch 0: loss = 2.88, accuracy = 0.09
   LOG  Epoch 10: loss = 2.36, accuracy = 0.28
   LOG  Epoch 20: loss = 1.65, accuracy = 0.57
   LOG  Epoch 29: loss = 0.52, accuracy = 0.95
   LOG  ✅ Training complete! Final accuracy: 95%
   LOG  💾 Model and weights saved successfully
   ```

2. **Lancements suivants** : Le modèle se charge depuis AsyncStorage (~1s)
   ```
   LOG  ✅ Model loaded from storage
   LOG  ✅ Intent Classifier initialized successfully
   ```

### Avantages
- ✅ Aucune configuration nécessaire
- ✅ Le modèle s'adapte automatiquement si vous modifiez TRAINING_DATA
- ✅ Sauvegarde persistante après le premier entraînement

### Inconvénients
- ⚠️ ~10 secondes au premier lancement
- ⚠️ Nécessite de ré-entraîner si l'utilisateur supprime les données de l'app

---

## Option 2: Modèle Pré-entraîné (Avancé) 🚀

### Étape 1: Créer un Script d'Entraînement Node.js

Créez `mobile/scripts/trainModel.js` :

```javascript
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// Import training data
const { TRAINING_DATA, INTENT_LABELS } = require('../src/services/aiEngine/trainingData');
const { vocabularyBuilder } = require('../src/services/aiEngine/vocabularyBuilder');

async function trainAndExportModel() {
  console.log('🏗️ Creating model...');

  // Build vocabulary
  const vocabulary = vocabularyBuilder.build();
  const vocabularySize = 500;

  // Create model (same architecture as intentClassifier.ts)
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [vocabularySize],
    units: 128,
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));

  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelInitializer: 'heNormal'
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({
    units: INTENT_LABELS.length,
    activation: 'softmax'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('🏋️ Training model...');

  // Prepare training data (implement textToVector logic)
  const { inputs, labels } = prepareTrainingData(TRAINING_DATA, vocabulary, vocabularySize);

  // Train
  const history = await model.fit(inputs, labels, {
    epochs: 50,  // More epochs for pre-training
    batchSize: 16,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
      }
    }
  });

  console.log('💾 Saving model...');

  // Save model to file
  const modelPath = path.join(__dirname, '../assets/pretrained-model');
  await model.save(`file://${modelPath}`);

  // Save vocabulary and metadata
  const metadata = {
    vocabularySize,
    intentLabels: INTENT_LABELS,
    trainedAt: new Date().toISOString(),
    finalAccuracy: history.history.acc[history.history.acc.length - 1]
  };

  fs.writeFileSync(
    path.join(__dirname, '../assets/pretrained-model/metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Save vocabulary
  fs.writeFileSync(
    path.join(__dirname, '../assets/pretrained-model/vocabulary.json'),
    JSON.stringify(Array.from(vocabulary.entries()), null, 2)
  );

  console.log('✅ Model exported successfully!');
  console.log(`   Path: ${modelPath}`);
  console.log(`   Final accuracy: ${(metadata.finalAccuracy * 100).toFixed(2)}%`);
}

// Helper function (implement same logic as intentClassifier.ts)
function prepareTrainingData(examples, vocabulary, vocabularySize) {
  // ... (implement textToVector logic)
}

trainAndExportModel().catch(console.error);
```

### Étape 2: Exécuter l'Entraînement

```bash
cd mobile
npm install @tensorflow/tfjs-node
node scripts/trainModel.js
```

### Étape 3: Modifier `intentClassifier.ts` pour Charger le Modèle Pré-entraîné

```typescript
private async loadModel(): Promise<boolean> {
  try {
    // Try loading from AsyncStorage first (user-trained model)
    const metadata = await AsyncStorage.getItem(MODEL_METADATA_KEY);
    if (metadata) {
      this.model = await tf.loadLayersModel(asyncStorageIO('intent_classifier'));
      console.log('✅ Model loaded from AsyncStorage');
      return true;
    }

    // Fallback: Load pre-trained model from assets
    const pretrainedPath = 'file://./assets/pretrained-model/model.json';
    this.model = await tf.loadLayersModel(pretrainedPath);
    console.log('✅ Pre-trained model loaded from assets');
    return true;
  } catch (error) {
    console.log('📚 Could not load model:', error.message);
    return false;
  }
}
```

### Avantages
- ✅ **Démarrage instantané** (~1s au lieu de ~10s)
- ✅ Fonctionne même sans connexion internet
- ✅ Modèle optimisé avec plus d'epochs (50 au lieu de 30)

### Inconvénients
- ⚠️ Nécessite de ré-exporter si vous modifiez TRAINING_DATA
- ⚠️ Augmente la taille de l'app (~200KB pour le modèle)

---

## Option 3: Modèle Distant (Future Enhancement)

Pour une vraie app en production, vous pourriez :

1. **Héberger le modèle** sur un CDN (Firebase Storage, S3, etc.)
2. **Le télécharger** au premier lancement
3. **Le mettre en cache** localement

Avantages :
- ✅ Taille d'app minimale
- ✅ Mises à jour du modèle sans release d'app
- ✅ A/B testing de différents modèles

---

## Recommandation Actuelle

Pour votre usage actuel, **Option 1 (Entraînement Auto)** est parfait :

- ✅ Premier lancement : 10s d'entraînement (une seule fois)
- ✅ Lancements suivants : Chargement instantané
- ✅ Aucune config nécessaire
- ✅ Le modèle est déjà sauvegardé grâce à `asyncStorageHandler.ts`

### Ce qui a été amélioré

Avant nos changements :
```
❌ Entraînement à CHAQUE lancement (50 epochs)
❌ Modèle jamais sauvegardé
❌ ~15s de délai à chaque ouverture
```

Après nos changements :
```
✅ Entraînement UNIQUE au premier lancement (30 epochs)
✅ Modèle sauvegardé automatiquement
✅ ~10s au premier lancement, <1s ensuite
✅ Sauvegarde persistante via AsyncStorage
```

---

## Commandes Utiles

### Vérifier si le modèle est sauvegardé
```bash
# Dans React Native Debugger ou via adb
AsyncStorage.getItem('@ai_intent_metadata')
  .then(metadata => console.log(JSON.parse(metadata)))
```

### Supprimer le modèle sauvegardé (forcer ré-entraînement)
```bash
AsyncStorage.removeItem('@ai_model_topology_intent_classifier')
AsyncStorage.removeItem('@ai_model_weights_intent_classifier')
AsyncStorage.removeItem('@ai_intent_metadata')
```

### Logs à surveiller

**Premier lancement** (entraînement) :
```
🧠 Initializing Intent Classifier...
✓ TensorFlow.js backend ready
📚 No model metadata found
📚 No existing model found. Training new model...
🏋️ Training model...
Epoch 0: loss = 2.88, accuracy = 0.09
Epoch 10: loss = 2.36, accuracy = 0.28
Epoch 20: loss = 1.65, accuracy = 0.57
Epoch 29: loss = 0.52, accuracy = 0.95
✅ Training complete! Final accuracy: 95%
💾 Model and weights saved successfully
✅ Intent Classifier initialized successfully
```

**Lancements suivants** (chargement) :
```
🧠 Initializing Intent Classifier...
✓ TensorFlow.js backend ready
✅ Model loaded from storage
✅ Intent Classifier initialized successfully
```

---

## Troubleshooting

### Le modèle ne se charge pas

**Symptôme** : Le modèle s'entraîne à chaque lancement

**Solution** :
1. Vérifiez les logs pour voir si `💾 Model and weights saved successfully`
2. Vérifiez AsyncStorage pour `@ai_model_topology_intent_classifier`
3. Assurez-vous que `asyncStorageHandler.ts` est importé correctement

### Erreur "Cannot convert base64 to ArrayBuffer"

**Cause** : Problème de compatibilité `btoa/atob` dans React Native

**Solution** : Installez un polyfill
```bash
npm install base-64
```

Puis dans `asyncStorageHandler.ts` :
```typescript
import { decode, encode } from 'base-64';

// Remplacer btoa/atob par encode/decode
```

### Le modèle est trop volumineux pour AsyncStorage

**Symptôme** : Erreur "Quota exceeded"

**Solution** : AsyncStorage a une limite de ~6MB. Le modèle fait ~200KB, donc ça devrait passer. Si problème :
- Réduire le `vocabularySize` de 500 à 300
- Réduire les layers du modèle (128 → 64, 64 → 32)

---

## Conclusion

Le système actuel avec **sauvegarde automatique** est optimal pour votre app :

✅ **Premier lancement** : ~10s d'entraînement unique
✅ **Tous les autres** : <1s de chargement
✅ **Persistant** : Le modèle survit aux redémarrages
✅ **Automatique** : Aucune configuration requise

Si vous voulez aller plus loin avec un modèle pré-entraîné, suivez l'Option 2 ci-dessus !
