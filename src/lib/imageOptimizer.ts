// Serves smaller, compressed versions of Cloud Storage images everywhere,
// without changing markup. Originals are untouched; on any error the image
// falls back to the original URL.
const OBJ = "/storage/v1/object/public/";
const RENDER = "/storage/v1/render/image/public/";
const WIDTHS = [480, 960, 1600];

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
  const nativeSet = Element.prototype.setAttribute;

  const apply = (img: HTMLImageElement, url: string) => {
    originals.set(img, url);
    if (!img.hasAttribute("decoding")) nativeSet.call(img, "decoding", "async");
    if (!img.hasAttribute("srcset")) {
      nativeSet.call(img, "srcset", WIDTHS.map((w) => `${variant(url, w)} ${w}w`).join(", "));
      if (!img.hasAttribute("sizes")) nativeSet.call(img, "sizes", "(max-width: 640px) 100vw, (max-width: 1200px) 60vw, 1000px");
    }
    nativeSet.call(img, "src", variant(url, 1280));
  };

  Element.prototype.setAttribute = function (name: string, value: string) {
    if (this instanceof HTMLImageElement && name === "src" && canOptimize(value)) {
      apply(this, value);
      return;
    }
    return nativeSet.call(this, name, value);
  };

  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  if (desc?.set && desc.get) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: desc.enumerable,
      get() { return desc.get!.call(this); },
      set(v: string) {
        if (canOptimize(v)) apply(this, v);
        else desc.set!.call(this, v);
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
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
};
