export const normalizeRegionId = (regionName?: string | null) => {
  if (!regionName) return "unknown";
  // Ví dụ: "Thành phố Hồ Chí Minh" -> "ho-chi-minh"
  // "Hà Nội" -> "ha-noi"
  return regionName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace("thanh-pho-", "") // Bỏ chữ thành phố cho gọn
    .replace("tinh-", "")
    .replace("-city", "")
    .replace("-province", "");
};