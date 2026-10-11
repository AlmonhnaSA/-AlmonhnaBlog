/**
 * Removes font-family declarations from HTML content
 * so the site's default font (IBM Plex Sans Arabic) is always used.
 * Handles: inline style attributes (double/single quotes) and <font face=""> tags.
 */
export function cleanContentFont(html: string): string {
  if (!html) return html;

  let result = html;

  const stripFontRules = (styleValue: string) =>
    styleValue
      .split(";")
      .filter((rule) => {
        const prop = rule.split(":")[0]?.trim().toLowerCase() || "";
        return prop !== "font-family" && prop !== "font";
      })
      .join(";");

  // Remove font declarations from inline style with double quotes
  result = result.replace(/style="([^"]*)"/gi, (_m, v: string) => `style="${stripFontRules(v)}"`);

  // Remove font declarations from inline style with single quotes
  result = result.replace(/style='([^']*)'/gi, (_m, v: string) => `style='${stripFontRules(v)}'`);

  // Remove legacy <font> wrappers entirely, keeping their inner content
  result = result.replace(/<font\b[^>]*>/gi, "").replace(/<\/font>/gi, "");

  // Remove font-family declarations inside embedded <style> blocks
  result = result.replace(/font-family\s*:[^;"'}]*;?/gi, "");

  return result;
}

