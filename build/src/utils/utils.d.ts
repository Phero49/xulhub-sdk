export declare function sendMessageToClient({ event, data, }: {
    event: string;
    data: {
        cellIndex: number;
        contentPosition: number;
        payload: any;
    };
}): void;
export declare const checkCell: (cIndex: number, cPosition: number, cellNumber: number, contentPosition: number) => boolean;
export declare function takeScreenShot(): Promise<ArrayBuffer | null>;
