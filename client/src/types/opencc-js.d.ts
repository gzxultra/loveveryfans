// Type declarations for opencc-js subpath imports
declare module "opencc-js/cn2t" {
  interface ConverterOptions {
    from: string;
    to: string;
  }
  export function Converter(options: ConverterOptions): (text: string) => string;
  export function CustomConverter(dict: string[][]): (text: string) => string;
}

declare module "opencc-js" {
  interface ConverterOptions {
    from: string;
    to: string;
  }
  export function Converter(options: ConverterOptions): (text: string) => string;
  export function CustomConverter(dict: string[][]): (text: string) => string;
}
