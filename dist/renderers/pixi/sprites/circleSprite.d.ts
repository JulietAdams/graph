import * as PIXI from 'pixi.js';
import { PIXIRenderer as Renderer } from '../';
import { Node, Edge } from '../../../';
export declare class CircleSprite<N extends Node, E extends Edge> {
    static radius: number;
    private texture;
    constructor(renderer: Renderer<N, E>);
    create(): PIXI.Sprite;
    delete(): void;
}
