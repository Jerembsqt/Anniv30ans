/**
 * Mission : les 30 ans de Manon — réception des réponses
 * Une ligne par participant dans le Google Sheet, une photo par participant dans un dossier Drive.
 *
 * Mode d'emploi complet : LISEZ-MOI.md
 */

const SHEET_NAME = 'Réponses';
const FOLDER_NAME = 'Manon 30 ans - photos';
const HEADERS = [
  'Date', 'ID', 'Prénom', 'Lien avec Manon', 'La connaît depuis',
  'Mot 1', 'Mot 2', 'Mot 3',
  'Plus belle qualité', 'Petit défaut', 'Manie / habitude',
  'Anecdote', 'Info méconnue', 'On sait que Manon est dans les parages quand…',
  'Photo (lien Drive)', 'Photo (fichier)', 'Contexte de la photo'
];
const MAX_TEXT = 2000;
const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

/** À exécuter UNE fois depuis l'éditeur (bouton ▶ Exécuter) : crée la feuille, le dossier, et demande les autorisations. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet_(ss);
  const folder = getFolder_();
  PropertiesService.getScriptProperties().setProperty('SS_ID', ss.getId());
  Logger.log('Feuille : ' + ss.getUrl());
  Logger.log('Dossier photos : ' + folder.getUrl());
  Logger.log('Prêt. Tu peux maintenant déployer en application web.');
}

function doGet() {
  return json_({ ok: true, message: 'Le script de réception est en ligne.' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');

    // Champ piège : un humain ne le remplit jamais. On répond « ok » sans rien enregistrer.
    if (d.website) return json_({ ok: true });

    const prenom = clean_(d.prenom);
    if (!prenom) return json_({ ok: false, error: 'Prénom manquant' });

    const ssId = PropertiesService.getScriptProperties().getProperty('SS_ID');
    if (!ssId) return json_({ ok: false, error: 'Script non initialisé : exécute setup() une fois.' });
    const sheet = getSheet_(SpreadsheetApp.openById(ssId));

    // Si le téléphone renvoie la même participation (réseau capricieux), on ne l'enregistre pas deux fois.
    const id = clean_(d.id);
    if (id && sheet.getLastRow() > 1) {
      const ids = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat();
      if (ids.indexOf(id) !== -1) return json_({ ok: true, duplicate: true });
    }

    // Photo (facultative)
    let photoUrl = '', photoName = '';
    const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(d.photo || '');
    if (m) {
      const bytes = Utilities.base64Decode(m[2]);
      if (bytes.length > MAX_PHOTO_BYTES) return json_({ ok: false, error: 'Photo trop lourde' });
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
      photoName = prenom.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 30) + '_' + stamp + '.' + ext;
      const file = getFolder_().createFile(Utilities.newBlob(bytes, 'image/' + m[1], photoName));
      photoUrl = file.getUrl();
    }

    const mots = Array.isArray(d.mots) ? d.mots : [];
    sheet.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      id, prenom, clean_(d.lien), clean_(d.anciennete),
      clean_(mots[0]), clean_(mots[1]), clean_(mots[2]),
      clean_(d.qualite), clean_(d.defaut), clean_(d.manie),
      clean_(d.anecdote), clean_(d.meconnu), clean_(d.phrase),
      photoUrl, photoName, photoUrl ? clean_(d.photoContexte) : ''
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ---------- Utilitaires ---------- */

function getSheet_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Format « texte brut » : une réponse qui commencerait par « = » ne sera jamais interprétée comme une formule.
    sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length).setNumberFormat('@');
    sheet.setColumnWidths(1, HEADERS.length, 160);
  }
  return sheet;
}

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const known = props.getProperty('FOLDER_ID');
  if (known) {
    try { return DriveApp.getFolderById(known); } catch (_) { /* dossier supprimé : on le recrée */ }
  }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function clean_(v) {
  return String(v == null ? '' : v).replace(/\u0000/g, '').trim().slice(0, MAX_TEXT);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
