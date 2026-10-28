import express from 'express';
import type { CopyLibrary } from './library.js';
import { languageFrom } from './locale.js';

// Accounts and public model access are deferred. No email, account or model action.
export function studioRouter(library: CopyLibrary) {
  const router = express.Router();
  router.get('/api/studio', (_req,res) => res.json({ready:false,mode:'writing-brief',accounts:'deferred'}));
  router.get('/api/writing-kit', (req,res) => {
    const localized = library.forLanguage(languageFrom(req.query.lang));
    res.json({frameworks:localized.frameworks,people:localized.people,guide:localized.writingGuide,language:localized.language});
  });
  router.get('/api/account', (_req,res) => res.json({user:null}));
  router.post('/api/write', (req,res) => res.status(503).json({error:req.query.lang === 'en'
    ? 'AI writing inside Sigge is not available yet. Create a writing prompt and use it in your AI chat.'
    : 'AI-skrivning direkt i Sigge är inte öppen ännu. Skapa ett skrivunderlag och använd det i din AI-chatt.'}));
  return router;
}
