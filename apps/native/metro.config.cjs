// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require("nativewind/metro");
// const path = require("path");

// // 1. Xác định thư mục gốc của dự án và của Monorepo (Workspace)
// const projectRoot = __dirname;
// const workspaceRoot = path.resolve(projectRoot, "../..");

// // 2. Lấy config mặc định của Expo
// const config = getDefaultConfig(projectRoot);

// // 3. Cấu hình cho Monorepo (Để Metro nhìn thấy code ở thư mục gốc)
// config.watchFolders = [workspaceRoot];

// config.resolver.nodeModulesPaths = [
//   path.resolve(projectRoot, "node_modules"),
//   path.resolve(workspaceRoot, "node_modules"),
// ];

// // Bắt buộc Metro chỉ tìm trong nodeModulesPaths đã định nghĩa (Tránh lỗi phantom dependencies)
// config.resolver.disableHierarchicalLookup = true;

// // 4. (Tùy chọn) Nếu bạn muốn chắc chắn Metro hiểu alias (thường Babel đã lo việc này)
// // Bạn có thể dùng extraNodeModules để map nếu cần thiết, nhưng với setup chuẩn thì không cần.
// // config.resolver.extraNodeModules = {
// //   ...config.resolver.extraNodeModules,
// //   "@": path.resolve(__dirname, "src"),
// // };

// // 5. Bọc config với NativeWind và export
// module.exports = withNativeWind(config, {
//   input: "./src/config/global.css", 
//   inlineRem: 16, // (Tùy chọn) Config base rem size
// });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. Lấy config mặc định của Expo
const config = getDefaultConfig(__dirname);

// 2. Cấu hình NativeWind (Tailwind CSS)
// Lưu ý: trỏ đúng đường dẫn file global.css của bạn
// Dựa trên code cũ của bạn: import "@/config/global.css" -> file nằm ở config/global.css
module.exports = withNativeWind(config, {
  input: "./src/config/global.css"
});