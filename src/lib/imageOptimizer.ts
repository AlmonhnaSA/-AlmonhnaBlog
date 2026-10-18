import { resolveImageUrl } from "./imageUrl";
const relocated = (url: string) => resolveImageUrl(url, import.meta.env.VITE_IMAGE_BASE_URL, import.meta.env.VITE_IMAGE_SOURCE_PROJECT);
// Serves smaller, compressed versions of Cloud Storage images everywhere,
// without changing markup. Originals are untouched; on any error the image
// falls back to the original URL.
const OBJ = "/storage/v1/object/public/";
const RENDER = "/storage/v1/render/image/public/";
const WIDTHS = [96, 192, 320, 480, 640, 960, 1280, 1600];

const canOptimize = (url: string) =>
  typeof url === "string" &&
  url.includes(".supabase.co" + OBJ) &&
  !/\.(gif|svg)(\?|$)/i.test(url) &&
  !url.includes("/render/image/");

const variant = (url: string, w: number) => {
  const base = url.replace(OBJ, RENDER);
  return `${base}${base.includes("?") ? "&" : "?"}width=${w}&quality=72&resize=contain`;
};

export const optimizedSrc = (url: string, w = 960) => (canOptimize(url) ? variant(url, w) : url);

export const installImageOptimizer = () => {
  if (typeof window === "undefined" || (window as any).__imgOpt) return;
  (window as any).__imgOpt = true;
  const originals = new WeakMap<HTMLImageElement, string>();
  const autoSizes = new WeakSet<HTMLImageElement>();
  const autoSrcSets = new WeakSet<HTMLImageElement>();
  const nativeSet = Element.prototype.setAttribute;
  const updateSize = (img: HTMLImageElement) => {
    if (!autoSizes.has(img)) return;
    const width = Math.ceil(img.getBoundingClientRect().width);
    if (width > 0) nativeSet.call(img, "sizes", `${width}px`);
  };
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => {
      if (target instanceof HTMLImageElement) updateSize(target);
    });
  });

  const apply = (img: HTMLImageElement, url: string) => {
    if (originals.get(img) === url) return; // avoid re-requesting the same image
    originals.set(img, url);
    if (!img.hasAttribute("decoding")) nativeSet.call(img, "decoding", "async");
    // Off-screen by default; images explicitly marked eager/high priority keep loading first.
    if (!img.hasAttribute("loading") && img.getAttribute("fetchpriority") !== "high") nativeSet.call(img, "loading", "lazy");
    // Wait for React to attach the image and its layout classes before choosing
    // a candidate; otherwise tiny portraits request desktop-size covers first.
    requestAnimationFrame(() => {
      if (originals.get(img) !== url) return;
      const moved = relocated(url);
      if (moved !== url) {
        img.removeAttribute("srcset");
        nativeSet.call(img, "src", moved);
        return;
      }
      if (!img.hasAttribute("sizes")) autoSizes.add(img);
      updateSize(img);
      if (!img.hasAttribute("srcset") || autoSrcSets.has(img)) {
        autoSrcSets.add(img);
        nativeSet.call(img, "srcset", WIDTHS.map((w) => `${variant(url, w)} ${w}w`).join(", "));
      }
      nativeSet.call(img, "src", variant(url, 960));
      if (autoSizes.has(img)) resizeObserver.observe(img);
    });
  };

  Element.prototype.setAttribute = function (name: string, value: string) {
    if (this instanceof HTMLImageElement && name === "src" && (canOptimize(value) || relocated(value) !== value)) {
      apply(this, value);
      return;
    }
    if (this instanceof HTMLImageElement && name === "src" && originals.has(this)) {
      originals.delete(this);
      resizeObserver.unobserve(this);
      if (autoSrcSets.has(this)) this.removeAttribute("srcset");
      if (autoSizes.has(this)) this.removeAttribute("sizes");
      autoSrcSets.delete(this);
      autoSizes.delete(this);
    }
    return nativeSet.call(this, name, value);
  };

  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (desc?.set && desc.get) {
    const getSrc = desc.get;
    const setSrc = desc.set;
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: desc.enumerable,
      get() { return getSrc.call(this); },
      set(v: string) {
        if (canOptimize(v) || relocated(v) !== v) apply(this, v);
        else {
          originals.delete(this);
          resizeObserver.unobserve(this);
          if (autoSrcSets.has(this)) this.removeAttribute("srcset");
          if (autoSizes.has(this)) this.removeAttribute("sizes");
          autoSrcSets.delete(this);
          autoSizes.delete(this);
          setSrc.call(this, v);
        }
      },
    });
  }

  // Fallback to original if the optimized version fails.
  window.addEventListener("error", (e) => {
    const img = e.target as HTMLImageElement;
    if (!(img instanceof HTMLImageElement)) return;
    const orig = originals.get(img);
    if (!orig) return;
    originals.delete(img);
    resizeObserver.unobserve(img);
    autoSizes.delete(img);
    autoSrcSets.delete(img);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    nativeSet.call(img, "src", orig);
  }, true);
};

// Compress an image file to WebP (max 1920px) before upload. Returns the original on failure.
export const compressImage = async (file: File, maxDim = 1920, quality = 0.85): Promise<File> => {
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const context = canvas.getContext("2d");
    if (!context) { bmp.close(); return file; }
    context.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
};
