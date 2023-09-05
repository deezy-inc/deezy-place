const { useEffectOnce } = require("react-use");

export const useSimpleScrollTop = () => {
  useEffectOnce(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });
};
