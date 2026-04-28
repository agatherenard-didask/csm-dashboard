// MOCK — à remplacer par fetch direct de la propriété HubSpot "csm_workload" (déjà calculée côté HubSpot, ne pas recalculer côté dashboard)
export const csmWorkload = {
  "Agathe Renard":   123,
  "Antoine Michon":   94,
  "Florian Guillot":  95,
  "Adeline X":        87,
  "Alexandre Y":     110,
};

export const DB = [
  {id:"1",name:"Uptoo",       tier:"Premium", csm:"Agathe",   kam:"Marion",  pulse:5,start:"01/01/2026",end:"31/12/2026",uLog:2, lLog:1, meet:10, next:"15/06/2026",aiAct:true, aiMsg:18,coachAct:false,coachMsg:0, trend:5,  seatsUsed:120,seatsContract:100,creditsUsed:450, creditsContract:500, mrr:4200, nps:72},
  {id:"2",name:"Clariane",    tier:"Premium", csm:"Adeline",  kam:"Valérie", pulse:2,start:"15/05/2025",end:"15/05/2026",uLog:45,lLog:60,meet:65, next:null,         aiAct:true, aiMsg:3, coachAct:false,coachMsg:0, trend:-12,seatsUsed:45, seatsContract:50, creditsUsed:100, creditsContract:200, mrr:6500, nps:34},
  {id:"3",name:"Marvesting",  tier:"Standard",csm:"Antoine",  kam:"Marion",  pulse:4,start:"20/01/2026",end:"20/01/2027",uLog:5, lLog:2, meet:45, next:"10/05/2026", aiAct:true, aiMsg:12,coachAct:true, coachMsg:8, trend:2,  seatsUsed:80, seatsContract:80, creditsUsed:550, creditsContract:500, mrr:2100, nps:61},
  {id:"4",name:"Tasq-OM",     tier:"Light",   csm:"Florian",  kam:"Valérie", pulse:3,start:"01/04/2025",end:"20/05/2026",uLog:25,lLog:10,meet:120,next:null,         aiAct:false,aiMsg:0, coachAct:false,coachMsg:0, trend:-5, seatsUsed:15, seatsContract:20, creditsUsed:50,  creditsContract:100, mrr:800,  nps:null},
  {id:"5",name:"Cap Retraite",tier:"Standard",csm:"Alexandre",kam:"Marion",  pulse:1,start:"12/06/2025",end:"12/06/2026",uLog:70,lLog:80,meet:90, next:null,         aiAct:false,aiMsg:0, coachAct:false,coachMsg:0, trend:-20,seatsUsed:10, seatsContract:50, creditsUsed:10,  creditsContract:200, mrr:1800, nps:18},
  {id:"6",name:"L'Oréal",     tier:"Premium", csm:"Agathe",   kam:"Valérie", pulse:5,start:"01/02/2026",end:"31/01/2027",uLog:1, lLog:1, meet:5,  next:"10/06/2026", aiAct:true, aiMsg:25,coachAct:true, coachMsg:15,trend:15, seatsUsed:510,seatsContract:500,creditsUsed:1200,creditsContract:1000,mrr:12000,nps:81},
];
