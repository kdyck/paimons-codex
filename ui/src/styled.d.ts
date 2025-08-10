import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      backgroundGradient: string;
      text: {
        primary: string;
        secondary: string;
        placeholder: string;
      };
      glass: {
        background: string;
        backdrop: string;
        hover: string;
      };
      shadow: string;
    };
  }
}