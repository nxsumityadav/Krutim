import { ImageResponse } from "next/og";

const KRUTIM_SVG_PATH =
  "M56.82,39.62c.36-.11.65-.36.81-.7,2.67-5.78,6.91-12.31,12.35-18.67C82.98,5.07,97.97-3.41,103.48,1.3c5.39,4.61-.33,20.17-12.77,35.07,12.91.72,22.34,4.78,23.03,10.74.84,7.16-11.19,14.66-27.83,17.93,5.47,8.6,7.01,16.89,3.22,20.13-4.69,4.01-15.76-1.23-24.74-11.71-2.11-2.46-3.92-5-5.38-7.48l-.21-.19c-1.43-1.29-3.63-1.15-4.88.31h0c-1.45,2.45-3.24,4.94-5.31,7.36-8.98,10.48-20.05,15.72-24.74,11.71-3.81-3.26-2.23-11.63,3.31-20.27C10.9,61.56-.79,54.17.04,47.11c.68-5.83,9.7-9.83,22.16-10.69C9.72,21.51,3.99,5.92,9.38,1.3c5.5-4.71,20.5,3.77,33.5,18.95,5.44,6.35,9.67,12.87,12.34,18.65.28.61.96.92,1.59.72h0Z";

// Maskable icon: safe zone is the inner 80% circle
// Content centered with extra padding for maskable area
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
        }}
      >
        <svg viewBox="0 0 113.78 86.52" width="260" height="198">
          <path fillRule="evenodd" fill="#FFFFFF" d={KRUTIM_SVG_PATH} />
        </svg>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
