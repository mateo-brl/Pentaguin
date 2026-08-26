/**
 * Envoi d'e-mails par SMTP, en parlant directement au Postfix local.
 *
 * L'implémentation précédente lançait `/usr/sbin/sendmail`. Elle ne pouvait pas
 * fonctionner : le service tourne avec `DynamicUser=yes`, qui impose
 * `NoNewPrivileges`, ce qui neutralise le bit setgid dont `postdrop` a besoin
 * pour écrire dans /var/spool/postfix/maildrop. Postfix refusait chaque dépôt
 * avec « mail_queue_enter: create file maildrop/…: Permission denied », et
 * l'erreur était avalée : aucun code de vérification n'est jamais parti.
 *
 * Une connexion TCP sur le port SMTP local ne demande, elle, aucun privilège
 * particulier et traverse le sandbox sans rien y assouplir.
 */
import { createConnection } from 'node:net';

const HOST = process.env.SMTP_HOST ?? '127.0.0.1';
const PORT = Number(process.env.SMTP_PORT ?? 25);
const TIMEOUT_MS = 10_000;

/** Un point seul en début de ligne termine les données SMTP : il faut le doubler. */
function dotStuff(body) {
  return body.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
}

/**
 * En-tête non ASCII : encodage MIME « encoded-word » (RFC 2047). Sans ça, un
 * sujet accentué arrive illisible dans la boîte de réception.
 */
function encodeHeader(value) {
  return /^[\x20-\x7E]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
}

function buildMessage(to, subject, text, from) {
  return (
    `From: Pentaguin <${from}>\r\n` +
    `To: <${to}>\r\n` +
    `Subject: ${encodeHeader(subject)}\r\n` +
    'MIME-Version: 1.0\r\n' +
    'Content-Type: text/plain; charset=utf-8\r\n' +
    'Content-Transfer-Encoding: 8bit\r\n' +
    `Date: ${new Date().toUTCString()}\r\n` +
    `\r\n${dotStuff(text)}\r\n`
  );
}

/**
 * Dialogue SMTP minimal. Chaque étape attend un code de réponse précis ; tout
 * écart rejette la promesse, pour que l'échec remonte à l'appelant au lieu
 * d'être silencieux comme avant.
 */
export function sendMail(to, subject, text, from) {
  return new Promise((resolve, reject) => {
    // La réponse à DATA est 354 (« vas-y, envoie »), les autres 250. La bannière
    // d'accueil est 220 et n'est précédée d'aucune commande.
    const script = [
      { expect: 220, next: `EHLO ${HOST}` },
      { expect: 250, next: `MAIL FROM:<${from}>` },
      { expect: 250, next: `RCPT TO:<${to}>` },
      { expect: 250, next: 'DATA' },
      { expect: 354, next: `${buildMessage(to, subject, text, from)}.` },
      { expect: 250, next: 'QUIT' },
    ];

    const socket = createConnection({ host: HOST, port: PORT });
    socket.setEncoding('utf-8');
    socket.setTimeout(TIMEOUT_MS);

    let step = 0;
    let buffer = '';
    let settled = false;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error instanceof Error ? error : new Error(String(error)));
      else resolve();
    };

    socket.on('error', finish);
    socket.on('timeout', () => finish(new Error('smtp_timeout')));
    socket.on('close', () => finish(new Error('smtp_closed')));

    socket.on('data', (chunk) => {
      buffer += chunk;
      // Une réponse peut tenir sur plusieurs lignes : « 250-… » les continue,
      // « 250 … » (espace) la termine. On ne traite que des réponses complètes.
      let index;
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (!/^\d{3}[ -]/.test(line)) return finish(new Error('smtp_protocole'));
        if (line[3] === '-') continue; // ligne de continuation

        const code = Number(line.slice(0, 3));
        const current = script[step];
        if (code !== current.expect) return finish(new Error(`smtp_${code}_etape_${step}`));

        socket.write(`${current.next}\r\n`);
        step += 1;
        // QUIT vient d'être envoyé : le travail est fait, on n'attend pas la
        // réponse de politesse du serveur.
        if (step === script.length) return finish(null);
      }
    });
  });
}
