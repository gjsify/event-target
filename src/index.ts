import { setErrorHandler } from "./error-handler.js"
import { Event } from "./event.js"
import { CustomEvent } from "./custom-event.js"
import {
    getEventAttributeValue,
    setEventAttributeValue,
} from "./event-attribute-handler.js"
import { EventTarget } from "./event-target.js"
import { defineCustomEventTarget, defineEventAttribute } from "./legacy.js"
import { setWarningHandler } from "./warning-handler.js"

export default EventTarget
export {
    defineCustomEventTarget,
    defineEventAttribute,
    Event,
    CustomEvent,
    EventTarget,
    getEventAttributeValue,
    setErrorHandler,
    setEventAttributeValue,
    setWarningHandler,
}
