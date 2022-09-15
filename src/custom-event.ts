import { Event } from './event.js';
import { warnNotImplemented } from '@gjsify/utils';

export class CustomEvent<T = any> extends Event implements globalThis.CustomEvent<T> {
    detail: T;

    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
        super(type, eventInitDict);
        this.detail = eventInitDict?.detail as any;
    }

    /** @deprecated */
    // @ts-ignore
    initCustomEvent(type: string, bubbles?: boolean | undefined, cancelable?: boolean | undefined, detail?: T): void {
        // @ts-ignore
        this.type = type;
        // @ts-ignore
        this.bubbles = bubbles;
        // @ts-ignore
        this.cancelable = cancelable;
        if(detail) this.detail = detail;
        warnNotImplemented('CustomEvent.initCustomEvent');
    }

    // eslint-disable-next-line class-methods-use-this
    public get isTrusted(): boolean {
        return true
    }
}