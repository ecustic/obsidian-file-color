import { ReactNode } from "react"
import { StylisPlugin } from "styled-components";
/*
const plugin: (repeatTimes: number) => StylisPlugin = (repeatTimes = 1) => (context, content, selectors) => {
  if (context === 2) {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      if (/^\.[\w\d-_]+$/i.test(selector) && repeatTimes > 1) {
        selectors[i] = selector.repeat(repeatTimes);
      }
    }
  }
};


const stylisPluginExtraClassNamesSpecifity =
  (...rest) =>
  (element) => {
    const specificity = rest.map((value) => value || 1);

    // we only want type "rule" and no keyframes definitions
    if (element.type !== "rule" || element.root?.type === "@keyframes") {
      return;
    }

    if (element.parent === null && specificity && specificity > 1) {
      element.props = element.props.map((prop) => (/^\.[\w\d-_]+$/i.test(prop) 
        ? prop.repeat(specificity) 
        : prop));
    }
  };

Object.defineProperty(specificPlugin, 'name', { value: 'class-name-specificity' });

export type StylesheetProviderProps = {
  children: ReactNode
}

export const StylesheetProvider = ({ children }: StylesheetProviderProps) => {
  <StyleSheetManager stylisPlugins={[
    specificPlugin
  ]}>
    {children}
  </StyleSheetManager>
}*/