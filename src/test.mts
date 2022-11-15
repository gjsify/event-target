import { run } from '@gjsify/unit';

import { ErrorHandlerTest } from './error-handler.spec.js';
import { eventTargetDefineCustomTest } from './event-target-define-custom.spec.js';
import { eventAttributeTest } from './event-attribute-handler.spec.js';
import { EventTargetTest } from './event-target.spec.js';
import { EventTest } from './event.spec.js';
import { warningHandlerTest } from './warning-handler.spec.js';

run({
    eventTargetDefineCustomTest,
    eventAttributeTest,
    EventTest,
    EventTargetTest,
    warningHandlerTest,
    ErrorHandlerTest,
});