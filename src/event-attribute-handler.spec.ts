import { describe, it, assert, spy, beforeEach, afterEach } from '@gjsify/unit';

import {
    Event,
    EventTarget,
    getEventAttributeValue,
    setEventAttributeValue,
} from "./index.js"
import { InvalidAttributeHandler } from "./warnings.js"
import { countEventListeners } from "./test/count-event-listeners.js"
import { setupErrorCheck } from "./test/setup-error-check.js"

export default async () => {
    await describe("Event attribute handlers 'getEventAttributeValue' function", async () => {
        let target: EventTarget;
        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck();

        beforeEach(async () => {
            beforeEachCb();
            target = new EventTarget();
        })

        afterEach(async () => {
            afterEachCb();
        })

        await it("should throw a TypeError if non-EventTarget object is present", async () => {
            assert.throws(() => {
                // @ts-expect-error
                getEventAttributeValue()
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                getEventAttributeValue(null)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                getEventAttributeValue({})
            }, TypeError)
        })

        await it("should return null if any handlers are not set.", async () => {
            assert.strictEqual(getEventAttributeValue(target, "foo"), null)
        })

        await it("should return null if any handlers are not set, even if listeners are added by 'addEventListener'.", async () => {
            target.addEventListener("foo", () => {})
            assert.strictEqual(getEventAttributeValue(target, "foo"), null)
        })

        await it("should return null if listeners are set to a different event by 'setEventAttributeValue'.", async () => {
            const f = () => {}
            setEventAttributeValue(target, "bar", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), null)
        })

        await it("should return the set function if listeners are set by 'setEventAttributeValue'.", async () => {
            const f = () => {}
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), f)
        })

        await it("should return the set object if listeners are set by 'setEventAttributeValue'.", async () => {
            const f = {}
            // @ts-expect-error
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), f)
            assertWarning(InvalidAttributeHandler, f)
        })

        await it("should return the last set function if listeners are set by 'setEventAttributeValue' multiple times.", async () => {
            const f = () => {}
            setEventAttributeValue(target, "foo", async () => {})
            setEventAttributeValue(target, "foo", null)
            setEventAttributeValue(target, "foo", async () => {})
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(getEventAttributeValue(target, "foo"), f)
        })

        await it("should handle the string representation of the type argument", async () => {
            const f = () => {}
            setEventAttributeValue(target, "1000", f)
            // @ts-expect-error
            assert.strictEqual(getEventAttributeValue(target, 1e3), f)
        })
    })

    await describe("Event attribute handlers 'setEventAttributeValue' function", async () => {
        let target: EventTarget;
        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck();

        beforeEach(async () => {
            beforeEachCb();
            target = new EventTarget();
        });

        afterEach(async () => {
            afterEachCb();
        });

        await it("should throw a TypeError if non-EventTarget object is present", async () => {
            assert.throws(() => {
                // @ts-expect-error
                setEventAttributeValue()
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                setEventAttributeValue(null)
            }, TypeError)
            assert.throws(() => {
                // @ts-expect-error
                setEventAttributeValue({})
            }, TypeError)
        })

        await it("should add an event listener if a function is given.", async () => {
            setEventAttributeValue(target, "foo", async () => {})
            assert.strictEqual(countEventListeners(target), 1)
            assert.strictEqual(countEventListeners(target, "foo"), 1)
        })

        await it("should add an event listener if an object is given.", async () => {
            const f = {}
            // @ts-expect-error
            setEventAttributeValue(target, "foo", f)
            assert.strictEqual(countEventListeners(target), 1)
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            assertWarning(InvalidAttributeHandler, f)
        })

        await it("should remove an event listener if null is given.", async () => {
            setEventAttributeValue(target, "foo", async () => {})
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            setEventAttributeValue(target, "foo", null)
            assert.strictEqual(countEventListeners(target, "foo"), 0)
        })

        await it("should remove an event listener if primitive is given.", async () => {
            setEventAttributeValue(target, "foo", async () => {})
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            // @ts-expect-error
            setEventAttributeValue(target, "foo", 3)
            assert.strictEqual(countEventListeners(target, "foo"), 0)

            assertWarning(InvalidAttributeHandler, 3)
        })

        await it("should do nothing if primitive is given and the target doesn't have listeners.", async () => {
            setEventAttributeValue(target, "foo", null)
            assert.strictEqual(countEventListeners(target, "foo"), 0)
        })

        await it("should handle the string representation of the type argument", async () => {
            const f = () => {}
            // @ts-expect-error
            setEventAttributeValue(target, 1e3, f)

            assert.strictEqual(countEventListeners(target), 1)
            assert.strictEqual(countEventListeners(target, "1000"), 1)
        })

        await it("should keep the added order: attr, normal, capture", async () => {
            const list: string[] = []
            const f1 = () => {
                list.push("f1")
            }
            const f2 = () => {
                list.push("f2")
            }
            const f3 = () => {
                list.push("f3")
            }

            setEventAttributeValue(target, "foo", f1)
            target.addEventListener("foo", f2)
            target.addEventListener("foo", f3, { capture: true })
            target.dispatchEvent(new Event("foo"))

            assert.deepStrictEqual(list, ["f1", "f2", "f3"])
        })

        await it("should keep the added order: normal, capture, attr", async () => {
            const list: string[] = []
            const f1 = () => {
                list.push("f1")
            }
            const f2 = () => {
                list.push("f2")
            }
            const f3 = () => {
                list.push("f3")
            }

            target.addEventListener("foo", f1)
            target.addEventListener("foo", f2, { capture: true })
            setEventAttributeValue(target, "foo", f3)
            target.dispatchEvent(new Event("foo"))

            assert.deepStrictEqual(list, ["f1", "f2", "f3"])
        })

        await it("should keep the added order: capture, attr, normal", async () => {
            const list: string[] = []
            const f1 = () => {
                list.push("f1")
            }
            const f2 = () => {
                list.push("f2")
            }
            const f3 = () => {
                list.push("f3")
            }

            target.addEventListener("foo", f1, { capture: true })
            setEventAttributeValue(target, "foo", f2)
            target.addEventListener("foo", f3)
            target.dispatchEvent(new Event("foo"))

            assert.deepStrictEqual(list, ["f1", "f2", "f3"])
        })

        await it("should not be called by 'dispatchEvent' if the listener is object listener", async () => {
            const f = { handleEvent: spy() }
            // @ts-expect-error
            setEventAttributeValue(target, "foo", f)
            target.dispatchEvent(new Event("foo"))

            assert.strictEqual(
                f.handleEvent.calls.length,
                0,
                "handleEvent should not be called",
            )
            assertWarning(InvalidAttributeHandler, f)
        })
    })
}
