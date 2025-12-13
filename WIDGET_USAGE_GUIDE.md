# 📱 Guide d'Utilisation des Widgets Do-It

Ce guide explique comment installer, utiliser et tirer le meilleur parti des widgets Do-It pour iOS et Android.

## 📋 Table des Matières

1. [Widgets Disponibles](#widgets-disponibles)
2. [Installation iOS](#installation-ios)
3. [Installation Android](#installation-android)
4. [Configuration](#configuration)
5. [Deep Linking](#deep-linking)
6. [Foire aux Questions](#foire-aux-questions)
7. [Résolution de Problèmes](#résolution-de-problèmes)

---

## 🎨 Widgets Disponibles

### 1. Widget "Tâches du Jour" 📅
**Tailles disponibles:** Petit (2x2), Moyen (4x2), Grand (4x4)

**Fonctionnalités:**
- Affiche toutes les tâches du jour
- Barre de progression visuelle
- Cases à cocher pour chaque tâche
- Indicateurs de priorité (couleurs)
- Heure de début et localisation
- Messages motivationnels (80%+ de complétion)

**Idéal pour:**
- Vue d'ensemble rapide de la journée
- Suivre la progression en temps réel
- Motivation quotidienne

---

### 2. Widget "Prochaine Tâche" ⏰
**Taille disponible:** Petit (2x2)

**Fonctionnalités:**
- Affiche la tâche la plus urgente
- Badge de priorité (Urgent/Moyen/Faible)
- Heure de début
- Localisation si applicable
- Durée estimée
- Icône de catégorie

**Idéal pour:**
- Focus sur la tâche immédiate
- Rappel visuel constant
- Organisation rapide

---

### 3. Widget "Statistiques" 📊
**Taille disponible:** Moyen (4x2)

**Fonctionnalités:**
- Taux de complétion (%)
- Total de tâches complétées
- Série actuelle (nombre de jours consécutifs)
- Meilleur record de série
- Tendance (progression/baisse/stable)
- Moyenne de tâches par jour

**Idéal pour:**
- Suivre la productivité
- Motivation par les statistiques
- Analyse de performance

---

### 4. Widget "Assistant Intelligent" 🧠
**Taille disponible:** Moyen (4x2)

**Fonctionnalités:**
- Suggestion principale d'optimisation
- Type de suggestion (Regrouper/Reprogrammer/etc.)
- Niveau de confiance (indicateurs visuels)
- Impact estimé (temps/distance économisés)
- Prévisualisation d'autres suggestions
- Compteur de suggestions disponibles

**Idéal pour:**
- Optimisation automatique
- Économiser du temps
- Améliorer l'efficacité

---

## 📱 Installation iOS

### Prérequis
- iOS 14 ou supérieur
- Do-It app installée et configurée
- Au moins une tâche créée (recommandé)

### Étapes d'Installation

1. **Accéder au mode édition**
   - Appuyez longuement sur l'écran d'accueil
   - Les icônes commenceront à trembler
   - Touchez le bouton `+` en haut à gauche

2. **Rechercher Do-It**
   - Dans la barre de recherche, tapez "Do-It"
   - Sélectionnez "Do-It" dans la liste des résultats

3. **Choisir un widget**
   - Faites défiler pour voir tous les widgets disponibles:
     - **Today Widget:** Petit, Moyen, Grand
     - **Next Task Widget:** Petit
     - **Stats Widget:** Moyen
     - **Smart Suggestions Widget:** Moyen

4. **Ajouter le widget**
   - Sélectionnez la taille souhaitée
   - Touchez "Ajouter le widget"
   - Positionnez le widget où vous le souhaitez
   - Touchez "Terminé" en haut à droite

### Personnalisation iOS

**Modifier la taille d'un widget:**
1. Appuyez longuement sur le widget
2. Sélectionnez "Modifier le widget"
3. Choisissez une nouvelle taille (si disponible)
4. Touchez en dehors pour valider

**Supprimer un widget:**
1. Appuyez longuement sur le widget
2. Sélectionnez "Supprimer le widget"
3. Confirmez

---

## 🤖 Installation Android

### Prérequis
- Android 8.0 (Oreo) ou supérieur
- Do-It app installée et configurée
- Au moins une tâche créée (recommandé)

### Étapes d'Installation

1. **Accéder aux widgets**
   - Appuyez longuement sur un espace vide de l'écran d'accueil
   - Touchez "Widgets" dans le menu qui apparaît

2. **Rechercher Do-It**
   - Faites défiler dans la liste des apps
   - Trouvez "Do-It" dans la liste alphabétique
   - Développez la section pour voir tous les widgets

3. **Choisir un widget**
   - Widgets disponibles:
     - **Tâches du Jour:** Petit, Moyen, Grand
     - **Prochaine Tâche:** Petit
     - **Statistiques:** Moyen
     - **Suggestions Intelligentes:** Moyen

4. **Placer le widget**
   - Appuyez longuement sur le widget souhaité
   - Faites-le glisser vers l'emplacement désiré
   - Relâchez pour placer
   - Redimensionnez si nécessaire (points de redimensionnement aux coins)

### Personnalisation Android

**Redimensionner un widget:**
1. Appuyez longuement sur le widget
2. Relâchez (points de redimensionnement apparaissent)
3. Faites glisser les points pour ajuster la taille
4. Touchez en dehors pour valider

**Supprimer un widget:**
1. Appuyez longuement sur le widget
2. Faites-le glisser vers "Supprimer" en haut
3. Relâchez

---

## ⚙️ Configuration

### Mise à Jour Automatique

Les widgets se mettent à jour automatiquement:
- **iOS:** Toutes les 15 minutes
- **Android:** Toutes les 15-30 minutes (selon le widget)

### Mise à Jour Manuelle

**Pour forcer une mise à jour:**
1. Ouvrez l'application Do-It
2. Naviguez vers Réglages → Widgets
3. Touchez "Actualiser tous les widgets"

Ou simplement:
- Touchez le widget pour ouvrir l'app (met à jour au retour)

### Données Affichées

Les widgets affichent:
- **Tâches du jour:** Tâches avec `startDate = aujourd'hui` ou sans date
- **Prochaine tâche:** Tâche non complétée avec la priorité la plus élevée
- **Statistiques:** Calculées sur les 7 derniers jours par défaut
- **Suggestions:** Générées par l'assistant intelligent en temps réel

---

## 🔗 Deep Linking

### URLs Supportées

Les widgets utilisent le schéma d'URL `doit://` pour ouvrir l'app:

```
doit://today              → Ouvre l'écran "Aujourd'hui"
doit://task/{id}          → Ouvre la tâche spécifique
doit://stats              → Ouvre l'écran Statistiques
doit://smart-assistant    → Ouvre l'Assistant Intelligent
doit://quick-add          → Ouvre l'écran Ajout Rapide
```

### Actions des Widgets

**Widget "Tâches du Jour":**
- Touche sur le widget → `doit://today`
- Touche sur une tâche → `doit://task/{taskId}` (futur)

**Widget "Prochaine Tâche":**
- Touche sur le widget → `doit://task/{taskId}`

**Widget "Statistiques":**
- Touche sur le widget → `doit://stats`

**Widget "Assistant Intelligent":**
- Touche sur le widget → `doit://smart-assistant`

---

## ❓ Foire aux Questions

### Général

**Q: Combien de widgets puis-je ajouter?**
R: Autant que vous voulez! iOS et Android n'imposent pas de limite.

**Q: Les widgets fonctionnent-ils hors ligne?**
R: Oui, les widgets affichent les dernières données synchronisées. Ils se mettent à jour dès que la connexion est rétablie.

**Q: Les widgets consomment-ils beaucoup de batterie?**
R: Non. Les widgets utilisent un système de mise à jour intelligent et ne consomment presque pas de batterie.

**Q: Puis-je personnaliser les couleurs des widgets?**
R: Les widgets suivent automatiquement le mode clair/sombre de votre appareil. La personnalisation des couleurs sera ajoutée dans une future version.

### iOS Spécifique

**Q: Pourquoi mon widget affiche "Aucune donnée"?**
R:
1. Assurez-vous que l'app est installée
2. Ouvrez l'app au moins une fois
3. Créez au moins une tâche
4. Attendez quelques secondes pour la mise à jour

**Q: Le widget ne se met pas à jour.**
R:
1. Vérifiez que l'app a les permissions nécessaires
2. Ouvrez l'app pour forcer une synchronisation
3. Retirez et rajoutez le widget

**Q: Puis-je utiliser les widgets sur l'écran de verrouillage (iOS 16+)?**
R: Oui! Les petits widgets (2x2) sont compatibles avec l'écran de verrouillage iOS 16+.

### Android Spécifique

**Q: Le widget est flou/pixelisé.**
R: Redimensionnez le widget ou supprimez-le et recréez-le à la bonne taille.

**Q: Le widget ne répond pas aux touchers.**
R:
1. Vérifiez que Do-It est à jour
2. Redémarrez votre appareil
3. Retirez et rajoutez le widget

**Q: Le widget disparaît après un redémarrage.**
R: Si Do-It est installée sur la carte SD, déplacez-la vers la mémoire interne (Réglages → Apps → Do-It → Stockage → Modifier).

---

## 🔧 Résolution de Problèmes

### Widget vide ou erreur

**Symptôme:** Le widget affiche "Erreur" ou reste vide

**Solutions:**
1. Ouvrez l'application Do-It
2. Créez au moins une tâche
3. Synchronisez les données (tirez pour actualiser)
4. Attendez 30 secondes
5. Si le problème persiste, retirez et rajoutez le widget

### Widget ne se met pas à jour

**Symptôme:** Les données du widget sont obsolètes

**Solutions:**
1. Touchez le widget pour ouvrir l'app
2. Vérifiez votre connexion internet
3. Dans Réglages → Widgets, touchez "Actualiser"
4. Redémarrez l'application

### Widget ne s'affiche pas dans la liste

**Symptôme:** Impossible de trouver les widgets Do-It

**Solutions iOS:**
1. Redémarrez votre iPhone
2. Vérifiez que Do-It est installée via l'App Store
3. Mettez à jour iOS vers la dernière version
4. Désinstallez et réinstallez Do-It

**Solutions Android:**
1. Redémarrez votre appareil
2. Vérifiez que Do-It est installée depuis le Play Store
3. Assurez-vous qu'Android est version 8.0+
4. Désinstallez et réinstallez Do-It

### Données incorrectes

**Symptôme:** Le widget affiche des tâches incorrectes ou des stats erronées

**Solutions:**
1. Ouvrez l'app et synchronisez manuellement
2. Vérifiez que les tâches sont bien sauvegardées
3. Déconnectez-vous et reconnectez-vous
4. Contactez le support si le problème persiste

---

## 📞 Support

Si vous rencontrez des problèmes non résolus par ce guide:

1. **In-App:** Réglages → Aide et Support → Signaler un problème
2. **Email:** support@doit-app.com
3. **GitHub:** https://github.com/your-repo/issues

---

## 🎯 Conseils d'Utilisation

### Configuration Recommandée

**Écran d'accueil principal:**
- 1x Widget "Prochaine Tâche" (Petit) - En haut à droite
- 1x Widget "Tâches du Jour" (Moyen) - Au centre

**Page secondaire:**
- 1x Widget "Statistiques" (Moyen) - En haut
- 1x Widget "Assistant Intelligent" (Moyen) - En dessous

### Optimisation Batterie

- Désactivez les widgets que vous n'utilisez pas
- Utilisez le mode sombre (économise batterie sur écrans OLED)
- Gardez l'app à jour pour les optimisations

### Meilleure Expérience

1. **Créez des tâches avec toutes les infos:**
   - Heure de début (pour l'ordre)
   - Priorité (pour "Prochaine Tâche")
   - Localisation (affichée dans les widgets)
   - Durée estimée

2. **Complétez vos tâches régulièrement:**
   - Les statistiques sont plus pertinentes
   - L'assistant intelligent donne de meilleures suggestions

3. **Utilisez les suggestions:**
   - Suivez les recommandations de l'assistant
   - Économisez du temps et de l'énergie

---

## 📝 Notes de Version

### Version 1.0.0
- Widget "Tâches du Jour" (Petit, Moyen, Grand)
- Widget "Prochaine Tâche" (Petit)
- Widget "Statistiques" (Moyen)
- Widget "Assistant Intelligent" (Moyen)
- Support iOS 14+ et Android 8+
- Deep linking complet
- Mode clair/sombre automatique

---

**Dernière mise à jour:** 13 décembre 2025
**Version du guide:** 1.0.0
