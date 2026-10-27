import express from 'express';
import type { CopyLibrary } from './library.js';

// Accounts and public model access are deferred by the owner. No email, account
// or model action is exposed here. The CLI can still evaluate the writer locally.
export function studioRouter(library: CopyLibrary) {
  const router = express.Router();
  router.get('/api/studio', (_req,res)=>res.json({ready:false,mode:'writing-brief',accounts:'deferred'}));
  router.get('/api/writing-kit', (_req,res)=>res.json({frameworks:library.frameworks,people:library.people,guide:library.writingGuide}));
  router.get('/api/account', (_req,res)=>res.json({user:null}));
  router.post('/api/write', (_req,res)=>res.status(503).json({error:'AI-skrivning direkt i Sigge är inte öppen ännu. Skapa ett skrivunderlag och använd det i din AI-chatt.'}));
  return router;
}
