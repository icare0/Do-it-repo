# 📋 Rapport d'Amélioration : Compréhension Intelligente des Tâches

**Date**: 17 Décembre 2025
**Objectif**: Améliorer drastiquement la compréhension du texte utilisateur lors de la création de tâches

---

## 🔍 Analyse de l'Existant

### Architecture Actuelle

Ton application **Do'It** est une solution sophistiquée avec :

- **Backend**: Node.js/Express + MongoDB
- **Mobile**: React Native + Expo avec WatermelonDB (offline-first)
- **NLP**: chrono-node + compromise (backend), parsing manuel (mobile)
- **AI**: TensorFlow.js pour prédiction de durée
- **Smart Features**: Apprentissage des habitudes, optimisation de routes

### Services NLP Existants

#### 1. **Backend NLP Service** (`/backend/src/services/nlpService.ts`)
✅ **Points forts**:
- Utilise chrono-node (excellent pour les dates)
- Extrait : dates, heures, récurrence, priorités, catégories, tags, lieux
- Nettoie le titre proprement

❌ **Limitations**:
- Basé sur des mots-clés fixes et rigides
- Ne comprend pas les variations de langage naturel
- Pas de gestion de la flexibilité temporelle

#### 2. **Mobile NLP Service** (`/mobile/src/services/nlpService.ts`)
✅ **Points forts**:
- Parse dates relatives (aujourd'hui, demain, après-demain)
- Parse durées (1h30, 30min)
- Parse heures (14h, 14h30, 14:30)

❌ **Limitations**:
- Encore plus rigide que le backend
- Ne gère pas les formulations complexes
- Pas de distinction entre "demain" (flexible) et "demain 14h" (strict)

#### 3. **Smart Task Service** (`/mobile/src/services/smartTaskService.ts`)
✅ **Points forts**:
- Détecte les termes ambigus (salle, magasin, restaurant)
- Apprend les préférences utilisateur
- Enrichit automatiquement les tâches futures

❌ **Limitations**:
- Limité aux patterns pré-définis
- Pas de compréhension contextuelle profonde

---

## 🚨 Problèmes Identifiés

### 1. **Manque de Flexibilité Temporelle**

**Problème actuel** :
```
Input: "Acheter du lait demain"
→ Crée une tâche avec date = demain à 00:00
→ L'utilisateur voulait dire "n'importe quand demain"
```

**Ce qui manque** :
- Pas de distinction entre heure fixe vs jour flexible
- Pas de gestion des plages horaires floues ("demain matin", "dans l'après-midi")
- Pas de champ `timeFlexibility` dans le modèle de données

### 2. **Parsing Rigide et Limité**

**Exemples qui ne marchent pas bien** :
```
❌ "Appeler le médecin dans la semaine"
   → Ne détecte pas "dans la semaine" = 7 jours de flexibilité

❌ "Faire les courses quand j'ai le temps"
   → Ne comprend pas que c'est une tâche basse priorité sans date fixe

❌ "Rdv dentiste le 25 si possible le matin"
   → Ne gère pas la condition "si possible"

❌ "Réunion hebdo tous les lundis à 10h sauf jours fériés"
   → Ne gère pas l'exception
```

### 3. **Manque de Compréhension Contextuelle**

**Problème** : L'app ne comprend pas l'intention de l'utilisateur

```
Input: "Préparer la présentation pour lundi"
→ Devrait créer une tâche avec deadline = lundi
→ Devrait suggérer de la programmer avant lundi
→ Devrait détecter que c'est du travail
```

### 4. **Pas de Gestion des Ambiguïtés**

**Problème** : Quand le texte est ambigu, l'app devine au lieu de demander

```
Input: "Rappeler Marie"
→ Quand ? Maintenant ? Demain ? Dans la semaine ?
→ Par téléphone ? Email ?
→ L'app devrait poser des questions intelligentes
```

---

## 💡 Solution Proposée : Architecture Multi-Couches

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                                │
│              "Acheter du lait demain matin"                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         TASK INTERPRETATION SERVICE (Nouveau)                │
│  • Orchestre toutes les couches                             │
│  • Décide de la meilleure interprétation                    │
│  • Gère les ambiguïtés et demande clarifications            │
└──────┬──────────────┬──────────────┬───────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐
│ Enhanced    │ │ AI-Powered   │ │ Smart Task          │
│ NLP Service │ │ Understanding│ │ Service (Existant)  │
│ (Amélioré)  │ │ (LLM)        │ │ • Enrichissement    │
└─────────────┘ └──────────────┘ └─────────────────────┘
       │              │              │
       └──────────────┴──────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              STRUCTURED TASK DATA                            │
│  {                                                           │
│    title: "Acheter du lait",                                │
│    date: Date(demain),                                      │
│    timeOfDay: "morning",  ← NOUVEAU                         │
│    timeFlexibility: "flexible",  ← NOUVEAU                  │
│    suggestedTimeSlot: { start: 9, end: 12 },  ← NOUVEAU    │
│    confidence: 0.95,  ← NOUVEAU                             │
│    originalInput: "...",  ← NOUVEAU                         │
│    category: "courses",                                     │
│    priority: "medium"                                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Détaillée

### 1️⃣ **Amélioration du Modèle de Données**

#### Nouveaux champs à ajouter au modèle `Task`

```typescript
interface Task {
  // ... champs existants ...

  // 🆕 NOUVEAUX CHAMPS
  timeFlexibility?: 'strict' | 'flexible' | 'range';
  // - strict: heure précise (ex: "14h30")
  // - flexible: jour mais pas d'heure (ex: "demain")
  // - range: plage horaire (ex: "demain matin")

  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  // Pour les tâches avec timeFlexibility = 'flexible' ou 'range'

  suggestedTimeSlot?: {
    start: number; // heure de début (0-23)
    end: number;   // heure de fin (0-23)
  };
  // Proposition d'horaire basée sur les habitudes

  deadline?: Date;
  // Date limite (différent de startDate)
  // Ex: "Préparer présentation pour lundi" → deadline = lundi

  estimatedDuration?: number;
  // Durée estimée par l'AI (en minutes)
  // Différent de duration qui est la durée réelle

  originalInput?: string;
  // Texte original de l'utilisateur (pour debug et amélioration)

  parsingConfidence?: number;
  // Niveau de confiance du parsing (0-1)
  // < 0.7 = demander confirmation à l'utilisateur

  interpretationMetadata?: {
    usedAI: boolean;        // Si l'AI a été utilisée
    parsedBy: 'nlp' | 'ai' | 'hybrid';
    detectedIntent: string; // L'intention détectée
    alternatives?: Array<{  // Interprétations alternatives
      interpretation: string;
      confidence: number;
    }>;
  };
}
```

---

### 2️⃣ **Enhanced NLP Service** (Amélioration de l'existant)

**Localisation**: `/mobile/src/services/enhancedNlpService.ts` (nouveau)

**Améliorations**:

#### A. Détection de la Flexibilité Temporelle

```typescript
class EnhancedNLPService {

  detectTimeFlexibility(input: string, parsedDate?: Date): {
    flexibility: 'strict' | 'flexible' | 'range';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    suggestedSlot?: { start: number; end: number };
  } {
    const lowerInput = input.toLowerCase();

    // Cas 1: Heure précise = STRICT
    if (/\d{1,2}[h:]\d{0,2}/.test(input)) {
      return { flexibility: 'strict' };
    }

    // Cas 2: Plage horaire = RANGE
    const timeOfDayPatterns = {
      morning: {
        keywords: ['matin', 'matinée', 'ce matin', 'demain matin'],
        slot: { start: 8, end: 12 }
      },
      afternoon: {
        keywords: ['après-midi', 'aprèm', "cet après-midi"],
        slot: { start: 14, end: 18 }
      },
      evening: {
        keywords: ['soir', 'soirée', 'ce soir'],
        slot: { start: 18, end: 22 }
      },
      night: {
        keywords: ['nuit', 'cette nuit'],
        slot: { start: 22, end: 6 }
      }
    };

    for (const [timeOfDay, config] of Object.entries(timeOfDayPatterns)) {
      if (config.keywords.some(kw => lowerInput.includes(kw))) {
        return {
          flexibility: 'range',
          timeOfDay: timeOfDay as any,
          suggestedSlot: config.slot
        };
      }
    }

    // Cas 3: Juste une date, pas d'heure = FLEXIBLE
    if (parsedDate) {
      return { flexibility: 'flexible' };
    }

    // Pas de date du tout
    return { flexibility: 'flexible' };
  }

  // ...
}
```

#### B. Détection de Deadline vs StartDate

```typescript
detectDeadlineIntent(input: string): 'deadline' | 'startDate' | 'both' {
  const deadlineKeywords = [
    'pour le', 'avant le', 'avant', "d'ici",
    'deadline', 'à rendre', 'livraison'
  ];

  const startKeywords = [
    'à partir de', 'dès', 'commencer', 'débuter'
  ];

  const lowerInput = input.toLowerCase();

  const hasDeadline = deadlineKeywords.some(kw => lowerInput.includes(kw));
  const hasStart = startKeywords.some(kw => lowerInput.includes(kw));

  if (hasDeadline && hasStart) return 'both';
  if (hasDeadline) return 'deadline';
  if (hasStart) return 'startDate';

  // Par défaut, une date = startDate
  return 'startDate';
}
```

#### C. Détection de Plages Temporelles Floues

```typescript
detectTemporalRange(input: string): {
  type: 'week' | 'month' | 'weekend' | 'today' | null;
  startDate?: Date;
  endDate?: Date;
} {
  const lowerInput = input.toLowerCase();

  // "Cette semaine" / "Dans la semaine"
  if (/cette semaine|dans la semaine|cette sem/.test(lowerInput)) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

    return {
      type: 'week',
      startDate: startOfWeek,
      endDate: endOfWeek
    };
  }

  // "Ce weekend"
  if (/ce weekend|ce week-end|le weekend/.test(lowerInput)) {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    return {
      type: 'weekend',
      startDate: saturday,
      endDate: sunday
    };
  }

  // "Ce mois" / "Dans le mois"
  if (/ce mois|dans le mois/.test(lowerInput)) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      type: 'month',
      startDate: startOfMonth,
      endDate: endOfMonth
    };
  }

  return { type: null };
}
```

---

### 3️⃣ **AI-Powered Understanding Service** (Nouveau avec LLM)

**Localisation**: `/mobile/src/services/aiTaskUnderstandingService.ts` (nouveau)

**Objectif**: Utiliser un LLM pour comprendre profondément l'intention de l'utilisateur

#### A. Architecture LLM avec Fallback

```typescript
// Configuration multi-provider
type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'none';

interface AIConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  enabled: boolean;
}

class AITaskUnderstandingService {
  private config: AIConfig;
  private cache: Map<string, any> = new Map(); // Cache pour économiser les appels

  constructor() {
    // Configuration par défaut (peut être changée dans les settings)
    this.config = {
      provider: 'none', // Désactivé par défaut, opt-in
      enabled: false
    };
  }

  async configure(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
    await AsyncStorage.setItem('ai_config', JSON.stringify(this.config));
  }

  // ...
}
```

#### B. Parsing Structuré avec LLM

```typescript
async parseTaskWithAI(input: string, context?: {
  recentTasks?: Task[];
  userHabits?: any;
  currentLocation?: { lat: number; lng: number };
}): Promise<{
  success: boolean;
  data?: EnhancedTaskData;
  confidence: number;
  alternatives?: Array<{ interpretation: string; confidence: number }>;
  error?: string;
}> {

  if (!this.config.enabled) {
    return { success: false, confidence: 0, error: 'AI disabled' };
  }

  // Check cache first
  const cacheKey = this.getCacheKey(input, context);
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }

  try {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(input);

    const response = await this.callLLM(systemPrompt, userPrompt);
    const parsed = this.parseResponse(response);

    // Cache the result (24h TTL)
    this.cache.set(cacheKey, parsed);
    setTimeout(() => this.cache.delete(cacheKey), 24 * 60 * 60 * 1000);

    return parsed;

  } catch (error) {
    console.error('AI parsing error:', error);
    return {
      success: false,
      confidence: 0,
      error: error.message
    };
  }
}

private buildSystemPrompt(context?: any): string {
  return `Tu es un assistant intelligent qui aide à interpréter des tâches écrites en langage naturel.

Ton rôle est d'extraire les informations suivantes d'une phrase utilisateur :

1. **Titre de la tâche** : Le titre nettoyé et concis
2. **Date/Heure** :
   - startDate : Date de début (ISO 8601)
   - deadline : Date limite si différente
   - timeFlexibility : "strict" | "flexible" | "range"
   - timeOfDay : "morning" | "afternoon" | "evening" | "night" (si applicable)
   - suggestedTimeSlot : { start: number, end: number } (si applicable)
3. **Durée** : Durée estimée en minutes
4. **Priorité** : "low" | "medium" | "high"
5. **Catégorie** : "travail" | "personnel" | "courses" | "santé" | "sport" | etc.
6. **Lieu** : Nom et informations de localisation si mentionné
7. **Récurrence** : Si la tâche est récurrente
8. **Intention** : L'intention de l'utilisateur (call, buy, meet, etc.)
9. **Niveau de confiance** : 0-1, ta confiance dans l'interprétation

**Contexte utilisateur** :
${context ? JSON.stringify(context, null, 2) : 'Aucun contexte disponible'}

**Règles importantes** :
- Si l'utilisateur dit "demain" SANS heure précise, utilise timeFlexibility: "flexible"
- Si l'utilisateur dit "demain matin", utilise timeFlexibility: "range" avec timeOfDay: "morning"
- Si l'utilisateur dit "demain 14h", utilise timeFlexibility: "strict"
- Si c'est ambigu, retourne plusieurs alternatives avec leur niveau de confiance
- Utilise les habitudes de l'utilisateur pour affiner l'interprétation

Réponds UNIQUEMENT en JSON valide, sans texte additionnel.`;
}

private buildUserPrompt(input: string): string {
  return `Analyse cette tâche : "${input}"

Retourne un JSON avec cette structure exacte :
{
  "title": "string",
  "startDate": "ISO 8601 string ou null",
  "deadline": "ISO 8601 string ou null",
  "timeFlexibility": "strict | flexible | range",
  "timeOfDay": "morning | afternoon | evening | night ou null",
  "suggestedTimeSlot": { "start": number, "end": number } ou null,
  "duration": number (minutes) ou null,
  "priority": "low | medium | high",
  "category": "string ou null",
  "location": { "name": "string" } ou null,
  "recurringPattern": { ... } ou null,
  "detectedIntent": "string",
  "confidence": number (0-1),
  "reasoning": "string (pourquoi cette interprétation)",
  "alternatives": [
    {
      "interpretation": "string (description alternative)",
      "confidence": number
    }
  ] ou []
}`;
}

private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  switch (this.config.provider) {
    case 'openai':
      return this.callOpenAI(systemPrompt, userPrompt);
    case 'anthropic':
      return this.callAnthropic(systemPrompt, userPrompt);
    case 'ollama':
      return this.callOllama(systemPrompt, userPrompt);
    default:
      throw new Error('No LLM provider configured');
  }
}

// Implementation for OpenAI
private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    },
    body: JSON.stringify({
      model: this.config.model || 'gpt-4o-mini', // Modèle le moins cher
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Plus déterministe
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Implementation for Anthropic (Claude)
private async callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: this.config.model || 'claude-3-haiku-20240307', // Modèle le moins cher
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Implementation for Ollama (local, gratuit)
private async callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: this.config.model || 'llama3.2', // Modèle local gratuit
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      format: 'json'
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}
```

---

### 4️⃣ **Task Interpretation Service** (Orchestrateur)

**Localisation**: `/mobile/src/services/taskInterpretationService.ts` (nouveau)

**Rôle**: Coordonner tous les services pour obtenir la meilleure interprétation

```typescript
class TaskInterpretationService {

  async interpretTask(
    input: string,
    options: {
      useAI?: boolean;
      context?: any;
    } = {}
  ): Promise<InterpretedTask> {

    // Step 1: Enhanced NLP parsing (toujours)
    const nlpResult = enhancedNlpService.parse(input);

    let finalResult: InterpretedTask = {
      ...nlpResult,
      interpretationMetadata: {
        parsedBy: 'nlp',
        usedAI: false,
        detectedIntent: 'unknown'
      }
    };

    // Step 2: Try AI if enabled and available
    if (options.useAI && aiTaskUnderstandingService.isEnabled()) {
      try {
        const aiResult = await aiTaskUnderstandingService.parseTaskWithAI(
          input,
          options.context
        );

        if (aiResult.success && aiResult.confidence > 0.7) {
          // Merge AI results with NLP results (AI takes precedence)
          finalResult = {
            ...nlpResult,
            ...aiResult.data,
            interpretationMetadata: {
              parsedBy: 'ai',
              usedAI: true,
              detectedIntent: aiResult.data.detectedIntent,
              alternatives: aiResult.alternatives
            }
          };
        } else if (aiResult.success && aiResult.confidence > 0.4) {
          // AI pas sûr, on hybride avec NLP
          finalResult = this.mergeInterpretations(nlpResult, aiResult.data);
          finalResult.interpretationMetadata = {
            parsedBy: 'hybrid',
            usedAI: true,
            detectedIntent: aiResult.data.detectedIntent,
            alternatives: aiResult.alternatives
          };
        }
      } catch (error) {
        console.warn('AI parsing failed, falling back to NLP:', error);
        // On garde le résultat NLP
      }
    }

    // Step 3: Smart Task enrichment (toujours)
    const { enrichedTitle, location } = smartTaskService.enrichTaskTitle(finalResult.title);
    finalResult.title = enrichedTitle;
    if (location && !finalResult.location) {
      finalResult.location = location;
    }

    // Step 4: Apply habit learning
    const habits = await habitLearningService.getUserPatterns(finalResult.category);
    if (habits && !finalResult.suggestedTimeSlot && finalResult.timeFlexibility === 'flexible') {
      finalResult.suggestedTimeSlot = {
        start: habits.preferredHours[0],
        end: habits.preferredHours[habits.preferredHours.length - 1]
      };
    }

    // Step 5: Duration prediction with ML
    if (!finalResult.duration && finalResult.category) {
      const predicted = await mlDurationService.predictDuration({
        category: finalResult.category,
        priority: finalResult.priority,
        title: finalResult.title
      });
      finalResult.estimatedDuration = predicted;
    }

    // Step 6: Detect ambiguities and questions to ask
    const questions = this.detectAmbiguities(finalResult);
    if (questions.length > 0) {
      finalResult.requiresClarification = true;
      finalResult.clarificationQuestions = questions;
    }

    return finalResult;
  }

  private detectAmbiguities(task: InterpretedTask): string[] {
    const questions: string[] = [];

    // Pas de date du tout
    if (!task.startDate && !task.deadline) {
      questions.push("Quand voulez-vous faire cette tâche ?");
    }

    // Date mais confiance basse
    if (task.parsingConfidence && task.parsingConfidence < 0.6) {
      questions.push("J'ai compris ça correctement ?");
    }

    // Tâche importante sans rappel
    if (task.priority === 'high' && !task.reminder) {
      questions.push("Voulez-vous un rappel pour cette tâche importante ?");
    }

    // Tâche de lieu sans localisation
    const locationCategories = ['courses', 'sport', 'santé'];
    if (locationCategories.includes(task.category) && !task.location) {
      questions.push("Où voulez-vous faire cette tâche ?");
    }

    return questions;
  }

  private mergeInterpretations(nlp: any, ai: any): InterpretedTask {
    // Intelligence pour merger les deux résultats
    return {
      ...nlp,
      // AI prend la priorité pour certains champs
      title: ai.title || nlp.title,
      timeFlexibility: ai.timeFlexibility || nlp.timeFlexibility,
      detectedIntent: ai.detectedIntent,
      // NLP prend la priorité pour d'autres
      startDate: nlp.startDate || ai.startDate,
      category: nlp.category || ai.category,
      // Merge des deux
      confidence: (nlp.confidence + ai.confidence) / 2
    };
  }
}
```

---

## 🎯 Exemples Concrets d'Amélioration

### Exemple 1: "Acheter du lait demain"

**Avant** (actuel):
```json
{
  "title": "Acheter du lait",
  "startDate": "2025-12-18T00:00:00Z", // ❌ Heure à minuit
  "category": "courses",
  "priority": "medium"
}
```

**Après** (avec améliorations):
```json
{
  "title": "Acheter du lait",
  "startDate": "2025-12-18T00:00:00Z",
  "timeFlexibility": "flexible", // ✅ Nouveau !
  "suggestedTimeSlot": { // ✅ Basé sur les habitudes
    "start": 9,
    "end": 11
  },
  "category": "courses",
  "priority": "medium",
  "estimatedDuration": 30, // ✅ ML prediction
  "originalInput": "Acheter du lait demain",
  "parsingConfidence": 0.95,
  "interpretationMetadata": {
    "parsedBy": "hybrid",
    "usedAI": true,
    "detectedIntent": "shopping"
  }
}
```

### Exemple 2: "Appeler le médecin dans la semaine si possible le matin"

**Avant** (actuel):
```json
{
  "title": "Appeler le médecin dans la semaine si possible le matin", // ❌ Pas nettoyé
  "category": "santé"
  // ❌ Pas de date détectée
}
```

**Après** (avec AI):
```json
{
  "title": "Appeler le médecin",
  "deadline": "2025-12-24T23:59:59Z", // ✅ Fin de la semaine
  "timeFlexibility": "range", // ✅ Plage horaire
  "timeOfDay": "morning", // ✅ Détecté !
  "suggestedTimeSlot": {
    "start": 8,
    "end": 12
  },
  "category": "santé",
  "priority": "medium",
  "detectedIntent": "call",
  "reasoning": "L'utilisateur veut appeler son médecin avant la fin de la semaine, de préférence le matin",
  "parsingConfidence": 0.92,
  "alternatives": [
    {
      "interpretation": "Appel immédiat au médecin",
      "confidence": 0.15
    }
  ]
}
```

### Exemple 3: "Rdv dentiste le 25 à 14h30"

**Avant** (actuel):
```json
{
  "title": "Rdv dentiste",
  "startDate": "2025-12-25T14:30:00Z",
  "time": "14:30"
}
```

**Après** (amélioré):
```json
{
  "title": "Rendez-vous dentiste",
  "startDate": "2025-12-25T14:30:00Z",
  "timeFlexibility": "strict", // ✅ Heure précise
  "duration": 60, // ✅ Estimé à 1h
  "category": "santé",
  "priority": "high", // ✅ RDV = important
  "reminder": { // ✅ Auto-suggéré
    "type": "time",
    "time": "2025-12-25T14:15:00Z" // 15 min avant
  },
  "requiresClarification": false,
  "parsingConfidence": 0.98
}
```

---

## 📱 Améliorations de l'UI

### 1. **Affichage Intelligent du Parsing**

Améliorer `QuickAddScreen` pour afficher :

```tsx
{/* Visualisation de la flexibilité temporelle */}
{parsedTask.timeFlexibility === 'flexible' && (
  <View style={styles.flexibilityIndicator}>
    <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
    <Text style={styles.flexibilityText}>
      Journée entière • {parsedTask.suggestedTimeSlot
        ? `Suggéré: ${parsedTask.suggestedTimeSlot.start}h-${parsedTask.suggestedTimeSlot.end}h`
        : 'N\'importe quand'}
    </Text>
  </View>
)}

{parsedTask.timeFlexibility === 'range' && (
  <View style={styles.flexibilityIndicator}>
    <Ionicons name="partly-sunny" size={16} color={theme.colors.secondary} />
    <Text style={styles.flexibilityText}>
      {parsedTask.timeOfDay === 'morning' && 'Matin (8h-12h)'}
      {parsedTask.timeOfDay === 'afternoon' && 'Après-midi (14h-18h)'}
      {parsedTask.timeOfDay === 'evening' && 'Soir (18h-22h)'}
    </Text>
  </View>
)}

{/* Niveau de confiance */}
{parsedTask.parsingConfidence < 0.7 && (
  <View style={styles.lowConfidenceWarning}>
    <Ionicons name="help-circle" size={16} color={theme.colors.warning} />
    <Text style={styles.warningText}>
      Je ne suis pas sûr d'avoir bien compris
    </Text>
  </View>
)}

{/* Interprétations alternatives */}
{parsedTask.alternatives && parsedTask.alternatives.length > 0 && (
  <View style={styles.alternativesContainer}>
    <Text style={styles.alternativesLabel}>Ou vouliez-vous dire :</Text>
    {parsedTask.alternatives.map((alt, idx) => (
      <TouchableOpacity
        key={idx}
        onPress={() => applyAlternative(alt)}
        style={styles.alternativeChip}
      >
        <Text>{alt.interpretation}</Text>
        <Text style={styles.confidenceText}>{Math.round(alt.confidence * 100)}%</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

### 2. **Settings pour l'AI**

Ajouter un écran dans Settings :

```tsx
// SettingsScreen → Section "Intelligence Artificielle"

<View style={styles.section}>
  <Text style={styles.sectionTitle}>Intelligence Artificielle</Text>

  <SwitchRow
    label="Activer l'AI pour comprendre les tâches"
    value={aiEnabled}
    onValueChange={setAIEnabled}
  />

  {aiEnabled && (
    <>
      <Picker
        label="Fournisseur AI"
        value={aiProvider}
        options={[
          { label: 'OpenAI (GPT-4)', value: 'openai' },
          { label: 'Anthropic (Claude)', value: 'anthropic' },
          { label: 'Ollama (Local, gratuit)', value: 'ollama' },
        ]}
        onChange={setAIProvider}
      />

      {aiProvider !== 'ollama' && (
        <TextInput
          label="Clé API"
          value={apiKey}
          onChangeText={setAPIKey}
          secureTextEntry
          placeholder="sk-..."
        />
      )}

      <InfoBox>
        💡 L'AI améliore la compréhension mais consomme des crédits.
        Coût estimé : ~0.001€ par tâche avec GPT-4o-mini
      </InfoBox>
    </>
  )}
</View>
```

---

## 🚀 Plan de Mise en Œuvre

### Phase 1️⃣ : Fondations (Semaine 1)
**Sans IA, juste amélioration du NLP existant**

1. ✅ Ajouter les nouveaux champs au modèle `Task`
   - Migration de la base de données (WatermelonDB + MongoDB)
   - Mettre à jour les types TypeScript

2. ✅ Créer `enhancedNlpService.ts`
   - Détection de la flexibilité temporelle
   - Détection deadline vs startDate
   - Détection plages temporelles floues
   - Amélioration du parsing existant

3. ✅ Créer `taskInterpretationService.ts` (sans AI pour l'instant)
   - Orchestration NLP + Smart Task + ML Duration
   - Détection des ambiguïtés
   - Merge des interprétations

4. ✅ Mettre à jour `QuickAddScreen`
   - Afficher la flexibilité temporelle
   - Afficher les suggestions intelligentes
   - Afficher le niveau de confiance

### Phase 2️⃣ : Intelligence Artificielle (Semaine 2)
**Intégration optionnelle de l'AI**

5. ✅ Créer `aiTaskUnderstandingService.ts`
   - Support OpenAI, Anthropic, Ollama
   - Système de cache intelligent
   - Fallback gracieux

6. ✅ Intégrer l'AI dans `taskInterpretationService.ts`
   - Logique de merge AI + NLP
   - Gestion des alternatives
   - Confiance combinée

7. ✅ Ajouter les Settings AI
   - Toggle AI on/off
   - Sélection du provider
   - Configuration API key

### Phase 3️⃣ : UI/UX (Semaine 3)
**Améliorer l'expérience utilisateur**

8. ✅ Améliorer l'affichage du parsing
   - Indicateurs de flexibilité
   - Alternatives cliquables
   - Warnings pour basse confiance

9. ✅ Ajouter des suggestions pro-actives
   - "Voulez-vous ajouter un rappel ?"
   - "Cette tâche semble nécessiter une localisation"
   - "Basé sur vos habitudes, je suggère..."

10. ✅ Feedback loop
    - Bouton "Bien compris ?" après création
    - Learning à partir des corrections
    - Amélioration continue

### Phase 4️⃣ : Backend (Semaine 4)
**Synchroniser avec le backend**

11. ✅ Mettre à jour le backend NLP service
    - Intégrer les mêmes améliorations
    - Support des nouveaux champs
    - API endpoint pour l'AI parsing

12. ✅ Migration de données
    - Script pour migrer les tâches existantes
    - Ajouter les nouveaux champs avec valeurs par défaut

13. ✅ Tests & Optimisation
    - Tests unitaires pour chaque service
    - Tests d'intégration
    - Optimisation des performances
    - Monitoring des coûts AI

---

## 💰 Coûts et Considérations

### Coûts AI (estimation)

#### Option 1: OpenAI GPT-4o-mini
- Prix: ~$0.00015 par tâche (150 tokens)
- Pour 1000 tâches/mois : ~$0.15/mois
- ✅ Très bon rapport qualité/prix
- ✅ API stable et rapide

#### Option 2: Anthropic Claude 3 Haiku
- Prix: ~$0.00025 par tâche
- Pour 1000 tâches/mois : ~$0.25/mois
- ✅ Excellente compréhension du français
- ✅ Réponses structurées

#### Option 3: Ollama (Local)
- Prix: GRATUIT (nécessite serveur local)
- ✅ Pas de coûts
- ✅ Privacy totale
- ❌ Nécessite backend pour mobile

### Recommandation

**Approche hybride** :
1. NLP amélioré par défaut (gratuit)
2. AI optionnelle (opt-in dans settings)
3. Cache intelligent pour réduire les appels
4. Limites par utilisateur (ex: 100 tâches AI/mois en gratuit)
5. Premium pour AI illimité

---

## 🎓 Apprentissage Continu

### Système de Feedback

```typescript
interface TaskFeedback {
  taskId: string;
  originalInput: string;
  parsedData: InterpretedTask;
  userCorrections: {
    field: string;
    expected: any;
    parsed: any;
  }[];
  wasCorrect: boolean;
  timestamp: Date;
}

// Après chaque création de tâche
async function collectFeedback(task: Task) {
  // Demander à l'utilisateur si c'est correct
  const feedback = await showFeedbackModal();

  if (!feedback.wasCorrect) {
    // Enregistrer les corrections
    await learningService.recordMistake({
      input: task.originalInput,
      parsed: task,
      expected: feedback.corrections
    });

    // Si AI utilisée, fine-tune ou améliorer les prompts
    if (task.interpretationMetadata.usedAI) {
      await aiTaskUnderstandingService.learnFromMistake(feedback);
    }
  }
}
```

---

## 📊 Métriques de Succès

Pour mesurer l'amélioration :

1. **Taux de Parsing Réussi**
   - Avant : ~60-70% (estimation)
   - Objectif : >90%

2. **Taux de Corrections Utilisateur**
   - Avant : ~30% des tâches nécessitent corrections
   - Objectif : <10%

3. **Confiance Moyenne**
   - Objectif : >0.85

4. **Temps de Création de Tâche**
   - Objectif : <10 secondes (avec AI)

5. **Satisfaction Utilisateur**
   - Survey après 1 semaine d'utilisation
   - Net Promoter Score (NPS)

---

## ⚠️ Risques et Mitigation

### Risque 1: Coûts AI Incontrôlés
**Mitigation**:
- Limites par utilisateur
- Cache agressif
- Fallback automatique sur NLP

### Risque 2: Latence
**Mitigation**:
- Affichage progressif (NLP d'abord, AI après)
- Timeout après 3 secondes
- Optimistic UI updates

### Risque 3: Privacy
**Mitigation**:
- Option "AI locale uniquement" (Ollama)
- Pas d'envoi de données sensibles
- Anonymisation avant envoi

### Risque 4: Dépendance API externe
**Mitigation**:
- Toujours avoir le fallback NLP
- Multi-provider support
- Mode offline fonctionnel

---

## 🎯 Résumé

Cette amélioration va transformer l'application en un assistant vraiment intelligent qui :

✅ **Comprend le langage naturel** avec ou sans AI
✅ **Gère la flexibilité temporelle** ("demain" vs "demain 14h")
✅ **Détecte les intentions** (acheter, appeler, rencontrer, etc.)
✅ **Propose intelligemment** basé sur les habitudes
✅ **S'améliore continuellement** via feedback
✅ **Reste rapide et efficace** même sans AI
✅ **Respecte la privacy** avec options locales

L'approche progressive permet de :
- Démarrer sans AI (Phase 1 suffit déjà pour une grosse amélioration)
- Tester l'AI de manière opt-in
- Contrôler les coûts
- Maintenir la performance

**Es-tu prêt à commencer ? Par quelle phase veux-tu que je commence ?**
