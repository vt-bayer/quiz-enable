/**
 * Cliente Supabase compartilhado (usa apenas a Publishable key).
 * Depende de: CDN @supabase/supabase-js e supabase-config.js
 */
(function (global) {
  "use strict";

  var instancia = null;

  function obterClienteSupabase() {
    if (instancia) return instancia;

    if (typeof SUPABASE_URL === "undefined" || typeof SUPABASE_ANON_KEY === "undefined") {
      return null;
    }

    if (!global.supabase || typeof global.supabase.createClient !== "function") {
      return null;
    }

    instancia = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return instancia;
  }

  global.obterClienteSupabase = obterClienteSupabase;
})(window);
