// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sendMessageToClient({
  event,
  data,
}: {
  event: string;
  data: {
    cellIndex: number;
    contentPosition: number;
    payload: any;
  };
}) {
  parent.postMessage({ event: event, data }, "*");
}

export const checkCell = (
  cIndex: number,
  cPosition: number,
  cellNumber: number,
  contentPosition: number
) => {
  return cIndex === cellNumber && contentPosition === cPosition;
};

import { toBlob } from "html-to-image";
export async function takeScreenShot(): Promise<ArrayBuffer | null> {
  const body = document.body;
  const blob = await toBlob(body, {
    type: "image/png",
    pixelRatio: 2,
    width: body.offsetWidth,
    backgroundColor: "#121212",
  });
  if (blob) return blob.arrayBuffer();
  return null;
}
