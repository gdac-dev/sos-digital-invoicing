import { useState, useRef, useEffect } from 'react';
import { useLang } from '../../context/LangContext';
import { MessageCircle, X, Send, ChevronDown, Mail, Phone } from 'lucide-react';
import logoImg from '../../assets/logo.jpeg';

const ADMIN_EMAIL = 'arsenedemenou@gmail.com';
const ADMIN_PHONE = '237683091628';
const ADMIN_PHONE_DISPLAY = '+237 6 83 09 16 28';

// ─────────────────────────────────────────────
// COMPREHENSIVE BILINGUAL KNOWLEDGE BASE
// ─────────────────────────────────────────────

const KB = {
  fr: {
    // ── FACTURES ──
    categories: [
      {
        name: 'Factures',
        entries: [
          { keys: ['créer facture', 'nouvelle facture', 'faire facture', 'comment facturer', 'ajouter facture', 'établir facture'], answer: '📄 **Créer une facture** :\n1. Menu **Factures** → bouton **Nouvelle facture**\n2. Onglet **Client** : sélectionnez ou importez un client depuis le CRM\n3. Onglet **Prestations** : ajoutez vos services, quantités et prix\n4. Onglet **Design** : choisissez le modèle, la palette et la police\n5. Cliquez **Créer** en haut pour enregistrer\n\nUn aperçu temps réel s\'affiche à droite !' },
          { keys: ['modifier facture', 'éditer facture', 'changer facture', 'mettre à jour facture', 'corriger facture'], answer: '✏️ **Modifier une facture** :\n1. Allez dans **Factures**\n2. Cliquez sur l\'icône ✏️ (crayon) à droite de la facture\n3. Modifiez les champs souhaités dans l\'éditeur\n4. Cliquez **Mettre à jour** pour sauvegarder' },
          { keys: ['supprimer facture', 'effacer facture', 'enlever facture', 'annuler facture'], answer: '🗑️ **Supprimer une facture** :\n1. Allez dans **Factures**\n2. Cliquez sur l\'icône 🗑️ (corbeille) à droite\n3. Confirmez la suppression\n\n⚠️ Cette action est irréversible !' },
          { keys: ['voir facture', 'consulter facture', 'détail facture', 'ouvrir facture', 'afficher facture'], answer: '👁️ **Voir une facture** :\nCliquez sur n\'importe quelle ligne dans la liste des factures, ou sur l\'icône 👁️ pour accéder à la page de détail avec aperçu, historique des paiements et actions rapides.' },
          { keys: ['statut facture', 'état facture', 'brouillon', 'envoyé', 'payé', 'en retard'], answer: '📊 **Statuts des factures** :\n• **Brouillon** : facture en cours de création\n• **Envoyé** : facture transmise au client\n• **Vu** : le client a ouvert la facture\n• **Payé** : paiement total reçu\n• **En retard** : échéance dépassée\n• **Annulé** : facture invalidée\n\nVous pouvez filtrer par statut dans la liste.' },
          { keys: ['numéro facture', 'numérotation', 'format numéro', 'inv-'], answer: '🔢 **Numérotation des factures** :\nLe système génère automatiquement un numéro au format **INV-2026-0001**. Le compteur s\'incrémente à chaque création. Vous pouvez aussi saisir un numéro personnalisé dans l\'onglet **Détails** de l\'éditeur.' },
          { keys: ['devise', 'monnaie', 'fcfa', 'euro', 'dollar', 'currency'], answer: '💱 **Devises disponibles** :\n• FCFA (par défaut)\n• EUR (Euro)\n• USD (Dollar US)\n• GBP (Livre sterling)\n• CAD (Dollar canadien)\n\nChangez la devise dans l\'onglet **Détails** de l\'éditeur.' },
          { keys: ['taxe', 'tva', 'impôt', 'pourcentage'], answer: '🧮 **TVA et taxes** :\nDans l\'onglet **Prestations** de l\'éditeur, section **Ajustements** :\n• Saisissez le taux de TVA en % (par défaut 19.25%)\n• Ajoutez une remise en FCFA si nécessaire\n• Le total TTC est calculé automatiquement en temps réel' },
          { keys: ['remise', 'réduction', 'discount', 'promotion'], answer: '🏷️ **Appliquer une remise** :\nDans l\'éditeur de facture, onglet **Prestations**, section **Ajustements** :\n• Saisissez le montant de la remise en FCFA\n• La remise est déduite avant le calcul de la TVA\n• Le total est mis à jour en temps réel dans l\'aperçu' },
          { keys: ['main oeuvre', 'main-d\'oeuvre', 'main d\'oeuvre', 'labour'], answer: '🔧 **Main-d\'œuvre** :\nDans l\'éditeur, onglet **Prestations** → **Ajustements**, vous pouvez ajouter un montant forfaitaire de main-d\'œuvre qui s\'ajoute au sous-total avant TVA.' },
          { keys: ['section', 'groupe', 'catégorie prestation', 'organiser'], answer: '📑 **Sections de prestations** :\nVous pouvez organiser vos prestations en sections (ex: "Développement", "Design"). Cliquez **Ajouter une section** et donnez-lui un titre. Chaque section peut avoir plusieurs lignes.' },
          { keys: ['échéance', 'date limite', 'due date', 'délai paiement'], answer: '📅 **Échéance de facture** :\nDans l\'éditeur, onglet **Détails**, renseignez la **Date d\'échéance**. Les factures dont l\'échéance est dépassée passent automatiquement au statut **En retard** (marqué en rouge).' },
        ]
      },
      // ── PDF & EXPORT ──
      {
        name: 'PDF & Export',
        entries: [
          { keys: ['pdf', 'exporter', 'télécharger', 'download', 'imprimer', 'impression'], answer: '📥 **Exporter en PDF** :\n1. Ouvrez une facture (page de détail ou éditeur)\n2. Cliquez sur le bouton **⬇ Télécharger** (icône flèche)\n3. Le PDF haute qualité est généré avec votre design personnalisé\n\n💡 Astuce : dans l\'éditeur, vous pouvez prévisualiser le PDF en temps réel avant de le télécharger.' },
          { keys: ['whatsapp', 'partager', 'envoyer client', 'transmettre'], answer: '📲 **Partager via WhatsApp** :\n1. Ouvrez la page de détail d\'une facture\n2. Cliquez le bouton **WhatsApp**\n3. Un message pré-rempli s\'ouvre avec le nom du client et le numéro de facture\n\nSur Desktop, l\'app WhatsApp s\'ouvre automatiquement.' },
          { keys: ['csv', 'excel', 'tableur', 'données'], answer: '📊 **Exporter en CSV** :\nAllez dans **Rapports**, configurez vos filtres (période, statut), puis cliquez **Exporter CSV**. Le fichier peut être ouvert dans Excel, Google Sheets ou LibreOffice.' },
          { keys: ['email facture', 'mail facture', 'envoyer email'], answer: '📧 **Envoyer par email** :\nLe système envoie automatiquement des notifications par email. Pour partager une facture manuellement, téléchargez le PDF et joignez-le à votre email.' },
        ]
      },
      // ── DESIGN & TEMPLATES ──
      {
        name: 'Design',
        entries: [
          { keys: ['design', 'modèle', 'template', 'apparence', 'look', 'style'], answer: '🎨 **Modèles de facture** :\n5 styles disponibles dans l\'onglet **Design** :\n• **Élégant** (défaut) : sobre et professionnel\n• **Classique** : traditionnel avec logo circulaire\n• **Moderne** : en-tête coloré plein\n• **Minimaliste** : épuré, focus sur le contenu\n• **Corporate Orange** : style entreprise avec barre supérieure' },
          { keys: ['palette', 'couleur', 'thème couleur', 'changer couleur'], answer: '🎨 **Palettes de couleurs** :\n8 palettes au choix :\n• Bleu ciel, Violet, Émeraude, Orange\n• Rose, Brun, Ardoise, Or\n\nChangez dans l\'onglet **Design** → section **Palette de couleurs**.' },
          { keys: ['police', 'font', 'typographie', 'écriture'], answer: '🔤 **Polices disponibles** :\nInter (défaut), Arial, Georgia, Times New Roman, Courier New, Trebuchet MS.\n\nChangez dans l\'onglet **Design** du formulaire.' },
          { keys: ['filigrane', 'watermark', 'brouillon texte', 'confidentiel'], answer: '🖼️ **Filigrane personnalisé** :\nOnglet **Design** → **Filigrane** :\n• Choisissez **Texte** ou **Image**\n• Saisissez votre texte (BROUILLON, PAYÉ, CONFIDENTIEL…)\n• Réglez la taille, l\'opacité et la position\n• 3 styles : Texte estompé, Contour, Diagonal' },
          { keys: ['tampon', 'stamp', 'cachet', 'signature image'], answer: '🖋️ **Tampon personnalisé** :\nOnglet **Design** → **Tampon** :\n1. Uploadez une image PNG (150×150px recommandé)\n2. Réglez la taille et l\'opacité\n3. Cliquez **Positionner le tampon** puis cliquez sur l\'aperçu pour le placer' },
          { keys: ['logo', 'image entreprise', 'logo entreprise'], answer: '🏢 **Logo entreprise** :\nOnglet **Entreprise** de l\'éditeur, cliquez **Choisir un fichier** pour uploader votre logo. Tous les formats d\'image sont acceptés (JPEG, PNG, WebP, SVG…). Le logo est automatiquement optimisé.' },
          { keys: ['titre document', 'changer titre', 'proforma', 'avoir'], answer: '📝 **Titre du document** :\nDans l\'onglet **Design**, modifiez le champ **Titre principal** pour écrire FACTURE, DEVIS, PROFORMA, AVOIR ou tout autre titre personnalisé.' },
          { keys: ['qr code', 'code qr'], answer: '📱 **QR Code** :\nChaque facture affiche automatiquement un QR code en bas de page qui renvoie vers le contact WhatsApp de l\'entreprise.' },
        ]
      },
      // ── CLIENTS / CRM ──
      {
        name: 'Clients',
        entries: [
          { keys: ['ajouter client', 'nouveau client', 'créer client', 'enregistrer client'], answer: '👤 **Ajouter un client** :\n1. Menu **Clients** → bouton **Nouveau client**\n2. Remplissez : Nom, Email, Téléphone, Adresse, Ville\n3. Optionnel : Entreprise, catégorie (Standard, VIP, Inactif)\n4. Cliquez **Enregistrer**\n\nLe client apparaîtra ensuite dans la liste déroulante de l\'éditeur de factures.' },
          { keys: ['modifier client', 'éditer client', 'changer client', 'mettre à jour client'], answer: '✏️ **Modifier un client** :\nDans la liste **Clients**, cliquez sur l\'icône ✏️ à droite du client pour ouvrir le formulaire d\'édition.' },
          { keys: ['supprimer client', 'effacer client', 'enlever client'], answer: '🗑️ **Supprimer un client** :\nCliquez sur l\'icône 🗑️ à droite du client. ⚠️ Si le client a des factures associées, vous devrez d\'abord les supprimer ou les réassigner.' },
          { keys: ['chercher client', 'rechercher client', 'trouver client', 'filtrer client'], answer: '🔍 **Rechercher un client** :\nUtilisez la **barre de recherche** en haut de la page Clients pour filtrer par nom, email ou entreprise. Vous pouvez aussi filtrer par catégorie (Standard, VIP, Inactif).' },
          { keys: ['vip', 'catégorie client', 'type client', 'statut client'], answer: '⭐ **Catégories de clients** :\n• **Standard** : client classique\n• **VIP** : client privilégié (marqué en or)\n• **Inactif** : client désactivé\n\nChangez la catégorie dans le formulaire d\'édition du client.' },
          { keys: ['importer client', 'crm', 'liste client'], answer: '📋 **Importer un client dans une facture** :\nDans l\'éditeur de facture, onglet **Client**, utilisez le menu déroulant **Importer depuis CRM** pour sélectionner un client existant. Ses coordonnées seront remplies automatiquement.' },
        ]
      },
      // ── DEVIS ──
      {
        name: 'Devis',
        entries: [
          { keys: ['créer devis', 'nouveau devis', 'faire devis', 'établir devis', 'générer devis'], answer: '📋 **Créer un devis** :\n1. Menu **Devis** → bouton **Nouveau devis**\n2. Sélectionnez un client, ajoutez les articles\n3. Définissez la date de validité\n4. Cliquez **Enregistrer**\n\nLe devis reçoit un numéro automatique (DEV-2026-XXXX).' },
          { keys: ['convertir devis', 'devis en facture', 'transformer devis'], answer: '🔄 **Convertir un devis en facture** :\n1. Ouvrez le devis ou cliquez **Convertir** dans la liste\n2. Confirmez la conversion\n3. Une facture est créée automatiquement avec les mêmes données\n\nLe devis passe au statut **Converti** et ne peut plus être modifié.' },
          { keys: ['modifier devis', 'éditer devis', 'changer devis'], answer: '✏️ **Modifier un devis** :\nCliquez sur l\'icône ✏️ dans la liste des devis, ou ouvrez le devis et cliquez **Modifier**. Vous pouvez changer les articles, les montants, la date de validité et le statut.' },
          { keys: ['statut devis', 'accepté', 'refusé', 'expiré', 'converti'], answer: '📊 **Statuts des devis** :\n• **Brouillon** : en cours de rédaction\n• **Envoyé** : transmis au client\n• **Accepté** : client a validé\n• **Refusé** : client a décliné\n• **Expiré** : validité dépassée\n• **Converti** : transformé en facture' },
          { keys: ['validité devis', 'durée devis', 'expiration devis'], answer: '⏳ **Validité du devis** :\nDéfinissez la date de validité lors de la création. Passée cette date, le devis peut être marqué comme **Expiré**.' },
        ]
      },
      // ── PAIEMENTS ──
      {
        name: 'Paiements',
        entries: [
          { keys: ['enregistrer paiement', 'ajouter paiement', 'saisir paiement', 'recevoir paiement', 'payer'], answer: '💰 **Enregistrer un paiement** :\n1. Ouvrez la page de détail d\'une facture\n2. Cliquez **Enregistrer paiement**\n3. Saisissez : montant, date, mode de paiement, référence\n4. Validez\n\nLa facture passe automatiquement à **Payé** quand le total des paiements atteint le montant dû.' },
          { keys: ['mode paiement', 'moyen paiement', 'type paiement', 'virement', 'mobile money', 'espèce', 'chèque'], answer: '💳 **Modes de paiement** :\n• Virement bancaire\n• Espèces\n• Chèque\n• Mobile Money (OM, MOMO…)\n• Carte bancaire\n\nSélectionnez le mode lors de l\'enregistrement du paiement.' },
          { keys: ['historique paiement', 'liste paiement', 'suivi paiement'], answer: '📋 **Historique des paiements** :\n• **Page Paiements** : vue globale de tous les paiements reçus\n• **Détail facture** : historique spécifique à cette facture\n\nFiltrez par période, client ou mode de paiement.' },
          { keys: ['paiement partiel', 'acompte', 'avance'], answer: '💵 **Paiement partiel** :\nVous pouvez enregistrer plusieurs paiements sur la même facture (acomptes). Le solde restant est calculé automatiquement. La facture reste en statut **Envoyé** tant que le total n\'est pas atteint.' },
        ]
      },
      // ── CATALOGUE ──
      {
        name: 'Catalogue',
        entries: [
          { keys: ['catalogue', 'produit', 'service catalogue', 'article', 'prestation catalogue'], answer: '📦 **Catalogue de services** :\nMenu **Catalogue** pour créer vos prestations récurrentes avec nom et prix par défaut. Ensuite, dans l\'éditeur de facture, cliquez rapidement sur un article du **Catalogue rapide** pour l\'ajouter en un clic !' },
          { keys: ['ajouter catalogue', 'nouveau produit', 'créer service', 'nouveau service'], answer: '➕ **Ajouter au catalogue** :\n1. Menu **Catalogue** → **Ajouter un article**\n2. Saisissez le nom et le prix unitaire\n3. Enregistrez\n\nL\'article apparaîtra dans le catalogue rapide de l\'éditeur de facture.' },
          { keys: ['modifier catalogue', 'changer prix', 'éditer produit'], answer: '✏️ Pour modifier un article du catalogue, cliquez sur l\'icône ✏️ à côté de l\'article dans la page **Catalogue**.' },
        ]
      },
      // ── RAPPORTS ──
      {
        name: 'Rapports',
        entries: [
          { keys: ['rapport', 'statistique', 'bilan', 'analyse', 'chiffre affaire', 'revenu'], answer: '📊 **Rapports et statistiques** :\nMenu **Rapports** pour accéder à :\n• **Bilan annuel** : graphique des revenus mensuels\n• **Rapport filtré** : par période, statut et client\n• **Export CSV** : téléchargez les données en tableur\n\nLe tableau de bord affiche aussi un résumé en temps réel.' },
          { keys: ['dashboard', 'tableau de bord', 'accueil', 'vue ensemble'], answer: '🏠 **Tableau de bord** :\nLa page d\'accueil affiche :\n• Total des revenus et factures\n• Graphique des ventes mensuelles\n• Factures récentes\n• Paiements en attente\n• Résumé des clients' },
        ]
      },
      // ── PARAMÈTRES & UTILISATEURS ──
      {
        name: 'Paramètres',
        entries: [
          { keys: ['paramètre', 'réglage', 'configuration', 'setting'], answer: '⚙️ **Paramètres** :\nMenu **Paramètres** (accessible aux administrateurs) pour :\n• Voir les infos de l\'entreprise\n• Gérer les comptes utilisateurs\n• Créer, modifier ou supprimer des utilisateurs\n• Changer les rôles et permissions' },
          { keys: ['créer utilisateur', 'nouveau utilisateur', 'ajouter utilisateur', 'compte'], answer: '👥 **Créer un utilisateur** :\n1. Menu **Paramètres** → **Nouvel utilisateur**\n2. Renseignez nom, email, mot de passe\n3. Choisissez le rôle : Admin, Agent ou Comptable\n4. Cochez \"Peut voir les données\" si nécessaire\n5. Enregistrez' },
          { keys: ['rôle', 'permission', 'droit', 'accès', 'admin', 'agent', 'comptable'], answer: '🔐 **Rôles utilisateurs** :\n• **Admin** : accès complet (paramètres, suppression, gestion)\n• **Agent** : création de factures, devis, clients\n• **Comptable** : consultation des rapports et paiements\n\nSeul l\'admin peut accéder aux Paramètres.' },
          { keys: ['mot de passe', 'password', 'changer mot de passe', 'oublié mot de passe'], answer: '🔑 **Mot de passe** :\n• Minimum 6 caractères requis\n• L\'admin peut réinitialiser le mot de passe d\'un utilisateur dans **Paramètres** → éditer l\'utilisateur\n• Si vous avez oublié votre mot de passe, contactez l\'administrateur' },
          { keys: ['activer', 'désactiver', 'bloquer', 'débloquer', 'suspendre'], answer: '🔒 **Activer/Désactiver un utilisateur** :\nDans **Paramètres**, cliquez sur le bouton **Actif/Inactif** à côté de l\'utilisateur. Un utilisateur inactif ne peut plus se connecter.' },
        ]
      },
      // ── CONNEXION ──
      {
        name: 'Connexion',
        entries: [
          { keys: ['connexion', 'login', 'se connecter', 'accéder', 'identifiant'], answer: '🔐 **Connexion** :\nSaisissez votre **email** et **mot de passe** sur la page de connexion. Si vous n\'avez pas de compte, cliquez sur **S\'inscrire** pour en créer un.' },
          { keys: ['inscription', 'inscrire', 'créer compte', 'register', 'nouveau compte'], answer: '📝 **Inscription** :\n1. Page de connexion → onglet **S\'inscrire**\n2. Renseignez nom, email et mot de passe (min. 6 caractères)\n3. Confirmez le mot de passe\n4. Cliquez **S\'inscrire**\n\nVotre compte sera créé avec le rôle Agent par défaut.' },
          { keys: ['déconnexion', 'logout', 'se déconnecter', 'quitter'], answer: '🚪 **Déconnexion** :\nCliquez sur votre avatar ou le bouton de déconnexion dans la barre latérale en bas.' },
          { keys: ['erreur connexion', 'impossible connecter', 'identifiant invalide', 'mauvais mot de passe'], answer: '⚠️ **Erreur de connexion** :\n• Vérifiez que l\'email est correct (sensible à la casse)\n• Le mot de passe doit contenir au moins 6 caractères\n• Si le compte est **Inactif**, contactez l\'admin\n• En cas de serveur hors ligne, patientez et réessayez' },
        ]
      },
      // ── LANGUE & INTERFACE ──
      {
        name: 'Interface',
        entries: [
          { keys: ['langue', 'français', 'anglais', 'changer langue', 'translation', 'traduction'], answer: '🌐 **Changer la langue** :\nCliquez sur le sélecteur **FR / EN** dans la barre latérale ou sur la page de connexion. Toute l\'application bascule instantanément.' },
          { keys: ['thème', 'mode sombre', 'dark mode', 'mode clair', 'apparence interface'], answer: '🌙 **Mode sombre** :\nCliquez sur l\'icône ☀️/🌙 dans la barre latérale pour basculer entre le mode clair et le mode sombre.' },
          { keys: ['mobile', 'responsive', 'téléphone', 'tablette', 'petit écran'], answer: '📱 **Compatibilité mobile** :\nL\'application est entièrement responsive. Sur mobile, le menu latéral se replie automatiquement et les tableaux deviennent défilables horizontalement.' },
          { keys: ['desktop', 'application bureau', 'windows', 'installer', 'exe'], answer: '💻 **Application Desktop** :\nL\'app SOS DIGITAL est aussi disponible en application Windows (.exe). Elle fonctionne hors-ligne avec une base de données locale SQLite. Contactez l\'administrateur pour obtenir l\'installeur.' },
        ]
      },
      // ── APP INFO ──
      {
        name: 'À propos',
        entries: [
          { keys: ['c\'est quoi', 'qu\'est-ce que', 'à propos', 'sos digital', 'application', 'présentation', 'fonctionnalité'], answer: '🏢 **SOS DIGITAL** est une application complète de facturation et gestion commerciale. Fonctionnalités :\n\n📄 Création de factures et devis professionnels\n👤 Gestion CRM des clients\n💰 Suivi des paiements\n📦 Catalogue de services\n📊 Rapports et statistiques\n🎨 5 modèles de design + 8 palettes\n📥 Export PDF et CSV\n📲 Partage WhatsApp\n🌐 Bilingue français / anglais' },
          { keys: ['aide', 'help', 'assistance', 'comment ça marche', 'guide', 'tutoriel'], answer: '📚 **Besoin d\'aide ?**\nJe peux vous guider sur :\n• 📄 Factures et devis\n• 👤 Gestion des clients\n• 💰 Paiements\n• 📦 Catalogue\n• 📊 Rapports\n• ⚙️ Paramètres\n• 🎨 Design et templates\n\nPosez-moi votre question ou cliquez **Contacter l\'admin** pour parler directement à un humain !' },
          { keys: ['prix', 'coût', 'tarif', 'gratuit', 'abonnement', 'licence'], answer: '💡 Pour toute question concernant les prix, tarifs ou licences de SOS DIGITAL, veuillez contacter directement l\'administrateur.' },
        ]
      },
    ],
    // CONVERSATIONAL
    greetings: {
      patterns: ['bonjour', 'salut', 'hello', 'hey', 'coucou', 'bonsoir', 'bonne journée', 'yo', 'hi'],
      reply: 'Bonjour ! 😊 Comment puis-je vous aider aujourd\'hui ? N\'hésitez pas à me poser une question sur l\'application.'
    },
    thanks: {
      patterns: ['merci', 'thanks', 'ok merci', 'parfait', 'super', 'génial', 'excellent', 'bien', 'cool', 'top', 'nickel', 'c\'est bon'],
      reply: 'Avec plaisir ! 😊 N\'hésitez pas si vous avez d\'autres questions.'
    },
    goodbye: {
      patterns: ['au revoir', 'bye', 'à plus', 'bonne journée', 'à bientôt', 'ciao'],
      reply: 'Au revoir ! 👋 Bonne continuation avec SOS DIGITAL.'
    },
    contactAdmin: `📬 Pour contacter l'administrateur directement :\n\n📧 **Email** : ${ADMIN_EMAIL}\n📱 **WhatsApp** : ${ADMIN_PHONE_DISPLAY}\n\nVotre message sera reçu instantanément. Veuillez patienter, l'admin vous répondra dans les plus brefs délais. 🙏`,
    contactPatterns: ['admin', 'administrateur', 'contacter', 'parler humain', 'personne réelle', 'support technique', 'support', 'bug', 'problème technique', 'signaler'],
    noMatch: 'Je n\'ai pas trouvé de réponse précise à votre question. 🤔\n\nEssayez de reformuler ou contactez directement l\'administrateur qui pourra vous aider personnellement.',
  },

  en: {
    categories: [
      {
        name: 'Invoices',
        entries: [
          { keys: ['create invoice', 'new invoice', 'make invoice', 'how to invoice', 'add invoice'], answer: '📄 **Create an invoice**:\n1. Menu **Invoices** → **New Invoice** button\n2. **Client** tab: select or import a client from CRM\n3. **Services** tab: add your services, quantities and prices\n4. **Design** tab: choose template, palette and font\n5. Click **Save** at the top\n\nA real-time preview displays on the right!' },
          { keys: ['edit invoice', 'modify invoice', 'change invoice', 'update invoice', 'correct invoice'], answer: '✏️ **Edit an invoice**:\n1. Go to **Invoices**\n2. Click the ✏️ (pencil) icon on the right\n3. Modify fields in the editor\n4. Click **Update** to save' },
          { keys: ['delete invoice', 'remove invoice', 'erase invoice', 'cancel invoice'], answer: '🗑️ **Delete an invoice**:\n1. Go to **Invoices**\n2. Click the 🗑️ (trash) icon on the right\n3. Confirm deletion\n\n⚠️ This action is irreversible!' },
          { keys: ['view invoice', 'see invoice', 'invoice detail', 'open invoice', 'show invoice'], answer: '👁️ **View an invoice**:\nClick any row in the invoice list, or the 👁️ icon to access the detail page with preview, payment history and quick actions.' },
          { keys: ['invoice status', 'draft', 'sent', 'paid', 'overdue'], answer: '📊 **Invoice statuses**:\n• **Draft**: invoice being created\n• **Sent**: transmitted to client\n• **Viewed**: client opened the invoice\n• **Paid**: full payment received\n• **Overdue**: past due date\n• **Canceled**: invalidated invoice\n\nYou can filter by status in the list.' },
          { keys: ['invoice number', 'numbering', 'number format', 'inv-'], answer: '🔢 **Invoice numbering**:\nThe system auto-generates numbers in the format **INV-2026-0001**. The counter increments with each creation. You can also enter a custom number in the **Details** tab.' },
          { keys: ['currency', 'money', 'fcfa', 'euro', 'dollar'], answer: '💱 **Available currencies**:\n• FCFA (default)\n• EUR (Euro)\n• USD (US Dollar)\n• GBP (British Pound)\n• CAD (Canadian Dollar)\n\nChange currency in the editor\'s **Details** tab.' },
          { keys: ['tax', 'vat', 'percentage'], answer: '🧮 **VAT and taxes**:\nIn the editor\'s **Services** tab, **Adjustments** section:\n• Enter VAT rate in % (default 19.25%)\n• Add a discount in FCFA if needed\n• Total is calculated automatically in real-time' },
          { keys: ['discount', 'reduction', 'promotion'], answer: '🏷️ **Apply a discount**:\nIn the invoice editor, **Services** tab, **Adjustments** section:\n• Enter the discount amount in FCFA\n• Discount is deducted before VAT calculation\n• Total updates in real-time in the preview' },
          { keys: ['due date', 'deadline', 'payment delay'], answer: '📅 **Invoice due date**:\nIn the editor, **Details** tab, fill in the **Due Date**. Invoices past due date automatically change to **Overdue** status (marked in red).' },
        ]
      },
      {
        name: 'PDF & Export',
        entries: [
          { keys: ['pdf', 'export', 'download', 'print'], answer: '📥 **Export as PDF**:\n1. Open an invoice (detail page or editor)\n2. Click the **⬇ Download** button\n3. A high-quality PDF is generated with your custom design\n\n💡 Tip: in the editor, you can preview the PDF in real-time before downloading.' },
          { keys: ['whatsapp', 'share', 'send client', 'transmit'], answer: '📲 **Share via WhatsApp**:\n1. Open the invoice detail page\n2. Click the **WhatsApp** button\n3. A pre-filled message opens with the client name and invoice number' },
          { keys: ['csv', 'excel', 'spreadsheet', 'data export'], answer: '📊 **Export as CSV**:\nGo to **Reports**, set your filters (period, status), then click **Export CSV**. The file can be opened in Excel, Google Sheets or LibreOffice.' },
        ]
      },
      {
        name: 'Design',
        entries: [
          { keys: ['design', 'template', 'appearance', 'look', 'style'], answer: '🎨 **Invoice templates**:\n5 styles available in the **Design** tab:\n• **Elegant** (default): clean and professional\n• **Classic**: traditional with circular logo\n• **Modern**: full-color header\n• **Minimalist**: clean, content-focused\n• **Corporate Orange**: business style with top bar' },
          { keys: ['palette', 'color', 'theme color', 'change color'], answer: '🎨 **Color palettes**:\n8 palettes to choose from:\n• Sky Blue, Violet, Emerald, Orange\n• Rose, Brown, Slate, Gold\n\nChange in the **Design** tab → **Color palette** section.' },
          { keys: ['font', 'typography'], answer: '🔤 **Available fonts**:\nInter (default), Arial, Georgia, Times New Roman, Courier New, Trebuchet MS.\n\nChange in the **Design** tab.' },
          { keys: ['watermark', 'draft text', 'confidential'], answer: '🖼️ **Custom watermark**:\n**Design** tab → **Watermark**:\n• Choose **Text** or **Image**\n• Enter your text (DRAFT, PAID, CONFIDENTIAL…)\n• Adjust size, opacity and position\n• 3 styles available' },
          { keys: ['stamp', 'seal', 'signature image'], answer: '🖋️ **Custom stamp**:\n**Design** tab → **Stamp**:\n1. Upload a PNG image (150×150px recommended)\n2. Adjust size and opacity\n3. Click **Position stamp** then click on the preview to place it' },
          { keys: ['logo', 'company image', 'company logo'], answer: '🏢 **Company logo**:\nIn the editor\'s **Company** tab, click **Choose file** to upload your logo. All image formats accepted (JPEG, PNG, WebP, SVG…). The logo is automatically optimized.' },
        ]
      },
      {
        name: 'Clients',
        entries: [
          { keys: ['add client', 'new client', 'create client', 'register client'], answer: '👤 **Add a client**:\n1. Menu **Clients** → **New Client** button\n2. Fill in: Name, Email, Phone, Address, City\n3. Optional: Company, category (Standard, VIP, Inactive)\n4. Click **Save**\n\nThe client will appear in the invoice editor dropdown.' },
          { keys: ['edit client', 'modify client', 'change client', 'update client'], answer: '✏️ **Edit a client**:\nIn the **Clients** list, click the ✏️ icon next to the client to open the edit form.' },
          { keys: ['delete client', 'remove client'], answer: '🗑️ **Delete a client**:\nClick the 🗑️ icon next to the client. ⚠️ If the client has associated invoices, you must delete or reassign them first.' },
          { keys: ['search client', 'find client', 'filter client'], answer: '🔍 **Search clients**:\nUse the **search bar** at the top of the Clients page to filter by name, email or company. You can also filter by category.' },
          { keys: ['vip', 'client category', 'client type', 'client status'], answer: '⭐ **Client categories**:\n• **Standard**: regular client\n• **VIP**: premium client (marked in gold)\n• **Inactive**: disabled client\n\nChange the category in the client edit form.' },
        ]
      },
      {
        name: 'Quotes',
        entries: [
          { keys: ['create quote', 'new quote', 'make quote', 'generate quote'], answer: '📋 **Create a quote**:\n1. Menu **Quotes** → **New Quote** button\n2. Select a client, add items\n3. Set the validity date\n4. Click **Save**\n\nThe quote gets an automatic number (DEV-2026-XXXX).' },
          { keys: ['convert quote', 'quote to invoice', 'transform quote'], answer: '🔄 **Convert a quote to invoice**:\n1. Open the quote or click **Convert** in the list\n2. Confirm the conversion\n3. An invoice is created automatically with the same data\n\nThe quote changes to **Converted** status.' },
          { keys: ['quote status', 'accepted', 'declined', 'expired', 'converted'], answer: '📊 **Quote statuses**:\n• **Draft**: being drafted\n• **Sent**: transmitted to client\n• **Accepted**: client approved\n• **Declined**: client rejected\n• **Expired**: validity passed\n• **Converted**: transformed into invoice' },
        ]
      },
      {
        name: 'Payments',
        entries: [
          { keys: ['record payment', 'add payment', 'enter payment', 'receive payment', 'pay'], answer: '💰 **Record a payment**:\n1. Open the invoice detail page\n2. Click **Record Payment**\n3. Enter: amount, date, payment method, reference\n4. Confirm\n\nThe invoice automatically changes to **Paid** when total payments reach the amount due.' },
          { keys: ['payment method', 'payment type', 'transfer', 'mobile money', 'cash', 'check'], answer: '💳 **Payment methods**:\n• Bank transfer\n• Cash\n• Check\n• Mobile Money\n• Credit card\n\nSelect the method when recording the payment.' },
          { keys: ['payment history', 'payment list', 'payment tracking'], answer: '📋 **Payment history**:\n• **Payments page**: global view of all received payments\n• **Invoice detail**: specific history for that invoice\n\nFilter by period, client or payment method.' },
          { keys: ['partial payment', 'deposit', 'advance'], answer: '💵 **Partial payment**:\nYou can record multiple payments on the same invoice (deposits). The remaining balance is calculated automatically.' },
        ]
      },
      {
        name: 'Catalog',
        entries: [
          { keys: ['catalog', 'product', 'service catalog', 'item'], answer: '📦 **Service catalog**:\nMenu **Catalog** to create your recurring services with name and default price. Then, in the invoice editor, quickly click a **Quick catalog** item to add it in one click!' },
          { keys: ['add catalog', 'new product', 'create service', 'new service'], answer: '➕ **Add to catalog**:\n1. Menu **Catalog** → **Add item**\n2. Enter name and unit price\n3. Save\n\nThe item will appear in the invoice editor\'s quick catalog.' },
        ]
      },
      {
        name: 'Reports',
        entries: [
          { keys: ['report', 'statistics', 'summary', 'analysis', 'revenue'], answer: '📊 **Reports and statistics**:\nMenu **Reports** to access:\n• **Annual summary**: monthly revenue chart\n• **Filtered report**: by period, status and client\n• **CSV export**: download data as spreadsheet\n\nThe dashboard also shows a real-time summary.' },
          { keys: ['dashboard', 'home', 'overview'], answer: '🏠 **Dashboard**:\nThe home page displays:\n• Total revenue and invoices\n• Monthly sales chart\n• Recent invoices\n• Pending payments\n• Client summary' },
        ]
      },
      {
        name: 'Settings',
        entries: [
          { keys: ['settings', 'configuration', 'preferences'], answer: '⚙️ **Settings**:\nMenu **Settings** (admin access only) to:\n• View company info\n• Manage user accounts\n• Create, edit or delete users\n• Change roles and permissions' },
          { keys: ['create user', 'new user', 'add user', 'account'], answer: '👥 **Create a user**:\n1. Menu **Settings** → **New User**\n2. Fill in name, email, password\n3. Choose role: Admin, Agent or Accountant\n4. Check "Can view data" if needed\n5. Save' },
          { keys: ['role', 'permission', 'access', 'admin', 'agent', 'accountant'], answer: '🔐 **User roles**:\n• **Admin**: full access (settings, deletion, management)\n• **Agent**: create invoices, quotes, clients\n• **Accountant**: view reports and payments\n\nOnly admin can access Settings.' },
          { keys: ['password', 'change password', 'forgot password'], answer: '🔑 **Password**:\n• Minimum 6 characters required\n• Admin can reset a user\'s password in **Settings** → edit user\n• If you forgot your password, contact the administrator' },
        ]
      },
      {
        name: 'Login',
        entries: [
          { keys: ['login', 'sign in', 'log in', 'access', 'credentials'], answer: '🔐 **Login**:\nEnter your **email** and **password** on the login page. If you don\'t have an account, click **Register** to create one.' },
          { keys: ['register', 'sign up', 'create account', 'new account'], answer: '📝 **Registration**:\n1. Login page → **Register** tab\n2. Fill in name, email and password (min. 6 characters)\n3. Confirm password\n4. Click **Register**\n\nYour account will be created with Agent role by default.' },
          { keys: ['logout', 'sign out', 'log out', 'disconnect'], answer: '🚪 **Logout**:\nClick your avatar or the logout button at the bottom of the sidebar.' },
          { keys: ['login error', 'cannot login', 'invalid credentials', 'wrong password'], answer: '⚠️ **Login error**:\n• Check that the email is correct\n• Password must be at least 6 characters\n• If the account is **Inactive**, contact admin\n• If server is offline, wait and retry' },
        ]
      },
      {
        name: 'Interface',
        entries: [
          { keys: ['language', 'french', 'english', 'change language', 'translation'], answer: '🌐 **Change language**:\nClick the **FR / EN** selector in the sidebar or on the login page. The entire app switches instantly.' },
          { keys: ['theme', 'dark mode', 'light mode', 'appearance'], answer: '🌙 **Dark mode**:\nClick the ☀️/🌙 icon in the sidebar to toggle between light and dark mode.' },
          { keys: ['mobile', 'responsive', 'phone', 'tablet', 'small screen'], answer: '📱 **Mobile compatibility**:\nThe app is fully responsive. On mobile, the sidebar collapses automatically and tables become horizontally scrollable.' },
          { keys: ['desktop', 'desktop app', 'windows', 'install', 'exe'], answer: '💻 **Desktop app**:\nSOS DIGITAL is also available as a Windows desktop app (.exe). It works offline with a local SQLite database. Contact the administrator for the installer.' },
        ]
      },
      {
        name: 'About',
        entries: [
          { keys: ['what is', 'about', 'sos digital', 'application', 'features'], answer: '🏢 **SOS DIGITAL** is a complete invoicing and business management application. Features:\n\n📄 Professional invoices and quotes\n👤 Client CRM management\n💰 Payment tracking\n📦 Service catalog\n📊 Reports and statistics\n🎨 5 design templates + 8 palettes\n📥 PDF and CSV export\n📲 WhatsApp sharing\n🌐 Bilingual French / English' },
          { keys: ['help', 'assistance', 'how does it work', 'guide', 'tutorial'], answer: '📚 **Need help?**\nI can guide you on:\n• 📄 Invoices and quotes\n• 👤 Client management\n• 💰 Payments\n• 📦 Catalog\n• 📊 Reports\n• ⚙️ Settings\n• 🎨 Design and templates\n\nAsk me your question or click **Contact admin** to talk to a human!' },
          { keys: ['price', 'cost', 'tariff', 'free', 'subscription', 'license'], answer: '💡 For any questions about SOS DIGITAL pricing, tariffs or licensing, please contact the administrator directly.' },
        ]
      },
    ],
    greetings: {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'yo', 'sup'],
      reply: 'Hello! 😊 How can I help you today? Feel free to ask me anything about the application.'
    },
    thanks: {
      patterns: ['thank', 'thanks', 'ok thanks', 'perfect', 'great', 'awesome', 'excellent', 'good', 'cool', 'nice', 'got it'],
      reply: 'You\'re welcome! 😊 Don\'t hesitate if you have more questions.'
    },
    goodbye: {
      patterns: ['bye', 'goodbye', 'see you', 'later', 'have a good day', 'ciao'],
      reply: 'Goodbye! 👋 Have a great time with SOS DIGITAL.'
    },
    contactAdmin: `📬 To contact the administrator directly:\n\n📧 **Email**: ${ADMIN_EMAIL}\n📱 **WhatsApp**: ${ADMIN_PHONE_DISPLAY}\n\nYour message will be received instantly. Please be patient, the admin will respond as soon as possible. 🙏`,
    contactPatterns: ['admin', 'administrator', 'contact', 'talk to human', 'real person', 'technical support', 'support', 'bug', 'technical problem', 'report'],
    noMatch: 'I couldn\'t find a precise answer to your question. 🤔\n\nTry rephrasing or contact the administrator directly for personal assistance.',
  }
};

const QUICK_CHIPS = {
  fr: ['Créer une facture', 'Ajouter un client', 'Générer un devis', 'Exporter PDF', 'Contacter l\'admin'],
  en: ['Create invoice', 'Add client', 'Create quote', 'Export PDF', 'Contact admin'],
};

const BOT_INTRO = {
  fr: 'Bonjour ! 😊 Je suis l\'assistant SOS DIGITAL. Je peux vous aider avec les factures, devis, clients, paiements, rapports et bien plus. Posez-moi n\'importe quelle question !',
  en: 'Hello! 😊 I\'m the SOS DIGITAL assistant. I can help you with invoices, quotes, clients, payments, reports and much more. Ask me anything!',
};

// ─────────────────────────────────────────────
// SMART MATCHING ENGINE
// ─────────────────────────────────────────────

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findAnswer(message, lang) {
  const kb = KB[lang];
  const input = normalize(message);
  const inputWords = input.split(' ');

  // 1. Check greetings
  if (kb.greetings.patterns.some(p => input.includes(normalize(p)))) {
    return { type: 'greeting', answer: kb.greetings.reply };
  }

  // 2. Check thanks
  if (kb.thanks.patterns.some(p => input.includes(normalize(p)))) {
    return { type: 'thanks', answer: kb.thanks.reply };
  }

  // 3. Check goodbye
  if (kb.goodbye.patterns.some(p => input.includes(normalize(p)))) {
    return { type: 'goodbye', answer: kb.goodbye.reply };
  }

  // 4. Check admin contact request
  if (kb.contactPatterns.some(p => input.includes(normalize(p)))) {
    return { type: 'contact', answer: kb.contactAdmin };
  }

  // 5. Search knowledge base with scoring
  let bestMatch = null;
  let bestScore = 0;

  for (const category of kb.categories) {
    for (const entry of category.entries) {
      let entryBestScore = 0;

      for (const keyPhrase of entry.keys) {
        const normalKey = normalize(keyPhrase);
        const keyWords = normalKey.split(' ');

        // Exact phrase match → highest score
        if (input.includes(normalKey)) {
          const score = keyWords.length * 3 + normalKey.length * 0.1;
          if (score > entryBestScore) entryBestScore = score;
          continue;
        }

        // Word overlap scoring
        let matchedWords = 0;
        let totalWeight = 0;
        for (const kw of keyWords) {
          if (kw.length < 2) continue;
          totalWeight++;
          // Exact word match
          if (inputWords.includes(kw)) { matchedWords += 1; continue; }
          // Partial match (word starts with or contains)
          if (inputWords.some(iw => iw.includes(kw) || kw.includes(iw))) { matchedWords += 0.7; continue; }
        }

        if (totalWeight > 0) {
          const ratio = matchedWords / totalWeight;
          if (ratio >= 0.4) {
            const score = ratio * keyWords.length + matchedWords * 0.5;
            if (score > entryBestScore) entryBestScore = score;
          }
        }
      }

      if (entryBestScore > bestScore) {
        bestScore = entryBestScore;
        bestMatch = entry;
      }
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    return { type: 'faq', answer: bestMatch.answer };
  }

  return { type: 'none', answer: kb.noMatch };
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function ChatbotWidget() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ from: 'bot', text: BOT_INTRO[lang] }]);
  const [typing, setTyping] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMsgCount(c => c + 1);
    setMessages(m => [...m, { from: 'user', text: msg }]);
    setTyping(true);

    // Small delay for natural feel
    setTimeout(() => {
      const result = findAnswer(msg, lang);
      setMessages(m => [...m, {
        from: 'bot',
        text: result.answer,
        showActions: result.type === 'contact' || result.type === 'none',
      }]);
      setTyping(false);
    }, 400 + Math.random() * 400);
  };

  const openWhatsApp = () => {
    const msg = lang === 'fr'
      ? 'Bonjour Admin, je vous contacte depuis l\'application SOS DIGITAL.'
      : 'Hello Admin, I\'m contacting you from the SOS DIGITAL app.';
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`;
    if (window.electronAPI) window.electronAPI.openExternal(url);
    else window.open(url, '_blank');
  };

  const openEmail = () => {
    const subject = lang === 'fr' ? 'Contact depuis SOS DIGITAL' : 'Contact from SOS DIGITAL';
    const body = lang === 'fr'
      ? 'Bonjour Admin,\n\nJe vous contacte depuis l\'application SOS DIGITAL.\n\n'
      : 'Hello Admin,\n\nI\'m contacting you from the SOS DIGITAL app.\n\n';
    const url = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (window.electronAPI) window.electronAPI.openExternal(url);
    else window.open(url, '_blank');
  };

  const renderText = (text) => text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <>
      {/* Floating button */}
      <button
        className="float-anim"
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
          boxShadow: '0 6px 24px rgba(14,165,233,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open ? <ChevronDown size={22} color="white" /> : <MessageCircle size={22} color="white" />}
        {/* Badge */}
        {msgCount > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ef4444', color: 'white',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
            animation: 'pulse 1.5s infinite',
          }}>
            {msgCount > 9 ? '9+' : msgCount}
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 370, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          border: '1px solid rgba(14,165,233,0.2)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.25s ease',
          background: 'var(--bg2)',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              <img src={logoImg} alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>Assistant SOS DIGITAL</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', marginRight: 4 }} />
                {lang === 'fr' ? 'En ligne • Réponse instantanée' : 'Online • Instant response'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', padding: 4, borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, minHeight: 200 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.from === 'bot' && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', marginRight: 6, flexShrink: 0, alignSelf: 'flex-end' }}>
                      <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%', padding: '8px 12px', borderRadius: m.from === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: m.from === 'user' ? '#0EA5E9' : 'var(--bg3)',
                    color: m.from === 'user' ? 'white' : 'var(--text)',
                    fontSize: 12.5, lineHeight: 1.5,
                  }} dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
                </div>
                {/* Contact action buttons */}
                {m.from === 'bot' && m.showActions && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: 32 }}>
                    <button onClick={openWhatsApp} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20,
                      background: '#25D366', color: 'white', border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'transform 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Phone size={12} /> WhatsApp
                    </button>
                    <button onClick={openEmail} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20,
                      background: '#EA4335', color: 'white', border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'transform 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Mail size={12} /> Email
                    </button>
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={logoImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: '14px 14px 14px 2px', padding: '8px 14px', display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', display: 'inline-block', animation: `bounce 0.8s ${i*0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div style={{ padding: '6px 10px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
            {QUICK_CHIPS[lang].map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', border: '1px solid rgba(14,165,233,0.3)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.target.style.background = '#0EA5E9'; e.target.style.color = 'white'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(14,165,233,0.1)'; e.target.style.color = '#0EA5E9'; }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={lang === 'fr' ? 'Posez votre question...' : 'Ask your question...'}
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 12.5, color: 'var(--text)', outline: 'none' }}
            />
            <button onClick={() => sendMessage()} style={{ width: 34, height: 34, borderRadius: '50%', background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
