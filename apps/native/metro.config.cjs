const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// 1. Xác định đường dẫn
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// 2. Lấy config mặc định
const config = getDefaultConfig(projectRoot);

// 3. Cấu hình Watch Folders
config.watchFolders = [workspaceRoot];

// 4. Cấu hình Resolver
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Hỗ trợ đuôi file .mjs (quan trọng cho Redux Toolkit mới)
config.resolver.sourceExts.push("mjs");

// 5. Cấu hình Extra Node Modules (QUAN TRỌNG NHẤT)
// Ép Metro trỏ tất cả các thư viện nhạy cảm về `projectRoot` (apps/native)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,

  // React Core
  "react": path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),

  // Redux Ecosystem (FIX LỖI CỦA BẠN TẠI ĐÂY)
  // Sau khi chạy yarn add ở Bước 1, các gói này sẽ nằm ở projectRoot
  "redux": path.resolve(projectRoot, "node_modules/redux"),
  "react-redux": path.resolve(projectRoot, "node_modules/react-redux"),
  "@reduxjs/toolkit": path.resolve(projectRoot, "node_modules/@reduxjs/toolkit"),

  // Các thư viện khác
  "redux-thunk": path.resolve(projectRoot, "node_modules/redux-thunk"), // Nếu đã cài ở bước trước
  "@repo/shared": path.resolve(workspaceRoot, "packages/shared"),
};

// Chặn việc tìm kiếm lung tung
config.resolver.disableHierarchicalLookup = true;

// 6. Kết hợp NativeWind
module.exports = withNativeWind(config, {
  input: "./src/config/global.css",
  inlineRem: 16,
});