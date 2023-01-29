declare module 'stylis-plugin-extra-class-names-specifity' {
  import { StylisPlugin } from "styled-components";
  function plugin(specificity: number): StylisPlugin

  export default plugin
}