import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader, AlertTriangle, Monitor, Tablet, Smartphone, Shield } from 'lucide-react';
import JSZip from 'jszip';
import { getTemplateZip } from '../utils/templateStorage';
import '../styles/template-preview.css';

const VIEWPORTS = [
  { id: 'desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', icon: Tablet, width: '768px' },
  { id: 'mobile', icon: Smartphone, width: '375px' },
];

// CSS injected into every iframe to kill selection, dragging, copying
const PROTECTION_CSS = `
  * {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
  }
  img, svg, video, canvas {
    -webkit-user-drag: none !important;
    user-drag: none !important;
    pointer-events: none !important;
  }
  a { pointer-events: none !important; }
  ::selection { background: transparent !important; }
  ::-moz-selection { background: transparent !important; }
`;

// JS injected into every iframe to block right-click, keyboard shortcuts, dev tools
const PROTECTION_JS = `
  (function(){
    // Block right-click
    document.addEventListener('contextmenu', function(e){ e.preventDefault(); return false; }, true);

    // Block keyboard shortcuts: Ctrl+S, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12, Ctrl+A, Ctrl+C, Ctrl+P
    document.addEventListener('keydown', function(e){
      if (e.key === 'F12') { e.preventDefault(); return false; }
      if (e.ctrlKey || e.metaKey) {
        var blocked = ['s','u','p','a','c','j'];
        if (blocked.indexOf(e.key.toLowerCase()) !== -1) { e.preventDefault(); return false; }
        if (e.shiftKey && ['i','j','c'].indexOf(e.key.toLowerCase()) !== -1) { e.preventDefault(); return false; }
      }
    }, true);

    // Block drag
    document.addEventListener('dragstart', function(e){ e.preventDefault(); return false; }, true);
    document.addEventListener('drop', function(e){ e.preventDefault(); return false; }, true);

    // Block copy/cut
    document.addEventListener('copy', function(e){ e.preventDefault(); return false; }, true);
    document.addEventListener('cut', function(e){ e.preventDefault(); return false; }, true);

    // Block print
    window.addEventListener('beforeprint', function(e){ e.preventDefault(); }, true);

    // Inject visible watermark into DOM
    var wm = document.createElement('div');
    wm.id = '__tsd_watermark';
    wm.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;opacity:0.045;background-image:url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'500\\' height=\\'250\\'%3E%3Ctext x=\\'50%25\\' y=\\'35%25\\' font-family=\\'Arial,sans-serif\\' font-size=\\'20\\' font-weight=\\'800\\' fill=\\'%23000\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' transform=\\'rotate(-25 250 125)\\'%3ETHREE SEAS DIGITAL%3C/text%3E%3Ctext x=\\'50%25\\' y=\\'65%25\\' font-family=\\'Arial,sans-serif\\' font-size=\\'14\\' font-weight=\\'600\\' fill=\\'%23000\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\' transform=\\'rotate(-25 250 125)\\'%3E%C2%A9 PREVIEW ONLY %E2%80%94 NOT FOR REDISTRIBUTION%3C/text%3E%3C/svg%3E");background-repeat:repeat;';
    document.body.appendChild(wm);

    // Prevent removing the watermark via DevTools — re-inject if removed
    var observer = new MutationObserver(function(){
      if (!document.getElementById('__tsd_watermark')) {
        document.body.appendChild(wm.cloneNode(true));
      }
    });
    observer.observe(document.body, { childList: true });
  })();
`;

export default function TemplatePreview({ templateId, templateName, templatePath, onClose }) {
  const [iframeSrc, setIframeSrc] = useState(null);
  const [isBlobUrl, setIsBlobUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewport, setViewport] = useState('desktop');
  const iframeRef = useRef(null);

  const loadPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try loading ZIP from IndexedDB first
      const blob = await getTemplateZip(templateId).catch(() => null);

      if (blob) {
        // ZIP-based preview: extract and inline everything
        const zip = await JSZip.loadAsync(blob);

        let htmlFile = zip.file('index.html');
        if (!htmlFile) {
          const entries = Object.keys(zip.files);
          const nested = entries.find((e) => e.endsWith('/index.html') && e.split('/').length === 2);
          if (nested) htmlFile = zip.file(nested);
        }

        if (!htmlFile) {
          setError('No index.html found in the ZIP.');
          setLoading(false);
          return;
        }

        let html = await htmlFile.async('string');

        // Inline CSS files referenced in the HTML
        const cssRefs = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi)];
        for (const match of cssRefs) {
          const cssPath = match[1].replace(/^\.\//, '');
          const cssFile = zip.file(cssPath);
          if (cssFile) {
            const cssContent = await cssFile.async('string');
            html = html.replace(match[0], `<style>${cssContent}</style>`);
          }
        }

        // Inline images as base64 data URIs
        const imgRefs = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:png|jpg|jpeg|gif|svg|webp|ico))["']/gi)];
        for (const match of imgRefs) {
          const imgPath = match[1].replace(/^\.\//, '');
          const imgFile = zip.file(imgPath);
          if (imgFile) {
            const ext = imgPath.split('.').pop().toLowerCase();
            const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const base64 = await imgFile.async('base64');
            html = html.replaceAll(match[1], `data:${mime};base64,${base64}`);
          }
        }

        // Strip all existing <script> tags
        html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<script[^>]*\/>/gi, '');

        // Inject protection CSS + JS before </head> (or at start)
        const protectionBlock = `<style>${PROTECTION_CSS}</style><script>${PROTECTION_JS}<\/script>`;
        if (html.includes('</head>')) {
          html = html.replace('</head>', protectionBlock + '</head>');
        } else if (html.includes('<body')) {
          html = html.replace('<body', protectionBlock + '<body');
        } else {
          html = protectionBlock + html;
        }

        const previewBlob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(previewBlob);
        setIframeSrc(url);
        setIsBlobUrl(true);
      } else if (templatePath) {
        // Built-in template: load the route path directly
        setIframeSrc(window.location.origin + templatePath);
        setIsBlobUrl(false);
      } else {
        setError('No preview available for this template.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError('Failed to load preview: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [templateId, templatePath]);

  useEffect(() => {
    loadPreview();
    return () => {
      if (iframeSrc && isBlobUrl) URL.revokeObjectURL(iframeSrc);
    };
  }, [loadPreview]); // eslint-disable-line react-hooks/exhaustive-deps

  // For same-origin iframes (built-in templates), inject protections after load
  const handleIframeLoad = useCallback(() => {
    if (isBlobUrl) return; // blob previews already have injected protections
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      // Inject protection CSS
      const style = doc.createElement('style');
      style.textContent = PROTECTION_CSS;
      doc.head.appendChild(style);

      // Inject protection JS
      const script = doc.createElement('script');
      script.textContent = PROTECTION_JS;
      doc.body.appendChild(script);
    } catch {
      // Cross-origin — can't inject, outer protections still apply
    }
  }, [isBlobUrl]);

  // Block keyboard shortcuts on the parent while preview is open
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      // Block DevTools, save, print, view-source, select-all, copy
      if (e.key === 'F12') { e.preventDefault(); return; }
      if (e.ctrlKey || e.metaKey) {
        const blocked = ['s', 'u', 'p', 'a', 'c', 'j'];
        if (blocked.includes(e.key.toLowerCase())) { e.preventDefault(); return; }
        if (e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) { e.preventDefault(); return; }
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [onClose]);

  // Block print while preview is open
  useEffect(() => {
    const blockPrint = (e) => e.preventDefault();
    window.addEventListener('beforeprint', blockPrint);
    return () => window.removeEventListener('beforeprint', blockPrint);
  }, []);

  const activeViewport = VIEWPORTS.find((v) => v.id === viewport);

  return (
    <div
      className="tp-overlay"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="tp-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tp-header">
          <div className="tp-header-left">
            <Shield size={14} className="tp-shield-icon" />
            <span className="tp-title">{templateName || 'Template Preview'}</span>
            <span className="tp-badge">Protected Preview</span>
          </div>
          <div className="tp-header-center">
            {VIEWPORTS.map((v) => (
              <button
                key={v.id}
                className={`tp-viewport-btn ${viewport === v.id ? 'tp-viewport-btn--active' : ''}`}
                onClick={() => setViewport(v.id)}
                title={v.id}
              >
                <v.icon size={16} />
              </button>
            ))}
          </div>
          <button className="tp-close" onClick={onClose} aria-label="Close preview">
            <X size={20} />
          </button>
        </div>

        {/* Preview Area */}
        <div
          className="tp-iframe-wrap"
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        >
          {loading && (
            <div className="tp-loading">
              <Loader size={32} className="tp-spinner" />
              <span>Loading preview...</span>
            </div>
          )}

          {error && (
            <div className="tp-error">
              <AlertTriangle size={32} />
              <span>{error}</span>
            </div>
          )}

          {iframeSrc && !loading && (
            <>
              <div className="tp-iframe-sizer" style={{ maxWidth: activeViewport.width }}>
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  sandbox={isBlobUrl
                    ? 'allow-same-origin allow-scripts'
                    : 'allow-same-origin allow-scripts allow-popups'
                  }
                  referrerPolicy="no-referrer"
                  title="Template Preview"
                  onLoad={handleIframeLoad}
                />
              </div>
              {/* Outer watermark overlay — covers entire preview */}
              <div className="tp-watermark" />
              {/* Corner copyright stamps */}
              <div className="tp-copyright tp-copyright--top">
                <Shield size={10} />
                &copy; {new Date().getFullYear()} Three Seas Digital &mdash; All Rights Reserved
              </div>
              <div className="tp-copyright tp-copyright--bottom">
                Unauthorized reproduction or distribution is prohibited.
                This preview is for evaluation purposes only.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
