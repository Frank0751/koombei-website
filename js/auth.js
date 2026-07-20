/*
 * KoomBei Circle authentication - real Supabase accounts, magic-link login,
 * no passwords, no backend code of our own. Loaded as an ES module via
 * esm.sh (the same no-build-step CDN pattern already used on this site),
 * and everything it exports is also attached to window.KBAuth so the
 * site's existing plain <script> files can call it.
 *
 * Flow:
 *   1. circle.html collects a join request (name, org, project, etc.) and
 *      calls KBAuth.sendMagicLink(email). Since a magic link only carries
 *      the email address, the rest of the details are cached in
 *      localStorage via KBAuth.saveDraft() until the member logs in.
 *   2. The member clicks the link in their inbox and lands back on
 *      pages/members.html, now authenticated.
 *   3. members.html reads the cached draft (if present) and creates the
 *      member's `profiles` row - which always starts unapproved (see
 *      supabase/schema.sql). If no draft is found (e.g. a different
 *      device), it asks for the same details inline instead.
 *   4. Membership is approved by the site owner directly in the Supabase
 *      Table Editor. Members have no update access to their own row at
 *      all, so there is no client-side path to self-approve.
 *
 * The publishable key below is the public, "safe to embed" Supabase key -
 * it can only do what the RLS policies in supabase/schema.sql allow.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

var SUPABASE_URL = 'https://ntiagjkclftjterprnfm.supabase.co';
var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yPyIYE7rDIjolf7pmMCqHg_NkuMDaY-';

var supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

var DRAFT_KEY = 'kb-circle-draft';
var DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // a week is plenty of time to click the email

function saveDraft(email, fields) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ email: email, fields: fields, savedAt: Date.now() }));
  } catch (e) { /* storage unavailable - the complete-profile fallback form still works */ }
}

function readDraft() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > DRAFT_MAX_AGE_MS) return null;
    return parsed;
  } catch (e) { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
}

function sendMagicLink(email) {
  var redirectTo = new URL('members.html', window.location.href).href;
  return supabase.auth.signInWithOtp({
    email: email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
  });
}

async function getSession() {
  var res = await supabase.auth.getSession();
  return res.data.session;
}

async function getProfile(userId) {
  var res = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (res.error) throw res.error;
  return res.data;
}

async function createProfile(userId, email, fields) {
  fields = fields || {};
  var res = await supabase.from('profiles').insert({
    id: userId,
    email: email,
    full_name: fields.full_name || null,
    organisation: fields.organisation || null,
    whatsapp: fields.whatsapp || null,
    project: fields.project || null,
    referred_by: fields.referred_by || null,
    message: fields.message || null
  });
  if (res.error) throw res.error;
}

async function signOut() {
  await supabase.auth.signOut();
}

window.KBAuth = {
  supabase: supabase,
  saveDraft: saveDraft,
  readDraft: readDraft,
  clearDraft: clearDraft,
  sendMagicLink: sendMagicLink,
  getSession: getSession,
  getProfile: getProfile,
  createProfile: createProfile,
  signOut: signOut
};

// Let listeners on the page know the module has finished attaching KBAuth,
// since plain <script> tags load/execute before module scripts resolve their
// imports and can't just assume window.KBAuth exists yet.
window.dispatchEvent(new Event('kbauth:ready'));
