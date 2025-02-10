export interface IPoint extends IPointData {
    clone(): IPoint;
    equals(other: IPoint): boolean;
    set(x: number, y: number): void;
    updateFunc?: () => void;
}

export interface IPointData {
    x: number;
    y: number;
}

export enum EnumCommandIndexType {
    MOVE_TO = 0,
    LINE_TO = 1,
    STROKE = 2,
    FILL = 3,
    CIRCLE = 4,
    CLOSE_PATH = 5,
}

export interface ISize {
    width: number;
    height: number;
}

export type StrokeOptions = {
    color?: number | number[];
    width?: number;
    alpha?: number;
};

export type FillOptions = {
    color?: number | number[];
    alpha?: number;
};

export type ShadowOptions = {
    color?: number | number[];
    blur?: number;
    offset?: [number, number];
};

export type SceneOptions = {
    canvasSize: ISize;
    designSize: ISize;
    sideWidth: number;
};

export type TransformOptions = {
    position?: IPointData;
    scale?: IPointData;
    rotation?: number;
    anchor?: IPointData;
};
