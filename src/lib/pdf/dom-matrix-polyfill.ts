/**
 * Minimal DOMMatrix polyfill for Node.js (Server Actions / API routes).
 * pdf-parse (via its PDF engine) expects DOMMatrix; it does not exist in Node.
 * This file must be imported before any pdf-parse usage.
 */
if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: number[] | string) {
      if (init && Array.isArray(init) && init.length >= 6) {
        this.a = this.m11 = init[0];
        this.b = this.m12 = init[1];
        this.c = this.m21 = init[2];
        this.d = this.m22 = init[3];
        this.e = this.m41 = init[4];
        this.f = this.m42 = init[5];
        this.isIdentity = false;
      }
    }

    invertSelf(): DOMMatrixPolyfill {
      return this;
    }

    multiplySelf(_other?: DOMMatrixPolyfill): DOMMatrixPolyfill {
      return this;
    }

    transformPoint(point?: { x: number; y: number }): { x: number; y: number } {
      return point ?? { x: 0, y: 0 };
    }

    translateSelf(_x?: number, _y?: number): DOMMatrixPolyfill {
      return this;
    }

    scaleSelf(_x?: number, _y?: number): DOMMatrixPolyfill {
      return this;
    }
  }
  (globalThis as unknown as { DOMMatrix: typeof DOMMatrixPolyfill }).DOMMatrix =
    DOMMatrixPolyfill;
}
