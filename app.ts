import express from "express";
import { createApp } from "./copy/http.js";
import { loadCopyLibrary, ROOT } from "./copy/library.js";

// Public hosting always uses original applications and source links only.
const library = await loadCopyLibrary(ROOT, false);
export default express().disable("x-powered-by").use(createApp(library));
