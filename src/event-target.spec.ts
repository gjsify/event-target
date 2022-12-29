import { describe, it, assert, Spy, spy, beforeEach, afterEach } from '@gjsify/unit';

import { Event, EventTarget } from "./index.js";
import {
    CanceledInPassiveListener,
    EventListenerWasDuplicated,
    InvalidEventListener,
    NonCancelableEventWasCanceled,
    OptionWasIgnored,
} from "./warnings.js";
import { AbortSignalStub } from "./test/abort-signal-stub.js";
import { countEventListeners } from "./test/count-event-listeners.js";
import { setupErrorCheck } from "./test/setup-error-check.js";

const NativeDOMException = globalThis.DOMException;
const NativeEventTarget = globalThis.EventTarget;
const NativeEvent = globalThis.Event;
const NativeKeyboardEvent = globalThis.KeyboardEvent;
const NativeMouseEvent = globalThis.MouseEvent;

export const EventTargetTest = async () => {
    await describe("EventTarget.constructor", async () => {

        await it("should not throw", async () => {
            assert(new EventTarget())
        })

        await it("should throw a TypeError if called as a function.", async () => {
            assert.throws(() => {
                // @ts-expect-error
                EventTarget() // eslint-disable-line new-cap
            }, TypeError)
        })
    })

    if(NativeEventTarget) {
        await describe("EventTarget.constructor if native EventTarget class is present", async () => {
            await it("`target instanceof window.EventTarget` should be true", async () => {
                const target = new EventTarget()
                assert(target instanceof NativeEventTarget)
            })
        })
    }

    await describe("EventTarget.addEventListener method", async () => {
        let target: EventTarget
        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
            target = new EventTarget()
        })

        afterEach(async () => {
            afterEachCb();
        })

        await it("should do nothing if callback is nothing.", async () => {
            // @ts-expect-error
            target.addEventListener()
            target.addEventListener("foo")
            target.addEventListener("foo", null)
            target.addEventListener("foo", undefined)

            assert.strictEqual(countEventListeners(target), 0)
            assertWarning(InvalidEventListener, undefined)
            assertWarning(InvalidEventListener, undefined)
            assertWarning(InvalidEventListener, null)
            assertWarning(InvalidEventListener, undefined)
        })

        await it("should throw a TypeError if callback is a primitive.", async () => {
            assert.throws(() => {
                // @ts-expect-error
                target.addEventListener("foo", true)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.addEventListener("foo", 1)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.addEventListener("foo", "function")
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.addEventListener("foo", Symbol("symbol"))
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.addEventListener("foo", 0n)
            }, TypeError)

            assert.strictEqual(countEventListeners(target), 0)
        })

        await it("should add a given event listener.", async () => {
            target.addEventListener("foo", () => {})
            assert.strictEqual(countEventListeners(target), 1)
        })

        await it("should add a given object.", async () => {
            const f = {}
            // @ts-expect-error
            target.addEventListener("foo", f)
            assert.strictEqual(countEventListeners(target), 1)
            assertWarning(InvalidEventListener, f)
        })

        await it("should add multiple given event listeners.", async () => {
            target.addEventListener("foo", () => {})
            target.addEventListener("foo", () => {})
            target.addEventListener("foo", () => {})
            target.addEventListener("bar", () => {})

            assert.strictEqual(countEventListeners(target), 4)
            assert.strictEqual(countEventListeners(target, "foo"), 3)
            assert.strictEqual(countEventListeners(target, "bar"), 1)
        })

        await it("should handle non-string types as string types.", async () => {
            // @ts-expect-error
            target.addEventListener(null, () => {})
            // @ts-expect-error
            target.addEventListener(undefined, () => {})
            // @ts-expect-error
            target.addEventListener(1e3, () => {})

            assert.strictEqual(countEventListeners(target), 3)
            assert.strictEqual(countEventListeners(target, "null"), 1)
            assert.strictEqual(countEventListeners(target, "undefined"), 1)
            assert.strictEqual(countEventListeners(target, "1000"), 1)
        })

        await it("should not add the same listener twice.", async () => {
            const f = () => {}
            target.addEventListener("foo", f)
            target.addEventListener("foo", f)
            target.addEventListener("bar", f)

            assert.strictEqual(countEventListeners(target), 2)
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            assert.strictEqual(countEventListeners(target, "bar"), 1)
            assertWarning(EventListenerWasDuplicated, "bubble", f)
        })

        await it("should add the same listener twice if capture flag is different.", async () => {
            const f = () => {}
            target.addEventListener("foo", f, { capture: true })
            target.addEventListener("foo", f, { capture: false })

            assert.strictEqual(countEventListeners(target), 2)
            assert.strictEqual(countEventListeners(target, "foo"), 2)
        })

        await it("should add the same listener twice if capture flag is different. (boolean option)", async () => {
            const f = () => {}
            target.addEventListener("foo", f, true)
            target.addEventListener("foo", f, false)

            assert.strictEqual(countEventListeners(target), 2)
            assert.strictEqual(countEventListeners(target, "foo"), 2)
        })

        await it("should not add the same listener twice even if passive flag is different.", async () => {
            const f = () => {}
            target.addEventListener("foo", f, { passive: true })
            target.addEventListener("foo", f, { passive: false })

            assert.strictEqual(countEventListeners(target), 1)
            assertWarning(EventListenerWasDuplicated, "bubble", f)
            assertWarning(OptionWasIgnored, "passive")
        })

        await it("should not add the same listener twice even if once flag is different.", async () => {
            const f = () => {}
            target.addEventListener("foo", f, { once: true })
            target.addEventListener("foo", f, { once: false })

            assert.strictEqual(countEventListeners(target), 1)
            assertWarning(EventListenerWasDuplicated, "bubble", f)
            assertWarning(OptionWasIgnored, "once")
        })

        await it("should not add the same listener twice even if signal flag is different.", async () => {
            const f = () => {}
            target.addEventListener("foo", f, { signal: null })
            target.addEventListener("foo", f, { signal: new AbortSignalStub() })

            assert.strictEqual(countEventListeners(target), 1)
            assertWarning(EventListenerWasDuplicated, "bubble", f)
            assertWarning(OptionWasIgnored, "signal")
        })

        await it("should not add the same listener twice even if flags are different.", async () => {
            const f = () => {}
            target.addEventListener("foo", f, {
                passive: true,
                once: true,
                signal: null,
            })
            target.addEventListener("foo", f, {
                passive: false,
                once: false,
                signal: new AbortSignalStub(),
            })

            assert.strictEqual(countEventListeners(target), 1)
            assertWarning(EventListenerWasDuplicated, "bubble", f)
            assertWarning(OptionWasIgnored, "passive")
            assertWarning(OptionWasIgnored, "once")
            assertWarning(OptionWasIgnored, "signal")
        })

        await it("should not add the listener if abort signal is present and the `signal.aborted` is true.", async () => {
            const signal = new AbortSignalStub()
            signal.abort()

            target.addEventListener("foo", () => {}, { signal })
            assert.strictEqual(countEventListeners(target), 0)
        })

        await it("should remove the listener if abort signal was notified.", async () => {
            const signal = new AbortSignalStub()

            target.addEventListener("foo", () => {}, { signal })
            assert.strictEqual(countEventListeners(target), 1)

            signal.abort()
            assert.strictEqual(countEventListeners(target), 0)
        })
    })

    await describe("EventTarget.removeEventListener method", async () => {
        const f = () => {}
        let target: EventTarget

        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
            target = new EventTarget()
            target.addEventListener("foo", f)
            assert.strictEqual(countEventListeners(target), 1)
        })

        afterEach(async () => {
            afterEachCb();
        })

        await it("should do nothing if callback is nothing.", async () => {
            // @ts-expect-error
            target.removeEventListener()
            target.removeEventListener("foo")
            target.removeEventListener("foo", null)
            target.removeEventListener("foo", undefined)

            assert.strictEqual(countEventListeners(target, "foo"), 1)
            assertWarning(InvalidEventListener, undefined)
            assertWarning(InvalidEventListener, undefined)
            assertWarning(InvalidEventListener, null)
            assertWarning(InvalidEventListener, undefined)
        })

        await it("should throw a TypeError if callback is a primitive.", async () => {
            assert.throws(() => {
                // @ts-expect-error
                target.removeEventListener("foo", true)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.removeEventListener("foo", 1)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.removeEventListener("foo", "function")
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.removeEventListener("foo", Symbol("symbol"))
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                target.removeEventListener("foo", 0n)
            }, TypeError)

            assert.strictEqual(countEventListeners(target), 1)
        })

        await it("should remove a given event listener.", async () => {
            target.removeEventListener("foo", f)
            assert.strictEqual(countEventListeners(target), 0)
        })

        await it("should not remove any listeners if the event type is different.", async () => {
            target.removeEventListener("bar", f)
            assert.strictEqual(countEventListeners(target), 1)
        })

        await it("should not remove any listeners if the callback function is different.", async () => {
            target.removeEventListener("foo", async () => {})
            assert.strictEqual(countEventListeners(target), 1)
        })

        await it("should not remove any listeners if the capture flag is different.", async () => {
            target.removeEventListener("foo", f, true)
            target.removeEventListener("foo", f, { capture: true })
            assert.strictEqual(countEventListeners(target), 1)
        })

        await it("should handle capture flag correctly.", async () => {
            target.addEventListener("foo", f, { capture: true })
            assert.strictEqual(countEventListeners(target), 2)

            target.removeEventListener("foo", f, { capture: true })
            target.removeEventListener("foo", f, { capture: true })
            assert.strictEqual(countEventListeners(target), 1)
        })

        await it("should remove a given event listener even if the passive flag is present.", async () => {
            // @ts-expect-error
            target.removeEventListener("foo", f, { passive: true })
            assert.strictEqual(countEventListeners(target), 0)
        })

        await it("should remove a given event listener even if the once flag is present.", async () => {
            // @ts-expect-error
            target.removeEventListener("foo", f, { once: true })
            assert.strictEqual(countEventListeners(target), 0)
        })

        await it("should remove a given event listener even if the signal is present.", async () => {
            // @ts-expect-error
            target.removeEventListener("foo", f, {
                signal: new AbortSignalStub(),
            })
            assert.strictEqual(countEventListeners(target), 0)
        })

        await it("should handle non-string types as string types.", async () => {
            target.addEventListener("null", f)
            target.addEventListener("undefined", f)
            target.addEventListener("1000", f)
            assert.strictEqual(countEventListeners(target, "null"), 1)
            assert.strictEqual(countEventListeners(target, "undefined"), 1)
            assert.strictEqual(countEventListeners(target, "1000"), 1)

            // @ts-expect-error
            target.removeEventListener(null, f)
            assert.strictEqual(countEventListeners(target, "null"), 0)
            // @ts-expect-error
            target.removeEventListener(undefined, f)
            assert.strictEqual(countEventListeners(target, "undefined"), 0)
            // @ts-expect-error
            target.removeEventListener(1e3, f)
            assert.strictEqual(countEventListeners(target, "1000"), 0)
        })
    })

    await describe("EventTarget.dispatchEvent method", async () => {
        let target: EventTarget<{ foo: Event }>
        const { assertError, assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
            target = new EventTarget()
        })

        afterEach(async () => {
            afterEachCb();
        })

        await it("should throw a TypeError if the argument was not present", async () => {
            assert.throws(() => {
                // @ts-expect-error
                target.dispatchEvent()
            }, TypeError)
        })

        await it("should not throw even if listeners don't exist", async () => {
            const retv = target.dispatchEvent(new Event("foo"))
            assert.strictEqual(retv, true)
        })

        await it("should not throw even if empty object had been added", async () => {
            const f = {}
            // @ts-expect-error
            target.addEventListener("foo", f)
            const retv = target.dispatchEvent(new Event("foo"))
            assert.strictEqual(retv, true)
            assertWarning(InvalidEventListener, f)
        })

        await it("should call obj.handleEvent method even if added later", async () => {
            const event = new Event("foo")
            const f: { handleEvent?: Spy<(event: Event) => void> } = {}
            // @ts-expect-error
            target.addEventListener("foo", f)
            f.handleEvent = spy()
            const retv = target.dispatchEvent(event)

            assert.strictEqual(
                f.handleEvent.calls.length,
                1,
                "handleEvent should be called",
            )
            assert.strictEqual(f.handleEvent.calls[0].this, f)
            assert.strictEqual(f.handleEvent.calls[0].arguments[0], event)
            assert.strictEqual(retv, true)
            assertWarning(InvalidEventListener, f)
        })

        await it("should call a registered listener.", async () => {
            const f1 = spy((_event: Event) => {})
            const f2 = spy((_event: Event) => {})
            target.addEventListener("foo", f1)
            target.addEventListener("bar", f2)

            const event = new Event("foo")
            const retv = target.dispatchEvent(event)

            assert.strictEqual(f1.calls.length, 1, "foo should be called once")
            assert.strictEqual(
                f1.calls[0].arguments.length,
                1,
                "the argument of callback should be one",
            )
            assert.strictEqual(
                f1.calls[0].arguments[0],
                event,
                "the argument of callback should be the given Event object",
            )
            assert.strictEqual(f2.calls.length, 0, "bar should not be called")
            assert.strictEqual(retv, true)
        })

        await it("should not call subsequent listeners if a listener called `event.stopImmediatePropagation()`.", async () => {
            const f1 = spy((_event: Event) => {})
            const f2 = spy((event: Event) => {
                event.stopImmediatePropagation()
            })
            const f3 = spy((_event: Event) => {})
            const f4 = spy((_event: Event) => {})
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)
            target.addEventListener("foo", f4)

            const retv = target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called")
            assert.strictEqual(f3.calls.length, 0, "f3 should not be called")
            assert.strictEqual(f4.calls.length, 0, "f4 should not be called")
            assert.strictEqual(retv, true)
        })

        await it("should return true even if a listener called 'event.preventDefault()' if the event is not cancelable.", async () => {
            target.addEventListener("foo", event => {
                event.preventDefault()
            })
            const retv = target.dispatchEvent(new Event("foo"))

            assert.strictEqual(retv, true)
            assertWarning(NonCancelableEventWasCanceled)
        })

        await it("should return false if a listener called 'event.preventDefault()' and the event is cancelable.", async () => {
            target.addEventListener("foo", event => {
                event.preventDefault()
            })
            const retv = target.dispatchEvent(
                new Event("foo", { cancelable: true }),
            )

            assert.strictEqual(retv, false)
        })

        await it("should return true even if a listener called 'event.preventDefault()' if passive option is present.", async () => {
            target.addEventListener(
                "foo",
                event => {
                    event.preventDefault()
                },
                { passive: true },
            )
            const retv = target.dispatchEvent(
                new Event("foo", { cancelable: true }),
            )

            assert.strictEqual(retv, true)
            assertWarning(CanceledInPassiveListener)
        })

        await it("should return true even if a listener called 'event.returnValue = false' if the event is not cancelable.", async () => {
            target.addEventListener("foo", event => {
                event.returnValue = false
            })
            const retv = target.dispatchEvent(new Event("foo"))

            assert.strictEqual(retv, true)
            assertWarning(NonCancelableEventWasCanceled)
        })

        await it("should return false if a listener called 'event.returnValue = false' and the event is cancelable.", async () => {
            target.addEventListener("foo", event => {
                event.returnValue = false
            })
            const retv = target.dispatchEvent(
                new Event("foo", { cancelable: true }),
            )

            assert.strictEqual(retv, false)
        })

        await it("should return true even if a listener called 'event.returnValue = false' if passive option is present.", async () => {
            target.addEventListener(
                "foo",
                event => {
                    event.returnValue = false
                },
                { passive: true },
            )
            const retv = target.dispatchEvent(
                new Event("foo", { cancelable: true }),
            )

            assert.strictEqual(retv, true)
            assertWarning(CanceledInPassiveListener)
        })

        await it("should remove a listener if once option is present.", async () => {
            const f1 = spy()
            const f2 = spy()
            const f3 = spy()
            target.addEventListener("foo", f1, { once: true })
            target.addEventListener("foo", f2, { once: true })
            target.addEventListener("foo", f3, { once: true })

            const retv = target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called once")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called once")
            assert.strictEqual(f3.calls.length, 1, "f3 should be called once")
            assert.strictEqual(countEventListeners(target), 0)
            assert.strictEqual(retv, true)
        })

        await it("should handle removing in event listeners correctly. Remove 0 at 0.", async () => {
            const f1 = spy(() => {
                target.removeEventListener("foo", f1)
            })
            const f2 = spy()
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called once")
            assert.strictEqual(f2.calls.length, 2, "f2 should be called twice")
            assert.strictEqual(f3.calls.length, 2, "f3 should be called twice")
        })

        await it("should handle removing in event listeners correctly. Remove 1 at 0.", async () => {
            const f1 = spy(() => {
                target.removeEventListener("foo", f2)
            })
            const f2 = spy()
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 0, "f2 should not be called")
            assert.strictEqual(f3.calls.length, 2, "f3 should be called twice")
        })

        await it("should handle removing in event listeners correctly. Remove 0 at 1.", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.removeEventListener("foo", f1)
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called once")
            assert.strictEqual(f2.calls.length, 2, "f2 should be called twice")
            assert.strictEqual(f3.calls.length, 2, "f3 should be called twice")
        })

        await it("should handle removing in event listeners correctly. Remove 1 at 1.", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.removeEventListener("foo", f2)
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called once")
            assert.strictEqual(f3.calls.length, 2, "f3 should be called twice")
        })

        await it("should handle removing in event listeners correctly. Remove 2 at 1.", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.removeEventListener("foo", f3)
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 2, "f2 should be called twice")
            assert.strictEqual(f3.calls.length, 0, "f3 should be not called")
        })

        await it("should handle removing in event listeners correctly. Remove 2 at 2.", async () => {
            const f1 = spy()
            const f2 = spy()
            const f3 = spy(() => {
                target.removeEventListener("foo", f3)
            })
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 2, "f2 should be called twice")
            assert.strictEqual(f3.calls.length, 1, "f3 should be called once")
        })

        await it("should handle removing in event listeners correctly along with once flag.", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.removeEventListener("foo", f2)
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2, { once: true })
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called once")
            assert.strictEqual(f3.calls.length, 2, "f3 should be called twice")
        })

        await it("should handle removing in event listeners correctly along with once flag. (2)", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.removeEventListener("foo", f3)
            })
            const f3 = spy()
            const f4 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2, { once: true })
            target.addEventListener("foo", f3)
            target.addEventListener("foo", f4)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called once")
            assert.strictEqual(f3.calls.length, 0, "f3 should not be called")
            assert.strictEqual(f4.calls.length, 2, "f4 should be called twice")
        })

        await it("should handle removing once and remove", async () => {
            const f1 = spy(() => {
                target.removeEventListener("foo", f1)
            })
            target.addEventListener("foo", f1, { once: true })

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called once")
        })

        await it("should handle removing once and signal", async () => {
            const signal = new AbortSignalStub()
            const f1 = spy(() => {
                signal.abort()
            })
            target.addEventListener("foo", f1, { once: true, signal })

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called once")
        })

        await it("should handle once in nested dispatches", async () => {
            const f1 = spy(() => {
                target.dispatchEvent(new Event("foo"))
                assert.strictEqual(
                    f2.calls.length,
                    1,
                    "f2 should be called only once",
                )
            })
            const f2 = spy()
            target.addEventListener("foo", f1, { once: true })
            target.addEventListener("foo", f2, { once: true })

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(
                f1.calls.length,
                1,
                "f1 should be called only once",
            )
            assert.strictEqual(
                f2.calls.length,
                1,
                "f2 should be called only once",
            )
        })

        await it("should not call the listeners that were added after the 'dispatchEvent' method call.", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.addEventListener("foo", f3)
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 2, "f2 should be called twice")
            assert.strictEqual(f3.calls.length, 1, "f3 should be called once")

            // happens at the second dispatch.
            assertWarning(EventListenerWasDuplicated, "bubble", f3)
        })

        await it("should not call the listeners that were added after the 'dispatchEvent' method call. (the last listener is removed at first dispatch)", async () => {
            const f1 = spy()
            const f2 = spy(() => {
                target.addEventListener("foo", f3)
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2, { once: true })

            target.dispatchEvent(new Event("foo"))
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 2, "f1 should be called twice")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called once")
            assert.strictEqual(f3.calls.length, 1, "f3 should be called once")
        })

        await it("should catch exceptions that are thrown from listeners and call the error handler.", async () => {
            const error = new Error("test")
            const f1 = spy()
            const f2 = spy(() => {
                throw error
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called")
            assert.strictEqual(f3.calls.length, 1, "f3 should be called")
            
            assertError(error)
        })

        await it("should catch exceptions that are thrown from listeners and call the error handler, even if the exception was not an Error object.", async () => {
            const error = "error"
            const f1 = spy()
            const f2 = spy(() => {
                throw error
            })
            const f3 = spy()
            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3)

            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(f1.calls.length, 1, "f1 should be called")
            assert.strictEqual(f2.calls.length, 1, "f2 should be called")
            assert.strictEqual(f3.calls.length, 1, "f3 should be called")
            assertError(error)
        })

        await it("should throw a InvalidStateError if the given event is being used", async () => {
            const event = new Event("foo")
            const f = spy(() => {
                target.dispatchEvent(event)
            })
            target.addEventListener("foo", f, { once: true })
            target.dispatchEvent(event)

            assert.strictEqual(f.calls.length, 1, "f should be called")
            assert.strictEqual(f.calls[0].type, "throw" as const)
            assert.strictEqual(f.calls[0].throw.name, "InvalidStateError")
            assert.strictEqual(f.calls[0].throw.code, 11)
            assertError("This event has been in dispatching.")
        })

        if(NativeDOMException) {
            await it("if the native DOMException is present, the InvalidStateError should be a DOMException instance.", async () => {
                const event = new Event("foo")
                const f = spy(() => {
                    target.dispatchEvent(event)
                })
                target.addEventListener("foo", f, { once: true })
                target.dispatchEvent(event)

                assert.strictEqual(f.calls.length, 1, "f should be called")
                assert(f.calls[0].type === "throw", "f should throw a value")

                if (f.calls[0].type === "throw") {
                    assert(
                        f.calls[0].throw instanceof NativeDOMException,
                        "the thrown value should be a DOMException",
                    )
                } else {
                    assert(false, "f should throw a value")
                }

                assertError("This event has been in dispatching.")
            })
        }

        await it("should not call event listeners if given event was stopped", async () => {
            const event = new Event("foo")
            const f = spy()

            event.stopPropagation()
            target.addEventListener("foo", f)
            target.dispatchEvent(event)

            assert.strictEqual(f.calls.length, 0, "f should not be called")
        })

        if(NativeEvent) {
            await it("if native Event class is present it should call a registered listener even if the argument is a native Event object.", async () => {
                const f1 = spy((_event: Event) => {})
                target.addEventListener("foo", f1)

                const retv = target.dispatchEvent(new NativeEvent("foo") as Event)
                assert.strictEqual(
                    f1.calls.length,
                    1,
                    "foo should be called once",
                )
                assert(
                    f1.calls[0].arguments[0] instanceof Event,
                    "the argument of callback should be an instance of our Event class (wrapper)",
                )
                assert.strictEqual(retv, true)
            })

            await describe("if the argument is a native Event object, the event object in the listener", async () => {
                await it("'type' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo")
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.type, event.type)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'target' property should be the event target that is dispatching.", async () => {
                    const event = new NativeEvent("foo")
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.target, target)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'currentTarget' property should be the event target that is dispatching.", async () => {
                    const event = new NativeEvent("foo")
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.currentTarget, target)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'eventPhase' property should be 2.", async () => {
                    const event = new NativeEvent("foo")
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.eventPhase, 2)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'stopPropagation()' method should change both 'cancelBubble' property.", async () => {
                    const event = new NativeEvent("foo")
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        wrapper.stopPropagation()
                        assert.strictEqual(wrapper.cancelBubble, true)
                        assert.strictEqual(event.cancelBubble, true)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'cancelBubble' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo")
                    event.stopPropagation()
                    let ok = true
                    target.addEventListener("foo", (_) => {
                        ok = false
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                // Node.js's `Event` class is buggy.
                const isStopImmediatePropagationBuggy = (() => {
                    if (!NativeEvent) {
                        return false
                    }
                    const e = new NativeEvent("foo")
                    e.stopImmediatePropagation()
                    return !e.cancelBubble
                })()

                if(!isStopImmediatePropagationBuggy) {
                    await it("'stopImmediatePropagation()' method should change both 'cancelBubble' property.", async () => {
                        const event = new NativeEvent("foo")
                        let ok = false
                        target.addEventListener("foo", wrapper => {
                            ok = true
                            wrapper.stopImmediatePropagation()
                            assert.strictEqual(
                                wrapper.cancelBubble,
                                true,
                                "wrapper's cancelBubble should be true",
                            )
                            assert.strictEqual(
                                event.cancelBubble,
                                true,
                                "original's cancelBubble should be true",
                            )
                        })
                        target.dispatchEvent(event as Event)
                        assert(ok)
                    })
                }

                await it("'bubbles' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo", { bubbles: true })
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.bubbles, event.bubbles)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'cancelable' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo", { cancelable: true })
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.cancelable, event.cancelable)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'returnValue' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo", { cancelable: true })
                    event.preventDefault()
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(
                            wrapper.returnValue,
                            event.returnValue,
                        )
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'preventDefault()' method should change both 'defaultPrevented' property.", async () => {
                    const event = new NativeEvent("foo", { cancelable: true })
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        wrapper.preventDefault()
                        assert.strictEqual(wrapper.defaultPrevented, true)
                        assert.strictEqual(event.defaultPrevented, true)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'defaultPrevented' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo", { cancelable: true })
                    event.preventDefault()
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(
                            wrapper.defaultPrevented,
                            event.defaultPrevented,
                        )
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'composed' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo", { composed: true })
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.composed, event.composed)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'timeStamp' property should be the same value as the original.", async () => {
                    const event = new NativeEvent("foo")
                    await new Promise(resolve => setTimeout(resolve, 100))
                    let ok = false
                    target.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.timeStamp, event.timeStamp)
                    })
                    target.dispatchEvent(event as Event)
                    assert(ok)
                })
            })
        }

        if(NativeKeyboardEvent) {
            await describe("if native KeyboardEvent class is present and if the argument is a native KeyboardEvent object, the event object in the listener", async () => {
                await it("'key' property should be the same value as the original.", async () => {
                    // @ts-ignore
                    const customTarget = new EventTarget<{
                        foo: KeyboardEvent
                    }>()
                    const event = new NativeKeyboardEvent("foo", {
                        key: "Enter",
                    })
                    let ok = false
                    customTarget.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.key, event.key)
                    })
                    customTarget.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'getModifierState' method should return the same value as the original.", async () => {
                    // @ts-ignore
                    const customTarget = new EventTarget<{
                        foo: KeyboardEvent
                    }>()
                    const event = new NativeKeyboardEvent("foo", {
                        shiftKey: true,
                    })
                    let ok = false
                    customTarget.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(
                            wrapper.getModifierState("Shift"),
                            event.getModifierState("Shift"),
                        )
                    })
                    customTarget.dispatchEvent(event as Event)
                    assert(ok)
                })
            })
        }

        if(NativeMouseEvent) {
            await describe("if native MouseEvent class is present and if the argument is a native MouseEvent object, the event object in the listener", async () => {
                await it("'button' property should be the same value as the original.", async () => {
                    // @ts-ignore
                    const customTarget = new EventTarget<{ foo: MouseEvent }>()
                    const event = new NativeMouseEvent("foo", { button: 1 })
                    let ok = false
                    customTarget.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(wrapper.button, event.button)
                    })
                    customTarget.dispatchEvent(event as Event)
                    assert(ok)
                })

                await it("'getModifierState' method should return the same value as the original.", async () => {
                    // @ts-ignore
                    const customTarget = new EventTarget<{ foo: MouseEvent }>()
                    const event = new NativeMouseEvent("foo", {
                        shiftKey: true,
                    })
                    let ok = false
                    customTarget.addEventListener("foo", wrapper => {
                        ok = true
                        assert.strictEqual(
                            wrapper.getModifierState("Shift"),
                            event.getModifierState("Shift"),
                        )
                    })
                    customTarget.dispatchEvent(event as Event)
                    assert(ok)
                })
            })
        }

        await describe("if the argument is a plain object, the event object in the listener", async () => {
            class MyEvent extends Event {
                writable: number
                constructor(writable: number) {
                    super("myevent")
                    this.writable = writable
                }
            }

            // eslint-disable-next-line no-shadow
            let target: EventTarget<{ foo: Event; bar: MyEvent }, "strict">

            beforeEach(async () => {
                target = new EventTarget()
            })

            await it("'type' property should be the same value as the original.", async () => {
                const event = { type: "foo" } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.type, event.type)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'target' property should be the event target that is dispatching.", async () => {
                const event = { type: "foo" } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.target, target)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'currentTarget' property should be the event target that is dispatching.", async () => {
                const event = { type: "foo" } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.currentTarget, target)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'eventPhase' property should be 2.", async () => {
                const event = { type: "foo" } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.eventPhase, 2)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'stopPropagation()' method should call the 'stopPropagation()' method on the original.", async () => {
                const event = { type: "foo", stopPropagation: spy() } as const
                target.addEventListener("foo", wrapper => {
                    wrapper.stopPropagation()
                })
                target.dispatchEvent(event)
                assert.strictEqual(
                    event.stopPropagation.calls.length,
                    1,
                    "stopPropagation method should be called",
                )
            })

            await it("'stopPropagation()' method should not throw any error even if the original didn't have the 'stopPropagation()' method.", async () => {
                const event = { type: "foo" } as const
                let ok = true
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.stopPropagation()
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'cancelBubble' property should be the same value as the original.", async () => {
                const event = { type: "foo", cancelBubble: true } as const
                let ok = true
                target.addEventListener("foo", (_) => {
                    ok = false
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("assigning to 'cancelBubble' property should change both the wrapper and the original.", async () => {
                const event = { type: "foo", cancelBubble: false } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.cancelBubble = true
                    assert.strictEqual(wrapper.cancelBubble, true)
                    assert.strictEqual(event.cancelBubble, true)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("assigning to 'cancelBubble' property should change only the wrapper if the original didn't have the property.", async () => {
                const event = { type: "foo" } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.cancelBubble = true
                    assert.strictEqual(wrapper.cancelBubble, true)
                    // @ts-expect-error
                    assert.strictEqual(event.cancelBubble, undefined)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'stopImmediatePropagation()' method should call the 'stopImmediatePropagation()' method on the original.", async () => {
                const event = {
                    type: "foo",
                    stopImmediatePropagation: spy(),
                } as const
                target.addEventListener("foo", wrapper => {
                    wrapper.stopImmediatePropagation()
                })
                target.dispatchEvent(event)
                assert.strictEqual(
                    event.stopImmediatePropagation.calls.length,
                    1,
                    "stopImmediatePropagation method should be called",
                )
            })

            await it("'stopImmediatePropagation()' method should not throw any error even if the original didn't have the 'stopImmediatePropagation()' method.", async () => {
                const event = { type: "foo" } as const
                let ok = true
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.stopImmediatePropagation()
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'bubbles' property should be the same value as the original.", async () => {
                const event = { type: "foo", bubbles: true } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.bubbles, event.bubbles)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'cancelable' property should be the same value as the original.", async () => {
                const event = { type: "foo", cancelable: true } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.cancelable, event.cancelable)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'returnValue' property should be the same value as the original.", async () => {
                const event = { type: "foo", returnValue: true } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.returnValue, event.returnValue)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("assigning to 'returnValue' property should change both the wrapper and the original.", async () => {
                const event = {
                    type: "foo",
                    cancelable: true,
                    returnValue: true,
                } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.returnValue = false
                    assert.strictEqual(wrapper.returnValue, false)
                    assert.strictEqual(event.returnValue, false)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("assigning to 'returnValue' property should change only the wrapper if the original didn't have the property.", async () => {
                const event = {
                    type: "foo",
                    cancelable: true,
                } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.returnValue = false
                    assert.strictEqual(wrapper.returnValue, false)
                    // @ts-expect-error
                    assert.strictEqual(event.returnValue, undefined)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'preventDefault()' method should call the 'preventDefault()' method on the original.", async () => {
                const event = {
                    type: "foo",
                    cancelable: true,
                    preventDefault: spy(),
                } as const
                target.addEventListener("foo", wrapper => {
                    wrapper.preventDefault()
                })
                target.dispatchEvent(event)
                assert.strictEqual(
                    event.preventDefault.calls.length,
                    1,
                    "preventDefault method should be called",
                )
            })

            await it("'preventDefault()' method should not throw any error even if the original didn't have the 'preventDefault()' method.", async () => {
                const event = { type: "foo", cancelable: true } as const
                let ok = true
                target.addEventListener("foo", wrapper => {
                    ok = true
                    wrapper.preventDefault()
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'composed' property should be the same value as the original.", async () => {
                const event = { type: "foo", composed: true } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.composed, event.composed)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'timeStamp' property should be the same value as the original.", async () => {
                const event = { type: "foo", timeStamp: Date.now() } as const
                await new Promise(resolve => setTimeout(resolve, 100))
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(wrapper.timeStamp, event.timeStamp)
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("'timeStamp' property should be a number even if the original didn't have the 'timeStamp' property.", async () => {
                const event = { type: "foo" } as const
                let ok = false
                target.addEventListener("foo", wrapper => {
                    ok = true
                    assert.strictEqual(typeof wrapper.timeStamp, "number")
                })
                target.dispatchEvent(event)
                assert(ok)
            })

            await it("should redirect instance properties.", async () => {
                const event = { type: "bar", writable: 1 } as const
                target.addEventListener("bar", wrapper => {
                    assert.strictEqual(wrapper.writable, 1)
                    wrapper.writable = 2
                })
                target.dispatchEvent(event)
                assert.strictEqual(event.writable, 2)
            })

            await it("should not throw even if prototype is null.", async () => {
                const event = Object.assign(
                    Object.create(null) as {},
                    { type: "bar", writable: 1 } as const,
                )
                target.addEventListener("bar", wrapper => {
                    assert.strictEqual(wrapper.writable, 1)
                    wrapper.writable = 2
                })
                target.dispatchEvent(event)
                assert.strictEqual(event.writable, 2)
            })
        })
    })

    await describe("EventTarget for-in", async () => {
        await it("should enumerate 3 property names", async () => {
            const target = new EventTarget()
            const actualKeys = []
            const expectedKeys = [
                "addEventListener",
                "removeEventListener",
                "dispatchEvent",
            ]

            // eslint-disable-next-line @mysticatea/prefer-for-of
            for (const key in target) {
                actualKeys.push(key)
            }

            assert.deepStrictEqual(
                actualKeys.sort(undefined),
                expectedKeys.sort(undefined),
            )
        })

        await it("should enumerate no property names in static", async () => {
            const keys = new Set()

            // eslint-disable-next-line @mysticatea/prefer-for-of
            for (const key in EventTarget) {
                keys.add(key)
            }

            assert.deepStrictEqual(keys, new Set())
        })
    })
}