import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon раздела КАМТЕХНОСТРОЙ — временный знак из графитового квадрата
 * и бронзовой засечки, в тон текстовому wordmark. Заменится, когда
 * будет загружена настоящая эмблема.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0c0e",
        }}
      >
        <div style={{ display: "flex", width: 16, height: 16, border: "2px solid #f2f1ee" }}>
          <div style={{ display: "flex", width: 5, height: 16, background: "#b07a3c" }} />
        </div>
      </div>
    ),
    size,
  );
}
