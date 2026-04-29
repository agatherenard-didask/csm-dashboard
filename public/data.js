// MOCK — à remplacer par fetch direct de la propriété HubSpot "csm_workload" (déjà calculée côté HubSpot, ne pas recalculer côté dashboard)
export const csmWorkload = {
  "Agathe Renard":   123,
  "Antoine Michon":   94,
  "Florian Guillot":  95,
  "Adeline X":        87,
  "Alexandre Y":     110,
};

// Source : Typeform → HubSpot (champ HubSpot custom property "nps_score")
// MOCK — sources à confirmer (Intercom et/ou Slack) ; à brancher via HubSpot si possible pour limiter les sources d'ingestion
export const DB = [
  {id:"1", name:"Uptoo", tier:"Premium", csm:"Agathe", kam:"Marion",
   pulse:5, start:"01/01/2026", end:"31/12/2026", uLog:2, lLog:1, meet:10, next:"15/06/2026",
   aiAct:true, aiMsg:18, coachAct:false, coachMsg:0, trend:5,
   seatsUsed:120, seatsContract:100, creditsUsed:450, creditsContract:500, mrr:4200, nps:72,
   supportConversations:[
     {date:"2026-04-15", topic:"Onboarding nouvelles équipes commerciales"},
     {date:"2026-03-02", topic:"Question droits administrateurs"},
     {date:"2026-01-20", topic:"Demande d'export des statistiques"},
     {date:"2025-11-08", topic:"Configuration parcours IA"},
     {date:"2025-08-14", topic:"Intégration SSO entreprise"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-18", topic:"Erreur affichage module vidéo",        status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/44001"},
     {date:"2026-02-11", topic:"Bug export CSV rapports",               status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/44002"},
     {date:"2025-10-05", topic:"Accès refusé certains apprenants",      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/44003"},
   ]},

  {id:"2", name:"Clariane", tier:"Premium", csm:"Adeline", kam:"Valérie",
   pulse:2, start:"15/05/2025", end:"15/05/2026", uLog:45, lLog:60, meet:65, next:null,
   aiAct:true, aiMsg:3, coachAct:false, coachMsg:0, trend:-12,
   seatsUsed:45, seatsContract:50, creditsUsed:100, creditsContract:200, mrr:6500, nps:34,
   supportConversations:[
     {date:"2026-04-20", topic:"Relance suite baisse d'engagement"},
     {date:"2026-04-01", topic:"Point sur les objectifs Q1"},
     {date:"2026-03-10", topic:"Problème adoption plateforme RH"},
     {date:"2026-02-14", topic:"Demande de support onboarding"},
     {date:"2026-01-05", topic:"Discussion renouvellement contrat"},
     {date:"2025-10-22", topic:"Bilan déploiement initial"},
     {date:"2025-07-30", topic:"Kick-off projet"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-22", topic:"Utilisateurs bloqués après MAJ",        status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/55001"},
     {date:"2026-04-15", topic:"Permissions rôles incorrectes",          status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/55002"},
     {date:"2026-04-05", topic:"Synchronisation SIRH défaillante",       status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/55003"},
     {date:"2026-03-28", topic:"Rapport hebdo vide pour 3 managers",     status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55004"},
     {date:"2026-03-15", topic:"Erreur 403 connexion SSO",               status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55005"},
     {date:"2026-02-28", topic:"Contenu non accessible mobile",          status:"abandonné",url:"https://app.intercom.com/a/apps/didask01/conversations/55006"},
     {date:"2026-01-12", topic:"Bug notation quiz",                      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55007"},
     {date:"2025-11-18", topic:"Import CSV échoué",                      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/55008"},
   ]},

  {id:"3", name:"Marvesting", tier:"Standard", csm:"Antoine", kam:"Marion",
   pulse:4, start:"20/01/2026", end:"20/01/2027", uLog:5, lLog:2, meet:45, next:"10/05/2026",
   aiAct:true, aiMsg:12, coachAct:true, coachMsg:8, trend:2,
   seatsUsed:80, seatsContract:80, creditsUsed:550, creditsContract:500, mrr:2100, nps:61,
   supportConversations:[
     {date:"2026-03-25", topic:"Présentation nouvelles fonctionnalités IA"},
     {date:"2026-01-14", topic:"Bilan formation managers"},
     {date:"2025-10-30", topic:"Question sur les rapports personnalisés"},
     {date:"2025-07-12", topic:"Déploiement module compliance"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-02-08", topic:"Erreur chargement parcours",            status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/66001"},
     {date:"2025-12-19", topic:"Problème certificats PDF",              status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/66002"},
     {date:"2025-09-04", topic:"Accès mobile KO après update",          status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/66003"},
   ]},

  {id:"4", name:"Tasq-OM", tier:"Light", csm:"Florian", kam:"Valérie",
   pulse:3, start:"01/04/2025", end:"20/05/2026", uLog:25, lLog:10, meet:120, next:null,
   aiAct:false, aiMsg:0, coachAct:false, coachMsg:0, trend:-5,
   seatsUsed:15, seatsContract:20, creditsUsed:50, creditsContract:100, mrr:800, nps:null,
   supportConversations:[
     {date:"2026-03-01", topic:"Point trimestriel usage"},
     {date:"2025-10-15", topic:"Configuration initiale parcours"},
     {date:"2025-06-20", topic:"Formation administrateurs"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-10", topic:"Bug affichage leçon interactive",       status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/77001"},
     {date:"2026-02-22", topic:"Réinitialisation mot de passe en masse",status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/77002"},
     {date:"2025-11-30", topic:"Lenteurs plateforme signalées",          status:"abandonné",url:"https://app.intercom.com/a/apps/didask01/conversations/77003"},
     {date:"2025-08-17", topic:"Import utilisateurs échoué",             status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/77004"},
   ]},

  {id:"5", name:"Cap Retraite", tier:"Standard", csm:"Alexandre", kam:"Marion",
   pulse:1, start:"12/06/2025", end:"12/06/2026", uLog:70, lLog:80, meet:90, next:null,
   aiAct:false, aiMsg:0, coachAct:false, coachMsg:0, trend:-20,
   seatsUsed:10, seatsContract:50, creditsUsed:10, creditsContract:200, mrr:1800, nps:18,
   supportConversations:[
     {date:"2026-04-24", topic:"Escalade insatisfaction utilisateurs"},
     {date:"2026-03-18", topic:"Point critique engagement"},
     {date:"2026-02-05", topic:"Réunion plan de remédiation"},
     {date:"2025-12-10", topic:"Bilan fin d'année décevant"},
     {date:"2025-09-22", topic:"Problèmes signalés par les RH"},
     {date:"2025-06-14", topic:"Premier bilan déploiement"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-04-26", topic:"Accès impossible pour 8 utilisateurs",  status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/88001"},
     {date:"2026-03-20", topic:"Crash module évaluation",               status:"en cours", url:"https://app.intercom.com/a/apps/didask01/conversations/88002"},
     {date:"2026-02-14", topic:"Données stats erronées",                status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/88003"},
     {date:"2025-12-03", topic:"Contenu non synchronisé",               status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/88004"},
     {date:"2025-09-30", topic:"Erreur import LDAP",                    status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/88005"},
   ]},

  {id:"6", name:"L'Oréal", tier:"Premium", csm:"Agathe", kam:"Valérie",
   pulse:5, start:"01/02/2026", end:"31/01/2027", uLog:1, lLog:1, meet:5, next:"10/06/2026",
   aiAct:true, aiMsg:25, coachAct:true, coachMsg:15, trend:15,
   seatsUsed:510, seatsContract:500, creditsUsed:1200, creditsContract:1000, mrr:12000, nps:81,
   supportConversations:[
     {date:"2026-04-21", topic:"Préparation déploiement international"},
     {date:"2026-04-01", topic:"Bilan T1 — résultats excellents"},
     {date:"2026-03-12", topic:"Extension équipe marketing EMEA"},
     {date:"2026-02-20", topic:"Workshop création contenu IA"},
     {date:"2026-01-08", topic:"Onboarding vague 3 apprenants"},
     {date:"2025-11-25", topic:"Configuration Coach IA avancée"},
     {date:"2025-09-14", topic:"Bilan post-lancement"},
     {date:"2025-07-03", topic:"Formation champions internes"},
   ],
   // MOCK — à remplacer par fetch Intercom (tickets) — URL et status disponibles dans Intercom API
   supportTickets:[
     {date:"2026-03-28", topic:"Accès SSO Okta — nouvelle entité",      status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99001"},
     {date:"2026-01-30", topic:"Lenteurs ponctuelles fin de mois",       status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99002"},
     {date:"2025-10-18", topic:"Paramétrage langue par défaut",          status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99003"},
     {date:"2025-08-22", topic:"Bug export reporting groupe",            status:"résolu",   url:"https://app.intercom.com/a/apps/didask01/conversations/99004"},
   ]},
];
