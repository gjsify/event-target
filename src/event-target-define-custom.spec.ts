import { describe, it, assert, beforeEach, afterEach, on } from '@gjsify/unit';

import { defineCustomEventTarget, Event, EventTarget } from "./index.js"
import { countEventListeners } from "./test/count-event-listeners.js"
import { setupErrorCheck } from "./test/setup-error-check.js"

export const eventTargetDefineCustomTest = async () => {

    const MyEventTarget = defineCustomEventTarget<{
        foo: Event<"foo">
        bar: Event<"bar">
    }>("foo", "bar");

    type MyEventTarget = InstanceType<typeof MyEventTarget>

    await describe("'defineCustomEventTarget' function when '{foo:Event; bar:Event}' type argument is present, the returned value", async () => {

        const { beforeEachCb, afterEachCb } = setupErrorCheck();

        beforeEach(async () => {
            beforeEachCb();
        })

        afterEach(async () => {
            afterEachCb();
        })

        await it("should be a function.", async () => {
            assert.strictEqual(typeof MyEventTarget, "function")
        })

        await it("should throw a TypeError on function calls.", async () => {
            assert.throws(() => {
                // @ts-expect-error
                MyEventTarget()
            }, TypeError)
        })

        await it("should return an instance on constructor calls.", async () => {
            const target = new MyEventTarget()
            assert(
                target instanceof MyEventTarget,
                "should be an instance of MyEventTarget",
            )
            assert(
                target instanceof EventTarget,
                "should be an instance of EventTarget",
            )
        })
    })

    await describe("MyEventTarget.onfoo property", async () => {
        let target: MyEventTarget

        const { beforeEachCb, afterEachCb } = setupErrorCheck();

        beforeEach(async () => {
            target = new MyEventTarget()
            beforeEachCb();
        });

        afterEach(async () => {
            afterEachCb();
        });

        await it("should be null at first", async () => {
            assert.strictEqual(target.onfoo, null)
        })

        await it("should be able to set a function", async () => {
            const f = async () => {}
            target.onfoo = f
            assert.strictEqual(target.onfoo, f)
        })

        await it("should add an listener on setting a function", async () => {
            const f = async () => {}
            target.onfoo = f
            assert.strictEqual(countEventListeners(target, "foo"), 1)
        })

        await it("should remove the set listener on setting null", async () => {
            const f = async () => {}
            target.onfoo = f
            assert.strictEqual(countEventListeners(target, "foo"), 1)
            target.onfoo = null
            assert.strictEqual(countEventListeners(target, "foo"), 0)
        })
    })

    await describe("MyEventTarget.onbar property", async () => {
        let target: MyEventTarget

        const { beforeEachCb, afterEachCb } = setupErrorCheck();

        beforeEach(async () => {
            target = new MyEventTarget()
            beforeEachCb();
        });

        afterEach(async () => {
            afterEachCb();
        });

        await it("should be null at first", async () => {
            assert.strictEqual(target.onbar, null)
        })

        await it("should be able to set a function", async () => {
            const f = async () => {}
            target.onbar = f
            assert.strictEqual(target.onbar, f)
        })

        await it("should add an listener on setting a function", async () => {
            const f = async () => {}
            target.onbar = f
            assert.strictEqual(countEventListeners(target, "bar"), 1)
        })

        await it("should remove the set listener on setting null", async () => {
            const f = async () => {}
            target.onbar = f
            assert.strictEqual(countEventListeners(target, "bar"), 1)
            target.onbar = null
            assert.strictEqual(countEventListeners(target, "bar"), 0)
        })
    })

    // TODO Fix Deno
    await on(["Gjs", "Node.js"], async () => {
        await describe("MyEventTarget for-in", async () => {

            let target: MyEventTarget

            const { beforeEachCb, afterEachCb } = setupErrorCheck();

            beforeEach(async () => {
                target = new MyEventTarget()
                beforeEachCb();
            });

            afterEach(async () => {
                afterEachCb();
            });

            await it("should enumerate 5 property names", async () => {
                const actualKeys = []
                const expectedKeys = [
                    "addEventListener",
                    "removeEventListener",
                    "dispatchEvent",
                    "onfoo",
                    "onbar",
                ]

                for (const key in target) {
                    actualKeys.push(key)
                }

                assert.deepStrictEqual(
                    actualKeys.sort(undefined),
                    expectedKeys.sort(undefined),
                )
            })
        })
    })
}
