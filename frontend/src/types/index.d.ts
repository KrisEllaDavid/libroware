// Global type declarations
/// <reference path="./vite-env.d.ts" />
/// <reference path="./apollo.d.ts" />
/// <reference path="./react-router-dom.d.ts" />
/// <reference path="./jsx.d.ts" />
/// <reference path="./css.d.ts" />

// Add any additional global types here
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.json' {
  const value: any;
  export default value;
} 