# Project decisions

- Load non-homepage routes on demand so editors, PDF tools, and administration code do not delay public startup.
- Choose transformed image candidates from measured layout width and device pixel ratio, preserving original fallback and uploaded files; small portraits must not download cover-sized variants.

- Keep public sticky header geometry unchanged across scroll states and use non-modal account dropdowns; scroll-lock and resizing must not displace navigation.
- Scroll reveals play once by default, with repeat motion opt-in; keep the final homepage form free of continuous whole-panel and patterned-background motion to prevent boundary flicker and text shimmer.

- Persist public service requests only through the validated, rate-limited edge endpoint; keep request reads/status updates admin-only under database RLS, and share validation between form and endpoint to prevent drift.
- Service-request notifications use the existing SendGrid sender and a server-configured administration recipient; mail failure never turns a saved request into a failed submission and notification state stays visible to administrators.

- Apply the bounded public canvas and its track-padding overrides only at CSS viewport widths of at least 2560px; leave ordinary desktop shells untouched because viewport width is reliable but browser zoom detection is not.

- Keep timeline selection in scoped RTL text tabs using the shared Button, with a gold active underline; styling changes must preserve the existing selected timeline and content rendering.
- Render image timelines at full container width with intrinsic height and no image hover transform, so every image stays fully visible independently of viewport height.

- Reserve vertical motion clearance inside animated horizontal tracks and use unclipped reveal transitions; scroll containers must not cut off floating cards, while intentional image-frame zoom and decorative cropping stay scoped.

- Apply the shared internal-page canvas at the document and top-level page shells, excluding shells containing the editorial homepage; transparent services sections expose this canvas without altering cards, reader-selected backgrounds, or homepage artwork.

- Keep archive card styling opt-in through ArticleCard's archive variant; shared heading CSS targets public page and section titles, excluding card titles, editor content, and admin/writer management screens to preserve hierarchy.

- Anchor hero decorative circles to the article artwork with percentage-based positions and square aspect ratios; this preserves the same composition across screen sizes.

- Keep the three core services as presentation content in the public Services page; database services remain the independently managed “خدمات أخرى” list, preserving the existing editorial workflow.
- Article detail pages use the scoped `.article-editorial` reading layout; service detail pages render only their uploaded ServiceGallery using the column-gallery presentation classes, keeping stored service content and editing workflows intact while matching the visual columns.
- ProductDetail uses a shared article gallery only for the image and quote columns, normalizing Arabic diacritics when matching their names; other columns retain their existing article lists and all content stays in the existing article workflow.
- Service and visual-column galleries share an Embla image track for mouse and touch navigation; service frames follow intrinsic image proportions while column image links retain click navigation and suppress accidental clicks after dragging.- Episode audio may be served by the separate R2 Worker in cloudflare/audio-worker (bucket binding only, no keys in the frontend); players resolve links through resolveAudioUrl so an unset VITE_AUDIO_BASE_URL keeps existing storage links working as the rollback path; the preview-only value lives in .env.development, which production builds never load.
