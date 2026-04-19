// @bun
// node_modules/html-to-image/es/util.js
function resolveUrl(url, baseUrl) {
  if (url.match(/^[a-z]+:\/\//i)) {
    return url;
  }
  if (url.match(/^\/\//)) {
    return window.location.protocol + url;
  }
  if (url.match(/^[a-z]+:/i)) {
    return url;
  }
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  const a = doc.createElement("a");
  doc.head.appendChild(base);
  doc.body.appendChild(a);
  if (baseUrl) {
    base.href = baseUrl;
  }
  a.href = url;
  return a.href;
}
var uuid = (() => {
  let counter = 0;
  const random = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
  return () => {
    counter += 1;
    return `u${random()}${counter}`;
  };
})();
function toArray(arrayLike) {
  const arr = [];
  for (let i = 0, l = arrayLike.length;i < l; i++) {
    arr.push(arrayLike[i]);
  }
  return arr;
}
var styleProps = null;
function getStyleProperties(options = {}) {
  if (styleProps) {
    return styleProps;
  }
  if (options.includeStyleProperties) {
    styleProps = options.includeStyleProperties;
    return styleProps;
  }
  styleProps = toArray(window.getComputedStyle(document.documentElement));
  return styleProps;
}
function px(node, styleProperty) {
  const win = node.ownerDocument.defaultView || window;
  const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
  return val ? parseFloat(val.replace("px", "")) : 0;
}
function getNodeWidth(node) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.clientHeight + topBorder + bottomBorder;
}
function getImageSize(targetNode, options = {}) {
  const width = options.width || getNodeWidth(targetNode);
  const height = options.height || getNodeHeight(targetNode);
  return { width, height };
}
function getPixelRatio() {
  let ratio;
  let FINAL_PROCESS;
  try {
    FINAL_PROCESS = process;
  } catch (e) {}
  const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
  if (val) {
    ratio = parseInt(val, 10);
    if (Number.isNaN(ratio)) {
      ratio = 1;
    }
  }
  return ratio || window.devicePixelRatio || 1;
}
var canvasDimensionLimit = 16384;
function checkCanvasDimensions(canvas) {
  if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
    if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
      if (canvas.width > canvas.height) {
        canvas.height *= canvasDimensionLimit / canvas.width;
        canvas.width = canvasDimensionLimit;
      } else {
        canvas.width *= canvasDimensionLimit / canvas.height;
        canvas.height = canvasDimensionLimit;
      }
    } else if (canvas.width > canvasDimensionLimit) {
      canvas.height *= canvasDimensionLimit / canvas.width;
      canvas.width = canvasDimensionLimit;
    } else {
      canvas.width *= canvasDimensionLimit / canvas.height;
      canvas.height = canvasDimensionLimit;
    }
  }
}
function canvasToBlob(canvas, options = {}) {
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, options.type ? options.type : "image/png", options.quality ? options.quality : 1);
    });
  }
  return new Promise((resolve) => {
    const binaryString = window.atob(canvas.toDataURL(options.type ? options.type : undefined, options.quality ? options.quality : undefined).split(",")[1]);
    const len = binaryString.length;
    const binaryArray = new Uint8Array(len);
    for (let i = 0;i < len; i += 1) {
      binaryArray[i] = binaryString.charCodeAt(i);
    }
    resolve(new Blob([binaryArray], {
      type: options.type ? options.type : "image/png"
    }));
  });
}
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image;
    img.onload = () => {
      img.decode().then(() => {
        requestAnimationFrame(() => resolve(img));
      });
    };
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
  });
}
async function svgToDataURL(svg) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
}
async function nodeToDataURL(node, width, height) {
  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  const foreignObject = document.createElementNS(xmlns, "foreignObject");
  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("externalResourcesRequired", "true");
  svg.appendChild(foreignObject);
  foreignObject.appendChild(node);
  return svgToDataURL(svg);
}
var isInstanceOfElement = (node, instance) => {
  if (node instanceof instance)
    return true;
  const nodePrototype = Object.getPrototypeOf(node);
  if (nodePrototype === null)
    return false;
  return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
};

// node_modules/html-to-image/es/clone-pseudos.js
function formatCSSText(style) {
  const content = style.getPropertyValue("content");
  return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
}
function formatCSSProperties(style, options) {
  return getStyleProperties(options).map((name) => {
    const value = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    return `${name}: ${value}${priority ? " !important" : ""};`;
  }).join(" ");
}
function getPseudoElementStyle(className, pseudo, style, options) {
  const selector = `.${className}:${pseudo}`;
  const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style, options);
  return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
  const style = window.getComputedStyle(nativeNode, pseudo);
  const content = style.getPropertyValue("content");
  if (content === "" || content === "none") {
    return;
  }
  const className = uuid();
  try {
    clonedNode.className = `${clonedNode.className} ${className}`;
  } catch (err) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
  clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode, options) {
  clonePseudoElement(nativeNode, clonedNode, ":before", options);
  clonePseudoElement(nativeNode, clonedNode, ":after", options);
}

// node_modules/html-to-image/es/mimes.js
var WOFF = "application/font-woff";
var JPEG = "image/jpeg";
var mimes = {
  woff: WOFF,
  woff2: WOFF,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: JPEG,
  jpeg: JPEG,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function getExtension(url) {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : "";
}
function getMimeType(url) {
  const extension = getExtension(url).toLowerCase();
  return mimes[extension] || "";
}

// node_modules/html-to-image/es/dataurl.js
function getContentFromDataUrl(dataURL) {
  return dataURL.split(/,/)[1];
}
function isDataUrl(url) {
  return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
  return `data:${mimeType};base64,${content}`;
}
async function fetchAsDataURL(url, init, process2) {
  const res = await fetch(url, init);
  if (res.status === 404) {
    throw new Error(`Resource "${res.url}" not found`);
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onloadend = () => {
      try {
        resolve(process2({ res, result: reader.result }));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(blob);
  });
}
var cache = {};
function getCacheKey(url, contentType, includeQueryParams) {
  let key = url.replace(/\?.*/, "");
  if (includeQueryParams) {
    key = url;
  }
  if (/ttf|otf|eot|woff2?/i.test(key)) {
    key = key.replace(/.*\//, "");
  }
  return contentType ? `[${contentType}]${key}` : key;
}
async function resourceToDataURL(resourceUrl, contentType, options) {
  const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
  if (cache[cacheKey] != null) {
    return cache[cacheKey];
  }
  if (options.cacheBust) {
    resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + new Date().getTime();
  }
  let dataURL;
  try {
    const content = await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
      if (!contentType) {
        contentType = res.headers.get("Content-Type") || "";
      }
      return getContentFromDataUrl(result);
    });
    dataURL = makeDataUrl(content, contentType);
  } catch (error) {
    dataURL = options.imagePlaceholder || "";
    let msg = `Failed to fetch resource: ${resourceUrl}`;
    if (error) {
      msg = typeof error === "string" ? error : error.message;
    }
    if (msg) {
      console.warn(msg);
    }
  }
  cache[cacheKey] = dataURL;
  return dataURL;
}

// node_modules/html-to-image/es/clone-node.js
async function cloneCanvasElement(canvas) {
  const dataURL = canvas.toDataURL();
  if (dataURL === "data:,") {
    return canvas.cloneNode(false);
  }
  return createImage(dataURL);
}
async function cloneVideoElement(video, options) {
  if (video.currentSrc) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx === null || ctx === undefined || ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL2 = canvas.toDataURL();
    return createImage(dataURL2);
  }
  const poster = video.poster;
  const contentType = getMimeType(poster);
  const dataURL = await resourceToDataURL(poster, contentType, options);
  return createImage(dataURL);
}
async function cloneIFrameElement(iframe, options) {
  var _a;
  try {
    if ((_a = iframe === null || iframe === undefined ? undefined : iframe.contentDocument) === null || _a === undefined ? undefined : _a.body) {
      return await cloneNode(iframe.contentDocument.body, options, true);
    }
  } catch (_b) {}
  return iframe.cloneNode(false);
}
async function cloneSingleNode(node, options) {
  if (isInstanceOfElement(node, HTMLCanvasElement)) {
    return cloneCanvasElement(node);
  }
  if (isInstanceOfElement(node, HTMLVideoElement)) {
    return cloneVideoElement(node, options);
  }
  if (isInstanceOfElement(node, HTMLIFrameElement)) {
    return cloneIFrameElement(node, options);
  }
  return node.cloneNode(isSVGElement(node));
}
var isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
var isSVGElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SVG";
async function cloneChildren(nativeNode, clonedNode, options) {
  var _a, _b;
  if (isSVGElement(clonedNode)) {
    return clonedNode;
  }
  let children = [];
  if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
    children = toArray(nativeNode.assignedNodes());
  } else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === undefined ? undefined : _a.body)) {
    children = toArray(nativeNode.contentDocument.body.childNodes);
  } else {
    children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== undefined ? _b : nativeNode).childNodes);
  }
  if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
    return clonedNode;
  }
  await children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
    if (clonedChild) {
      clonedNode.appendChild(clonedChild);
    }
  }), Promise.resolve());
  return clonedNode;
}
function cloneCSSStyle(nativeNode, clonedNode, options) {
  const targetStyle = clonedNode.style;
  if (!targetStyle) {
    return;
  }
  const sourceStyle = window.getComputedStyle(nativeNode);
  if (sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    targetStyle.transformOrigin = sourceStyle.transformOrigin;
  } else {
    getStyleProperties(options).forEach((name) => {
      let value = sourceStyle.getPropertyValue(name);
      if (name === "font-size" && value.endsWith("px")) {
        const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
        value = `${reducedFont}px`;
      }
      if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") {
        value = "block";
      }
      if (name === "d" && clonedNode.getAttribute("d")) {
        value = `path(${clonedNode.getAttribute("d")})`;
      }
      targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
    });
  }
}
function cloneInputValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
    clonedNode.innerHTML = nativeNode.value;
  }
  if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
    clonedNode.setAttribute("value", nativeNode.value);
  }
}
function cloneSelectValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
    const clonedSelect = clonedNode;
    const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
    if (selectedOption) {
      selectedOption.setAttribute("selected", "");
    }
  }
}
function decorate(nativeNode, clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    cloneCSSStyle(nativeNode, clonedNode, options);
    clonePseudoElements(nativeNode, clonedNode, options);
    cloneInputValue(nativeNode, clonedNode);
    cloneSelectValue(nativeNode, clonedNode);
  }
  return clonedNode;
}
async function ensureSVGSymbols(clone, options) {
  const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
  if (uses.length === 0) {
    return clone;
  }
  const processedDefs = {};
  for (let i = 0;i < uses.length; i++) {
    const use = uses[i];
    const id = use.getAttribute("xlink:href");
    if (id) {
      const exist = clone.querySelector(id);
      const definition = document.querySelector(id);
      if (!exist && definition && !processedDefs[id]) {
        processedDefs[id] = await cloneNode(definition, options, true);
      }
    }
  }
  const nodes = Object.values(processedDefs);
  if (nodes.length) {
    const ns = "http://www.w3.org/1999/xhtml";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.style.display = "none";
    const defs = document.createElementNS(ns, "defs");
    svg.appendChild(defs);
    for (let i = 0;i < nodes.length; i++) {
      defs.appendChild(nodes[i]);
    }
    clone.appendChild(svg);
  }
  return clone;
}
async function cloneNode(node, options, isRoot) {
  if (!isRoot && options.filter && !options.filter(node)) {
    return null;
  }
  return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode, options)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
}

// node_modules/html-to-image/es/embed-resources.js
var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
var URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
var FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
}
function parseURLs(cssText) {
  const urls = [];
  cssText.replace(URL_REGEX, (raw, quotation, url) => {
    urls.push(url);
    return raw;
  });
  return urls.filter((url) => !isDataUrl(url));
}
async function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
  try {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    const contentType = getMimeType(resourceURL);
    let dataURL;
    if (getContentFromUrl) {
      const content = await getContentFromUrl(resolvedURL);
      dataURL = makeDataUrl(content, contentType);
    } else {
      dataURL = await resourceToDataURL(resolvedURL, contentType, options);
    }
    return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
  } catch (error) {}
  return cssText;
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
  return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, (match) => {
    while (true) {
      const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
      if (!format) {
        return "";
      }
      if (format === preferredFontFormat) {
        return `src: ${src};`;
      }
    }
  });
}
function shouldEmbed(url) {
  return url.search(URL_REGEX) !== -1;
}
async function embedResources(cssText, baseUrl, options) {
  if (!shouldEmbed(cssText)) {
    return cssText;
  }
  const filteredCSSText = filterPreferredFontFormat(cssText, options);
  const urls = parseURLs(filteredCSSText);
  return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
}

// node_modules/html-to-image/es/embed-images.js
async function embedProp(propName, node, options) {
  var _a;
  const propValue = (_a = node.style) === null || _a === undefined ? undefined : _a.getPropertyValue(propName);
  if (propValue) {
    const cssString = await embedResources(propValue, null, options);
    node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
    return true;
  }
  return false;
}
async function embedBackground(clonedNode, options) {
  await embedProp("background", clonedNode, options) || await embedProp("background-image", clonedNode, options);
  await embedProp("mask", clonedNode, options) || await embedProp("-webkit-mask", clonedNode, options) || await embedProp("mask-image", clonedNode, options) || await embedProp("-webkit-mask-image", clonedNode, options);
}
async function embedImageNode(clonedNode, options) {
  const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
  if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) {
    return;
  }
  const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
  const dataURL = await resourceToDataURL(url, getMimeType(url), options);
  await new Promise((resolve, reject) => {
    clonedNode.onload = resolve;
    clonedNode.onerror = options.onImageErrorHandler ? (...attributes) => {
      try {
        resolve(options.onImageErrorHandler(...attributes));
      } catch (error) {
        reject(error);
      }
    } : reject;
    const image = clonedNode;
    if (image.decode) {
      image.decode = resolve;
    }
    if (image.loading === "lazy") {
      image.loading = "eager";
    }
    if (isImageElement) {
      clonedNode.srcset = "";
      clonedNode.src = dataURL;
    } else {
      clonedNode.href.baseVal = dataURL;
    }
  });
}
async function embedChildren(clonedNode, options) {
  const children = toArray(clonedNode.childNodes);
  const deferreds = children.map((child) => embedImages(child, options));
  await Promise.all(deferreds).then(() => clonedNode);
}
async function embedImages(clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    await embedBackground(clonedNode, options);
    await embedImageNode(clonedNode, options);
    await embedChildren(clonedNode, options);
  }
}

// node_modules/html-to-image/es/apply-style.js
function applyStyle(node, options) {
  const { style } = node;
  if (options.backgroundColor) {
    style.backgroundColor = options.backgroundColor;
  }
  if (options.width) {
    style.width = `${options.width}px`;
  }
  if (options.height) {
    style.height = `${options.height}px`;
  }
  const manual = options.style;
  if (manual != null) {
    Object.keys(manual).forEach((key) => {
      style[key] = manual[key];
    });
  }
  return node;
}

// node_modules/html-to-image/es/embed-webfonts.js
var cssFetchCache = {};
async function fetchCSS(url) {
  let cache2 = cssFetchCache[url];
  if (cache2 != null) {
    return cache2;
  }
  const res = await fetch(url);
  const cssText = await res.text();
  cache2 = { url, cssText };
  cssFetchCache[url] = cache2;
  return cache2;
}
async function embedFonts(data, options) {
  let cssText = data.cssText;
  const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
  const loadFonts = fontLocs.map(async (loc) => {
    let url = loc.replace(regexUrl, "$1");
    if (!url.startsWith("https://")) {
      url = new URL(url, data.url).href;
    }
    return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
      cssText = cssText.replace(loc, `url(${result})`);
      return [loc, result];
    });
  });
  return Promise.all(loadFonts).then(() => cssText);
}
function parseCSS(source) {
  if (source == null) {
    return [];
  }
  const result = [];
  const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  let cssText = source.replace(commentsRegex, "");
  const keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  while (true) {
    const matches = keyframesRegex.exec(cssText);
    if (matches === null) {
      break;
    }
    result.push(matches[0]);
  }
  cssText = cssText.replace(keyframesRegex, "");
  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  const combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]" + "*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
  const unifiedRegex = new RegExp(combinedCSSRegex, "gi");
  while (true) {
    let matches = importRegex.exec(cssText);
    if (matches === null) {
      matches = unifiedRegex.exec(cssText);
      if (matches === null) {
        break;
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex;
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex;
    }
    result.push(matches[0]);
  }
  return result;
}
async function getCSSRules(styleSheets, options) {
  const ret = [];
  const deferreds = [];
  styleSheets.forEach((sheet) => {
    if ("cssRules" in sheet) {
      try {
        toArray(sheet.cssRules || []).forEach((item, index) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            let importIndex = index + 1;
            const url = item.href;
            const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              try {
                sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
              } catch (error) {
                console.error("Error inserting rule from remote css", {
                  rule,
                  error
                });
              }
            })).catch((e) => {
              console.error("Error loading remote css", e.toString());
            });
            deferreds.push(deferred);
          }
        });
      } catch (e) {
        const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
        if (sheet.href != null) {
          deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
            inline.insertRule(rule, inline.cssRules.length);
          })).catch((err) => {
            console.error("Error loading remote stylesheet", err);
          }));
        }
        console.error("Error inlining remote css file", e);
      }
    }
  });
  return Promise.all(deferreds).then(() => {
    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          toArray(sheet.cssRules || []).forEach((item) => {
            ret.push(item);
          });
        } catch (e) {
          console.error(`Error while reading CSS rules from ${sheet.href}`, e);
        }
      }
    });
    return ret;
  });
}
function getWebFontRules(cssRules) {
  return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
}
async function parseWebFontRules(node, options) {
  if (node.ownerDocument == null) {
    throw new Error("Provided element is not within a Document");
  }
  const styleSheets = toArray(node.ownerDocument.styleSheets);
  const cssRules = await getCSSRules(styleSheets, options);
  return getWebFontRules(cssRules);
}
function normalizeFontFamily(font) {
  return font.trim().replace(/["']/g, "");
}
function getUsedFonts(node) {
  const fonts = new Set;
  function traverse(node2) {
    const fontFamily = node2.style.fontFamily || getComputedStyle(node2).fontFamily;
    fontFamily.split(",").forEach((font) => {
      fonts.add(normalizeFontFamily(font));
    });
    Array.from(node2.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        traverse(child);
      }
    });
  }
  traverse(node);
  return fonts;
}
async function getWebFontCSS(node, options) {
  const rules = await parseWebFontRules(node, options);
  const usedFonts = getUsedFonts(node);
  const cssTexts = await Promise.all(rules.filter((rule) => usedFonts.has(normalizeFontFamily(rule.style.fontFamily))).map((rule) => {
    const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
    return embedResources(rule.cssText, baseUrl, options);
  }));
  return cssTexts.join(`
`);
}
async function embedWebFonts(clonedNode, options) {
  const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : await getWebFontCSS(clonedNode, options);
  if (cssText) {
    const styleNode = document.createElement("style");
    const sytleContent = document.createTextNode(cssText);
    styleNode.appendChild(sytleContent);
    if (clonedNode.firstChild) {
      clonedNode.insertBefore(styleNode, clonedNode.firstChild);
    } else {
      clonedNode.appendChild(styleNode);
    }
  }
}

// node_modules/html-to-image/es/index.js
async function toSvg(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const clonedNode = await cloneNode(node, options, true);
  await embedWebFonts(clonedNode, options);
  await embedImages(clonedNode, options);
  applyStyle(clonedNode, options);
  const datauri = await nodeToDataURL(clonedNode, width, height);
  return datauri;
}
async function toCanvas(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const svg = await toSvg(node, options);
  const img = await createImage(svg);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const ratio = options.pixelRatio || getPixelRatio();
  const canvasWidth = options.canvasWidth || width;
  const canvasHeight = options.canvasHeight || height;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas);
  }
  canvas.style.width = `${canvasWidth}`;
  canvas.style.height = `${canvasHeight}`;
  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
async function toBlob(node, options = {}) {
  const canvas = await toCanvas(node, options);
  const blob = await canvasToBlob(canvas);
  return blob;
}

// src/utils/utils.ts
function sendMessageToClient({
  event,
  data
}) {
  parent.postMessage({ event, data }, "*");
}
var checkCell = (cIndex, cPosition, cellNumber, contentPosition) => {
  return cIndex === cellNumber && contentPosition === cPosition;
};
async function takeScreenShot() {
  const body = document.body;
  const blob = await toBlob(body, {
    type: "image/png",
    pixelRatio: 2,
    width: body.offsetWidth,
    backgroundColor: "#121212"
  });
  if (blob)
    return blob.arrayBuffer();
  return null;
}

// src/quizMananger.ts
class QuizManager {
  totalScore = 0;
  cellIndex = -1;
  contentPosition = -1;
  handleError;
  registerEvent;
  sendToParent;
  constructor(handleError, cellIndex, contentPosition, registerEvent, sendToParent) {
    this.handleError = handleError;
    this.cellIndex = cellIndex;
    this.contentPosition = contentPosition;
    this.registerEvent = registerEvent;
    this.sendToParent = sendToParent;
    this.registerEvent("tryAgain", this.onTryAgain);
    this.setupEventHandlers();
  }
  get position() {
    return {
      cellIndex: this.cellIndex,
      contentPosition: this.contentPosition
    };
  }
  setupEventHandlers() {
    this.registerEvent("verifyAnswer", () => {
      try {
        const results = this.verifyAnswer();
        this.sendVerificationResults(results);
      } catch (error) {
        this.handleError(error);
      }
    });
  }
  verifyAnswer = () => {
    throw new Error("verifyAnswer must be implemented before use");
  };
  sendVerificationResults(results) {
    window.parent.postMessage({
      event: "verificationResults",
      data: {
        payload: results,
        contentPosition: this.contentPosition,
        cellIndex: this.cellIndex
      }
    }, "*");
  }
  submitAnswerResults({
    passed,
    points,
    next,
    playSound = true
  }) {
    sendMessageToClient({
      event: "answered",
      data: {
        ...this.position,
        payload: { passed, points, next, playSound }
      }
    });
  }
  playCorrectSound() {
    this.sendToParent("playSound", { correct: true });
  }
  playIncorrectSound() {
    this.sendToParent("playSound", { correct: false });
  }
  completed() {
    this.sendToParent("completed");
  }
  updateTotalScore(score) {
    this.totalScore = score;
    this.sendToParent("registerExerciseTotalScore", score);
  }
  onTryAgain(callback) {
    callback();
  }
  verifyWithAi(inputData, prompt, output) {
    return new Promise((resolve, reject) => {
      this.registerEvent("verifyWithAiError", (errorData) => {
        reject(new Error(errorData.message || "AI verification failed"));
      });
      this.registerEvent("verifyWithAi", (response) => {
        resolve(response);
      });
      sendMessageToClient({
        event: "verifyWithAi",
        data: {
          ...this.position,
          payload: {
            inputData,
            prompt,
            output
          }
        }
      });
    });
  }
  showVerificationButton() {
    sendMessageToClient({
      event: "showVerificationButton",
      data: {
        ...this.position,
        payload: null
      }
    });
  }
  hideVerificationButton() {
    sendMessageToClient({
      event: "hideVerificationButton",
      data: {
        ...this.position,
        payload: null
      }
    });
  }
  hideFooter() {
    sendMessageToClient({
      event: "hideFooter",
      data: {
        ...this.position,
        payload: null
      }
    });
  }
  goToNextCell() {
    sendMessageToClient({
      event: "nextCell",
      data: {
        ...this.position,
        payload: null
      }
    });
  }
  goToPreviousCell() {
    sendMessageToClient({
      event: "previousCell",
      data: {
        ...this.position,
        payload: null
      }
    });
  }
  reset() {
    this.totalScore = 0;
    sendMessageToClient({
      event: "resetQuiz",
      data: {
        ...this.position,
        payload: null
      }
    });
  }
  requestHint(hintLevel) {
    sendMessageToClient({
      event: "requestHint",
      data: {
        ...this.position,
        payload: { hintLevel }
      }
    });
  }
}

// src/bridge.ts
class NotebookSDK {
  score = 0;
  isInitialized = false;
  isPublished = false;
  cellIndex = 0;
  contentPosition = 0;
  quizManager;
  contentData = null;
  config;
  eventHandlers = {
    ready: [],
    error: []
  };
  messageHandlers = {};
  constructor(config) {
    this.config = config;
    this.initializeSDK(config);
  }
  initializeSDK(_config, tries = 10) {
    if (typeof window === "undefined") {
      this.triggerError(new Error("SDK must run in a browser environment"));
      return;
    }
    if (typeof parent === "undefined") {
      this.triggerError(new Error("SDK must run in an iframe within the host application"));
      return;
    }
    window.addEventListener("message", this.handleIncomingMessage.bind(this));
    this.registerCoreMessageHandlers();
    setTimeout(() => {
      if (!this.isInitialized) {
        if (tries >= 0) {
          console.log("not initialized ", tries);
          this.reconnect();
          return this.initializeSDK(this.config, tries - 1);
        }
        this.triggerError(new Error("Host application did not respond to SDK initialization"));
      }
    }, 3000);
  }
  reconnect() {
    if (this.isInitialized === false) {
      this.sendToParent("reconnect");
    }
  }
  connect(data) {
    this.handleInitialization(data);
    this.sendToParent("connected", this.config);
    console.log("connected");
  }
  registerCoreMessageHandlers() {
    this.messageHandlers["connect"] = this.connect.bind(this);
    this.messageHandlers["scoreUpdated"] = this.handleScoreUpdate.bind(this);
    this.messageHandlers["getConfig"] = this.handleConfigRequest.bind(this);
    this.messageHandlers["captureScreenshot"] = this.takeScreenShot.bind(this);
    this.messageHandlers["showCorrectAnswer"] = this.handleShowCorrectAnswer.bind(this);
    this.messageHandlers["error"] = (data) => {
      this.triggerError(new Error(data.message));
    };
  }
  handleIncomingMessage(event) {
    const { data } = event;
    if (data == undefined || data.data == undefined) {
      return;
    }
    const { cellIndex: messageCell, contentPosition: messagePosition } = data.data;
    if (this.isInitialized) {
      const isTargetCell = checkCell(messageCell, messagePosition, this.cellIndex, this.contentPosition);
      if (!isTargetCell) {
        return;
      }
    }
    const handler = this.messageHandlers[data.event];
    if (handler) {
      handler(data.data.payload);
    }
  }
  sendToParent(event, payload) {
    sendMessageToClient({
      event,
      data: {
        cellIndex: this.cellIndex,
        contentPosition: this.contentPosition,
        payload
      }
    });
  }
  registerMessageHandler = (event, callback) => {
    this.messageHandlers[event] = callback.bind(this);
  };
  unRegisterMessageHandler(event) {
    delete this.messageHandlers[event];
  }
  handleInitialization(data) {
    if (data.getMeta) {
      let icon = "";
      const iconEl = document.querySelector('link[rel="icon"]');
      if (iconEl) {
        const href = iconEl.getAttribute("href") || "";
        if (/^https?:\/\//i.test(href)) {
          icon = href;
        } else {
          icon = new URL(href, window.location.origin).href;
        }
      }
      this.sendToParent("get-meta-response", {
        autoGen: {
          icon,
          type: this.contentGenerator.contentType,
          instruction: this.contentGenerator.instructionFormat
        }
      });
      data.published = false;
    }
    this.isPublished = data.published;
    this.cellIndex = data.cellIndex;
    this.contentData = data.cellContentData;
    this.contentPosition = data.contentPosition;
    this.score = data.calculatedScore || 0;
    this.isInitialized = true;
    if (data.cellContentData != null && data.cellContentData.processCells) {
      let rawData = data.cellContentData.dataToProcess;
      if (this.contentGenerator && this.contentGenerator.contentType?.includes("html")) {
        const div = document.createElement("div");
        div.innerHTML = data.cellContentData.dataToProcess;
        rawData = div;
      }
      const generatedContent = this.contentGenerator.processImport(rawData);
      this.sendToParent("autoGenerateCells", generatedContent);
      return;
    }
    this.quizManager = new QuizManager(this.triggerError.bind(this), this.cellIndex, this.contentPosition, this.registerMessageHandler, this.sendToParent);
    delete this.messageHandlers["sdkInitialized"];
    this.notifyReady();
  }
  handleScoreUpdate(data) {
    this.score = data.score;
  }
  handleConfigRequest() {
    this.sendToParent("getConfig", this.config);
  }
  updateConfig({}) {}
  getContentData() {
    return this.contentData;
  }
  saveContent(data) {
    if (!this.isInitialized) {
      throw new Error("SDK not initialized. Wait for onReady() before saving.");
    }
    if (data == null) {
      throw new Error("Cannot save null or undefined data");
    }
    const type = typeof data;
    if (type !== "string" && type !== "object") {
      throw new Error("Data must be a string, array, or plain object");
    }
    let cloned;
    if (type === "string") {
      cloned = data;
    } else {
      try {
        cloned = JSON.parse(JSON.stringify(data));
      } catch {
        throw new Error("Data contains non-JSON-safe values");
      }
    }
    this.contentData = cloned;
    this.sendToParent("saveData", cloned);
  }
  async uploadFile(file, timeoutMs = 15000) {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "text/plain"
    ];
    const base64ToArrayBuffer = (base64) => {
      const clean = base64.split(",")[1] || base64;
      const binary = atob(clean);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const view = new Uint8Array(buffer);
      for (let i = 0;i < len; i++)
        view[i] = binary.charCodeAt(i);
      return buffer;
    };
    const sendToHost = (payload) => {
      return new Promise((resolve, reject) => {
        const eventSuccess = "fileUploaded";
        const eventError = "fileUploadError";
        const handleSuccess = (url) => {
          clearTimeout(timeoutId);
          this.unRegisterMessageHandler(eventSuccess);
          this.unRegisterMessageHandler(eventError);
          resolve(url);
        };
        const handleFailure = (errMsg) => {
          clearTimeout(timeoutId);
          this.unRegisterMessageHandler(eventSuccess);
          this.unRegisterMessageHandler(eventError);
          reject(new Error(errMsg || "Host failed to upload file"));
        };
        this.registerMessageHandler(eventSuccess, handleSuccess);
        this.registerMessageHandler(eventError, handleFailure);
        const timeoutId = window.setTimeout(() => {
          this.unRegisterMessageHandler(eventSuccess);
          this.unRegisterMessageHandler(eventError);
          reject(new Error("File upload timed out"));
        }, timeoutMs);
        this.sendToParent("uploadFile", payload);
      });
    };
    const processFile = async (f, name) => {
      if (!allowedTypes.includes(f.type))
        throw new Error(`File type ${f.type} not supported`);
      const arrayBuffer = await f.arrayBuffer();
      if (arrayBuffer.byteLength > 3.5 * 1024 * 1024)
        throw new Error("File too large (max 3.5 MB). Please resize for better performance.");
      return sendToHost({
        fileName: name || (f instanceof File ? f.name : "file"),
        mimeType: f.type,
        data: arrayBuffer
      });
    };
    if (typeof file === "string") {
      const arrayBuffer = base64ToArrayBuffer(file);
      if (arrayBuffer.byteLength > 3.5 * 1024 * 1024)
        throw new Error("Base64 file too large (max 3.5 MB). Please resize for better performance.");
      const mimeMatch = file.match(/^data:(.+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
      if (!allowedTypes.includes(mimeType))
        throw new Error(`File type ${mimeType} not supported`);
      return sendToHost({
        fileName: "file",
        mimeType,
        data: arrayBuffer
      });
    } else {
      return processFile(file);
    }
  }
  onCaptureScreenshot = null;
  onScreenshotCaptured = null;
  async takeScreenShot() {
    if (this.onCaptureScreenshot) {
      await this.onCaptureScreenshot();
    }
    const image = await takeScreenShot();
    this.sendToParent("screenshotCaptured", image);
    if (this.onScreenshotCaptured)
      this.onScreenshotCaptured();
  }
  contentGenerator = {
    contentType: null,
    instructionFormat: null,
    processImport: (_input) => {
      this.sendToParent("notImplemented", "Content import processing not implemented");
      throw new Error("Content import processing not implemented");
    }
  };
  showCorrectAnswer = () => {
    this.sendToParent("notImplemented", "Show correct answer not implemented for this cell type");
    throw new Error("Show correct answer not implemented");
  };
  handleShowCorrectAnswer() {
    this.showCorrectAnswer();
  }
  reverseTTS(innerHTML) {
    return new Promise((resolve) => {
      this.messageHandlers["reverseTTS"] = (data) => {
        resolve(data);
      };
      this.sendToParent("reverseTTS", innerHTML);
    });
  }
  processTTS(element, size) {
    return new Promise((resolve) => {
      this.sendToParent("processTTs", element.innerHTML);
      this.messageHandlers["processTTs"] = (processedHTML) => {
        element.innerHTML = processedHTML;
        this.attachTTSControls(element, size);
        resolve();
      };
    });
  }
  attachTTSControls(container, size) {
    const ttsElements = container.querySelectorAll("[data-tts]");
    ttsElements.forEach((element) => {
      if (element.querySelector('[data-role="speak-btn"]')) {
        return;
      }
      const button = this.createTTSButton(element, size);
      element.prepend(button);
    });
    return container;
  }
  createTTSButton(element, size) {
    const button = document.createElement("span");
    this.styleTTSButton(button);
    const icons = this.getTTSIcons(size);
    button.innerHTML = icons.play;
    let isSpeaking = false;
    button.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      if (isSpeaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        button.innerHTML = icons.play;
        return;
      }
      const text = (element.textContent ?? "").trim().normalize();
      const languageCode = element.getAttribute("lang") || "en";
      const utterance = this.createSpeechUtterance(text, languageCode);
      utterance.onend = () => {
        isSpeaking = false;
        button.innerHTML = icons.play;
      };
      speechSynthesis.speak(utterance);
      button.innerHTML = icons.stop;
      isSpeaking = true;
    });
    button.setAttribute("data-role", "speak-btn");
    return button;
  }
  styleTTSButton(button) {
    Object.assign(button.style, {
      padding: "0px",
      margin: "0px",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      verticalAlign: "middle",
      marginRight: "8px"
    });
  }
  getTTSIcons(size) {
    return {
      play: `<svg height="${size}" viewBox="0 -960 960 960" width="${size}" fill="rgba(238, 42, 84, 1)"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`,
      stop: `<svg height="${size}" viewBox="0 -960 960 960" width="${size}" fill="#EA3323"><path d="M336-336h288v-288H336v288ZM480.28-96Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z"/></svg>`
    };
  }
  createSpeechUtterance(text, languageCode) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase() === languageCode.toLowerCase()) || voices.find((v) => v.lang.toLowerCase().startsWith(languageCode.toLowerCase()));
    if (voice) {
      utterance.voice = voice;
    }
    return utterance;
  }
  openDialog(options) {
    this.sendToParent("openDialog", options);
  }
  closeDialog() {
    this.sendToParent("closeDialog");
  }
  async requestDataFromParent(eventName) {
    if (!this.isInitialized) {
      throw new Error("SDK not initialized. Wait for onReady() event before requesting data.");
    }
    return new Promise((resolve, reject) => {
      const handler = ({ data }) => {
        if (data.event === eventName) {
          window.removeEventListener("message", handler);
          resolve(data.data);
        } else if (data.event === "error" && data.requestId === eventName) {
          window.removeEventListener("message", handler);
          reject(new Error(data.message));
        }
      };
      window.addEventListener("message", handler);
      const requestId = `${eventName}_${Date.now()}`;
      window.parent.postMessage({ event: eventName, requestId }, "*");
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error(`Timeout: No response for ${eventName} after 10 seconds`));
      }, 1e4);
    });
  }
  onReady(callback) {
    this.eventHandlers.ready.push((data) => {
      const expectedScore = callback(data);
      if (expectedScore > 0 && this.isPublished) {
        this.quizManager.updateTotalScore(expectedScore);
      }
    });
  }
  onError(callback) {
    this.eventHandlers.error.push(callback);
  }
  notifyReady() {
    this.eventHandlers.ready.forEach((callback) => callback(this.contentData));
  }
  triggerError(error) {
    this.eventHandlers.error.forEach((callback) => callback(error));
    console.error("[NotebookSDK] Error:", error);
  }
}
var createNotebookSDK = (config) => {
  return new NotebookSDK(config);
};
// src/utils/external-utils.ts
function createFileUploadArea(container, {
  onDrag,
  onDrop,
  onPaste,
  success,
  maxSize,
  acceptedFiles,
  expectedFileOutput
}) {
  const input = document.createElement("input");
  input.type = "file";
  input.style.display = "none";
  container.appendChild(input);
  container.addEventListener("click", () => {
    input.value = "";
    input.click();
  });
  input.addEventListener("change", () => {
    const files = Array.from(input.files || []);
    if (!files.length)
      return;
    handleFiles(files);
  });
  function preventDefaults(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => container.addEventListener(eventName, preventDefaults));
  container.addEventListener("dragover", (ev) => onDrag?.(ev));
  container.addEventListener("drop", (ev) => {
    onDrop?.(ev);
    const dt = ev.dataTransfer;
    const files = dt?.files ? Array.from(dt.files) : [];
    if (!files.length)
      return;
    handleFiles(files);
  });
  container.addEventListener("paste", (ev) => {
    onPaste?.(ev);
    const items = ev.clipboardData?.items;
    if (!items)
      return;
    const files = [];
    for (let i = 0;i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    if (files.length > 0) {
      handleFiles(files);
    }
  });
  function handleFiles(files) {
    files.forEach((file) => {
      if (typeof maxSize === "number" && file.size > maxSize) {
        console.warn("File too large:", file.name);
        return;
      }
      if (Array.isArray(acceptedFiles) && acceptedFiles.length > 0) {
        const isAccepted = acceptedFiles.some((accepted) => {
          if (accepted.endsWith("/*")) {
            const type = accepted.split("/")[0];
            return file.type.startsWith(type + "/");
          }
          return file.type === accepted;
        });
        if (!isAccepted) {
          throw new Error(`File type not allowed: ${file.type}`);
        }
      }
      if (!success)
        return;
      const outputMode = expectedFileOutput || success(file);
      if (outputMode === "string") {
        const reader = new FileReader;
        reader.onload = () => {
          success(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        success(file);
      }
    });
  }
}
function createSpeechUtterance(text, languageCode) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase() === languageCode.toLowerCase()) || voices.find((v) => v.lang.toLowerCase().startsWith(languageCode.toLowerCase()));
  if (voice) {
    utterance.voice = voice;
  }
  let isPlaying = false;
  utterance.onstart = () => {
    isPlaying = true;
  };
  utterance.onend = () => {
    isPlaying = false;
  };
  utterance.onerror = () => {
    isPlaying = false;
  };
  return {
    play() {
      if (!isPlaying) {
        speechSynthesis.speak(utterance);
      }
    },
    stop() {
      speechSynthesis.cancel();
      isPlaying = false;
    },
    isPlaying() {
      return isPlaying;
    },
    setText(newText) {
      utterance.text = newText;
    },
    setRate(rate) {
      utterance.rate = rate;
    },
    setPitch(pitch) {
      utterance.pitch = pitch;
    },
    getUtterance() {
      return utterance;
    },
    setVolume(volume) {
      utterance.volume = volume;
    }
  };
}
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  };
  return text.replace(/[&<>"'`]/g, (char) => map[char] ?? char);
}
export {
  escapeHtml,
  createSpeechUtterance,
  createNotebookSDK,
  createFileUploadArea
};
