import { EventTarget } from "./event-target.js" // Used as only type, so no circular.
import { assertType } from "./misc.js"
import {
    CanceledInPassiveListener,
    FalsyWasAssignedToCancelBubble,
    InitEventWasCalledWhileDispatching,
    NonCancelableEventWasCanceled,
    TruthyWasAssignedToReturnValue,
} from "./warnings.js"

/**
 * An implementation of `Event` interface, that wraps a given event object.
 * `EventTarget` shim can control the internal state of this `Event` objects.
 * @see https://dom.spec.whatwg.org/#event
 */
export class Event<TEventType extends string = string> implements globalThis.Event {
    /**
     * @see https://dom.spec.whatwg.org/#dom-event-none
     */
    static get NONE(): number {
        return NONE
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-capturing_phase
     */
    static get CAPTURING_PHASE(): number {
        return CAPTURING_PHASE
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-at_target
     */
    static get AT_TARGET(): number {
        return AT_TARGET
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-bubbling_phase
     */
    static get BUBBLING_PHASE(): number {
        return BUBBLING_PHASE
    }

    /**
     * Initialize this event instance.
     * @param type The type of this event.
     * @param eventInitDict Options to initialize.
     * @see https://dom.spec.whatwg.org/#dom-event-event
     */
    constructor(type: TEventType, eventInitDict?: Event.EventInit) {
        Object.defineProperty(this, "isTrusted", {
            value: false,
            enumerable: true,
        })

        const opts = eventInitDict ?? {}
        internalDataMap.set(this, {
            type: String(type),
            bubbles: Boolean(opts.bubbles),
            cancelable: Boolean(opts.cancelable),
            composed: Boolean(opts.composed),
            target: null,
            currentTarget: null,
            stopPropagationFlag: false,
            stopImmediatePropagationFlag: false,
            canceledFlag: false,
            inPassiveListenerFlag: false,
            dispatchFlag: false,
            timeStamp: Date.now(),
        })
    }

    /**
     * The type of this event.
     * @see https://dom.spec.whatwg.org/#dom-event-type
     */
    get type(): TEventType {
        return $(this).type as TEventType
    }

    /**
     * The event target of the current dispatching.
     * @see https://dom.spec.whatwg.org/#dom-event-target
     */
    get target(): EventTarget | null {
        return $(this).target
    }

    /**
     * The event target of the current dispatching.
     * @deprecated Use the `target` property instead.
     * @see https://dom.spec.whatwg.org/#dom-event-srcelement
     */
    get srcElement(): EventTarget | null {
        return $(this).target
    }

    /**
     * The event target of the current dispatching.
     * @see https://dom.spec.whatwg.org/#dom-event-currenttarget
     */
    get currentTarget(): EventTarget | null {
        return $(this).currentTarget
    }

    /**
     * The event target of the current dispatching.
     * This doesn't support node tree.
     * @see https://dom.spec.whatwg.org/#dom-event-composedpath
     */
    composedPath(): EventTarget[] {
        const currentTarget = $(this).currentTarget
        if (currentTarget) {
            return [currentTarget]
        }
        return []
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-none
     */
    get NONE(): number {
        return NONE
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-capturing_phase
     */
    get CAPTURING_PHASE(): number {
        return CAPTURING_PHASE
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-at_target
     */
    get AT_TARGET(): number {
        return AT_TARGET
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-bubbling_phase
     */
    get BUBBLING_PHASE(): number {
        return BUBBLING_PHASE
    }

    /**
     * The current event phase.
     * @see https://dom.spec.whatwg.org/#dom-event-eventphase
     */
    get eventPhase(): number {
        return $(this).dispatchFlag ? 2 : 0
    }

    /**
     * Stop event bubbling.
     * Because this shim doesn't support node tree, this merely changes the `cancelBubble` property value.
     * @see https://dom.spec.whatwg.org/#dom-event-stoppropagation
     */
    stopPropagation(): void {
        $(this).stopPropagationFlag = true
    }

    /**
     * `true` if event bubbling was stopped.
     * @deprecated
     * @see https://dom.spec.whatwg.org/#dom-event-cancelbubble
     */
    get cancelBubble(): boolean {
        return $(this).stopPropagationFlag
    }

    /**
     * Stop event bubbling if `true` is set.
     * @deprecated Use the `stopPropagation()` method instead.
     * @see https://dom.spec.whatwg.org/#dom-event-cancelbubble
     */
    set cancelBubble(value: boolean) {
        if (value) {
            $(this).stopPropagationFlag = true
        } else {
            FalsyWasAssignedToCancelBubble.warn()
        }
    }

    /**
     * Stop event bubbling and subsequent event listener callings.
     * @see https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
     */
    stopImmediatePropagation(): void {
        const data = $(this)
        data.stopPropagationFlag = data.stopImmediatePropagationFlag = true
    }

    /**
     * `true` if this event will bubble.
     * @see https://dom.spec.whatwg.org/#dom-event-bubbles
     */
    get bubbles(): boolean {
        return $(this).bubbles
    }

    /**
     * `true` if this event can be canceled by the `preventDefault()` method.
     * @see https://dom.spec.whatwg.org/#dom-event-cancelable
     */
    get cancelable(): boolean {
        return $(this).cancelable
    }

    /**
     * `true` if the default behavior will act.
     * @deprecated Use the `defaultPrevented` proeprty instead.
     * @see https://dom.spec.whatwg.org/#dom-event-returnvalue
     */
    get returnValue(): boolean {
        return !$(this).canceledFlag
    }

    /**
     * Cancel the default behavior if `false` is set.
     * @deprecated Use the `preventDefault()` method instead.
     * @see https://dom.spec.whatwg.org/#dom-event-returnvalue
     */
    set returnValue(value: boolean) {
        if (!value) {
            setCancelFlag($(this))
        } else {
            TruthyWasAssignedToReturnValue.warn()
        }
    }

    /**
     * Cancel the default behavior.
     * @see https://dom.spec.whatwg.org/#dom-event-preventdefault
     */
    preventDefault(): void {
        setCancelFlag($(this))
    }

    /**
     * `true` if the default behavior was canceled.
     * @see https://dom.spec.whatwg.org/#dom-event-defaultprevented
     */
    get defaultPrevented(): boolean {
        return $(this).canceledFlag
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-composed
     */
    get composed(): boolean {
        return $(this).composed
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-istrusted
     */
    //istanbul ignore next
    get isTrusted(): boolean {
        return false
    }

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-timestamp
     */
    get timeStamp(): number {
        return $(this).timeStamp
    }

    /**
     * @deprecated Don't use this method. The constructor did initialization.
     */
    initEvent(type: string, bubbles = false, cancelable = false) {
        const data = $(this)
        if (data.dispatchFlag) {
            InitEventWasCalledWhileDispatching.warn()
            return
        }

        internalDataMap.set(this, {
            ...data,
            type: String(type),
            bubbles: Boolean(bubbles),
            cancelable: Boolean(cancelable),
            target: null,
            currentTarget: null,
            stopPropagationFlag: false,
            stopImmediatePropagationFlag: false,
            canceledFlag: false,
        })
    }
}

/*eslint-enable class-methods-use-this */

export namespace Event {
    /**
     * The options of the `Event` constructor.
     * @see https://dom.spec.whatwg.org/#dictdef-eventinit
     */
    export interface EventInit {
        bubbles?: boolean
        cancelable?: boolean
        composed?: boolean
    }
}

export { $ as getEventInternalData }

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const NONE = 0
const CAPTURING_PHASE = 1
const AT_TARGET = 2
const BUBBLING_PHASE = 3

/**
 * Private data.
 */
interface EventInternalData {
    /**
     * The value of `type` attribute.
     */
    readonly type: string
    /**
     * The value of `bubbles` attribute.
     */
    readonly bubbles: boolean
    /**
     * The value of `cancelable` attribute.
     */
    readonly cancelable: boolean
    /**
     * The value of `composed` attribute.
     */
    readonly composed: boolean
    /**
     * The value of `timeStamp` attribute.
     */
    readonly timeStamp: number

    /**
     * @see https://dom.spec.whatwg.org/#dom-event-target
     */
    target: EventTarget | null
    /**
     * @see https://dom.spec.whatwg.org/#dom-event-currenttarget
     */
    currentTarget: EventTarget | null
    /**
     * @see https://dom.spec.whatwg.org/#stop-propagation-flag
     */
    stopPropagationFlag: boolean
    /**
     * @see https://dom.spec.whatwg.org/#stop-immediate-propagation-flag
     */
    stopImmediatePropagationFlag: boolean
    /**
     * @see https://dom.spec.whatwg.org/#canceled-flag
     */
    canceledFlag: boolean
    /**
     * @see https://dom.spec.whatwg.org/#in-passive-listener-flag
     */
    inPassiveListenerFlag: boolean
    /**
     * @see https://dom.spec.whatwg.org/#dispatch-flag
     */
    dispatchFlag: boolean
}

/**
 * Private data for event wrappers.
 */
const internalDataMap = new WeakMap<any, EventInternalData>()

/**
 * Get private data.
 * @param event The event object to get private data.
 * @param name The variable name to report.
 * @returns The private data of the event.
 */
function $(event: unknown, name = "this"): EventInternalData {
    const retv = internalDataMap.get(event)
    assertType(
        retv != null,
        "'%s' must be an object that Event constructor created, but got another one: %o",
        name,
        event,
    )
    return retv
}

/**
 * https://dom.spec.whatwg.org/#set-the-canceled-flag
 * @param data private data.
 */
function setCancelFlag(data: EventInternalData) {
    if (data.inPassiveListenerFlag) {
        CanceledInPassiveListener.warn()
        return
    }
    if (!data.cancelable) {
        NonCancelableEventWasCanceled.warn()
        return
    }

    data.canceledFlag = true
}

// Set enumerable
Object.defineProperty(Event, "NONE", { enumerable: true })
Object.defineProperty(Event, "CAPTURING_PHASE", { enumerable: true })
Object.defineProperty(Event, "AT_TARGET", { enumerable: true })
Object.defineProperty(Event, "BUBBLING_PHASE", { enumerable: true })
const keys = Object.getOwnPropertyNames(Event.prototype)
for (let i = 0; i < keys.length; ++i) {
    if (keys[i] === "constructor") {
        continue
    }
    Object.defineProperty(Event.prototype, keys[i], { enumerable: true })
}

// Ensure `event instanceof window.Event` is `true`.
if (typeof globalThis !== "undefined" && typeof globalThis.Event !== "undefined") {
    Object.setPrototypeOf(Event.prototype, globalThis.Event.prototype)
}
