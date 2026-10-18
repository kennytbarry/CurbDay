import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

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
          backgroundColor: "#FFF8E7",
          borderRadius: "7px",
          border: "2px solid #2BA8A2",
          position: "relative",
        }}
      >
        {/* Shadow C in Accent Gold */}
        <span
          style={{
            position: "absolute",
            fontSize: "24px",
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#FFD23F",
            left: "8.5px",
            top: "2.5px",
            lineHeight: 1,
          }}
        >
          C
        </span>
        {/* Main C in Primary Dark Teal */}
        <span
          style={{
            position: "absolute",
            fontSize: "24px",
            fontWeight: 900,
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1E8C86",
            left: "6.5px",
            top: "0.5px",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
