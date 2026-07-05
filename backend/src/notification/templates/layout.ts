/**
 * Shared HTML shell every template renders its body into. Centralizing this
 * here is what keeps individual templates to "just the content that
 * changes" instead of every template re-declaring the same table/branding
 * boilerplate (email HTML needs inline styles + tables for client
 * compatibility — no external stylesheet, no flexbox).
 */

export interface LayoutOptions {
  /** Small label above the heading, e.g. "Password reset". Optional. */
  eyebrow?: string;
}

export function renderLayout(bodyHtml: string, options: LayoutOptions = {}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#0B0B0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0B0F;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#16161D;border:1px solid #26262F;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <span style="display:inline-block;font-size:16px;font-weight:700;letter-spacing:-0.02em;background:linear-gradient(135deg,#7C3AED,#A855F7);-webkit-background-clip:text;background-clip:text;color:#A855F7;">Leinaflow</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;color:#E5E5EA;font-size:14px;line-height:1.6;">
                ${options.eyebrow ? `<p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#A855F7;">${options.eyebrow}</p>` : ''}
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;border-top:1px solid #26262F;">
                <p style="margin:0;font-size:11px;color:#6B6B76;">Leinaflow &middot; A product of Cloudivo</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="border-radius:8px;background:linear-gradient(135deg,#7C3AED,#A855F7);">
        <a href="${href}" style="display:inline-block;padding:10px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

/** Naive HTML→text fallback used when a template doesn't supply its own text() rendering. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
