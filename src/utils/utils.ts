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
