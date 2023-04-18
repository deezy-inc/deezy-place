module.exports = {
    // Lint & Prettify TS and JS files
    "**/*.(ts|tsx|js)": (filenames) => [`npm run lint ${filenames.join(" ")}`],
};
