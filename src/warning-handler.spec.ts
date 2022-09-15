import { describe, it, assert, spy, on } from '@gjsify/unit';

import { EventTarget } from "./index.js"
import { InvalidEventListener } from "./warnings.js"

export default async () => {
    // Run this only on Node.js because console.warn is read-only on Gjs
    await on('Node.js', async () => {
        await describe("The default warning handler", async () => {
            await it("should print the warning by 'console.warn'.", () => {
                /*eslint-disable no-console */
                const originalWarn = console.warn
                const f = spy((..._: any[]) => {})
                const target = new EventTarget()
    
                console.warn = f
                target.addEventListener("foo")
                console.warn = originalWarn
    
                assert.strictEqual(f.calls.length, 1, "f should be called.")
                assert.strictEqual(
                    f.calls[0].arguments[0],
                    InvalidEventListener.message,
                )
                assert.strictEqual(f.calls[0].arguments[1], undefined)
            })
        })
    })
}
