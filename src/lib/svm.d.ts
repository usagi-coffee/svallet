import SVM from "./svm.svelte";

declare module "svallet/svm" {
  export * from "./svm.svelte";
  export type * from "./svm.svelte";
  export default SVM;
}
