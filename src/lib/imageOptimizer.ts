
const OBJ = "/storage/v1/object/public/";
const RENDER = "/storage/v1/render/image/public/";

const WIDTHS = [192, 320, 480, 640, 960, 1280, 1600, 1920];

const canOptimize = (url: string) =>
  typeof url === "string" &&
  url.includes(".supabase.co" + OBJ) &&
  !/\.(gif|svg)(\?|$)/i.test(url) &&
  !url.includes("/render/image/");

const qualityFor = (w: number) => (w >= 960 ? 88 : 85);

const variant = (url: string, w: number) => {
  const base = url.replace(OBJ, RENDER);
  return `${base}${base.includes("?") ? "&" : "?"}width=${w}&quality=${qualityFor(w)}&resize=contain`;
};

export const optimizedSrc = (url: string, w = 1280) =>
  canOptimize(url) ? variant(url, w) : url;

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
    if (width <= 0) return;

    // Request roughly 2x the displayed width for better sharpness.
    nativeSet.call(img, "sizes", `${width * 2}px`);
  };

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => {
          entries.forEach(({ target }) => {
            if (target instanceof HTMLImageElement) updateSize(target);
          });
        })
      : null;

  const cleanup = (img: HTMLImageElement) => {
    originals.delete(img);
    resizeObserver?.unobserve(img);

    if (autoSrcSets.has(img)) img.removeAttribute("srcset");
    if (autoSizes.has(img)) img.removeAttribute("sizes");

    autoSrcSets.delete(img);
    autoSizes.delete(img);
  };

  const apply = (img: HTMLImageElement, url: string) => {
    if (originals.get(img) === url) return;

    originals.set(img, url);

    if (!img.hasAttribute("decoding")) {
      nativeSet.call(img, "decoding", "async");
    }

    if (
      !img.hasAttribute("loading") &&
      img.getAttribute("fetchpriority") !== "high"
    ) {
      nativeSet.call(img, "loading", "lazy");
    }

    requestAnimationFrame(() => {
      if (originals.get(img) !== url) return;

      if (!img.hasAttribute("sizes")) autoSizes.add(img);

      updateSize(img);

      if (!img.hasAttribute("srcset") || autoSrcSets.has(img)) {
        autoSrcSets.add(img);

        nativeSet.call(
          img,
          "srcset",
          WIDTHS.map((w) => `${variant(url, w)} ${w}w`).join(", ")
        );
      }

      nativeSet.call(img, "src", variant(url, 1280));

      if (autoSizes.has(img)) {
        resizeObserver?.observe(img);
      }

      requestAnimationFrame(() => {
        if (originals.get(img) === url) updateSize(img);
      });
    });
  };

  Element.prototype.setAttribute = function (
    name: string,
    value: string
  ) {
    if (
      this instanceof HTMLImageElement &&
      name === "src" &&
      canOptimize(value)
    ) {
      apply(this, value);
      return;
    }

    if (
      this instanceof HTMLImageElement &&
      name === "src" &&
      originals.has(this)
    ) {
      cleanup(this);
    }

    return nativeSet.call(this, name, value);
  };

  const desc = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src"
  );

  if (desc?.set && desc.get) {
    const getSrc = desc.get;
    const setSrc = desc.set;

    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: desc.enumerable,

      get() {
        return getSrc.call(this);
      },

      set(v: string) {
        if (canOptimize(v)) {
          apply(this, v);
        } else {
          cleanup(this);
          setSrc.call(this, v);
        }
      },
    });
  }

  window.addEventListener(
    "error",
    (e) => {
      const img = e.target;

      if (!(img instanceof HTMLImageElement)) return;

      const orig = originals.get(img);
      if (!orig) return;

      cleanup(img);
      nativeSet.call(img, "src", orig);
    },
    true
  );
};

// Keep the existing upload compression behavior.
export const compressImage = async (
  file: File,
  maxDim = 1920,
  quality = 0.85
): Promise<File> => {
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) {
    return file;
  }

  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxDim / Math.max(bmp.width, bmp.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      bmp.close();
      return file;
    }

    context.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );

    if (
      !blob ||
      blob.type !== "image/webp" ||
      blob.size >= file.size
    ) {
      return file;
    }

    return new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + ".webp",
      { type: "image/webp" }
    );
  } catch {
    return file;
  }
};
