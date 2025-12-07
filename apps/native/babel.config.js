module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // 1. Cấu hình Expo để hỗ trợ NativeWind
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // 2. NativeWind phải nằm ở đây (trong presets), KHÔNG phải plugins
      "nativewind/babel",
    ],
    plugins: [
      // Giữ lại cấu hình alias của bạn
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      // Plugin này luôn phải nằm ở dòng cuối cùng của mảng plugins
      "react-native-reanimated/plugin",
    ],
  };
};