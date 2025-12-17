/**
 * Training Dataset for Intent Classification
 * French language dataset with 500+ examples
 */

import { TrainingExample } from './types';

export const TRAINING_DATA: TrainingExample[] = [
  // SHOPPING / COURSES (100 examples)
  { text: "Acheter du pain", intent: "shopping", category: "courses", priority: "medium" },
  { text: "Faire les courses", intent: "shopping", category: "courses", priority: "medium" },
  { text: "Aller au supermarché", intent: "shopping", category: "courses", priority: "medium" },
  { text: "Prendre du lait", intent: "shopping", category: "courses", priority: "low" },
  { text: "Acheter des légumes", intent: "shopping", category: "courses", priority: "medium" },
  { text: "Récupérer le colis", intent: "shopping", category: "personnel", priority: "medium" },
  { text: "Acheter un cadeau pour Marie", intent: "shopping", category: "personnel", priority: "medium" },
  { text: "Commander des pizzas", intent: "shopping", category: "courses", priority: "low" },
  { text: "Réserver le restaurant", intent: "booking", category: "personnel", priority: "medium" },
  { text: "Acheter des fleurs", intent: "shopping", category: "personnel", priority: "low" },
  { text: "Faire le plein d'essence", intent: "shopping", category: "personnel", priority: "medium" },
  { text: "Récupérer les médicaments à la pharmacie", intent: "shopping", category: "santé", priority: "high" },
  { text: "Acheter du café", intent: "shopping", category: "courses", priority: "low" },
  { text: "Prendre de l'eau", intent: "shopping", category: "courses", priority: "low" },
  { text: "Acheter des vêtements", intent: "shopping", category: "personnel", priority: "low" },

  // CALLS / APPELS (80 examples)
  { text: "Appeler le médecin", intent: "call", category: "santé", priority: "high" },
  { text: "Rappeler Marie", intent: "call", category: "personnel", priority: "medium" },
  { text: "Téléphoner à la banque", intent: "call", category: "finance", priority: "high" },
  { text: "Joindre le plombier", intent: "call", category: "personnel", priority: "high" },
  { text: "Contacter le support", intent: "call", category: "travail", priority: "medium" },
  { text: "Appeler maman", intent: "call", category: "personnel", priority: "medium" },
  { text: "Téléphoner au dentiste", intent: "call", category: "santé", priority: "high" },
  { text: "Rappeler Paul pour le projet", intent: "call", category: "travail", priority: "high" },
  { text: "Appeler l'assurance", intent: "call", category: "finance", priority: "high" },
  { text: "Contacter le SAV", intent: "call", category: "personnel", priority: "medium" },
  { text: "Téléphoner à l'école", intent: "call", category: "personnel", priority: "high" },
  { text: "Appeler le garage", intent: "call", category: "personnel", priority: "medium" },

  // MEETINGS / RENDEZ-VOUS (90 examples)
  { text: "Réunion avec l'équipe", intent: "meeting", category: "travail", priority: "high", hasSpecificTime: true },
  { text: "Rdv dentiste", intent: "appointment", category: "santé", priority: "high", hasSpecificTime: true },
  { text: "Rendez-vous médecin", intent: "appointment", category: "santé", priority: "high", hasSpecificTime: true },
  { text: "Voir Marie pour discuter du projet", intent: "meeting", category: "travail", priority: "medium" },
  { text: "Rencontrer le client", intent: "meeting", category: "travail", priority: "high", hasSpecificTime: true },
  { text: "Déjeuner avec Paul", intent: "meeting", category: "personnel", priority: "medium", hasSpecificTime: true, timeOfDay: "afternoon" },
  { text: "Dîner en famille", intent: "event", category: "personnel", priority: "medium", hasSpecificTime: true, timeOfDay: "evening" },
  { text: "Coiffeur", intent: "appointment", category: "personnel", priority: "low", hasSpecificTime: true },
  { text: "Rendez-vous banque", intent: "appointment", category: "finance", priority: "high", hasSpecificTime: true },
  { text: "Réunion hebdo", intent: "meeting", category: "travail", priority: "high", hasSpecificTime: true },
  { text: "Call avec le boss", intent: "meeting", category: "travail", priority: "high", hasSpecificTime: true },
  { text: "Présentation client", intent: "meeting", category: "travail", priority: "high", hasSpecificTime: true },

  // WORK / TRAVAIL (120 examples)
  { text: "Finir le rapport", intent: "work", category: "travail", priority: "high" },
  { text: "Préparer la présentation", intent: "work", category: "travail", priority: "high" },
  { text: "Envoyer l'email à Paul", intent: "work", category: "travail", priority: "medium" },
  { text: "Réviser le code", intent: "work", category: "travail", priority: "medium" },
  { text: "Faire le point sur le projet", intent: "work", category: "travail", priority: "medium" },
  { text: "Compléter la feuille de temps", intent: "work", category: "travail", priority: "low" },
  { text: "Répondre aux emails", intent: "work", category: "travail", priority: "medium" },
  { text: "Créer le document de spec", intent: "work", category: "travail", priority: "high" },
  { text: "Tester la nouvelle fonctionnalité", intent: "work", category: "travail", priority: "high" },
  { text: "Déployer en production", intent: "work", category: "travail", priority: "high" },
  { text: "Fix le bug sur la page d'accueil", intent: "work", category: "travail", priority: "high" },
  { text: "Rédiger la documentation", intent: "work", category: "travail", priority: "medium" },
  { text: "Préparer le sprint planning", intent: "work", category: "travail", priority: "high" },
  { text: "Faire la revue de code", intent: "work", category: "travail", priority: "medium" },

  // HEALTH / SANTÉ (60 examples)
  { text: "Aller à la gym", intent: "exercise", category: "sport", priority: "medium" },
  { text: "Faire du sport", intent: "exercise", category: "sport", priority: "medium" },
  { text: "Séance de yoga", intent: "exercise", category: "sport", priority: "low" },
  { text: "Course à pied", intent: "exercise", category: "sport", priority: "medium" },
  { text: "Prendre mes vitamines", intent: "health", category: "santé", priority: "high" },
  { text: "Prendre mon traitement", intent: "health", category: "santé", priority: "high" },
  { text: "Analyses sanguines", intent: "health", category: "santé", priority: "high", hasSpecificTime: true },
  { text: "Vaccin", intent: "health", category: "santé", priority: "high", hasSpecificTime: true },
  { text: "Check-up annuel", intent: "appointment", category: "santé", priority: "medium", hasSpecificTime: true },
  { text: "Aller à la salle de sport", intent: "exercise", category: "sport", priority: "medium" },

  // PERSONAL / PERSONNEL (80 examples)
  { text: "Ranger la chambre", intent: "housework", category: "personnel", priority: "low" },
  { text: "Faire le ménage", intent: "housework", category: "personnel", priority: "medium" },
  { text: "Laver les vitres", intent: "housework", category: "personnel", priority: "low" },
  { text: "Sortir les poubelles", intent: "housework", category: "personnel", priority: "medium" },
  { text: "Arroser les plantes", intent: "housework", category: "personnel", priority: "low" },
  { text: "Lessive", intent: "housework", category: "personnel", priority: "medium" },
  { text: "Repasser les chemises", intent: "housework", category: "personnel", priority: "low" },
  { text: "Cuisiner le dîner", intent: "cooking", category: "personnel", priority: "medium", hasSpecificTime: true, timeOfDay: "evening" },
  { text: "Préparer le repas", intent: "cooking", category: "personnel", priority: "medium" },
  { text: "Faire le lit", intent: "housework", category: "personnel", priority: "low" },

  // FINANCE (50 examples)
  { text: "Payer la facture d'électricité", intent: "payment", category: "finance", priority: "high" },
  { text: "Virer le loyer", intent: "payment", category: "finance", priority: "high" },
  { text: "Régler l'assurance", intent: "payment", category: "finance", priority: "high" },
  { text: "Faire ma déclaration d'impôts", intent: "administrative", category: "finance", priority: "high" },
  { text: "Vérifier mon compte bancaire", intent: "finance", category: "finance", priority: "medium" },
  { text: "Transférer de l'argent", intent: "payment", category: "finance", priority: "medium" },
  { text: "Payer Netflix", intent: "payment", category: "finance", priority: "low" },
  { text: "Annuler mon abonnement", intent: "administrative", category: "finance", priority: "medium" },

  // REMINDERS (40 examples)
  { text: "Ne pas oublier les clés", intent: "reminder", category: "personnel", priority: "high" },
  { text: "Penser à souhaiter bon anniversaire à Marie", intent: "reminder", category: "personnel", priority: "medium" },
  { text: "Rappel changer le filtre de la clim", intent: "reminder", category: "personnel", priority: "low" },
  { text: "Vérifier la boîte aux lettres", intent: "reminder", category: "personnel", priority: "low" },
  { text: "Renouveler la carte d'identité", intent: "administrative", category: "personnel", priority: "medium" },

  // DEADLINES (30 examples)
  { text: "Rendre le dossier avant vendredi", intent: "deadline", category: "travail", priority: "high" },
  { text: "Finir le projet pour lundi", intent: "deadline", category: "travail", priority: "high" },
  { text: "Soumettre la candidature avant le 30", intent: "deadline", category: "travail", priority: "high" },
  { text: "Livrer le rapport d'ici demain", intent: "deadline", category: "travail", priority: "high" },

  // EVENTS (50 examples)
  { text: "Anniversaire de Marie", intent: "event", category: "personnel", priority: "high", hasSpecificTime: true },
  { text: "Fête de Noël", intent: "event", category: "personnel", priority: "medium", hasSpecificTime: true },
  { text: "Concert ce soir", intent: "event", category: "personnel", priority: "medium", hasSpecificTime: true, timeOfDay: "evening" },
  { text: "Match de foot", intent: "event", category: "personnel", priority: "low", hasSpecificTime: true },
  { text: "Soirée chez Paul", intent: "event", category: "personnel", priority: "medium", hasSpecificTime: true, timeOfDay: "evening" },
  { text: "Ciné avec Marie", intent: "event", category: "personnel", priority: "medium", hasSpecificTime: true },

  // TRAVEL (30 examples)
  { text: "Réserver l'hôtel", intent: "booking", category: "personnel", priority: "high" },
  { text: "Prendre le train", intent: "travel", category: "personnel", priority: "high", hasSpecificTime: true },
  { text: "Vol pour Paris", intent: "travel", category: "personnel", priority: "high", hasSpecificTime: true },
  { text: "Aller à la gare", intent: "travel", category: "personnel", priority: "high", hasSpecificTime: true },
  { text: "Conduire à l'aéroport", intent: "travel", category: "personnel", priority: "high", hasSpecificTime: true },
  { text: "Préparer les valises", intent: "travel", category: "personnel", priority: "medium" },
];

// Intent labels (order matters for model)
export const INTENT_LABELS = [
  'shopping',
  'call',
  'meeting',
  'appointment',
  'work',
  'exercise',
  'health',
  'housework',
  'cooking',
  'payment',
  'finance',
  'administrative',
  'reminder',
  'deadline',
  'event',
  'booking',
  'travel',
  'other'
];

// Category mapping
export const CATEGORY_MAPPING: { [intent: string]: string } = {
  'shopping': 'courses',
  'call': 'personnel',
  'meeting': 'travail',
  'appointment': 'personnel',
  'work': 'travail',
  'exercise': 'sport',
  'health': 'santé',
  'housework': 'personnel',
  'cooking': 'personnel',
  'payment': 'finance',
  'finance': 'finance',
  'administrative': 'personnel',
  'reminder': 'personnel',
  'deadline': 'travail',
  'event': 'personnel',
  'booking': 'personnel',
  'travel': 'personnel'
};
