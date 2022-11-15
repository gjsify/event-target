import { describe, it, expect, assert, beforeEach, afterEach } from '@gjsify/unit';

import {
    FalsyWasAssignedToCancelBubble,
    InitEventWasCalledWhileDispatching,
    NonCancelableEventWasCanceled,
    TruthyWasAssignedToReturnValue,
} from "./warnings.js"

import { setupErrorCheck } from "./test/setup-error-check.js";

import { Event } from './event.js';
import { EventTarget } from './event-target.js';

const NativeEvent = globalThis.Event;


// Credits https://github.com/mysticatea/event-target-shim/blob/master/test/event.ts

export const EventTest = async () => {

	await describe("Event.constructor", async () => {

		await it("should return an Event object", async () => {
			assert(new Event("") instanceof Event)
		})

		await it("should throw a TypeError if called as a function", async () => {
			expect(() => {
				// @ts-expect-error
				Event("") // eslint-disable-line new-cap
			}).toThrow();
		})

		if(NativeEvent) {
			describe("if native Event class is present", async () => {
				await it("`event instanceof window.Event` should be true", async () => {
					const event = new Event("")
					assert(event instanceof NativeEvent)
				})
			})
		}
	})

	await describe("Event.type property", async () => {

		await it("should be the value of the constructor's first argument", async () => {
			const event = new Event("foo")
			expect(event.type).toBe("foo")
		})

		await it("should be the string representation of the constructor's first argument", async () => {
			// @ts-expect-error
			expect(new Event().type).toBe("undefined");
			// @ts-expect-error
			expect(new Event(null).type).toBe("null");
			// @ts-expect-error
			expect(new Event(1e3).type).toBe("1000");
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			expect(() => {
				// @ts-expect-error
				event.type = "bar"
			}).toThrow();
		})
	})

	await describe("Event.target property", async () => {
		await it("should be null", async () => {
			const event = new Event("foo")
			expect(event.target).toBeNull();
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			expect(() => {
				// @ts-expect-error
				event.target = null
			}).toThrow();
		})

		await it("should be the event target under dispatching", async () => {
			const target = new EventTarget()
			const event = new Event("foo")
			let ok = false

			target.addEventListener("foo", () => {
				expect(event.target).toBe(target);
				ok = true
			})
			target.dispatchEvent(event)

			expect(event.target).toBeNull();
			assert(ok)
		})
	})

	await describe("Event.srcElement property", async () => {
		await it("should be null", async () => {
			const event = new Event("foo")
			expect(event.srcElement).toBeNull();
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			expect(() => {
				// @ts-expect-error
				event.srcElement = null
			}).toThrow();
		})

		await it("should be the event target under dispatching", async () => {
			const target = new EventTarget()
			const event = new Event("foo")
			let ok = false

			target.addEventListener("foo", () => {
				assert.strictEqual(event.srcElement, target)
				ok = true
			})
			target.dispatchEvent(event)

			assert.strictEqual(event.srcElement, null)
			assert(ok)
		})
	})

	await describe("Event.currentTarget property", async () => {
		await it("should be null", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.currentTarget, null)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.currentTarget = null
			})
		})

		await it("should be the event target under dispatching", async () => {
			const target = new EventTarget()
			const event = new Event("foo")
			let ok = false

			target.addEventListener("foo", () => {
				assert.strictEqual(event.currentTarget, target)
				ok = true
			})
			target.dispatchEvent(event)

			assert.strictEqual(event.currentTarget, null)
			assert(ok)
		})
	})

	await describe("Event.composedPath method", async () => {
		await it("should return an empty array", async () => {
			const event = new Event("foo")
			assert.deepStrictEqual(event.composedPath(), [])
		})

		await it("should return the event target under dispatching", async () => {
			const target = new EventTarget()
			const event = new Event("foo")
			let ok = false

			target.addEventListener("foo", () => {
				assert.deepStrictEqual(event.composedPath(), [target])
				ok = true
			})
			target.dispatchEvent(event)

			assert.deepStrictEqual(event.composedPath(), [])
			assert(ok)
		})
	})

	await describe("Event.NONE property", async () => {
		await it("should be 0", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.NONE, 0)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.NONE = -1
			})
		})
	})

	await describe("Event.NONE static property", async () => {
		await it("should be 0", async () => {
			assert.strictEqual(Event.NONE, 0)
		})

		await it("should be readonly", async () => {
			assert.throws(() => {
				// @ts-expect-error
				Event.NONE = -1
			})
		})
	})

	await describe("Event.CAPTURING_PHASE property", async () => {
		await it("should be 1", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.CAPTURING_PHASE, 1)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.CAPTURING_PHASE = -1
			})
		})
	})

	await describe("Event.CAPTURING_PHASE static property", async () => {
		await it("should be 1", async () => {
			assert.strictEqual(Event.CAPTURING_PHASE, 1)
		})

		await it("should be readonly", async () => {
			assert.throws(() => {
				// @ts-expect-error
				Event.CAPTURING_PHASE = -1
			})
		})
	})

	await describe("Event.AT_TARGET property", async () => {
		await it("should be 2", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.AT_TARGET, 2)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.AT_TARGET = -1
			})
		})
	})

	await describe("Event.AT_TARGET static property", async () => {
		await it("should be 2", async () => {
			assert.strictEqual(Event.AT_TARGET, 2)
		})

		await it("should be readonly", async () => {
			assert.throws(() => {
				// @ts-expect-error
				Event.AT_TARGET = -1
			})
		})
	})

	await describe("Event.BUBBLING_PHASE property", async () => {
		await it("should be 3", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.BUBBLING_PHASE, 3)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.BUBBLING_PHASE = -1
			})
		})
	})

	await describe("Event.BUBBLING_PHASE static property", async () => {
		await it("should be 3", async () => {
			assert.strictEqual(Event.BUBBLING_PHASE, 3)
		})

		await it("should be readonly", async () => {
			assert.throws(() => {
				// @ts-expect-error
				Event.BUBBLING_PHASE = -1
			})
		})
	})

	await describe("Event.eventPhase property", async () => {
		await it("should be 0", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.eventPhase, 0)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.eventPhase = -1
			})
		})

		await it("should be 2 under dispatching", async () => {
			const target = new EventTarget()
			const event = new Event("foo")
			let ok = false

			target.addEventListener("foo", () => {
				assert.strictEqual(event.eventPhase, 2)
				ok = true
			})
			target.dispatchEvent(event)

			assert.strictEqual(event.eventPhase, 0)
			assert(ok)
		})
	})

	await describe("Event.stopPropagation method", async () => {
		await it("should return undefined", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.stopPropagation(), undefined)
		})
	})

	await describe("Event.cancelBubble property", async () => {

        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
        })

        afterEach(async () => {
            afterEachCb();
        })

		await it("should be false", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.cancelBubble, false)
		})

		await it("should be true after 'stopPropagation' method was called", async () => {
			const event = new Event("foo")
			event.stopPropagation()
			assert.strictEqual(event.cancelBubble, true)
		})

		await it("should be true after 'stopImmediatePropagation' method was called", async () => {
			const event = new Event("foo")
			event.stopImmediatePropagation()
			assert.strictEqual(event.cancelBubble, true)
		})

		await it("should be writable", async () => {
			const event = new Event("foo")
			event.cancelBubble = true
			assert.strictEqual(event.cancelBubble, true)
		})

		await it("should NOT be changed by the assignment of false after 'stopPropagation' method was called", async () => {
			const event = new Event("foo")
			event.stopPropagation()
			event.cancelBubble = false
			assert.strictEqual(event.cancelBubble, true)
			assertWarning(FalsyWasAssignedToCancelBubble)
		})

		await it("should NOT be changed by the assignment of false after 'stopImmediatePropagation' method was called", async () => {
			const event = new Event("foo")
			event.stopImmediatePropagation()
			event.cancelBubble = false
			assert.strictEqual(event.cancelBubble, true)
			assertWarning(FalsyWasAssignedToCancelBubble)
		})

		await it("should NOT be changed by the assignment of false after the assignment of true", async () => {
			const event = new Event("foo")
			event.cancelBubble = true
			event.cancelBubble = false
			assert.strictEqual(event.cancelBubble, true)
			assertWarning(FalsyWasAssignedToCancelBubble)
		})
	})

	await describe("Event.stopImmediatePropagation method", async () => {
		await it("should return undefined", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.stopImmediatePropagation(), undefined)
		})
	})

	await describe("'bubbles' property", async () => {
		await it("should be false if the constructor option was not present", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.bubbles, false)
		})

		await it("should be false if the constructor option was false", async () => {
			const event = new Event("foo", { bubbles: false })
			assert.strictEqual(event.bubbles, false)
		})

		await it("should be true if the constructor option was true", async () => {
			const event = new Event("foo", { bubbles: true })
			assert.strictEqual(event.bubbles, true)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.bubbles = true
			})
		})
	})

	await describe("Event.cancelable property", async () => {
		await it("should be false if the constructor option was not present", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.cancelable, false)
		})

		await it("should be false if the constructor option was false", async () => {
			const event = new Event("foo", { cancelable: false })
			assert.strictEqual(event.cancelable, false)
		})

		await it("should be true if the constructor option was true", async () => {
			const event = new Event("foo", { cancelable: true })
			assert.strictEqual(event.cancelable, true)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.cancelable = true
			})
		})
	})

	await describe("Event.returnValue property", async () => {

        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
        })

        afterEach(async () => {
            afterEachCb();
        })

		await it("should be true", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.returnValue, true)
		})

		await it("should be true after 'preventDefault' method was called if 'cancelable' is false", async () => {
			const event = new Event("foo")
			event.preventDefault()
			assert.strictEqual(event.returnValue, true)
			assertWarning(NonCancelableEventWasCanceled)
		})

		await it("should be false after 'preventDefault' method was called if 'cancelable' is true", async () => {
			const event = new Event("foo", { cancelable: true })
			event.preventDefault()
			assert.strictEqual(event.returnValue, false)
		})

		await it("should NOT be changed by assignment if 'cancelable' is false", async () => {
			const event = new Event("foo")
			event.returnValue = false
			assert.strictEqual(event.returnValue, true)
			assertWarning(NonCancelableEventWasCanceled)
		})

		await it("should be changed by assignment if 'cancelable' is true", async () => {
			const event = new Event("foo", { cancelable: true })
			event.returnValue = false
			assert.strictEqual(event.returnValue, false)
		})

		await it("should NOT be changed by the assignment of true after 'preventDefault' method was called", async () => {
			const event = new Event("foo", { cancelable: true })
			event.preventDefault()
			event.returnValue = true
			assert.strictEqual(event.returnValue, false)
			assertWarning(TruthyWasAssignedToReturnValue)
		})

		await it("should NOT be changed by the assignment of true after the assginment of false", async () => {
			const event = new Event("foo", { cancelable: true })
			event.returnValue = false
			event.returnValue = true
			assert.strictEqual(event.returnValue, false)
			assertWarning(TruthyWasAssignedToReturnValue)
		})
	})

	await describe("Event.preventDefault method", async () => {

        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
        })

        afterEach(async () => {
            afterEachCb();
        })

		await it("should return undefined", async () => {
			const event = new Event("foo", { cancelable: true })
			assert.strictEqual(event.preventDefault(), undefined)
		})

		await it("should return undefined", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.preventDefault(), undefined)
			assertWarning(NonCancelableEventWasCanceled)
		})
	})

	await describe("Event.defaultPrevented property", async () => {

        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
        })

        afterEach(async () => {
            afterEachCb();
        })

		await it("should be false", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.defaultPrevented, false)
		})

		await it("should be false after 'preventDefault' method was called if 'cancelable' is false", async () => {
			const event = new Event("foo")
			event.preventDefault()
			assert.strictEqual(event.defaultPrevented, false)
			assertWarning(NonCancelableEventWasCanceled)
		})

		await it("should be false after 'preventDefault' method was called if 'cancelable' is true", async () => {
			const event = new Event("foo", { cancelable: true })
			event.preventDefault()
			assert.strictEqual(event.defaultPrevented, true)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.defaultPrevented = true
			})
		})
	})

	await describe("Event.composed property", async () => {
		await it("should be false if the constructor option was not present", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.composed, false)
		})

		await it("should be false if the constructor option was false", async () => {
			const event = new Event("foo", { composed: false })
			assert.strictEqual(event.composed, false)
		})

		await it("should be true if the constructor option was true", async () => {
			const event = new Event("foo", { composed: true })
			assert.strictEqual(event.composed, true)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.composed = true
			})
		})
	})

	await describe("Event.isTrusted property", async () => {
		await it("should be false", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.isTrusted, false)
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.isTrusted = true
			})
		})

		await it("should NOT be configurable", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				Object.defineProperty(event, "isTrusted", { value: true })
			})
		})

		await it("should NOT be overridable", async () => {
			class CustomEvent extends Event {
				// eslint-disable-next-line class-methods-use-this
				public get isTrusted(): boolean {
					return true
				}
			}
			const event = new CustomEvent("foo")
			assert.strictEqual(event.isTrusted, false)
		})
	})

	await describe("Event.timeStamp property", async () => {
		await it("should be a number", async () => {
			const event = new Event("foo")
			assert.strictEqual(typeof event.timeStamp, "number")
		})

		await it("should be readonly", async () => {
			const event = new Event("foo")
			assert.throws(() => {
				// @ts-expect-error
				event.timeStamp = 0
			})
		})
	})

	await describe("Event.initEvent method", async () => {

        const { assertWarning, beforeEachCb, afterEachCb } = setupErrorCheck()

        beforeEach(async () => {
            beforeEachCb();
        })

        afterEach(async () => {
            afterEachCb();
        })

		await it("should return undefined", async () => {
			const event = new Event("foo")
			assert.strictEqual(event.initEvent("bar"), undefined)
		})

		await it("should set type", async () => {
			const event = new Event("foo")
			event.initEvent("bar")
			assert.strictEqual(event.type, "bar")
		})

		await it("should set type (string representation)", async () => {
			const event = new Event("foo")
			// @ts-expect-error
			event.initEvent(1e3)
			assert.strictEqual(event.type, "1000")
		})

		await it("should set bubbles", async () => {
			const event = new Event("foo")
			event.initEvent("foo", true)
			assert.strictEqual(event.bubbles, true)
			assert.strictEqual(event.cancelable, false)
			assert.strictEqual(event.composed, false)
		})

		await it("should set cancelable", async () => {
			const event = new Event("foo", { bubbles: true })
			event.initEvent("foo", undefined, true)
			assert.strictEqual(event.bubbles, false)
			assert.strictEqual(event.cancelable, true)
			assert.strictEqual(event.composed, false)
		})

		await it("should not change composed", async () => {
			const event = new Event("foo", {
				bubbles: true,
				cancelable: true,
				composed: true,
			})
			event.initEvent("foo")
			assert.strictEqual(event.bubbles, false)
			assert.strictEqual(event.cancelable, false)
			assert.strictEqual(event.composed, true)
		})

		await it("should reset 'stopPropagation' flag", async () => {
			const event = new Event("foo")
			event.stopPropagation()
			assert.strictEqual(event.cancelBubble, true)
			event.initEvent("foo")
			assert.strictEqual(event.cancelBubble, false)
		})

		await it("should reset 'canceled' flag", async () => {
			const event = new Event("foo", { cancelable: true })
			event.preventDefault()
			assert.strictEqual(event.defaultPrevented, true)
			event.initEvent("foo")
			assert.strictEqual(event.defaultPrevented, false)
		})

		await it("should do nothing under dispatching", async () => {
			const target = new EventTarget()
			const event = new Event("foo")

			target.addEventListener("foo", () => {
				event.initEvent("bar")
			})
			target.dispatchEvent(event)

			assert.strictEqual(event.type, "foo")
			assertWarning(InitEventWasCalledWhileDispatching)
		})
	})

	await describe("Event for-in", async () => {
		await it("should enumerate 22 property names", async () => {
			const event = new Event("foo")
			const actualKeys = new Set<string>()

			// eslint-disable-next-line @mysticatea/prefer-for-of
			for (const key in event) {
				actualKeys.add(key)
			}

			for (const expectedKey of [
				"type",
				"target",
				"srcElement",
				"currentTarget",
				"composedPath",
				"NONE",
				"CAPTURING_PHASE",
				"AT_TARGET",
				"BUBBLING_PHASE",
				"eventPhase",
				"stopPropagation",
				"cancelBubble",
				"stopImmediatePropagation",
				"bubbles",
				"cancelable",
				"returnValue",
				"preventDefault",
				"defaultPrevented",
				"composed",
				"isTrusted",
				"timeStamp",
				"initEvent",
			]) {
				assert(
					actualKeys.has(expectedKey),
					`for-in loop should iterate '${expectedKey}' key`,
				)
			}
		})

		await it("should enumerate 4 property names in static", async () => {
			const actualKeys = []
			const expectedKeys = [
				"AT_TARGET",
				"BUBBLING_PHASE",
				"CAPTURING_PHASE",
				"NONE",
			]

			// eslint-disable-next-line @mysticatea/prefer-for-of
			for (const key in Event) {
				actualKeys.push(key)
			}

			assert.deepStrictEqual(
				actualKeys.sort(undefined),
				expectedKeys.sort(undefined),
			)
		})
	})
}
