import { assert, beforeEach, afterEach } from '@gjsify/unit';
import { setErrorHandler, setWarningHandler } from "../index.js"
import { Warning } from "../warning-handler.js"

export function setupErrorCheck() {
    const errors: Error[] = []
    const warnings: setWarningHandler.Warning[] = []

    beforeEach(async () => {
        errors.length = 0
        warnings.length = 0
        setErrorHandler((error: Error) => {
            errors.push(error)
        })
        setWarningHandler((warning: setWarningHandler.Warning) => {
            warnings.push(warning)
        })
    })

    afterEach(async () => {
        setErrorHandler(undefined)
        setWarningHandler(undefined)
        try {
            assert.deepStrictEqual(errors, [], "Errors should be nothing.")
            assert.deepStrictEqual(warnings, [], "Warnings should be nothing.")
        } catch (error) {
            // ?;(this.test as any)?.error(error)
            throw error;
        }
    })

    function assertError(errorOrMessage: Error | string): void {
        const actualError = errors.shift()
        assert.strictEqual(
            typeof errorOrMessage === "string"
                ? actualError?.message
                : actualError,
            errorOrMessage,
        )
    }

    function assertWarning<TArgs extends any[]>(
        warning: Warning<TArgs>,
        ...args: TArgs
    ): void {
        const actualWarning = warnings.shift()
        assert.deepStrictEqual(actualWarning, { ...warning, args })
    }

    return { assertError, assertWarning }
}
