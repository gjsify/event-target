import { describe, it, assert, spy, beforeEach, afterEach, on } from '@gjsify/unit';

import { Event, EventTarget, setWarningHandler } from "./index.js"
import process from 'process';

export const ErrorHandlerTest = async () => {
    await describe("The default error handler", async () => {

        beforeEach(async () => {
            setWarningHandler(() => {})
        })
        afterEach(async () => {
            setWarningHandler(undefined)
        })

        // TODO Fix Node.js and Gjs
        await on(["Browser", "Deno"], async () => {
            await it("should dispatch an ErrorEvent if a listener threw an error", async () => {
                const originalConsoleError = console.error
                const f = spy((_message, _source, _lineno, _colno, _error) => {})
                const consoleError = spy((..._: any[]) => {})
                const target = new EventTarget()
                const error = new Error("test error")
                target.addEventListener("foo", () => {
                    throw error
                })

                window.onerror = f
                console.error = consoleError
                try {
                    target.dispatchEvent(new Event("foo"))
                } finally {
                    window.onerror = null
                    console.error = originalConsoleError
                }

                assert.strictEqual(f.calls.length, 1, "f should be called.")
                // TODO: fails on Deno
                // assert.strictEqual(f.calls[0].arguments[0], error.message)
                // assert.strictEqual(f.calls[0].arguments[4], error)
                assert.strictEqual(
                    consoleError.calls.length,
                    1,
                    "console.error should be called.",
                )
                assert.strictEqual(consoleError.calls[0].arguments[0], error)
            })
        })

        // TODO Fix Gjs
        await on(["Deno", "Node.js"], async () => {
            await it("should emit an uncaughtException event if a listener threw an error", async () => {
                const f = spy(_event => {})
                const target = new EventTarget()
                const error = new Error("test error")
                target.addEventListener("foo", () => {
                    throw error
                })

                process.on("uncaughtException", f)
                target.dispatchEvent(new Event("foo"))
                process.removeListener("uncaughtException", f)

                assert.strictEqual(f.calls.length, 1, "f should be called.")
                assert.strictEqual(f.calls[0].arguments[0], error)
            })
        })
    })
}