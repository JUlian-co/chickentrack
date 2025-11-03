module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // 1. Das Expo Preset, ABER hier konfigurieren wir NativeWind mit:
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // 2. NUR das Reanimated Plugin (Muss der letzte Eintrag sein!)
      "react-native-reanimated/plugin",
    ],
  };
};
